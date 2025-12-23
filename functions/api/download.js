export async function onRequestPost(context) {
    try {
        // 1. データの受け取り
        const data = await context.request.json();
        const email = data.email;

        if (!email) {
            return new Response(JSON.stringify({ error: "メールアドレスがありません" }), { status: 400 });
        }

        // 2. KVへの保存 (ここが重要！)
        // context.env.DOWNLOAD_LEADS が管理画面の設定と一致している必要があります
        await context.env.DOWNLOAD_LEADS.put(email, JSON.stringify({
            ...data,
            date: new Date().toISOString()
        }));

        // 3. 成功レスポンス
        return new Response(JSON.stringify({
            message: "Success",
            downloadUrl: "https://logitsuku-ai.uplink-wiz.net/assets/tools/check-list.zip"
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        // どこでエラーが出たか詳細を返すようにします
        return new Response(JSON.stringify({
            error: "KV保存エラー",
            details: err.message
        }), { status: 500 });
    }
}