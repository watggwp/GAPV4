'use strict';

require('dotenv').config();
const Pool = require("./connectPool")

module.exports = function apiPump(app, pool = new Pool()) {
    app.post("/api/sensor/weather-greenhouse", async (req, res) => {
        // แสดงข้อมูลที่ TTN ส่งมาใน console
        console.log("📥 Received TTN data:", req.body);
        try {
            const {
                end_device_ids : {
                    device_id
                },
                uplink_message : {
                    decoded_payload : {
                        humidity_air,
                        humidity_soil,
                        light,
                        temperature_air,
                        temperature_soil
                    }
                },
                received_at : timestamp
            } = req.body

            try {
                await pool.executeQuery(
                    `
                        INSERT INTO weather_greenhouse
                            (device_id, timestamp, air_temperature, air_humidity, light, soil_temperature, soil_humidity)
                        VALUES
                            (?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        device_id,
                        timestamp,
                        temperature_air,
                        humidity_air,
                        light,
                        temperature_soil,
                        humidity_soil
                    ]
                )
    
                console.log("✅ Inserted to DB:", result.insertId);
                return res.status(200).send("success");
            } catch(err) {
                console.error("❌ DB Error:", err);
                return res.status(500).send("Failed to insert sensor data");
            }
            
        } catch(err) {
            console.error("❌ Error parsing TTN data:", err);
            return res.status(400).send("Invalid data format");
        }
    })
}
