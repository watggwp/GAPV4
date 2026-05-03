require('dotenv').config();
const line = require("./configLine");
const Pool = require("./connectPool");

module.exports = function callServices(app, connectionDB = new Pool()) {
    async function notifyDeviceStatus(status, device_id, res) {
        const sql = `
            SELECT 
                device_all.device_id, 
                device_all.greenhouse_id, 
                h.uid_line, 
                h.name_house, 
                f.fullname AS farmer_name
            FROM (
                SELECT device_id, greenhouse_id FROM sensor_pump_greenhouse WHERE device_id = ?
                UNION ALL
                SELECT device_id, greenhouse_id FROM sensor_weather_greenhouse WHERE device_id = ?
            ) AS device_all
            JOIN housefarm h ON device_all.greenhouse_id = h.id_farm_house
            LEFT JOIN acc_farmer f ON h.uid_line = f.uid_line
            LIMIT 1
        `;

        let result;
        try {
            result = await connectionDB.executeQuery(sql, [device_id, device_id]);
        } catch (err) {
            console.error("DB query failed:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        // รองรับทั้งกรณี result เป็น array หรือ object เดี่ยว
        const row = Array.isArray(result) ? result[0] : result;

        if (!row) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        const uid_line = row.uid_line?.trim?.();
        const farmer_name = (row.farmer_name ?? "").toString().trim();
        const name_house = (row.name_house ?? "").toString().trim();
        const deviceIdForMsg = (row.device_id ?? device_id ?? "").toString().trim();

        if (!uid_line) {
            return res.status(400).json({ success: false, message: "No uid_line linked to this greenhouse" });
        }

        const message =
            `❗ อุปกรณ์ ${status}\n` +
            `📟 อุปกรณ์: ${deviceIdForMsg}\n` +
            `🏠 โรงเรือน: ${name_house || "-"}\n` +
            `👨‍🌾 เกษตรกร: ${farmer_name || "-"}`;

        try {
            await line.pushMessage(uid_line, [{ type: "text", text: message }]);
            return res.json({ success: true });
        } catch (err) {
            console.error("❌ pushMessage failed:", err.response?.data || err);
            return res.status(500).json({ success: false, error: err.response?.data || err.message });
        }
    }
    
    app.post("/api/line/notify/device_offline", (req, res) => {
        const { device_id } = req.body;
        if (!device_id) return res.status(400).json({ message: "Missing device_id" });
        notifyDeviceStatus("Offline", device_id, res);
    });

    app.post("/api/line/notify/device_online", (req, res) => {
        const { device_id } = req.body;
        if (!device_id) return res.status(400).json({ message: "Missing device_id" });
        notifyDeviceStatus("Online", device_id, res);
    });
}