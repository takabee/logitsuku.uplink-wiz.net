export async function onRequestPost(context) {
    const { request, env } = context;
    const KV = env.DOWNLOAD_LEADS;

    try {
        const data = await request.json();

        // 日本時間の日時を生成
        const now = new Date();
        const timestamp = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

        // HTMLのname属性や診断結果の変数名に合わせてパッキング
        const payload = {
            createdAt: timestamp,
            officeName: data.office || "未入力", // name="office"
            userName: data.name || "未入力",     // name="name"
            email: data.email || "未入力",        // name="email"
            // 診断データ（フロントエンドから送られてくる想定の値をキャッチ）
            diagnosis: {
                clients: data.clients || "不明",    // 顧問先数
                hours: data.hours || "不明",        // 修正時間
                riskAmount: data.risk || "不明"     // リスク額
            }
        };

        // KVに保存（キー：タイムスタンプ_メアド）
        const key = `${now.getTime()}_${payload.email}`;
        await KV.put(key, JSON.stringify(payload));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}