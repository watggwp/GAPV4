require('dotenv').config();
const line = require("./configLine");
const Pool = require("./connectPool");

module.exports = function callServices(app, connectionDB = new Pool()) {
    app.post("/api/line/notify/device-offline", async (req, res) => {
        const { device_id } = req.body;

        if (!device_id) {
            return res.status(400).json({ message: "Missing device_id" });
        }

        try {
            const [rows] = await connectionDB.executeQuery(
                `
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
                    JOIN acc_farmer f ON h.uid_line = f.uid_line
                    LIMIT 1
                `,
                [device_id, device_id]
            );
            // console.log("✅ rows:", rows);

            if (!rows || rows.length === 0) {
                console.warn("🔍 Device not found in DB:", device_id);
                return res.status(404).json({ success: false, message: "Device not found" });
            }

            const row = Array.isArray(rows) ? rows[0] : rows;
            const { uid_line, farmer_name, name_house } = row;


            console.log("📨 Pushing to uid_line:", uid_line);
            try {
                await line.pushMessage(
                    uid_line,
                    [{
                        type: "text",
                        text: `❗ อุปกรณ์ Offline\n📟 อุปกรณ์: ${device_id.trim()}\n🏠 โรงเรือน: ${name_house.trim()}\n👨‍🌾 เกษตรกร: ${farmer_name.trim()}`
                    }]
                );
                res.json({ success: true });
            } catch (err) {
                console.error("❌ pushMessage failed:", err.response?.data || err);
                res.status(500).json({ success: false, error: err.response?.data || err.message });
            }
        } catch (err) {
            console.error("LINE Notify error:", err);
            res.status(500).json({ success: false, error: err });
        }
    });

    app.post("/api/line/notify/device-online", async (req, res) => {
        const { device_id } = req.body;

        if (!device_id) {
            return res.status(400).json({ message: "Missing device_id" });
        }

        try {
            const [rows] = await connectionDB.executeQuery(
                `
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
                    JOIN acc_farmer f ON h.uid_line = f.uid_line
                    LIMIT 1
                `,
                [device_id, device_id]
            );
            // console.log("✅ rows:", rows);

            if (!rows || rows.length === 0) {
                console.warn("🔍 Device not found in DB:", device_id);
                return res.status(404).json({ success: false, message: "Device not found" });
            }

            const row = Array.isArray(rows) ? rows[0] : rows;
            const { uid_line, farmer_name, name_house } = row;


            console.log("📨 Pushing to uid_line:", uid_line);
            try {
                await line.pushMessage(
                    uid_line,
                    [{
                        type: "text",
                        text: `❗ อุปกรณ์ Online\n📟 อุปกรณ์: ${device_id.trim()}\n🏠 โรงเรือน: ${name_house.trim()}\n👨‍🌾 เกษตรกร: ${farmer_name.trim()}`
                    }]
                );
                res.json({ success: true });
            } catch (err) {
                console.error("❌ pushMessage failed:", err.response?.data || err);
                res.status(500).json({ success: false, error: err.response?.data || err.message });
            }
        } catch (err) {
            console.error("LINE Notify error:", err);
            res.status(500).json({ success: false, error: err });
        }
    });
}