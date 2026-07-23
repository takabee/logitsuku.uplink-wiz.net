# logitsuku.uplink-wiz.net

社労士向けランディングページ + 無料診断ツール配布サイト（Cloudflare Pages）。

## ローカル起動

```bash
npm install
npx wrangler pages dev .
```

ブラウザ: `http://localhost:8788`

## デプロイ

アカウントは `uplink.jp@gmail.com` を使用する。

```bash
npx wrangler pages deploy . --project-name=logitsuku-uplink-wiz-net --commit-dirty=true
```

本番ドメイン: `https://logitsuku-ai.uplink-wiz.net`

## 主なドキュメント

- `SPEC.md` … 仕様・API・動作確認
- `TODO.md` … 課題・作業ログ
- `BACKLOG.md` … 中長期バックログ（Windows配布注意点含む）
- `DATA_POLICY.md` … 個人情報運用ポリシー

## 関連ディレクトリ

- `shigyo-tool/` … 診断アプリ本体（最小構成）
- `windows/` … Windows Python不要版（埋め込みPython）
- `assets/tools/check-list.zip` … ダウンロード配布ZIP
