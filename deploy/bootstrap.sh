#!/usr/bin/env bash
# One-time Google Cloud setup for the Gallery: project, billing, APIs, budget,
# Artifact Registry, the public media bucket, two service accounts and
# Workload Identity Federation for GitHub Actions. Safe to re-run: every step
# skips what already exists. DEPLOY.md §1–4 explains each step.
#
#   bash deploy/bootstrap.sh                      # creates/uses project ntsikagqiba-portfolio
#   bash deploy/bootstrap.sh my-other-project-id  # or a project ID of your choice
#   BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX bash deploy/bootstrap.sh   # if you have several billing accounts
#
# Run it in Cloud Shell (already signed in) or anywhere after `gcloud auth login`.
set -euo pipefail

PROJECT_ID=${1:-ntsikagqiba-portfolio}
REGION=europe-west1
REPO=portfolio
BUCKET=ntsikagqiba-assets
GH_REPO=Zanemvula/Portfolio-Website

step() { printf '\n\033[1;33m▸ %s\033[0m\n' "$*"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
# New service accounts take a few seconds to become visible to IAM; retry bindings.
retry() { for i in 1 2 3 4 5 6; do "$@" >/dev/null && return 0; sleep $((i * 5)); done; "$@"; }

step "Project $PROJECT_ID"
if gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  ok "exists"
else
  gcloud projects create "$PROJECT_ID" --name="Ntsika Gqiba portfolio" ||
    { echo "  Could not create it. If the ID is taken, re-run with another: bash deploy/bootstrap.sh ntsikagqiba-site-2"; exit 1; }
  ok "created"
fi
gcloud config set project "$PROJECT_ID" >/dev/null
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

step "Billing"
if [ "$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)')" = "True" ]; then
  ok "already linked"
else
  if [ -z "${BILLING_ACCOUNT:-}" ]; then
    mapfile -t ACCOUNTS < <(gcloud billing accounts list --filter=open=true --format='value(name.basename())')
    if [ "${#ACCOUNTS[@]}" -ne 1 ]; then
      gcloud billing accounts list
      echo "  Found ${#ACCOUNTS[@]} open billing accounts. Create one at https://console.cloud.google.com/billing"
      echo "  (or pick one above) and re-run: BILLING_ACCOUNT=<ACCOUNT_ID> bash deploy/bootstrap.sh $PROJECT_ID"
      exit 1
    fi
    BILLING_ACCOUNT=${ACCOUNTS[0]}
  fi
  gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT" >/dev/null
  ok "linked to $BILLING_ACCOUNT"
fi
BILLING_ACCOUNT=${BILLING_ACCOUNT:-$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingAccountName.basename())')}

step "APIs (takes a minute the first time)"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com iamcredentials.googleapis.com \
  sts.googleapis.com storage.googleapis.com cloudbuild.googleapis.com billingbudgets.googleapis.com
ok "enabled"

step "Budget alert (\$10/month: emails at 50%, 90%, 100%)"
if gcloud billing budgets list --billing-account="$BILLING_ACCOUNT" --format='value(displayName)' 2>/dev/null | grep -qx portfolio-cap; then
  ok "exists"
elif gcloud billing budgets create --billing-account="$BILLING_ACCOUNT" --display-name=portfolio-cap \
  --budget-amount=10USD --filter-projects="projects/$PROJECT_ID" \
  --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0 >/dev/null; then
  ok "created"
else
  echo "  ! Could not create the budget (not needed to deploy). Add one later under Billing → Budgets & alerts."
fi

step "Artifact Registry: $REPO"
if gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1; then
  ok "exists"
else
  gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" --description="Portfolio images"
  ok "created"
fi
POLICY=$(mktemp)
cat >"$POLICY" <<'EOF'
[{"name":"keep-5","action":{"type":"Keep"},"mostRecentVersions":{"keepCount":5}},
 {"name":"delete-old","action":{"type":"Delete"},"condition":{"olderThan":"30d"}}]
EOF
gcloud artifacts repositories set-cleanup-policies "$REPO" --location="$REGION" --policy="$POLICY" --no-dry-run >/dev/null
ok "cleanup policy: keep the 5 newest images"

step "Media bucket gs://$BUCKET (public read)"
if gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1; then
  ok "exists"
else
  gcloud storage buckets create "gs://$BUCKET" --location="$REGION" --uniform-bucket-level-access ||
    { echo "  Bucket names are global; if $BUCKET is taken, tell Claude and the site config will change with it."; exit 1; }
  ok "created"
fi
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member=allUsers --role=roles/storage.objectViewer >/dev/null
ok "anyone can read; only the deployer can write"

step "Service accounts"
RUN_SA=portfolio-runtime@$PROJECT_ID.iam.gserviceaccount.com
SA=gh-deployer@$PROJECT_ID.iam.gserviceaccount.com
gcloud iam service-accounts describe "$RUN_SA" >/dev/null 2>&1 ||
  gcloud iam service-accounts create portfolio-runtime --display-name="Portfolio (Cloud Run runtime)"
gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 ||
  gcloud iam service-accounts create gh-deployer --display-name="GitHub deployer"
ok "portfolio-runtime (no roles) and gh-deployer"

retry gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role=roles/run.admin --condition=None
retry gcloud artifacts repositories add-iam-policy-binding "$REPO" --location="$REGION" \
  --member="serviceAccount:$SA" --role=roles/artifactregistry.writer
retry gcloud iam service-accounts add-iam-policy-binding "$RUN_SA" --member="serviceAccount:$SA" --role=roles/iam.serviceAccountUser
retry gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member="serviceAccount:$SA" --role=roles/storage.objectAdmin
ok "gh-deployer: deploy Cloud Run, push to $REPO, act as portfolio-runtime, write to $BUCKET"

step "Workload Identity Federation (GitHub → gh-deployer, this repository only)"
gcloud iam workload-identity-pools describe github --location=global >/dev/null 2>&1 ||
  gcloud iam workload-identity-pools create github --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers describe github-provider --location=global --workload-identity-pool=github >/dev/null 2>&1 ||
  gcloud iam workload-identity-pools providers create-oidc github-provider \
    --location=global --workload-identity-pool=github \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='$GH_REPO'"
retry gcloud iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$GH_REPO"
ok "only $GH_REPO can use it; no keys exist"

cat <<EOF

$(printf '\033[1;32m')Done.$(printf '\033[0m') Add these four as repository VARIABLES (not secrets) at
https://github.com/$GH_REPO/settings/variables/actions → "New repository variable":

  WIF_PROVIDER    projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-provider
  WIF_SA          $SA
  RUN_SA          $RUN_SA
  GCP_PROJECT_ID  $PROJECT_ID

EOF
