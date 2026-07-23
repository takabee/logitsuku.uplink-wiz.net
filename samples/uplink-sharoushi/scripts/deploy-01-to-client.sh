#!/usr/bin/env bash
# 顧客スプレッドシート（編集者共有済み）へ ①残業上限 GAS をデプロイする
# Usage:
#   ./deploy-01-to-client.sh --spreadsheet-id ID --client-slug slug [--client-name "名称"]
set -euo pipefail

SPREADSHEET_ID=""
CLIENT_SLUG=""
CLIENT_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --spreadsheet-id) SPREADSHEET_ID="$2"; shift 2 ;;
    --client-slug) CLIENT_SLUG="$2"; shift 2 ;;
    --client-name) CLIENT_NAME="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$SPREADSHEET_ID" || -z "$CLIENT_SLUG" ]]; then
  echo "Usage: $0 --spreadsheet-id ID --client-slug slug [--client-name name]" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_GAS="$ROOT/01-overtime-36/gas"
WORK="$ROOT/clients/_work/${CLIENT_SLUG}/01-overtime-36"
LEDGER="$ROOT/clients/${CLIENT_SLUG}.json"
CLIENT_NAME="${CLIENT_NAME:-$CLIENT_SLUG}"

if ! npx --yes @google/clasp@2.4.2 login --status >/dev/null 2>&1; then
  echo "clasp にログインしてください: npx @google/clasp@2.4.2 login" >&2
  exit 1
fi

rm -rf "$WORK"
mkdir -p "$WORK"
cp "$SRC_GAS/appsscript.json" "$SRC_GAS/Code.gs" "$SRC_GAS/Index.html" "$WORK/"

# 顧客シートIDを Code.gs の DEMO_SPREADSHEET_ID に埋める
python3 - <<PY
from pathlib import Path
p = Path("$WORK/Code.gs")
t = p.read_text()
old = "var DEMO_SPREADSHEET_ID = '1fJcWExPd439VXQNGEl1PQREXcxmfHXRv3O7QpmOZ3ag';"
new = "var DEMO_SPREADSHEET_ID = '$SPREADSHEET_ID';"
if old not in t:
    # already customized or format changed — replace by regex
    import re
    t2, n = re.subn(
        r"var DEMO_SPREADSHEET_ID = '[^']+';",
        new,
        t,
        count=1,
    )
    if n != 1:
        raise SystemExit('DEMO_SPREADSHEET_ID の置換に失敗')
    t = t2
else:
    t = t.replace(old, new)
p.write_text(t)
print('patched DEMO_SPREADSHEET_ID')
PY

cd "$WORK"
echo "Creating bound script on spreadsheet $SPREADSHEET_ID ..."
# --type sheets は新規シートを作ることがあるため、既存IDへ紐づけるときは parentId のみ
npx --yes @google/clasp@2.4.2 create \
  --title "残業上限チェック_${CLIENT_SLUG}" \
  --parentId "$SPREADSHEET_ID" \
  --rootDir .

npx --yes @google/clasp@2.4.2 push -f

SCRIPT_ID="$(python3 - <<'PY'
import json
print(json.load(open('.clasp.json'))['scriptId'])
PY
)"

mkdir -p "$(dirname "$LEDGER")"
python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
ledger_path = Path("$LEDGER")
data = {
  "slug": "$CLIENT_SLUG",
  "name": "$CLIENT_NAME",
  "modules": {
    "01-overtime-36": {
      "spreadsheetId": "$SPREADSHEET_ID",
      "scriptId": "$SCRIPT_ID",
      "spreadsheetUrl": f"https://docs.google.com/spreadsheets/d/$SPREADSHEET_ID/edit",
      "scriptUrl": f"https://script.google.com/d/$SCRIPT_ID/edit",
      "deployedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
      "workDir": "$WORK",
    }
  }
}
ledger_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
print("ledger:", ledger_path)
PY

echo ""
echo "OK: ①を顧客シートへデプロイしました"
echo "  Sheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit"
echo "  Script: https://script.google.com/d/${SCRIPT_ID}/edit"
echo "  Ledger: $LEDGER"
echo ""
echo "顧客向け次ステップ:"
echo "  1) シートを再読み込み → メニュー『ロジつく労務』"
echo "  2) 必要なら『画面を開く』または Webアプリとしてデプロイ"
