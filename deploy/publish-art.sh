#!/usr/bin/env bash
# Uploads already-converted paintings (a zip of AVIF/WebP/JPG files) to
# gs://ntsikagqiba-assets/paintings/, and optionally the original PNGs to
# originals/ so the Art workflow can rebuild them later.
#
#   bash deploy/publish-art.sh paintings-web.zip [art-originals.zip]
#
# Use it when the paintings were converted somewhere without Google Cloud
# credentials; otherwise `npm run art:process -- --upload` does all of this.
set -euo pipefail

WEB=${1:?usage: bash deploy/publish-art.sh paintings-web.zip [art-originals.zip]}
ORIGINALS=${2:-}
BUCKET=${ART_BUCKET:-ntsikagqiba-assets}
TMP=$(mktemp -d)

unzip -q "$WEB" -d "$TMP/web"
cd "$TMP/web"
shopt -s nullglob
# Same headers as art-process.ts: the names carry a revision, so cache forever.
for pair in avif:image/avif webp:image/webp jpg:image/jpeg; do
  ext=${pair%%:*}
  files=(*."$ext")
  [ ${#files[@]} -eq 0 ] && continue
  gcloud storage cp "${files[@]}" "gs://$BUCKET/paintings/" \
    --cache-control="public, max-age=31536000, immutable" --content-type="${pair#*:}"
done
echo "✓ $(find . -type f | wc -l) web files in gs://$BUCKET/paintings/"

if [ -n "$ORIGINALS" ]; then
  unzip -q "$ORIGINALS" -d "$TMP/orig"
  gcloud storage cp -r "$TMP/orig/art/"* "gs://$BUCKET/originals/"
  echo "✓ originals in gs://$BUCKET/originals/"
fi
rm -rf "$TMP"
