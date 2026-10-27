#!/usr/bin/env bash
# Cloud Run release steps shared by the deploy, preview, cleanup and rollback workflows.
# Every revision is deployed with no traffic first and reached through a tag URL, so
# nothing serves visitors until it has passed a smoke test.
#
#   cloudrun.sh deploy IMAGE SUFFIX TAG   new revision <service>-SUFFIX, 0% traffic, tagged TAG; prints revision= and url=
#   cloudrun.sh smoke URL                 health, pages, 404 and security headers
#   cloudrun.sh promote REVISION          send 100% of traffic to REVISION
#   cloudrun.sh serving                   the revision taking traffic now
#   cloudrun.sh previous                  the production revision that served before it (for rollback)
#   cloudrun.sh discard REVISION          drop a revision that never took traffic (failed candidate)
#   cloudrun.sh untag TAG                 remove a tag URL
#   cloudrun.sh prune PREFIX              delete every revision named <service>-PREFIX* that has no traffic
#   cloudrun.sh url                       the service's run.app URL
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

promote() { gcloud run services update-traffic "$SERVICE" --region "$REGION" --to-revisions "$1=100" --quiet >&2; }

serving() { describe | jq -r '[.status.traffic[]? | select((.percent // 0) > 0)] | max_by(.percent) | .revisionName // empty'; }

previous() {
  local current
  current=$(serving)
  production_revisions | awk -v cur="$current" 'found { print; exit } $0 == cur { found = 1 }'
}

discard() {
  local rev=$1
  describe | jq -r --arg r "$rev" '.status.traffic[]? | select(.revisionName == $r and (.tag // "") != "") | .tag' |
    while read -r t; do untag "$t"; done
  gcloud run revisions delete "$rev" --region "$REGION" --quiet >&2
}

prune() {
  local prefix=$SERVICE-$1 busy
  busy=$(describe | jq -r '[.status.traffic[]? | select((.percent // 0) > 0) | .revisionName] | join(" ")')
  gcloud run revisions list --service "$SERVICE" --region "$REGION" --format='value(metadata.name)' |
    while read -r rev; do
      case "$rev" in "$prefix"*) [[ " $busy " == *" $rev "* ]] || gcloud run revisions delete "$rev" --region "$REGION" --quiet >&2 ;; esac
    done
}

url() { describe | jq -r '.status.url'; }

cmd=${1:?usage: cloudrun.sh deploy|smoke|promote|serving|previous|discard|untag|prune|url …}
shift
case "$cmd" in
  deploy | smoke | promote | serving | previous | discard | untag | prune | url) "$cmd" "$@" ;;
  *) echo "unknown command: $cmd" >&2; exit 2 ;;
esac
