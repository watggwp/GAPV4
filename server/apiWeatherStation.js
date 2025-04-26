'use strict';

require('dotenv').config();
const Pool = require("./connectPool")

module.exports = function apiWeatherStation(app, pool = new Pool()) {
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

            return res.status(200).send("success");
        } catch(err) {
            console.error("DB Error:", err);
            return res.status(500).send("Failed to insert sensor data");
        }
    })
}
