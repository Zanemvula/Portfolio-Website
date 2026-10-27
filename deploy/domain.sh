#!/usr/bin/env bash
# Maps ntsikagqiba.com and www to the Cloud Run service and prints the exact DNS
# records to add at the registrar. Safe to re-run. DEPLOY.md §9 explains it.
#
#   bash deploy/domain.sh
#
# Domain ownership must be verified first (once):  gcloud domains verify ntsikagqiba.com
set -euo pipefail

DOMAIN=${DOMAIN:-ntsikagqiba.com}
SERVICE=portfolio
REGION=europe-west1

VERIFIED=$(gcloud domains list-user-verified --format='value(id)')
if ! grep -qx "$DOMAIN" <<<"$VERIFIED"; then
  cat <<EOF
$DOMAIN is not verified for $(gcloud config get-value account 2>/dev/null) yet.

  1. Run:  gcloud domains verify $DOMAIN
     Open the link it prints. Search Console shows a TXT record (google-site-verification=…).
  2. Add it at your registrar: type TXT, host empty (@), answer = that value.
  3. Back in Search Console, press Verify (DNS can take a few minutes), then re-run this script.
EOF
  exit 1
fi

for host in "$DOMAIN" "www.$DOMAIN"; do
  if gcloud beta run domain-mappings describe --domain "$host" --region "$REGION" >/dev/null 2>&1; then
    echo "✓ $host already mapped"
  else
    gcloud beta run domain-mappings create --service "$SERVICE" --domain "$host" --region "$REGION" >/dev/null
    echo "✓ $host mapped to $SERVICE"
  fi
done

echo
echo "Add exactly these records at your registrar (and delete any other A, AAAA, ALIAS or CNAME"
echo "records for @, www and *). An empty host means the bare domain (@)."
echo
# Print the records Cloud Run asks for, plus whether each mapping is ready yet.
read -r -d '' SHOW <<'PY' || true
import json, sys
m = json.load(sys.stdin)
host = m['metadata']['name']
status = m.get('status', {})
records = status.get('resourceRecords', [])
if not records:
    print('  %s: records not issued yet; re-run in a minute' % host)
for r in records:
    name = r.get('name') or '@ (leave empty)'
    print('  %-6s host: %-16s value: %s' % (r.get('type', ''), name, r['rrdata']))
ready = {c['type']: c['status'] for c in status.get('conditions', [])}
print('  %s: Ready=%s certificate=%s\n' % (host, ready.get('Ready', '?'), ready.get('CertificateProvisioned', '?')))
PY
for host in "$DOMAIN" "www.$DOMAIN"; do
  gcloud beta run domain-mappings describe --domain "$host" --region "$REGION" --format=json | python3 -c "$SHOW"
done
echo "Re-run this script to check progress: Ready=True once DNS resolves and the certificate is issued"
echo "(15 minutes to 24 hours)."
