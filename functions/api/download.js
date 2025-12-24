export async function onRequestPost(context) {
    const { request, env } = context;
    const KV = env.DOWNLOAD_LEADS;

    try {
        const data = await request.json();

        // 日本時間の日時を生成
        const now = new Date();
        const timestamp = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

        // ペイロードの構築
        const payload = {
            createdAt: timestamp,
            officeName: data.office || "未入力",
            userName: data.name || "未入力",
            email: data.email || "未入力",
            diagnosis: {
                clients: data.clients || "不明",
                hours: data.hours || "不明",
                riskAmount: data.risk || "不明",
                isSkipped: data.skipped || false
            }
        };

        // KVに保存
        const key = `${now.getTime()}_${payload.email}`;
        await KV.put(key, JSON.stringify(payload));

        // 重要：フロントエンドが期待する「downloadUrl」を返却する
        // 本番のZIPファイルのパス（例: /assets/tools/check-list.zip）に書き換えてください
        const PDF_URL = "https://logitsuku-ai.uplink-wiz.net/assets/tools/check-list.zip";

        return new Response(JSON.stringify({
            success: true,
            downloadUrl: PDF_URL
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}