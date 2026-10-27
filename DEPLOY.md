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

## Quick path: one script for §1–4

In Cloud Shell (already signed in) or any terminal after `gcloud auth login`:

```bash
git clone https://github.com/Zanemvula/Portfolio-Website.git
cd Portfolio-Website
bash deploy/bootstrap.sh            # new project "ntsikagqiba-portfolio"; or pass your own project ID
```

It creates the project, links billing (when you have exactly one billing account; otherwise
re-run it with `BILLING_ACCOUNT=<id>`), and sets up everything in §2–4. It is safe to re-run. It
ends by printing the four repository variables for §5. The manual steps below are the same
commands, one at a time.

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
  iamcredentials.googleapis.com sts.googleapis.com storage.googleapis.com billingbudgets.googleapis.com \
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
| `PAINTING_MODEL` | variable (optional) | leave unset for `gpt-image-2` (cut-outs use `gpt-image-1.5`; override with `CUTOUT_MODEL`) |
| `OPENAI_API_KEY` | **secret** | your OpenAI key, optional: only for API painting in `art.yml` |

Or, with the GitHub CLI:

```bash
gh variable set WIF_PROVIDER --repo "$GH_REPO" --body "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-provider"
gh variable set WIF_SA --repo "$GH_REPO" --body "$SA"
gh variable set RUN_SA --repo "$GH_REPO" --body "$RUN_SA"
gh variable set GCP_PROJECT_ID --repo "$GH_REPO" --body "$PROJECT_ID"
gh secret set OPENAI_API_KEY --repo "$GH_REPO"      # prompts; never put it on the command line
```

## 6. The pipeline

Nothing reaches `main` without passing CI, and nothing reaches visitors without passing a smoke
test on Cloud Run first.

```
pull request ──► CI ─────────────► Preview ────────────► merge
                 gitleaks           image CI tested        │
                 lint · typecheck   → revision pr-<n>      │
                 build · actionlint   (0% traffic)         ▼
                 container smoke    → link on the PR     Deploy (main only)
                 Lighthouse ≥ 90                           CI again on the merged commit
                 saves the image                           push that exact image
                                                           candidate revision, 0% traffic
                 PR closed ──► PR Cleanup                  smoke-test candidate ─ fail → discard
                 (tag + preview revisions removed)         promote: 100% in one step
                                                           smoke-test production ─ fail → roll back
                                                           check ntsikagqiba.com (warn only)
```

| Workflow | Runs on | Does |
|---|---|---|
| `ci.yml` (**CI**) | every pull request; by hand; inside Deploy | The three required checks: *Secret scan (gitleaks)*, *Lint · typecheck · build* (also actionlint and shellcheck), *Container · Lighthouse* (builds the production image, smoke-tests it with the same script as production, Lighthouse ≥ 90 in every category, saves the image as the `image` artifact). |
| `preview.yml` (**Preview**) | after CI passes on a PR from this repository | Pushes the image CI tested as `portfolio:pr-<n>-<sha>`, deploys it as revision `portfolio-pr-<n>-…` with **no traffic** at `https://pr-<n>---portfolio-….run.app`, smoke-tests it and posts the link on the PR (one comment, updated on each push). Fork and Dependabot PRs get CI only, never cloud access. |
| `pr-cleanup.yml` (**PR Cleanup**) | a PR closes | Removes the `pr-<n>` tag and deletes that PR's preview revisions. |
| `deploy.yml` (**Deploy**) | push to `main`; by hand (main only) | Runs CI on the merged commit, then releases the image CI tested: candidate revision with 0% traffic → smoke test → promote → smoke test production → automatic rollback if production fails. |
| `rollback.yml` (**Rollback**) | by hand | Sends traffic back to the previous production revision, or to one you name, then smoke-tests it. Nothing is rebuilt. |
| `art.yml` (**Art**) | by hand | Converts and uploads paintings, then opens a PR with `content/paintings.json`; merging it releases the art. |

Every Cloud Run step goes through `deploy/cloudrun.sh`, so the deploy flags, the smoke test and the
revision bookkeeping are defined once. The smoke test checks `/health`, `/`, `/works/`, a project
room, a 404, and the CSP, HSTS and nosniff headers. Dependabot (`.github/dependabot.yml`) opens weekly
PRs for npm, GitHub Actions and the Docker base images; they go through the same gate.

### One-time GitHub settings (Settings → …)

1. **Rules → Rulesets → New branch ruleset** named `main`. Set Enforcement *Active*, and Target *Default branch*. Turn on:
   - *Restrict deletions*
   - *Block force pushes*
   - *Require a pull request before merging* (0 approvals is fine for a solo repo)
   - *Require status checks to pass*, with these checks: `Secret scan (gitleaks)`, `Lint · typecheck · build`
     and `Container · Lighthouse`. They appear in the picker after CI has run once on a PR.

   Add yourself (Repository admin) to the bypass list only if you want an emergency path.
2. **Environments → production → Deployment branches and tags → Selected branches → `main`**, so
   nothing but `main` can release or roll back. Optionally add yourself as a *Required reviewer*
   for a manual approval before each release.
3. **Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull
   requests**, so the Art workflow can open its manifest PR.

### Releasing, checking and rolling back

- **Release:** merge a PR. Deploy's run summary names the new revision and the one it replaced.
- **What is live:** `gcloud run services describe portfolio --region europe-west1 --format='yaml(status.traffic)'`
- **Roll back:** Actions → **Rollback** → Run workflow (leave the revision empty for "the previous
  one"). Or from a terminal: `gcloud run services update-traffic portfolio --region europe-west1 --to-revisions <REVISION>=100`.
- Images are kept by the Artifact Registry cleanup policy: the 5 newest, plus anything newer than
  30 days. A revision older than that may have lost its image and can't be rolled back to.

Optional manual release from your machine (Cloud Build, then the same script as the pipeline):

```bash
TAG=manual-$(git rev-parse --short HEAD)
gcloud builds submit --tag "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE:$TAG"
out=$(RUN_SA=$RUN_SA COMMIT=$(git rev-parse HEAD) deploy/cloudrun.sh deploy "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE:$TAG" "$TAG" candidate)
deploy/cloudrun.sh smoke "$(sed -n 's/^url=//p' <<<"$out")" && deploy/cloudrun.sh promote "$(sed -n 's/^revision=//p' <<<"$out")"
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

**D. Already converted somewhere else** (for example in a Claude session without cloud
credentials): `bash deploy/publish-art.sh paintings-web.zip art-originals.zip` uploads the web
files with the right headers, and the originals, then commit the matching `content/paintings.json`.

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

**Quick path:** `gcloud domains verify ntsikagqiba.com` once (add the TXT record it gives you),
then `bash deploy/domain.sh`. It creates both mappings and prints the exact records to add. Re-run it
to watch the certificate status.

**At Namecheap** (Domain List → ntsikagqiba.com → **Manage** → **Advanced DNS**; nameservers
must be *Namecheap BasicDNS*): delete the default parking records first, the `CNAME` on `www` to
`parkingpage.namecheap.com` and the `URL Redirect Record` on `@`. Then add the records below, with
**Host** `@` for the bare domain and `www` for www, TTL *Automatic*.

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
3. ~~Merge `v2-gallery` into `main`~~ — done 2026-10-27; only `main` deploys (§6).
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
