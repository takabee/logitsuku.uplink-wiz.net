export async function onRequestPost(context) {
    const { request, env } = context;
    const KV = env.DOWNLOAD_LEADS;
    const ZIP_URL = "/assets/tools/check-list.zip";

    try {
        const data = await request.json();
        const office = (data.office || "").trim();
        const name = (data.name || "").trim();
        const email = (data.email || "").trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!office || !name || !email) {
            return new Response(JSON.stringify({ error: "必須項目が不足しています。" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!emailPattern.test(email)) {
            return new Response(JSON.stringify({ error: "メールアドレスの形式が不正です。" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const toNumber = (value) => {
            if (typeof value === "number") return value;
            if (typeof value === "string" && value.trim() !== "") return Number(value);
            return NaN;
        };

        const isIntegerInRange = (value, min, max) =>
            Number.isInteger(value) && value >= min && value <= max;

        const skipped = typeof data.skipped === "boolean" ? data.skipped : null;
        if (skipped === null) {
            return new Response(JSON.stringify({ error: "診断データの形式が不正です。（skipped）" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const parsedClients = toNumber(data.clients);
        const parsedHours = toNumber(data.hours);
        const parsedRisk = toNumber(data.risk);

        if (!Number.isFinite(parsedClients) || !Number.isFinite(parsedHours) || !Number.isFinite(parsedRisk)) {
            return new Response(JSON.stringify({ error: "診断データの形式が不正です。（数値）" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (!isIntegerInRange(parsedClients, 0, 200) || !isIntegerInRange(parsedHours, 0, 40)) {
            return new Response(JSON.stringify({ error: "診断データが範囲外です。" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (parsedRisk < 0) {
            return new Response(JSON.stringify({ error: "年間リスク額が不正です。" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const expectedRisk = parsedClients * parsedHours * 10000 * 12;
        if (!skipped && parsedRisk !== expectedRisk) {
            return new Response(JSON.stringify({ error: "診断データが不正です。（リスク計算不一致）" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (skipped && (parsedClients !== 0 || parsedHours !== 0 || parsedRisk !== 0)) {
            return new Response(JSON.stringify({ error: "診断スキップ時のデータが不正です。" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const now = new Date();
        const timestamp = now.toISOString();

        const payload = {
            createdAt: timestamp,
            officeName: office,
            userName: name,
            email,
            diagnosis: {
                clients: parsedClients,
                hours: parsedHours,
                riskAmount: parsedRisk,
                isSkipped: skipped
            }
        };

        const key = `${now.getTime()}_${email.replace(/[^a-z0-9@._-]/g, "_")}`;
        await KV.put(key, JSON.stringify(payload));

        return new Response(JSON.stringify({
            success: true,
            downloadUrl: ZIP_URL
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
