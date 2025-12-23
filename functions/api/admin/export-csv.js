export async function onRequestGet(context) {
    const { env } = context;
    const KV = env.DOWNLOAD_LEADS;

    // 1. KVから全キーを取得
    const list = await KV.list();
    const keys = list.keys;

    if (keys.length === 0) {
        return new Response("No data found", { status: 404 });
    }

    // 2. ヘッダー行の定義（保存しているデータ構造に合わせて調整してください）
    let csvContent = "Date,Email,Result\n";

    // 3. 各キーのデータを取得して行に追加
    for (const key of keys) {
        const value = await KV.get(key.name, { type: "json" });
        if (value) {
            // CSVのエスケープ処理（簡易版）
            const row = [
                key.name, // 保存時のキー（タイムスタンプ等）
                `"${value.email || ''}"`,
                `"${JSON.stringify(value.result).replace(/"/g, '""') || ''}"`
            ].join(",");
            csvContent += row + "\n";
        }
    }

    // 4. CSVとしてレスポンスを返す
    return new Response(csvContent, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="leads_export.csv"',
            // 必要に応じてBasic認証や特定のIP制限をここに入れる
        },
    });
}