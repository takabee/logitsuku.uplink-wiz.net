export async function onRequestGet(context) {
    const { env, request } = context;
    const KV = env.DOWNLOAD_LEADS;
    const expectedUser = env.ADMIN_EXPORT_USER;
    const expectedPass = env.ADMIN_EXPORT_PASSWORD;

    if (!expectedUser || !expectedPass) {
        return new Response("Server configuration error", { status: 500 });
    }

    const authHeader = request.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Basic ")) {
        return new Response("Unauthorized", {
            status: 401,
            headers: { "WWW-Authenticate": 'Basic realm="admin-export"' }
        });
    }

    let decoded = "";
    try {
        decoded = atob(authHeader.slice(6));
    } catch (_error) {
        return new Response("Unauthorized", {
            status: 401,
            headers: { "WWW-Authenticate": 'Basic realm="admin-export"' }
        });
    }

    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) {
        return new Response("Unauthorized", {
            status: 401,
            headers: { "WWW-Authenticate": 'Basic realm="admin-export"' }
        });
    }

    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);
    if (user !== expectedUser || pass !== expectedPass) {
        return new Response("Forbidden", { status: 403 });
    }

    try {
        const escapeCsv = (field) => `"${String(field ?? "").replace(/"/g, '""')}"`;
        const rows = [
            ["登録日時", "事務所名", "氏名", "メールアドレス", "顧問先数", "月間更新時間", "年間リスク額", "診断スキップ有無"]
        ];
        let cursor = undefined;

        do {
            const list = await KV.list({ cursor, limit: 1000 });
            cursor = list.list_complete ? undefined : list.cursor;

            for (const key of list.keys) {
                const value = await KV.get(key.name, { type: "json" });
                if (!value) continue;

                rows.push([
                    value.createdAt || "不明",
                    value.officeName || "",
                    value.userName || "",
                    value.email || "",
                    value.diagnosis?.clients || "",
                    value.diagnosis?.hours || "",
                    value.diagnosis?.riskAmount || "",
                    value.diagnosis?.isSkipped ? "はい" : "いいえ"
                ]);
            }
        } while (cursor);

        // Excel文字化け防止（BOM付きUTF-8）
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const csvContent = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");

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