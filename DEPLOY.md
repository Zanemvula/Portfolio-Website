# Deploying the Gallery

Run the one-time bootstrap below on your own machine or in Cloud Shell, with your own Google
account. After that, GitHub Actions deploys every push through Workload Identity Federation, and
no service-account key exists anywhere.

Target shape: Cloud Run service `portfolio` in `europe-west1`, image in Artifact Registry repo
`portfolio`, media in `gs://ntsikagqiba-assets`. No load balancer, so the running cost stays
under $5/month.

---

## 0. Before anything else

```bash
# Tag the old AI Studio site. This session's git proxy refused tag pushes (HTTP 403), so run it yourself.
git fetch origin
git tag -a v1-ai-studio 641432c -m "Google AI Studio Vite/React version (pre-rebuild)"
git push origin v1-ai-studio
```

- **Rotate the Gemini key** in Google AI Studio. The old `vite.config.ts` put `GEMINI_API_KEY`
  into the client bundle at build time, so any deployed build published it. The key is **not** in
  git history: gitleaks found nothing across every branch.
- This repository is **already public**. CI runs gitleaks on every push; repeat the manual scan
  below before any other repo goes public.

```bash
brew install gitleaks          # or download a release binary
gitleaks git --log-opts="--all" .
```

---

## 1. Variables

```bash
gcloud auth login
gcloud projects list                       # pick the project
export PROJECT_ID=<your-project-id>
gcloud config set project "$PROJECT_ID"

export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
export REGION=europe-west1
export SERVICE=portfolio
export REPO=portfolio
export BUCKET=ntsikagqiba-assets
export GH_REPO=Zanemvula/Portfolio-Website

gcloud billing projects describe "$PROJECT_ID"     # billingEnabled: true
gcloud run services list                           # note any old service to retire later
```

## 2. APIs and a budget alert

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com storage.googleapis.com \
  cloudbuild.googleapis.com     # Cloud Build is only needed for the optional manual deploy in §6

gcloud billing accounts list
gcloud billing budgets create --billing-account=<BILLING_ACCOUNT_ID> \
  --display-name="portfolio-cap" --budget-amount=10USD \
  --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0
```

## 3. Artifact Registry and the media bucket

```bash
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker --location="$REGION" --description="Portfolio images"

# Keep the 5 newest images; delete anything older than 30 days (Keep rules win over Delete).
cat > /tmp/ar-cleanup.json <<'EOF'
[{"name":"keep-5","action":{"type":"Keep"},"mostRecentVersions":{"keepCount":5}},
 {"name":"delete-old","action":{"type":"Delete"},"condition":{"olderThan":"30d"}}]
EOF
gcloud artifacts repositories set-cleanup-policies "$REPO" \
  --location="$REGION" --policy=/tmp/ar-cleanup.json --no-dry-run

# Public-read media bucket (paintings, CV, videos)
gcloud storage buckets create "gs://$BUCKET" --location="$REGION" --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member=allUsers --role=roles/storage.objectViewer
```

## 4. Service accounts and Workload Identity Federation

Two identities, each with the least privilege that works:

- `portfolio-runtime`: the identity the Cloud Run service runs as. It needs **no roles**, because
  the container only serves files.
- `gh-deployer`: the identity GitHub Actions impersonates.

```bash
gcloud iam service-accounts create portfolio-runtime --display-name="Portfolio (Cloud Run runtime)"
gcloud iam service-accounts create gh-deployer --display-name="GitHub deployer"
export RUN_SA=portfolio-runtime@$PROJECT_ID.iam.gserviceaccount.com
export SA=gh-deployer@$PROJECT_ID.iam.gserviceaccount.com

# Deploy Cloud Run services and make them public (--allow-unauthenticated needs run.admin)
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role=roles/run.admin
# Push images to this one repository only
gcloud artifacts repositories add-iam-policy-binding "$REPO" --location="$REGION" \
  --member="serviceAccount:$SA" --role=roles/artifactregistry.writer
# Deploy as the runtime SA only (not every SA in the project)
gcloud iam service-accounts add-iam-policy-binding "$RUN_SA" \
  --member="serviceAccount:$SA" --role=roles/iam.serviceAccountUser
# Upload art to this one bucket only (art.yml)
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="serviceAccount:$SA" --role=roles/storage.objectAdmin

# WIF pool + GitHub OIDC provider, locked to this repository
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global --workload-identity-pool=github \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='$GH_REPO'"

gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$GH_REPO"

echo "WIF_PROVIDER=projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-provider"
echo "WIF_SA=$SA"
echo "RUN_SA=$RUN_SA"
echo "GCP_PROJECT_ID=$PROJECT_ID"
```

## 5. GitHub repository variables and secret

Add these under **Settings → Secrets and variables → Actions**. The four identifiers are
**variables**; they are not secret. Only the OpenAI key is a **secret**.

| Name | Kind | Value |
|---|---|---|
| `WIF_PROVIDER` | variable | the `projects/…/providers/github-provider` path printed above |
| `WIF_SA` | variable | `gh-deployer@<project>.iam.gserviceaccount.com` |
| `RUN_SA` | variable | `portfolio-runtime@<project>.iam.gserviceaccount.com` |
| `GCP_PROJECT_ID` | variable | your project ID |
| `PAINTING_MODEL` | variable (optional) | leave unset for `gpt-image-1` |
| `OPENAI_API_KEY` | **secret** | your OpenAI key, optional: only for API painting in `art.yml` |

Or, with the GitHub CLI:

```bash
gh variable set WIF_PROVIDER --repo "$GH_REPO" --body "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-provider"
gh variable set WIF_SA --repo "$GH_REPO" --body "$SA"
gh variable set RUN_SA --repo "$GH_REPO" --body "$RUN_SA"
gh variable set GCP_PROJECT_ID --repo "$GH_REPO" --body "$PROJECT_ID"
gh secret set OPENAI_API_KEY --repo "$GH_REPO"      # prompts; never put it on the command line
```

## 6. First deploy ("a live ugly URL")

`deploy.yml` runs on every push to `main` **and** `v2-gallery`. It skips the deploy job until the
variables above exist. Once they are set, re-run the latest **Deploy** run from the Actions tab
(Re-run all jobs), or push any commit to `v2-gallery`. The run summary links the `run.app` URL.

> GitHub only shows the **Run workflow** button for workflows that exist on the default branch.
> Until `v2-gallery` is merged, use *Re-run* or a push instead.

Optional manual deploy from your machine, built in Cloud Build so nothing heavy runs locally:

```bash
gcloud builds submit --tag "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE:manual-$(git rev-parse --short HEAD)"
gcloud run deploy "$SERVICE" \
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE:manual-$(git rev-parse --short HEAD)" \
  --region "$REGION" --service-account "$RUN_SA" --allow-unauthenticated --port 8080 \
  --min-instances 0 --max-instances 2 --memory 256Mi --cpu 1 --concurrency 80 --cpu-boost
gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
```

Check it:

```bash
URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')
curl -sI -H 'Accept-Encoding: br' "$URL/" | grep -iE 'content-encoding|content-security|strict-transport|cache-control'
```

Roll back to an earlier revision:

```bash
gcloud run revisions list --service "$SERVICE" --region "$REGION"
gcloud run services update-traffic "$SERVICE" --region "$REGION" --to-revisions=<REVISION>=100
```

## 7. Art (the painted scenes)

The scenes are painted in ChatGPT; [ART.md](ART.md) holds every prompt. Publish them in one of three ways:

**A. Through the bucket (no tools needed).** In the Cloud Console, open `gs://ntsikagqiba-assets`
and upload your `art/<scene>/` folders into `originals/`, so you have `originals/hero/full.png`,
`originals/hero/plate.png` and so on. Then run the **Art** workflow from the Actions tab. It
converts, publishes to `paintings/`, commits `content/paintings.json` and deploys.

```bash
# the same upload from a terminal
gcloud storage cp -r art/* gs://ntsikagqiba-assets/originals/
```

**B. From your machine:**

```bash
npm run art:process                 # preview: http://localhost:4321 after `npm run dev`
npm run art:process -- --upload     # publish, then commit content/paintings.json
```

**C. With the OpenAI API instead of ChatGPT** (optional): set the `OPENAI_API_KEY` secret and
run the **Art** workflow with *Paint missing scenes* ticked, or locally run
`npm run art:generate -- hero` with the key in `.env`.

Published files are named `<scene>-r<revision>-<layer>-<width>.(avif|webp)` and cached as
`immutable`. To repaint, bump the scene's `revision` in its content file first.

## 8. CV and videos

```bash
gcloud storage cp "path/to/Ntsika Gqiba CV.pdf" "gs://$BUCKET/cv/ntsika-gqiba-cv.pdf" \
  --content-type=application/pdf --cache-control="public, max-age=3600"
```

Then set `"cv": "https://storage.googleapis.com/ntsikagqiba-assets/cv/ntsika-gqiba-cv.pdf"` in
`content/site.json`. The CV keeps one stable name, so it gets a 1-hour cache, not an immutable
one. Videos go in `gs://$BUCKET/videos/` and are listed under `media.videos` in `site.json`.

## 9. Domain: ntsikagqiba.com and www

### Option A: Cloud Run domain mapping (free; europe-west1 supports it)

```bash
gcloud domains verify ntsikagqiba.com      # Search Console opens: add the TXT record it shows, then click Verify
gcloud domains list-user-verified           # must list ntsikagqiba.com

gcloud beta run domain-mappings create --service "$SERVICE" --domain ntsikagqiba.com --region "$REGION"
gcloud beta run domain-mappings create --service "$SERVICE" --domain www.ntsikagqiba.com --region "$REGION"
gcloud beta run domain-mappings describe --domain ntsikagqiba.com --region "$REGION"
gcloud beta run domain-mappings describe --domain www.ntsikagqiba.com --region "$REGION"
```

**Add these DNS records at your registrar.** Treat the `describe` output as authoritative. These
are the values Cloud Run normally returns:

| Host | Type | Value |
|---|---|---|
| `@` | TXT | `google-site-verification=…` (from Search Console, step 1) |
| `@` | A | `216.239.32.21` |
| `@` | A | `216.239.34.21` |
| `@` | A | `216.239.36.21` |
| `@` | A | `216.239.38.21` |
| `@` | AAAA | `2001:4860:4802:32::15` |
| `@` | AAAA | `2001:4860:4802:34::15` |
| `@` | AAAA | `2001:4860:4802:36::15` |
| `@` | AAAA | `2001:4860:4802:38::15` |
| `www` | CNAME | `ghs.googlehosted.com.` |

Remove any old A/AAAA/CNAME records for `@` and `www` that point at the previous host. Google
provisions the certificate automatically once DNS resolves; this takes from 15 minutes to 24
hours. Domain mappings are still a preview feature and can add latency. If time to first byte
from South Africa or Europe is poor, switch to Option B.

### Option B: Firebase Hosting in front of Cloud Run (free tier, CDN, managed TLS)

```bash
npm i -g firebase-tools && firebase login
firebase projects:addfirebase "$PROJECT_ID"
cat > firebase.json <<'EOF'
{ "hosting": { "public": "public-firebase", "rewrites": [{ "source": "**", "run": { "serviceId": "portfolio", "region": "europe-west1" } }] } }
EOF
mkdir -p public-firebase && firebase deploy --only hosting --project "$PROJECT_ID"
```

Then go to **Firebase console → Hosting → Add custom domain** and add the records it gives you
(they differ from Option A).

### Cut over

1. Confirm `https://ntsikagqiba.com` and `https://www.ntsikagqiba.com` serve the new build.
2. In `content/projects/portfolio.md`, set `draft: false` and add a log line.
3. Merge `v2-gallery` into `main`, then remove `v2-gallery` from `deploy.yml` and `ci.yml`.
4. Retire the old host: `gcloud run services delete <old-service> --region <old-region>`, or
   whatever served the AI Studio site.

## 10. What it costs

| Item | Expected monthly cost |
|---|---|
| Cloud Run, min 0 instances, portfolio traffic | $0 (inside the free tier: 2M requests, 180k vCPU-s, 360k GiB-s) |
| Artifact Registry, ≤ 5 images of ~95 MB | ≈ $0.05 (0.5 GB free, then $0.10/GB) |
| Cloud Storage, < 1 GB in europe-west1 | ≈ $0.02 storage + egress (≈ $0.12/GB to the internet) |
| Domain mapping or Firebase Hosting | $0 |
| **Total** | **well under $1 at portfolio traffic** |

No global HTTPS load balancer and no Cloud CDN: together they would cost about $18/month or more.
