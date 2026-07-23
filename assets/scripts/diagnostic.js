
(function () {
    // 初期値をセット
    let diagnosticData = { clients: 30, hours: 5, risk: 1800000, skipped: false };

    document.addEventListener('DOMContentLoaded', () => {
        const clientInput = document.getElementById('input-clients');
        const hourInput = document.getElementById('input-hours');
        const downloadForm = document.getElementById('download-form');
        const submitBtn = document.getElementById('submit-btn');
        const clientsValue = document.getElementById('val-clients');
        const hoursValue = document.getElementById('val-hours');
        const riskAmount = document.getElementById('risk-amount');

        if (!clientInput || !hourInput || !downloadForm || !clientsValue || !hoursValue || !riskAmount) return;

        function updateRisk() {
            const clients = parseInt(clientInput.value, 10);
            const hours = parseInt(hourInput.value, 10);
            const risk = clients * hours * 10000 * 12;

            clientsValue.textContent = String(clients);
            hoursValue.textContent = String(hours);
            riskAmount.textContent = "¥" + risk.toLocaleString();

            diagnosticData = { clients, hours, risk, skipped: false };
        }

        clientInput.addEventListener('input', updateRisk);
        hourInput.addEventListener('input', updateRisk);

        downloadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '送信中...';
            }

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

                const result = await response.json().catch(() => ({}));

                if (response.ok && result.downloadUrl) {
                    alert('情報の送信に成功しました。ツールのダウンロードを開始します。');
                    // 指定されたURLへ飛ばす
                    window.location.href = result.downloadUrl;
                } else {
                    throw new Error(result.error || 'サーバーレスポンスが不正です');
                }
            } catch (err) {
                console.error(err);
                alert('エラーが発生しました。入力を確認し、再度お試しください。');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'ツールを今すぐダウンロード';
                }
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
