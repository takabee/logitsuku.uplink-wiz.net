(function () {
    let diagnosticData = { clients: 30, hours: 5, risk: 1800000, skipped: false };

    document.addEventListener('DOMContentLoaded', () => {
        const clientInput = document.getElementById('input-clients');
        const hourInput = document.getElementById('input-hours');
        const downloadForm = document.getElementById('download-form');

        if (!clientInput || !hourInput || !downloadForm) return;

        function updateRisk() {
            const clients = parseInt(clientInput.value);
            const hours = parseInt(hourInput.value);
            const risk = clients * hours * 10000 * 12;

            document.getElementById('val-clients').textContent = clients;
            document.getElementById('val-hours').textContent = hours;
            document.getElementById('risk-amount').textContent = "¥" + risk.toLocaleString();

            diagnosticData = { clients, hours, risk, skipped: false };
        }

        clientInput.addEventListener('input', updateRisk);
        hourInput.addEventListener('input', updateRisk);

        downloadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = '送信中...';

            const formData = new FormData(e.target);
            const payload = {
                ...diagnosticData,
                office: formData.get('office'),
                name: formData.get('name'),
                email: formData.get('email')
            };

            try {
                const response = await fetch('/api/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('情報の送信に成功しました。ツールのダウンロードを開始します。');
                    // download.jsから返されたURLへリダイレクト
                    window.location.href = result.downloadUrl;
                } else {
                    throw new Error('サーバーエラーが発生しました');
                }
            } catch (err) {
                alert('エラーが発生しました。時間を置いて再度お試しください。');
                submitBtn.disabled = false;
                submitBtn.textContent = 'ツールを今すぐダウンロード';
            }
        });

        updateRisk();
    });

    window.showForm = function (skip = false) {
        if (skip) {
            diagnosticData.skipped = true;
            diagnosticData.clients = 0;
            diagnosticData.hours = 0;
            diagnosticData.risk = 0;
        }
        document.getElementById('step-diagnostic').style.display = 'none';
        document.getElementById('step-form').style.display = 'block';
    };
})();