#!/usr/bin/env bash
# ①残業上限サンプルを、ログイン中のGoogleアカウント上にSheets+GASとして作る
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
GAS_DIR="$ROOT/gas"
cd "$ROOT/../.." >/dev/null
REPO_ROOT="$(cd "$ROOT/../../.." && pwd)"
# samples/uplink-sharoushi/01-overtime-36 -> fix path
REPO_ROOT="$(cd "$ROOT/../../.." && pwd)"

# Correct: script is in 01-overtime-36/
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GAS_DIR="$SCRIPT_DIR/gas"
CSV="$SCRIPT_DIR/data/勤怠_残業.csv"

cd "$GAS_DIR"
if ! npx --yes @google/clasp@2.4.2 login --status >/dev/null 2>&1; then
  echo "Googleログインが必要です。ブラウザが開くので許可してください。"
  npx --yes @google/clasp@2.4.2 login
fi

TITLE="【デモ】①残業上限_アップリンク社労士事務所"
echo "スプレッドシートを作成: $TITLE"
npx --yes @google/clasp@2.4.2 create --type sheets --title "$TITLE" --rootDir .
npx --yes @google/clasp@2.4.2 push -f

echo ""
echo "完了。"
echo "1) 上記に表示されたスクリプトURL / シートを開く"
echo "2) シート名を『勤怠_残業』にし、次のCSVを貼る:"
echo "   $CSV"
echo "3) 再読み込み → メニュー『ロジつく労務』→『上限チェックを実行』"
echo "4) 共有 →『リンクを知っている全員が閲覧可』でデモURL化"
