# shigyo-tool 最小実行構成

このディレクトリは「ローカルでアプリを起動する」ための最小構成です。

## 残しているファイル

- `app.py`
- `logic.py`
- `templates/`
- `requirements.txt`

## 起動方法

```bash
cd shigyo-tool
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

起動後、`http://127.0.0.1:5001` が開きます。
