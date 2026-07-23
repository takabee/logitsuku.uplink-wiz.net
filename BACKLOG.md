# BACKLOG

## Epic 1: セキュリティ・ガバナンス

### Story 1-1 管理API保護
- 目的: CSVエクスポートAPIの不正利用を防止する
- 受け入れ条件:
  - `/api/admin/export-csv` が未認証アクセスで `401/403` を返す
  - 正常な認証情報でのみ CSV ダウンロードできる
- 状態: **実装済み**（Basic 認証）

### Story 1-2 個人情報管理
- 目的: 収集したリード情報の取り扱いを運用可能にする
- 受け入れ条件:
  - 保存期間ポリシーが文書化されている
  - 削除依頼時のデータ削除手順がある
- 状態: **暫定版作成済み**（`DATA_POLICY.md`）

## Epic 2: 配布フロー最適化（shigyo-tool連携）

### Story 2-1 配布物のバージョン管理
- 目的: LPダウンロード先と配布物の整合性を担保する
- 受け入れ条件:
  - ダウンロードURLがバージョン管理される
  - いつ・どの配布物に切り替わったか追跡できる

### Story 2-2 ビルド成果物の自動反映
- 目的: 手動更新ミスを減らす
- 受け入れ条件:
  - `shigyo-tool` ビルド成果物の配置手順が定義される
  - リリース手順にチェックリストが存在する

### Story 2-3 配布ZIPの構成（現状）
- Mac: `check-list/OvertimeChecker.app`（PyInstaller ビルド済み）
- Windows（ZIP内）: `OvertimeChecker-Windows.bat` + `windows-src/`（Python 要・初回 venv セットアップ）
- Windows（リポジトリ内）: `windows/` ディレクトリ（埋め込み Python 同梱・Python 事前インストール不要）
- 共通: `sample-overtime.csv`, `README_DOWNLOAD.txt`

## Epic 3: 品質改善

### Story 3-1 APIの検証強化
- 目的: 不正入力による障害を防止する
- 受け入れ条件:
  - `clients/hours/risk/skipped` の型と範囲を検証する
  - 不正時は `400` と明確なメッセージを返す
- 状態: **実装済み**

### Story 3-2 テスト自動化
- 目的: 変更時の退行を防ぐ
- 受け入れ条件:
  - APIテストがCIで実行される
  - 主要ユーザーフローのE2Eテストがある

## Epic 4: UI/UX整備

### Story 4-1 スタイルの一元化
- 目的: フロント実装の保守性を上げる
- 受け入れ条件:
  - `index.html` のインラインスタイルが削減される
  - `assets/styles/main.css` に集約される

### Story 4-2 フィードバック改善
- 目的: 送信失敗時の離脱を減らす
- 受け入れ条件:
  - API失敗時に原因別メッセージを表示する
  - 再試行導線が分かりやすい

---

## Epic 5: Windows 版ビルド・配布（重要）

### 背景

2026-07-09 に Windows 向け配布物を作成した際、Mac（ARM）環境からのクロスビルドでは複数の障害が発生した。本 Epic は再発防止と、安定した Windows 配布フローの確立を目的とする。

### Story 5-1 埋め込み Python 方式（現行・`windows/`）

- 目的: エンドユーザーに Python インストールを要求せず起動できるようにする
- 構成:
  - `windows/python/` … [python.org 埋め込み配布](https://www.python.org/downloads/windows/)（`python-3.9.x-embed-amd64.zip`）
  - `windows/python/python39._pth` … `Lib/site-packages` と `import site` を有効化
  - `windows/python/Lib/site-packages/` … Flask 依存一式
  - `windows/app.py`, `logic.py`, `templates/`
  - `windows/run.bat` … 起動ランチャー
- 受け入れ条件:
  - `run.bat` ダブルクリックで `http://127.0.0.1:5001` が開く
  - `sample-overtime.csv` で診断が動作する

### Story 5-2 Windows `.bat` 作成時の注意点（必読）

| 項目 | 注意点 | 本日の障害例 |
|------|--------|--------------|
| 文字コード | **日本語を `.bat` に書かない**（ASCII のみ推奨） | `chcp 65001` + 日本語 `echo` で文字化け・コマンド誤認識 |
| 括弧構文 | `if (...)` ブロック内に日本語や複雑なネストを入れない | `python.exe` に `(` が引数として渡る異常 |
| パス指定 | `%~dp0` を変数に格納し、**絶対パス**で `python.exe` / `app.py` を呼ぶ | 相対パス・引用符不足で起動失敗 |
| エラー表示 | 失敗時は `pause` で画面を閉じない | ダブルクリック時に一瞬で消えて原因不明 |
| 必須ファイル | `logic.py`, `templates/` が同ディレクトリにあること | `ModuleNotFoundError: No module named 'logic'` |
| 配布単位 | **`windows/` フォルダ一式**をコピー（`run.bat` と `app.py` だけでは不可） | ファイル欠落で起動不可 |

### Story 5-3 依存ライブラリ同梱時の注意点

| 依存 | 問題 | 対応 |
|------|------|------|
| `blinker` | Flask 3.x が必須 import。同梱漏れで起動失敗 | `site-packages` に同梱、または `app.py` でフォールバック（実装済み） |
| `colorama` | Windows 上で Click が import。同梱漏れで起動失敗 | 同梱、または `app.py` でフォールバック（実装済み） |
| `markupsafe` | Mac で `pip install` すると `.cpython-39-darwin.so` が入る | Windows では使えない。**純 Python wheel** のみ同梱するか、Windows 上でインストール |
| その他 | Mac ARM でビルドしたバイナリ拡張（`.so` / `.pyd`）は OS/アーキテクチャ依存 | **Windows 上で依存をインストール**するのが正攻法 |

### Story 5-4 Mac から Windows `.exe` を作れない理由

- PyInstaller の Windows ビルドは **Windows ホスト必須**（Mac では `.app` のみ）
- Docker `cdrx/pyinstaller-windows`（Wine 経由）も **Mac ARM では Wine が不安定**で失敗
- 結論: 単体 `.exe` が必要なら **GitHub Actions `windows-latest`** 等の CI でビルドする

### Story 5-5 推奨ビルドフロー（今後）

#### A. 埋め込み Python 方式（現行・手動）

1. Windows PC（または CI）で `python.org` から `embed-amd64.zip` を取得
2. `python39._pth` を編集（`Lib/site-packages`, `import site`）
3. `pip install --target Lib/site-packages flask psutil`（**Windows 上で実行**）
4. `app.py`, `logic.py`, `templates/`, `sample-overtime.csv` を配置
5. `run.bat` で起動確認
6. `windows/` 一式を ZIP 化して `assets/tools/check-list.zip` に同梱

#### B. 単体 `.exe` 方式（将来・推奨）

1. GitHub Actions `windows-latest` で PyInstaller 実行
2. 成果物 `OvertimeChecker.exe` を `check-list/` に配置
3. Mac `.app` と合わせて ZIP 生成
4. リリースタグと紐づけ

### Story 5-6 `app.py` 側の防御的実装（実装済み・維持すること）

```python
# BASE_DIR を sys.path に追加（logic 解決）
# blinker フォールバック（Flask 3.x）
# colorama フォールバック（Click on Windows）
```

- 同梱漏れがあっても起動できるようフォールバックを入れているが、**正規の依存同梱が前提**
- フォールバックは「応急」であり、本番配布前に Windows 実機テスト必須

### Story 5-7 受け入れチェックリスト（Windows 配布前）

- [ ] `windows/` フォルダ一式が揃っている（`python/`, `app.py`, `logic.py`, `templates/`, `run.bat`, `sample-overtime.csv`）
- [ ] `run.bat` が ASCII のみ（日本語メッセージなし）
- [ ] `python\python.exe` が存在する
- [ ] `python\Lib\site-packages\flask` が存在する
- [ ] `python\Lib\site-packages\blinker` が存在する（またはフォールバック確認）
- [ ] Windows 10/11 実機で `run.bat` ダブルクリック起動
- [ ] ブラウザで `http://127.0.0.1:5001` が開く
- [ ] `sample-overtime.csv` をアップロードして結果表示
- [ ] ポート 5001 が既に使用中の場合の挙動を確認
