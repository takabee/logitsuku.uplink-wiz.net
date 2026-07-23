# logitsuku.uplink-wiz.net 仕様書

## 1. 概要

本システムは、社労士向けランディングページ上で簡易診断を行い、フォーム送信後に診断ツール（ZIP）をダウンロードさせる仕組みを提供する。

同時に、フォーム入力情報と診断結果を Cloudflare KV に保存し、管理者向け API で CSV エクスポートできる。

## 2. システム構成

- フロントエンド（静的ページ）
  - `index.html`
  - `assets/styles/main.css`
  - `assets/scripts/diagnostic.js`
- バックエンド（Cloudflare Pages Functions）
  - `functions/api/download.js`
  - `functions/api/admin/export-csv.js`
- データストア
  - Cloudflare KV（バインディング名: `DOWNLOAD_LEADS`）

## 3. 画面仕様

### 3.1 ランディングページ

- サービス説明、コスト比較、プラン比較を表示する。
- 診断導線とフォーム導線を同ページ内に持つ。
- デザイン方針（2026-07-23）
  - 配色は従来どおり（紺 `#004a7c` / 黄 `#ffcc00` / 赤 CTA）
  - 士業向けに強い訴求・表比較を維持
  - 見出しは短文化し、フォントサイズを抑え、PCでの不自然な折り返しを避ける
  - 比較表は左揃え、✅ / ❌ を表示
  - スタイルは `assets/styles/main.css` に集約（インラインスタイルは原則使わない）

### 3.2 簡易診断

- 入力項目
  - 顧問先数（スライダー: 1-200）
  - 月間の Excel 修正・更新時間（スライダー: 1-40）
- 算出式
  - `年間損失リスク額 = 顧問先数 × 月間更新時間 × 10000 × 12`
- 表示内容
  - 顧問先数、時間、リスク額をリアルタイム更新
  - 金額表示は `toLocaleString()` で桁区切り

### 3.3 ダウンロードフォーム

- 入力項目（全て必須）
  - 事務所名（`office`）
  - お名前（`name`）
  - メールアドレス（`email`）
- 送信時挙動
  - 送信ボタンを無効化し、文言を「送信中...」に変更
  - `POST /api/download` に JSON 送信
  - 成功時: アラート表示後、返却された `downloadUrl` へ遷移
  - 失敗時: エラーアラート表示、ボタンを再有効化

### 3.4 診断スキップ

- 「診断せずにダウンロード（スキップ）」でフォームに直接遷移可能。
- スキップ時の診断データは以下で保存される。
  - `clients = 0`
  - `hours = 0`
  - `risk = 0`
  - `skipped = true`

## 4. API 仕様

### 4.1 POST `/api/download`

- 概要
  - フォーム情報と診断データを受け取り、KV に保存してダウンロード URL を返却する。
- リクエスト
  - `Content-Type: application/json`
  - Body 例:

```json
{
  "office": "サンプル社会保険労務士事務所",
  "name": "社労士 太郎",
  "email": "sample@example.com",
  "clients": 30,
  "hours": 5,
  "risk": 1800000,
  "skipped": false
}
```

- バリデーション
  - 必須: `office`, `name`, `email`
  - `email` は簡易メール形式チェックを実施
  - `skipped` は boolean 必須
  - `clients` は整数かつ `0-200`
  - `hours` は整数かつ `0-40`
  - `risk` は `0` 以上の数値
  - `skipped=false` の場合、`risk === clients * hours * 10000 * 12` であること
  - `skipped=true` の場合、`clients=0` / `hours=0` / `risk=0` であること

- サーバ処理
  - `office`, `name`, `email` を trim（`email` は小文字化）
  - `createdAt` は ISO 8601 文字列（`new Date().toISOString()`）
  - KV キーは `${timestamp}_${sanitizedEmail}` 形式
  - `sanitizedEmail` は `/[^a-z0-9@._-]/g` を `_` に置換
  - 固定 ZIP URL を返却

- 正常レスポンス（`200`）

```json
{
  "success": true,
  "downloadUrl": "/assets/tools/check-list.zip"
}
```

- バリデーションエラー（`400`）

```json
{
  "error": "必須項目が不足しています。"
}
```

```json
{
  "error": "メールアドレスの形式が不正です。"
}
```

- サーバエラー（`500`）

```json
{
  "error": "error message"
}
```

### 4.2 GET `/api/admin/export-csv`

- 概要
  - KV の全リードデータを CSV に変換し、ファイルダウンロードとして返却する。
- 認証
  - Basic 認証必須（`Authorization: Basic <base64(user:password)>`）
  - 照合先環境変数:
    - `ADMIN_EXPORT_USER`
    - `ADMIN_EXPORT_PASSWORD`
- 認証エラー
  - `401`: Authorization ヘッダ未指定または形式不正
  - `403`: 認証情報不一致
  - `500`: サーバ側の認証設定未完了（環境変数未設定）
- 処理内容
  - `KV.list({ cursor, limit: 1000 })` でページングしながら全キー走査
  - 各キーの値を JSON として読み出し
  - CSV エスケープ（`"` -> `""`）を実施
  - UTF-8 BOM 付きで返却（Excel 文字化け対策）

- レスポンス（`200`）
  - Headers:
    - `Content-Type: text/csv; charset=utf-8`
    - `Content-Disposition: attachment; filename="logitsuku_leads.csv"`
  - CSV カラム:
    - 登録日時
    - 事務所名
    - 氏名
    - メールアドレス
    - 顧問先数
    - 月間更新時間
    - 年間リスク額
    - 診断スキップ有無（はい/いいえ）

- エラー時（`500`）
  - Body: `Error: <message>`

## 5. データ仕様（KV 保存フォーマット）

保存値（JSON）:

```json
{
  "createdAt": "2026-07-09T08:00:00.000Z",
  "officeName": "サンプル社会保険労務士事務所",
  "userName": "社労士 太郎",
  "email": "sample@example.com",
  "diagnosis": {
    "clients": 30,
    "hours": 5,
    "riskAmount": 1800000,
    "isSkipped": false
  }
}
```

## 5.1 配布ZIP仕様（`assets/tools/check-list.zip`）

- `check-list/OvertimeChecker.app`
  - ダウンロード後にダブルクリックで起動可能な macOS 実行アプリ
- `check-list/windows/`（推奨・Python不要）
  - 埋め込み Python 同梱の Windows 実行パッケージ
  - `run.bat` をダブルクリックで起動（事前の Python インストール不要）
- `check-list/OvertimeChecker-Windows.bat`（代替・Python 要）
  - Windows 用ワンクリック起動ランチャー（初回セットアップ後に起動）
- `check-list/windows-src/`
  - 上記 bat ランチャーから実行する Flask アプリ本体（`app.py`, `logic.py`, `templates`, `requirements.txt`）
- `check-list/sample-overtime.csv`
  - 初回確認用のサンプルCSV
- `check-list/README_DOWNLOAD.txt`
  - 起動手順とセキュリティ警告時の案内

## 6. 動作確認方法

### 6.1 事前準備

- Node.js が利用可能であること
- Cloudflare Pages Functions 実行環境があること（`wrangler`）
- Cloudflare 側で `DOWNLOAD_LEADS` KV バインディングが設定済みであること
- 管理CSV取得テスト時は以下を環境に設定すること
  - `ADMIN_EXPORT_USER`
  - `ADMIN_EXPORT_PASSWORD`

### 6.2 ローカル起動

1. 依存インストール
   - `npm install`
2. ローカル起動
   - `npx wrangler pages dev .`
3. ブラウザで `http://localhost:8788`（または表示された URL）を開く

### 6.3 フロント機能確認

1. スライダー動作
   - 顧問先数・月間時間を変更し、以下が即時反映されること
     - `顧問先数`
     - `月間時間`
     - `年間損失リスク額`
2. 診断スキップ導線
   - 「診断せずにダウンロード（スキップ）」でフォームに遷移すること
3. フォーム送信 UI
   - 送信中にボタンが無効化され、文言が「送信中...」になること
   - エラー時にボタンが再度押下可能に戻ること

### 6.4 API 確認（curl）

#### 正常系: `/api/download`

```bash
curl -i -X POST "http://localhost:8788/api/download" \
  -H "Content-Type: application/json" \
  -d '{
    "office":"テスト事務所",
    "name":"テスト太郎",
    "email":"test@example.com",
    "clients":30,
    "hours":5,
    "risk":1800000,
    "skipped":false
  }'
```

期待値:
- `HTTP/1.1 200`
- JSON に `success: true` と `downloadUrl` が含まれる

#### 異常系: 必須不足

```bash
curl -i -X POST "http://localhost:8788/api/download" \
  -H "Content-Type: application/json" \
  -d '{"office":"","name":"テスト太郎","email":"test@example.com"}'
```

期待値:
- `HTTP/1.1 400`
- `{"error":"必須項目が不足しています。"}` を返却

#### 異常系: メール形式不正

```bash
curl -i -X POST "http://localhost:8788/api/download" \
  -H "Content-Type: application/json" \
  -d '{"office":"テスト事務所","name":"テスト太郎","email":"invalid-mail"}'
```

期待値:
- `HTTP/1.1 400`
- `{"error":"メールアドレスの形式が不正です。"}` を返却

#### CSV エクスポート: `/api/admin/export-csv`

```bash
curl -i "http://localhost:8788/api/admin/export-csv" \
  -H "Authorization: Basic $(printf '%s:%s' "$ADMIN_EXPORT_USER" "$ADMIN_EXPORT_PASSWORD" | base64)"
```

期待値:
- `HTTP/1.1 200`
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="logitsuku_leads.csv"`
- 1 行目ヘッダーに「診断スキップ有無」が含まれる

### 6.5 受け入れチェックリスト

- [ ] 診断リスク金額が算出式どおりに変化する
- [ ] 送信成功時に ZIP URL へ遷移する
- [ ] 入力不備・形式不備で `400` が返る
- [ ] CSV に保存データが出力され、列構成が仕様どおり

## 7. 既知の制約・注意点

- ダウンロード URL は固定値であり、ユーザーごとの個別発行はしていない。
- CSV エクスポートは全件走査のため、データ件数増加時は応答時間に影響する可能性がある。
- `index.html` には一部インラインスタイルが残っている（機能影響なし）。
- 個人情報運用ルールは `DATA_POLICY.md` を参照（暫定版）。

## 8. 今後の改善候補

- 管理 API の認証方式を Cloudflare Access / JWT に拡張し、監査ログを整備。
- `POST /api/download` のバリデーションをスキーマ駆動化（例: Zod）し、エラーコード体系を統一。
- 個人情報の保存期間ポリシーと削除フローを明確化。
- エクスポート API に期間指定、並び順指定を追加。

## 9. 関連資産（shigyo-tool）について

- 本ワークスペース内に `shigyo-tool` ディレクトリが存在し、読み込み可能。
- `shigyo-tool` 側では Flask アプリ（`app.py`）と PyInstaller 設定（`OvertimeChecker.spec`）が確認できる。
- 一方で、当リポジトリ（`logitsuku.uplink-wiz.net`）の実装は LP + Pages Functions が中心であり、`shigyo-tool` の起動・配布フローとは直接結合されていない。
- 現在のダウンロード導線は固定URL返却方式であり、`shigyo-tool` ビルド成果物との自動連携（ビルド時差し替え、署名、配布バージョン管理など）は未実装。
