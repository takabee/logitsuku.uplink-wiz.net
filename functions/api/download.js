export async function onRequestPost(context) {
    const { request, env } = context;
    const KV = env.DOWNLOAD_LEADS;

    try {
        const data = await request.json();
        const now = new Date();
        const timestamp = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

        const payload = {
            createdAt: timestamp,
            officeName: data.office || "未入力",
            userName: data.name || "未入力",
            email: data.email || "未入力",
            diagnosis: {
                clients: data.clients || 0,
                hours: data.hours || 0,
                riskAmount: data.risk || 0,
                isSkipped: data.skipped || false
            }
        };

        const key = `${now.getTime()}_${payload.email}`;
        await KV.put(key, JSON.stringify(payload));

        // ZIPファイルのフルパスを指定
        const ZIP_URL = "https://logitsuku-ai.uplink-wiz.net/assets/tools/check-list.zip";

        return new Response(JSON.stringify({
            success: true,
            downloadUrl: ZIP_URL
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}