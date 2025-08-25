require('dotenv').config();
const Pool = require("./connectPool");

module.exports = function apiDevice(app, connectionDB = new Pool()) {
    // POST /api/add/device (เดิม)
    app.post("/api/add/device", async (req, res) => {
        const { device_id, type } = req.body;

        if (!device_id || !type) {
            return res.status(400).json({ error: "Missing device_id or type" });
        }

        const tableMap = {
            greenhouse: "sensor_weather_greenhouse",
            weather: "sensor_weather_station",
            pump: "sensor_pump_greenhouse"
        };

        const targetTable = tableMap[type];

        if (!targetTable) {
            return res.status(400).json({ error: "Invalid type: must be 'greenhouse', 'weather', or 'pump'" });
        }

        try {
            const rows = await connectionDB.executeQuery(
                `SELECT device_id FROM ${targetTable} WHERE device_id = ? LIMIT 1`,
                [device_id]
            );

            if (rows.length > 0) {
                return res.status(200).json({ message: `✅ Device already exists in ${targetTable}` });
            }

            await connectionDB.executeQuery(
                `INSERT INTO ${targetTable} (device_id, status, create_timestamp) VALUES (?, 'not register', NOW())`,
                [device_id]
            );

            res.status(201).json({ message: `✅ Device inserted into ${targetTable}` });
        } catch (err) {
            console.error("❌ Error inserting device:", err);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    // DELETE /api/delete/device
    app.delete("/api/delete/device", async (req, res) => {
        const { device_id, type } = req.body;

        if (!device_id || !type) {
            return res.status(400).json({ error: "Missing device_id or type" });
        }

        const tableMap = {
            greenhouse: "sensor_weather_greenhouse",
            weather: "sensor_weather_station",
            pump: "sensor_pump_greenhouse"
        };

        const targetTable = tableMap[type];

        if (!targetTable) {
            return res.status(400).json({ error: "Invalid type: must be 'greenhouse', 'weather', or 'pump'" });
        }

        try {
            const result = await connectionDB.executeQuery(
                `DELETE FROM ${targetTable} WHERE device_id = ?`,
                [device_id]
            );

            res.status(200).json({ message: `✅ Device removed from ${targetTable}` });
        } catch (err) {
            console.error("❌ Error deleting device:", err);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
};
