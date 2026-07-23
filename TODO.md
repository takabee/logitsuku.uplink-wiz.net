# TODO（課題・問題点）

## 2026-07-09 作業ログ（本日実施分）

### LP / API（logitsuku.uplink-wiz.net）

- [x] `functions/api/admin/export-csv.js` に Basic 認証を追加（`ADMIN_EXPORT_USER` / `ADMIN_EXPORT_PASSWORD`）
- [x] `functions/api/download.js` の入力値検証を強化（必須項目・メール形式・診断パラメータ型/範囲/整合性）
- [x] `DATA_POLICY.md` を作成（個人情報の保存期間・削除フロー・問い合わせ対応）
- [x] `SPEC.md` を整備（仕様・動作確認手順・配布ZIP仕様）
- [x] `BACKLOG.md` を作成
- [x] フロント修正（`index.html` / `diagnostic.js`：送信ボタン制御、エラー表示改善、アクセシビリティ）
- [x] ダウンロードURLを `/assets/tools/check-list.zip` に変更

### shigyo-tool

- [x] 実行最小構成へ整理（`app.py` / `logic.py` / `templates` / `requirements.txt`）
- [x] Mac 向け `OvertimeChecker.app` を PyInstaller でビルド
- [x] `assets/tools/check-list.zip` を再生成（Mac `.app` + サンプルCSV + README）

### Windows 配布物

- [x] `assets/tools/OvertimeChecker-Windows.bat` + `windows-src/` を ZIP に同梱（Python 要・初回セットアップ型）
- [x] `windows/` ディレクトリに Python 不要版を作成（埋め込み Python 3.9 同梱）
- [x] `run.bat` の文字化け・構文エラーを修正（ASCII のみ・絶対パス・`goto` ラベル方式）
- [x] `app.py` に `blinker` / `colorama` フォールバックを追加
- [x] `app.py` に `sys.path` へ `BASE_DIR` を追加（`logic` モジュール解決）
- [x] `run.bat` に `logic.py` 存在チェックを追加

### ローカル開発

- [x] `npx wrangler pages dev .` で LP 起動確認（`http://localhost:8788`）
- [x] `python app.py` で shigyo-tool 起動確認

### 未完了・次回対応

- [ ] Windows 実機での最終起動確認（`colorama` フォールバック反映後）
- [ ] `windows/` 一式を ZIP 配布物と完全同期（現状は部分更新）
- [ ] Windows 向け単体 `.exe`（PyInstaller）を CI（Windows runner）で自動ビルド

---

## P0: 早急に対応すべき項目

- [x] `functions/api/admin/export-csv.js` に認証を追加する（最低でも Basic 認証、推奨は Cloudflare Access）。
- [x] `functions/api/download.js` の入力値検証を強化する（`clients/hours/risk/skipped` の型・範囲チェック）。
- [x] 個人情報の取り扱い方針を定義する（保存期間、削除手順、問い合わせ対応フロー）。
- [x] `shigyo-tool` を実行最小構成に整理（`app.py` / `logic.py` / `templates` / `requirements.txt`）。

## P1: 品質・運用性の改善

- [ ] `index.html` のインラインスタイルを `assets/styles/main.css` に移して保守性を上げる。
- [ ] APIエラー表示を改善する（ユーザー向け文言とログ用詳細を分離）。
- [ ] `wrangler` 実行時の `compatibility_date` を明示設定し、実行環境差分を減らす。
- [ ] ローカル開発用 `.dev.vars` を整備（`ADMIN_EXPORT_USER` / `ADMIN_EXPORT_PASSWORD` / KV バインディング）

## P2: `shigyo-tool` 連携の課題

- [x] ダウンロードZIP（`assets/tools/check-list.zip`）を再生成し、`OvertimeChecker.app` と `sample-overtime.csv` を同梱。
- [x] Windows 向け起動ランチャー（`OvertimeChecker-Windows.bat`）と実行ソース一式（`windows-src/`）を同梱。
- [x] `windows/` ディレクトリに Python不要版（埋め込みPython同梱）を作成。
- [x] Windows 起動失敗時のフォールバック対応（`blinker` 未導入環境でも起動）。
- [x] Windows 起動失敗時のフォールバック対応（`colorama` 未導入環境でも起動）。
- [ ] 固定の ZIP URL 返却をやめ、配布バージョンと紐づく仕組みにする。
- [ ] `shigyo-tool` のビルド成果物（例: `OvertimeChecker.app`）の配布先管理を明文化する。
- [ ] LP 側仕様と `shigyo-tool` 実体仕様の差分（無料版制限、機能範囲）を同期する。
- [ ] Windows 単体 `.exe` を GitHub Actions（windows-latest）でビルドするパイプラインを追加する。

## テスト関連

- [ ] `POST /api/download` の正常系・異常系テストを追加する。
- [ ] `GET /api/admin/export-csv` のCSV列・エスケープ・大量件数テストを追加する。
- [ ] 主要UIフロー（診断→フォーム→ダウンロード）のE2Eテストを追加する。
- [ ] Windows `run.bat` 起動のスモークテスト手順を `SPEC.md` に追記する。
