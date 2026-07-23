# TODO（課題・問題点）

## 製品・営業改善（評価ベース / 2026-07-23）

優先度の定義:
- **P0**: 期待値ギャップや信頼失墜につながるため、すぐ直す
- **P1**: 有料転換・納得感を上げるために次にやる
- **P2**: 中長期で製品競争力を上げる
- **P3**: 運用・品質の基盤強化（並行可）

### P0（最優先）

- [ ] **LPと無料ツールの約束を揃える**
  - 無料版は「残業上限の一次スクリーニング（OvertimeChecker）」と明記
  - 「法令保証システム」は有料プランの範囲だと分かるようにする
  - 現状の最大リスク: 期待値ギャップによる試用後離脱
- [ ] **無料版のできること / できないことをLPとツール画面の両方に明示**
  - できる: 36協定系チェック（単月100h、45h超過回数、複数月平均80h、年720h）
  - できない: 変形労働・裁量・管理監督者除外・独自就業規則ロジック等
  - 無料版制限（従業員10名まで）の意味を「お試し」と正しく伝える
- [x] **最新LPデザインを Cloudflare Pages へ再デプロイ**
  - `uplink.jp@gmail.com` で `logitsuku-uplink-wiz-net` に deploy

### P1（有料転換を上げる）

- [ ] **デモ結果を営業成果物にする**
  - 違反一覧 → 顧問先への指摘文テンプレ → 改善提案の流れを見せる
  - 「先生の仕事が楽になる」を無料体験で実感させる
- [ ] **価格ハードルを下げる前段オファーを用意する**
  - 例: 顧問先1社スポット診断、PoC 1ヶ月、オンライン説明会
  - いきなり初期40万円に飛ばない導線をLP/営業資料に追加
- [ ] **ROI話法を自事務所実数ベースに寄せる**
  - 110万円は入口として残す
  - 面談では「顧問先数 × Excel更新時間 × 時間単価」に置き換える説明を用意
- [ ] **対象ペルソナを絞って訴求する**
  - 主対象: Excelで36協定管理している中小社労士事務所
  - 勤怠クラウド利用者は別メッセージ（または対象外と明示）
- [ ] **初回ヒアリング台本を作る（そのまま読める版）**
  - 所要15〜30分想定
  - 聞くこと: 現状の残業/36協定管理手段、顧問先規模、痛み、CSV可否
  - 先に境界線を伝える: 法令判断は先生／実装はこちら
  - 締め: スポット（1社試作）への次アクション提示
  - 付録候補: スポット提案の一文見積テンプレ
- [x] **売り手目標と顧客側成果物を `BUSINESS.md` に記録**
  - 営業・業務目標（価格帯・ゴール・シナリオ）は売り手視点として分離
  - 顧客（社労士）視点は「スタート→ゴールで何が残るか」を別節で整理
- [x] **顧客Googleへ Cursor からデプロイする手順・スクリプトを追加**
  - `samples/uplink-sharoushi/DEPLOY.md`
  - `scripts/deploy-01-to-client.sh` / `push-01-client.sh`
  - 顧客は編集者共有のみ。中身は clasp でこちらが投入
- [x] **ヒアリング用サンプル（アップリンク社労士事務所・10領域）を `samples/uplink-sharoushi/` に作成**
  - ①はGAS判定つき。②〜⑩は表＋質問たたき台
  - [x] ①のローカルHTMLデモ `01-overtime-36/demo.html`
  - [x] Googleデモ作成（GAS push済み） + **Web UI**  
    シート: https://docs.google.com/spreadsheets/d/1fJcWExPd439VXQNGEl1PQREXcxmfHXRv3O7QpmOZ3ag/edit  
    UI: https://script.google.com/macros/s/AKfycbzCw_59_NQEmQqIjQb_U5vx4KRCtZvPccEoIex3j_JgYkniutCZrEuNTcRsxjBr0hRo/exec

### P2（製品競争力）

- [ ] **有料プランの提供範囲を具体例で見せる**
  - 独自CSV対応、法改正時の修正、名入れ、顧問先規模などの実施例
- [ ] **責任分界・監修体制を文書化する**
  - 法令判断の主体、免責、更新頻度、問い合わせ窓口を明記
  - 士業が契約前に必ず聞く点への回答を用意
- [ ] **無料版の価値上限を少し上げる（必要なら）**
  - 例: デモ出力のPDF/CSVエクスポート、指摘文テンプレ同梱
  - ※制限緩和しすぎて有料の必然性を壊さないこと
- [ ] **LP側仕様と `shigyo-tool` 実体仕様の差分を完全同期**
  - SPEC / LP / ツールREADMEの三者一致

### P3（運用・配布・品質）

- [ ] Windows 実機での最終起動確認（`colorama` フォールバック反映後）
- [x] `windows/` 一式を ZIP 配布物と完全同期（`check-list/windows/` として同梱）
- [ ] Windows 向け単体 `.exe` を CI（windows-latest）で自動ビルド
- [ ] 配布ZIPのバージョン管理（固定URL返却の見直し）
- [ ] APIエラー表示改善（ユーザー向け文言とログ詳細の分離）
- [ ] `wrangler` の `compatibility_date` 明示
- [ ] ローカル用 `.dev.vars` 整備
- [ ] `POST /api/download` / `GET /api/admin/export-csv` のテスト追加
- [ ] 主要UIフローのE2Eテスト追加

---

## 2026-07-23 作業ログ

### LP デザイン調整

- [x] 士業向けに元配色（紺 / 黄 / 赤）を維持しつつレイアウトを整理
- [x] 強い訴求コピー・コスト表・比較表（✅ / ❌）を維持
- [x] 見出し短縮・フォントサイズ縮小でPC折り返しを改善
- [x] ヒーロー文言を短縮
- [x] 表を左揃えに変更
- [x] `README.md` に起動・デプロイ手順を追記
- [x] 最新LPデザインを Cloudflare Pages へ再デプロイ

### デプロイ運用メモ

- Cloudflare ログインは `uplink.jp@gmail.com`（`uplink.wiz@gmail.com` だと別アカウントになる）
- プロジェクト名: `logitsuku-uplink-wiz-net`
- コマンド: `npx wrangler pages deploy . --project-name=logitsuku-uplink-wiz-net --commit-dirty=true`

---

## 2026-07-09 作業ログ（完了分）

- [x] API Basic認証 / 入力バリデーション強化
- [x] `DATA_POLICY.md` / `SPEC.md` / `BACKLOG.md` 作成
- [x] フロント送信制御・アクセシビリティ改善
- [x] ダウンロードURLを `/assets/tools/check-list.zip` に変更
- [x] `shigyo-tool` 最小構成化、Mac `.app` ビルド、ZIP再生成
- [x] Windows ランチャー / `windows/` 埋め込みPython版作成、起動フォールバック対応
- [x] インラインスタイルを CSS へ集約
