<script>
    let diagnosticData = {clients: 0, hours: 0, risk: 0, skipped: false };

    // スライダーのリアルタイム計算
    const clientInput = document.getElementById('input-clients');
    const hourInput = document.getElementById('input-hours');

    function updateRisk() {
        const clients = parseInt(clientInput.value);
    const hours = parseInt(hourInput.value);
    // 計算式: 顧問先数 × 時間 × 1万円(時給) × 12ヶ月
    const risk = clients * hours * 10000 * 12;

    document.getElementById('val-clients').textContent = clients;
    document.getElementById('val-hours').textContent = hours;
    document.getElementById('risk-amount').textContent = "¥" + risk.toLocaleString();

    diagnosticData = {clients, hours, risk, skipped: false };
    }

    clientInput.addEventListener('input', updateRisk);
    hourInput.addEventListener('input', updateRisk);

    // 画面切り替え
    function showForm(skip = false) {
        if (skip) diagnosticData.skipped = true;
    document.getElementById('step-diagnostic').style.display = 'none';
    document.getElementById('step-form').style.display = 'block';
    }

    // フォーム送信（Workers/Functionsとの連携）
    document.getElementById('download-form').addEventListener('submit', async (e) => {
        e.preventDefault();
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
    headers: {'Content-Type': 'application/json' },
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

    // 初期計算の実行
    updateRisk();
</script>