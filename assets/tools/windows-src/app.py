# Copyright (c) 2025 uplink. All rights reserved.
# 
# This source code is licensed for use only by the authorized user.
# Unauthorized redistribution or modification is prohibited.

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

import sys
import psutil

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

# Initialize Flask with correct template folder
if getattr(sys, 'frozen', False):
    template_folder = resource_path('templates')
    app = Flask(__name__, template_folder=template_folder)
else:
    app = Flask(__name__)
    
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit

@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers['Cache-Control'] = 'public, max-age=0'
    return response

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/pricing', methods=['GET'])
def pricing():
    return render_template('pricing.html')

@app.route('/check', methods=['POST'])
def check():
    if 'file' not in request.files:
        return redirect(url_for('index'))
    
    file = request.files['file']
    if file.filename == '' or not file.filename.lower().endswith('.csv'):
        return redirect(url_for('index'))
    
    if file:
        month_col = request.form.get('month_col', '年月')
        overtime_col = request.form.get('overtime_col', '残業時間（h）')
        
        # Decode stream
        try:
            # Attempt UTF-8
            stream = io.StringIO(file.stream.read().decode("utf-8-sig"), newline=None)
        except UnicodeDecodeError:
            try:
                # Fallback for Shift-JIS common in Japan
                file.stream.seek(0)
                stream = io.StringIO(file.stream.read().decode("cp932"), newline=None)
            except UnicodeDecodeError:
                return render_template('result.html', errors=["文字コードを判定できませんでした。UTF-8 または Shift-JIS (CP932) で保存してください。"])

        records, errors = logic.parse_csv(stream, month_col=month_col, overtime_col=overtime_col)
        
        # [Usage Limit Check]
        # Count unique employee IDs
        unique_emp_ids = set(r['id'] for r in records)
        if len(unique_emp_ids) > 10:
            limit_error = f"【無料版制限】従業員数が10名を超えています（ファイル内の人数: {len(unique_emp_ids)}名）。無料版では10名までしかチェックできません。"
            return render_template('result.html', errors=[limit_error])

        results = logic.check_violations(records)
        
        return render_template('result.html', results=results, month_col=month_col, overtime_col=overtime_col, errors=errors)

@app.route('/quit', methods=['POST'])
def quit():
    # Shutdown the application with a slight delay to allow response to be sent
    def shutdown():
        os._exit(0)
    
    threading.Timer(0.5, shutdown).start()
    return "OK"

@app.route('/demo', methods=['GET'])
def demo():
    # Sample data for demonstration
    # Scenario: 
    # - User A (Safe): Standard usage
    # - User B (Warning): High overtime, average violation
    records = []
    
    # User A: Safe
    for m in range(4, 10): # Apr-Sep
        records.append({"id": "DEMO01", "name": "山田 太郎（デモ）", "year_month": f"2024/{m:02d}", "overtime": 20.0})
        
    # User B: Violation (Avg > 80h)
    # 2024/04: 85h, 2024/05: 85h -> Avg 85h
    records.append({"id": "DEMO02", "name": "鈴木 一郎（デモ）", "year_month": "2024/04", "overtime": 85.0})
    records.append({"id": "DEMO02", "name": "鈴木 一郎（デモ）", "year_month": "2024/05", "overtime": 85.0})
    
    results = logic.check_violations(records)
    return render_template('result.html', results=results, month_col="（デモデータ）", overtime_col="（デモデータ）")
if __name__ == '__main__':
    import webbrowser
    import threading
    import socket
    import sys

    port = 5001
    url = f"http://127.0.0.1:{port}"

    import time

    def kill_existing_process(port):
        """ Kills any process listening on the specified port. """
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                for conn in proc.connections(kind='inet'):
                    if conn.laddr.port == port:
                        print(f"Killing existing process: {proc.info['name']} (PID: {proc.info['pid']})")
                        proc.kill()
                        proc.wait(timeout=3)
                        return
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass

    # Kill any existing instance on the port
    kill_existing_process(port)
    
    def open_browser():
        webbrowser.open_new(url)

    # Open browser after slight delay to ensure server is running
    threading.Timer(1.0, open_browser).start()
    
    app.run(debug=False, port=port)
