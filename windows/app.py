import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Flask 3.x requires blinker. Some offline bundles may miss it, so provide a tiny fallback.
try:
    import blinker  # noqa: F401
except ModuleNotFoundError:
    class _Signal:
        def connect(self, *args, **kwargs):
            return None

        def send(self, *args, **kwargs):
            return []

    class _Namespace:
        def signal(self, *args, **kwargs):
            return _Signal()

    class _BlinkerCompat:
        Namespace = _Namespace

    sys.modules["blinker"] = _BlinkerCompat()

# Click on Windows may import colorama for console wrapping.
try:
    import colorama  # noqa: F401
except ModuleNotFoundError:
    class _AnsiToWin32:
        def __init__(self, stream, *args, **kwargs):
            self.stream = stream

    class _ColoramaCompat:
        AnsiToWin32 = _AnsiToWin32

        @staticmethod
        def just_fix_windows_console():
            return None

    sys.modules["colorama"] = _ColoramaCompat()

from flask import Flask, render_template, request, redirect, url_for
import io
import logic
import threading
import webbrowser


app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024


@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["Cache-Control"] = "public, max-age=0"
    return response


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/pricing", methods=["GET"])
def pricing():
    return render_template("pricing.html")


@app.route("/check", methods=["POST"])
def check():
    if "file" not in request.files:
        return redirect(url_for("index"))

    file = request.files["file"]
    if file.filename == "" or not file.filename.lower().endswith(".csv"):
        return redirect(url_for("index"))

    month_col = request.form.get("month_col", "年月")
    overtime_col = request.form.get("overtime_col", "残業時間（h）")

    try:
        stream = io.StringIO(file.stream.read().decode("utf-8-sig"), newline=None)
    except UnicodeDecodeError:
        try:
            file.stream.seek(0)
            stream = io.StringIO(file.stream.read().decode("cp932"), newline=None)
        except UnicodeDecodeError:
            return render_template(
                "result.html",
                errors=["文字コードを判定できませんでした。UTF-8 または Shift-JIS (CP932) で保存してください。"],
            )

    records, errors = logic.parse_csv(stream, month_col=month_col, overtime_col=overtime_col)
    unique_emp_ids = set(r["id"] for r in records)
    if len(unique_emp_ids) > 10:
        limit_error = (
            f"【無料版制限】従業員数が10名を超えています（ファイル内の人数: {len(unique_emp_ids)}名）。"
            "無料版では10名までしかチェックできません。"
        )
        return render_template("result.html", errors=[limit_error])

    results = logic.check_violations(records)
    return render_template(
        "result.html",
        results=results,
        month_col=month_col,
        overtime_col=overtime_col,
        errors=errors,
    )


@app.route("/demo", methods=["GET"])
def demo():
    records = []
    for m in range(4, 10):
        records.append({"id": "DEMO01", "name": "山田 太郎（デモ）", "year_month": f"2024/{m:02d}", "overtime": 20.0})
    records.append({"id": "DEMO02", "name": "鈴木 一郎（デモ）", "year_month": "2024/04", "overtime": 85.0})
    records.append({"id": "DEMO02", "name": "鈴木 一郎（デモ）", "year_month": "2024/05", "overtime": 85.0})
    results = logic.check_violations(records)
    return render_template("result.html", results=results, month_col="（デモデータ）", overtime_col="（デモデータ）")


if __name__ == "__main__":
    port = 5001
    url = f"http://127.0.0.1:{port}"
    threading.Timer(1.0, lambda: webbrowser.open_new(url)).start()
    app.run(debug=False, port=port)
