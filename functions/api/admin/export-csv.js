export async function onRequestGet(context) {
    const { env } = context;
    const KV = env.DOWNLOAD_LEADS;

    try {
        const list = await KV.list();
        const keys = list.keys;

        // ヘッダー：管理しやすいよう項目を細分化
        let csvRows = [["登録日時", "事務所名", "氏名", "メールアドレス", "顧問先数", "月間更新時間", "年間リスク額"]];

        for (const key of keys) {
            const value = await KV.get(key.name, { type: "json" });

            if (value) {
                const row = [
                    value.createdAt || "不明",
                    value.officeName || "",
                    value.userName || "",
                    value.email || "",
                    value.diagnosis?.clients || "",
                    value.diagnosis?.hours || "",
                    value.diagnosis?.riskAmount || ""
                ];
                // 各項目をダブルクォートで囲んでカンマ区切りにする
                csvRows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","));
            }
        }

        // Excel文字化け防止（BOM付きUTF-8）
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const csvContent = csvRows.join("\r\n");

        return new Response(new Blob([bom, csvContent], { type: "text/csv" }), {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": 'attachment; filename="logitsuku_leads.csv"',
            },
        });
    } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
}