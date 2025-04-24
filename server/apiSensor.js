'use strict';

require('dotenv').config();
const Pool = require("./connectPool")

module.exports = function apiSensor(app, pool = new Pool()) {
	app.get('/api/sensor/weather-greenhouse/:greenhouse_id', async (req, res) => {
		const { greenhouse_id } = req.params
		const role = req.query.r
		
        switch(role) {
			case "doctor" :
				const username = req.session.user_doctor;
				const password = req.session.pass_doctor;
			
				if (username === '' || password === '' || !apifunc.authCsurf("doctor", req, res)) {
					res.status(403).send({
						errors : "authorize error"
					})
				}
				break;
			case "farmer" :
				const uid = req.session.uidFarmer
				if (!uid) {
					res.status(403).send({
						errors : "authorize error"
					});
				}
				break;
			default :
				res.status(403).send({
					errors : "authorize error"
				});
		}
    
		try {
			const data = await pool.executeQuery(
				`
					SELECT * 
					FROM sensor_weather_greenhouse 
					WHERE greenhouse_id = ?
					ORDER BY create_timestamp DESC
				`, [ greenhouse_id ]
			);
			res.status(200).send(data); // ส่งข้อมูลพร้อม status code 200
		} catch (err) {
			console.error('Query Error:', err);
			res.status(500).send({
				"errors" : "external"
			})
		}
    })

	app.get('/api/sensor/weather-greenhouse/:greenhouse_id/:device_id', async (req, res) => {

		const { greenhouse_id } = req.params
		const role = req.query.r

        switch(role) {
			case "doctor" :
				const username = req.session.user_doctor;
				const password = req.session.pass_doctor;
			
				if (username === '' || password === '' || !apifunc.authCsurf("doctor", req, res)) {
					res.status(403).send({
						errors : "authorize error"
					})
				}
			case "farmer" :
				const uid = req.session.uidFarmer
				if (!uid) {
					res.status(403).send({
						errors : "authorize error"
					});
				}
		}
    
		try {
			const data = await pool.executeQuery(
				`
					SELECT * FROM weather-greenhouse ORDER BY time DESC
				`, []
			);
			res.status(200).send(data); // ส่งข้อมูลพร้อม status code 200
		} catch (err) {
			console.error('Query Error:', err);
			res.status(500).send({
				"errors" : "external"
			})
		}
    })

	app.post("/api/sensor/weather-station", async (req, res) => {

		const { device_id, timestamp, temperature, humidity, light, rainfall } = req.body

		try {
			await pool.executeQuery(
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
	})

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
				res.status(200).send("success");
			} catch(err) {
				console.error("❌ DB Error:", err);
				res.status(500).send("Failed to insert sensor data");
			}
			
		} catch(err) {
			console.error("❌ Error parsing TTN data:", err);
			return res.status(400).send("Invalid data format");
		}
    })
}
