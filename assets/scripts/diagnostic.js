export async function onRequestPost(context) {
    const { request, env } = context;
    const KV = env.DOWNLOAD_LEADS;

    try {
        const data = await request.json();

        const now = new Date();
        const timestamp = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

        // JSの変数名（clients, hours, risk, skipped, office, name, email）に完全準拠
        const payload = {
            createdAt: timestamp,
            officeName: data.office || "未入力",
            userName: data.name || "未入力",
            email: data.email || "未入力",
            // 診断データ
            diagnosis: {
                clients: data.clients || 0,
                hours: data.hours || 0,
                riskAmount: data.risk || 0,
                isSkipped: data.skipped || false
            }
        };

        // 保存（一意のキーを作成）
        const key = `${now.getTime()}_${payload.email}`;
        await KV.put(key, JSON.stringify(payload));

        // フロントエンドのJSが result.downloadUrl を期待しているので、本番のPDFパスを返す
        return new Response(JSON.stringify({
            success: true,
            downloadUrl: "https://logitsuku-ai.uplink-wiz.net/assets/tools/check-list.zip" // ここを実際のZIPパスへ
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}