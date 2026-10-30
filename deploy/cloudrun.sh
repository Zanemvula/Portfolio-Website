#!/usr/bin/env bash
# Cloud Run release steps shared by the deploy, preview, cleanup and rollback workflows.
# Every revision is deployed with no traffic first and reached through a tag URL, so
# nothing serves visitors until it has passed a smoke test.
#
#   cloudrun.sh deploy IMAGE SUFFIX TAG   new revision <service>-SUFFIX, 0% traffic, tagged TAG; prints revision= and url=
#   cloudrun.sh smoke URL                 health, pages, 404 and security headers
#   cloudrun.sh promote REVISION          send 100% of traffic to REVISION; the one it replaces is tagged `previous`
#   cloudrun.sh serving                   the revision taking traffic now
#   cloudrun.sh previous                  the rollback target: the revision tagged `previous`
#   cloudrun.sh tagged TAG                the revision a tag points at
#   cloudrun.sh retag TAG [REVISION]      point TAG at REVISION, or remove it
#   cloudrun.sh discard REVISION          drop a revision that never took traffic (failed candidate)
#   cloudrun.sh untag TAG                 remove a tag URL
#   cloudrun.sh prune PREFIX              delete revisions named <service>-PREFIX* with no traffic and no tag
#   cloudrun.sh url                       the service's run.app URL
#
# Cloud Run refuses to delete a service's most recently created revision, so discard and prune
# leave that one in place (it takes no traffic and costs nothing); the next prune removes it.
#
# Env: SERVICE (portfolio), REGION (europe-west1), RUN_SA (runtime service account), COMMIT (for labels).
set -euo pipefail

SERVICE=${SERVICE:-portfolio}
REGION=${REGION:-europe-west1}

describe() { gcloud run services describe "$SERVICE" --region "$REGION" --format=json; }
tag_url() { describe | jq -r --arg t "$1" '[.status.traffic[]? | select(.tag == $t) | .url][0] // empty'; }
# Revisions named <service>-pr-… are PR previews; they never count as production.
production_revisions() {
  gcloud run revisions list --service "$SERVICE" --region "$REGION" --format=json |
    jq -r --arg p "$SERVICE-pr-" '[.[] | select(.metadata.name | startswith($p) | not)] | sort_by(.metadata.creationTimestamp) | reverse | .[].metadata.name'
}

untag() {
  if describe | jq -e --arg t "$1" 'any(.status.traffic[]?; .tag == $t)' >/dev/null; then
    gcloud run services update-traffic "$SERVICE" --region "$REGION" --remove-tags "$1" --quiet >/dev/null
  fi
}

deploy() {
  local image=$1 suffix=$2 tag=$3
  local args=(
    --image "$image" --region "$REGION" --platform managed --allow-unauthenticated --port 8080
    --min-instances 0 --max-instances 2 --memory 256Mi --cpu 1 --concurrency 80 --cpu-boost
    --revision-suffix "$suffix" --labels "app=$SERVICE,commit=${COMMIT:-manual}" --quiet
  )
  if [ -n "${RUN_SA:-}" ]; then args+=(--service-account "$RUN_SA"); fi
  # A tag can point at one revision only; move it by removing it first.
  untag "$tag"
  gcloud run deploy "$SERVICE" "${args[@]}" --no-traffic --tag "$tag" >&2
  echo "revision=$SERVICE-$suffix"
  echo "url=$(tag_url "$tag")"
}

smoke() {
  local base=${1%/} failed=0 code
  [ -n "$base" ] || { echo "smoke: no URL" >&2; return 1; }
  get() { curl -s -o /dev/null -w '%{http_code}' --retry 4 --retry-connrefused --retry-delay 3 --max-time 30 "$base$1" || true; }
  expect() {
    code=$(get "$1")
    if [ "$code" = "$2" ]; then echo "✓ GET $1 → $code"; else echo "✗ GET $1 → $code (want $2)"; failed=1; fi
  }
  if [ "$(curl -s --retry 4 --retry-connrefused --retry-delay 3 --max-time 30 "$base/health" || true)" = ok ]; then echo "✓ /health → ok"; else echo "✗ /health"; failed=1; fi
  expect / 200
  expect /works/ 200
  expect /works/chatly/ 200
  expect /this-page-does-not-exist/ 404
  local headers
  headers=$(curl -sI --max-time 30 "$base/" || true)
  for h in content-security-policy strict-transport-security x-content-type-options; do
    if grep -qi "^$h:" <<<"$headers"; then echo "✓ header $h"; else echo "✗ header $h missing"; failed=1; fi
  done
  return "$failed"
}

tagged() { describe | jq -r --arg t "$1" '[.status.traffic[]? | select(.tag == $t) | .revisionName][0] // empty'; }

retag() {
  local tag=$1 rev=${2:-}
  untag "$tag"
  if [ -n "$rev" ]; then
    gcloud run services update-traffic "$SERVICE" --region "$REGION" --update-tags "$tag=$rev" --quiet >/dev/null
  fi
}

promote() {
  local target=$1 current
  current=$(serving)
  if [ "$current" = "$target" ]; then echo "$target is already serving" >&2; return 0; fi
  gcloud run services update-traffic "$SERVICE" --region "$REGION" --to-revisions "$target=100" --quiet >&2
  # The revision it replaced becomes the rollback target (and keeps a URL for comparison).
  if [ -n "$current" ]; then retag previous "$current"; fi
}

serving() { describe | jq -r '[.status.traffic[]? | select((.percent // 0) > 0)] | max_by(.percent) | .revisionName // empty'; }

previous() {
  local tag current
  tag=$(tagged previous)
  current=$(serving)
  if [ -n "$tag" ] && [ "$tag" != "$current" ]; then echo "$tag"; return; fi
  # No usable tag yet (releases from before tagging): the newest older production revision.
  production_revisions | awk -v cur="$current" 'found { print; exit } $0 == cur { found = 1 }'
}

latest_created() { describe | jq -r '.status.latestCreatedRevisionName // empty'; }

# Delete one revision, unless it is the latest created, which Cloud Run refuses to delete.
delete_revision() {
  if [ "$1" = "$(latest_created)" ]; then
    echo "kept $1: Cloud Run never deletes the latest created revision; the next prune removes it" >&2
    return 0
  fi
  gcloud run revisions delete "$1" --region "$REGION" --quiet >&2
}

discard() {
  local rev=$1
  describe | jq -r --arg r "$rev" '.status.traffic[]? | select(.revisionName == $r and (.tag // "") != "") | .tag' |
    while read -r t; do untag "$t"; done
  delete_revision "$rev"
}

prune() {
  local prefix=$SERVICE-$1 keep
  # Anything with traffic or a tag (open PR previews, previous, candidate) stays.
  keep=$(describe | jq -r '[.status.traffic[]? | select((.percent // 0) > 0 or (.tag // "") != "") | .revisionName] | join(" ")')
  gcloud run revisions list --service "$SERVICE" --region "$REGION" --format='value(metadata.name)' |
    while read -r rev; do
      case "$rev" in "$prefix"*) [[ " $keep " == *" $rev "* ]] || delete_revision "$rev" ;; esac
    done
}

url() { describe | jq -r '.status.url'; }

cmd=${1:?usage: cloudrun.sh deploy|smoke|promote|serving|previous|tagged|retag|discard|untag|prune|url …}
shift
case "$cmd" in
  deploy | smoke | promote | serving | previous | tagged | retag | discard | untag | prune | url) "$cmd" "$@" ;;
  *) echo "unknown command: $cmd" >&2; exit 2 ;;
esac
