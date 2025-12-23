export async function onRequestGet(context) {
    const { env } = context;
    const KV = env.DOWNLOAD_LEADS;

    try {
        // 1. KVからリストを取得
        const list = await KV.list();
        const keys = list.keys;

        if (!keys || keys.length === 0) {
            return new Response("No data found", { status: 404 });
        }

        // 2. CSVヘッダー
        let rows = [["Date", "Email", "Result"]];

        // 3. データの取得
        for (const key of keys) {
            try {
                const value = await KV.get(key.name, { type: "json" });

                if (value) {
                    // データの安全な取り出し
                    const email = value.email || "N/A";
                    const result = value.result ? JSON.stringify(value.result).replace(/"/g, '""') : "N/A";

                    rows.push([key.name, `"${email}"`, `"${result}"`]);
                }
            } catch (e) {
                // 個別のデータ取得エラーはスキップして継続
                continue;
            }
        }

        const csvContent = rows.map(r => r.join(",")).join("\n");

        return new Response(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": 'attachment; filename="leads_export.csv"',
                "Access-Control-Allow-Origin": "*", // テスト用
            },
        });

    } catch (error) {
        // エラー内容をレスポンスとして返す（デバッグ用）
        return new Response(`Internal Error: ${error.message}`, { status: 500 });
    }
}