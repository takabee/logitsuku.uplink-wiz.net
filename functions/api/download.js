export async function onRequestPost(context) {
    try {
        // 1. フロントエンド（JS）から送られてきたデータを読み取る
        const data = await context.request.json();
        const { email, name, office, risk } = data;

        // 2. データの検証（メールアドレスがない場合はエラーを返す）
        if (!email) {
            return new Response(JSON.stringify({ error: "メールアドレスが必要です" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 3. 保存するデータの整形（登録日時などを追加）
        const leadData = {
            ...data,
            timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            userAgent: context.request.headers.get("user-agent") // どんな端末から送られたか
        };

        // 4. KVに保存（Key: メールアドレス, Value: JSONデータ）
        // ※ DOWNLOAD_LEADS は後ほどダッシュボードで設定する変数名です
        await context.env.DOWNLOAD_LEADS.put(email, JSON.stringify(leadData));

        // 5. 成功レスポンス（実際のツールURLを返す）
        return new Response(JSON.stringify({
            message: "Success",
            downloadUrl: "https://logitsuku-ai.uplink-wiz.net/assets/tools/check-list.zip" // ★ここを実際のパスに！
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "サーバーエラーが発生しました" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}