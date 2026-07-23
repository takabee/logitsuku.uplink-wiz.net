#!/usr/bin/env bash
# 既存顧客の①へ GAS を再 push
# Usage: ./push-01-client.sh --client-slug slug
set -euo pipefail

CLIENT_SLUG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --client-slug) CLIENT_SLUG="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$CLIENT_SLUG" ]]; then
  echo "Usage: $0 --client-slug slug" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LEDGER="$ROOT/clients/${CLIENT_SLUG}.json"
SRC_GAS="$ROOT/01-overtime-36/gas"

if [[ ! -f "$LEDGER" ]]; then
  echo "ledger not found: $LEDGER" >&2
  exit 1
fi

eval "$(python3 - <<PY
import json
d=json.load(open("$LEDGER"))
m=d["modules"]["01-overtime-36"]
print(f'SPREADSHEET_ID={m["spreadsheetId"]!r}')
print(f'SCRIPT_ID={m["scriptId"]!r}')
print(f'WORK={m.get("workDir")!r}')
PY
)"

WORK="${WORK:-$ROOT/clients/_work/${CLIENT_SLUG}/01-overtime-36}"
mkdir -p "$WORK"
cp "$SRC_GAS/appsscript.json" "$SRC_GAS/Code.gs" "$SRC_GAS/Index.html" "$WORK/"

python3 - <<PY
from pathlib import Path
import re
p = Path("$WORK/Code.gs")
t = p.read_text()
t2, n = re.subn(
    r"var DEMO_SPREADSHEET_ID = '[^']+';",
    "var DEMO_SPREADSHEET_ID = '$SPREADSHEET_ID';",
    t,
    count=1,
)
if n != 1:
    raise SystemExit('DEMO_SPREADSHEET_ID patch failed')
p.write_text(t2)
PY

cat > "$WORK/.clasp.json" <<EOF
{
  "scriptId": "$SCRIPT_ID",
  "rootDir": ".",
  "parentId": ["$SPREADSHEET_ID"]
}
EOF

cd "$WORK"
npx --yes @google/clasp@2.4.2 push -f
echo "Pushed to $CLIENT_SLUG ($SCRIPT_ID)"
