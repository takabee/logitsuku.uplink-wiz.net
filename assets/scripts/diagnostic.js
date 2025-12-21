// 全体を関数で囲むことで、他のJSとの衝突を防ぎます
(function () {
    let diagnosticData = { clients: 0, hours: 0, risk: 0, skipped: false };

    // DOMの読み込み完了を待ってから実行する
    document.addEventListener('DOMContentLoaded', () => {
        const clientInput = document.getElementById('input-clients');
        const hourInput = document.getElementById('input-hours');
        const downloadForm = document.getElementById('download-form');

        // 要素が存在しない場合のエラー防止
        if (!clientInput || !hourInput || !downloadForm) return;

        function updateRisk() {
            const clients = parseInt(clientInput.value);
            const hours = parseInt(hourInput.value);
            // 計算式: 顧問先数 × 時間 × 1万円(時給) × 12ヶ月
            const risk = clients * hours * 10000 * 12;

            document.getElementById('val-clients').textContent = clients;
            document.getElementById('val-hours').textContent = hours;
            document.getElementById('risk-amount').textContent = "¥" + risk.toLocaleString();

            diagnosticData = { clients, hours, risk, skipped: false };
        }

        clientInput.addEventListener('input', updateRisk);
        hourInput.addEventListener('input', updateRisk);

        // フォーム送信
        downloadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const payload = {
                ...diagnosticData,
                office: formData.get('office'),
                name: formData.get('name'),
                email: formData.get('email')
            };

            try {
                const response = await fetch('/functions/api/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (result.downloadUrl) {
                    alert('情報の送信に成功しました。ツールのダウンロードを開始します。');
                    window.location.href = result.downloadUrl;
                }
            } catch (err) {
                alert('エラーが発生しました。時間を置いて再度お試しください。');
            }
        });

        // 初期表示の計算
        updateRisk();
    });

    // showFormはHTMLから直接呼ばれるので、windowオブジェクトに紐付けて外から見えるようにする
    window.showForm = function (skip = false) {
        if (skip) diagnosticData.skipped = true;
        const diagStep = document.getElementById('step-diagnostic');
        const formStep = document.getElementById('step-form');
        if (diagStep && formStep) {
            diagStep.style.display = 'none';
            formStep.style.display = 'block';
        }
    };
})();