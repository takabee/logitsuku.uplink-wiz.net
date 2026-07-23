# Windows Python不要版

このディレクトリは、Windows で **Python を事前インストールせずに** 起動できる実行パッケージです。

## 起動方法

1. `run.bat` をダブルクリック
2. ブラウザで `http://127.0.0.1:5001` が開く
3. `sample-overtime.csv` を使って動作確認

起動に失敗した場合は、`run.bat` の黒い画面にエラー内容が表示されたまま停止します。

## 同梱内容

- `python/` : Windows 埋め込み Python 3.9 ランタイム
- `app.py`, `logic.py`, `templates/` : アプリ本体
- `sample-overtime.csv` : サンプルデータ
- `run.bat` : 起動ランチャー
