'use strict';

require('dotenv').config();
const Pool = require("./connectPool")

module.exports = function apiWeatherStation(app, pool = new Pool()) {
    app.get('/api/sensor/weather-station/:station_signature', async (req, res) => {
        const { params : { station_signature } , query : { r : role , st , et } } = req
        
        switch(role) {
            case "doctor" :
                const username = req.session.user_doctor;
                const password = req.session.pass_doctor;
            
                if (username === '' || password === '') {
                    return res.status(403).send({
                        errors : "authorize error"
                    })
                }
                break;
            case "farmer" :
                const uid = req.session.uidFarmer
                if (!uid) {
                    return res.status(403).send({
                        errors : "authorize error"
                    });
                }
                break;
            default :
                return res.status(403).send({
                    errors : "authorize error"
                });
        }
    
        try {
            const data = await pool.executeQuery(
                `
                    SELECT ws.id , timestamp , temperature , humidity ,light , rainfall , pressure
                    FROM weather_station ws
                    LEFT JOIN sensor_weather_station sws ON sws.device_id = ws.device_id
                    WHERE sws.station_signature = ? AND ws.timestamp BETWEEN ? AND ?
                    ORDER BY ws.timestamp DESC
                `, [ station_signature , new Date(Number(st)) , new Date(Number(et)) ]
            );
            return res.status(200).send({
                details : data
            }); // ส่งข้อมูลพร้อม status code 200
        } catch (err) {
            return res.status(500).send({
                "errors" : "external"
            })
        }
    })

    app.post("/api/sensor/weather-station", async (req, res) => {

        const { device_id, timestamp, temperature, humidity, light, rainfall , pressure } = req.body

        try {
            await pool.executeQuery(
                `
                    INSERT INTO weather_station
                        (device_id, timestamp, temperature, humidity, light, rainfall , pressure) 
                    VALUES
                        (?, ?, ?, ?, ?, ? , ?)
                `,
                [
                    device_id,
                    timestamp,
                    temperature,
                    humidity,
                    light,
                    rainfall,
                    pressure
                ]
            )

            return res.status(200).send("success");
        } catch(err) {
            console.error("DB Error:", err);
            return res.status(500).send("Failed to insert sensor data");
        }
    })
}
