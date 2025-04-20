'use strict';

require('dotenv').config();
const Pool = require("./connectPool")

module.exports = function apiSensor(app, connectionDB = new Pool()) {
	app.post("/api/sensor/weather-station", async (req, res) => {

		const { device_id, timestamp, temperature, humidity, light, rainfall } = req.body

		try {
			await connectionDB.executeQuery(
				`
					INSERT INTO weather_station
						(device_id, timestamp, temperature, humidity, light, rainfall) 
					VALUES
						(?, ?, ?, ?, ?, ?)
				`,
				[
					device_id,
					timestamp,
					temperature,
					humidity,
					light,
					rainfall
				]
			)

			res.status(200).send("success");
		} catch(err) {
			console.error("DB Error:", err);
			res.status(500).send("Failed to insert sensor data");
		}
	});

	app.post("/api/sensor/weather-greenhouse", async (req, res) => {
        // แสดงข้อมูลที่ TTN ส่งมาใน console
        console.log("📥 Received TTN data:", req.body);
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
			await connectionDB.executeQuery(
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
			res.status(200).send("success");
		} catch(err) {
			console.error("❌ DB Error:", err);
			res.status(500).send("Failed to insert sensor data");
		}
    });
}
