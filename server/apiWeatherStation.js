'use strict';

require('dotenv').config();
const Pool = require("./connectPool")

module.exports = function apiWeatherStation(app, pool = new Pool()) {

    app.get('/api/sensor/weather-station/:station_signature/list', async (req, res) => {
        const { params: { station_signature }, query: { r: role } } = req

        switch (role) {
            case "doctor":
                const username = req.session.user_doctor;
                const password = req.session.pass_doctor;

                if (username === '' || password === '') {
                    return res.status(403).send({
                        errors: "authorize error"
                    })
                }
                break;
            case "farmer":
                const uid = req.session.uidFarmer
                if (!uid) {
                    return res.status(403).send({
                        errors: "authorize error"
                    });
                }
                break;
            default:
                return res.status(403).send({
                    errors: "authorize error"
                });
        }

        try {
            const data = await pool.executeQuery(
                `
                    SELECT id , device_id , status , create_timestamp
                    FROM sensor_weather_station
                    WHERE station_signature = ? AND NOT status = 'not register'
                    ORDER BY create_timestamp DESC
                `, [station_signature]
            );
            return res.status(200).send({
                devices: data
            }); // ส่งข้อมูลพร้อม status code 200
        } catch (err) {
            return res.status(500).send({
                "errors": "external"
            })
        }
    })

    app.get('/api/sensor/weather-station/:station_signature', async (req, res) => {
        const { params: { station_signature }, query: { r: role, st, et } } = req

        switch (role) {
            case "doctor":
                const username = req.session.user_doctor;
                const password = req.session.pass_doctor;

                if (username === '' || password === '') {
                    return res.status(403).send({
                        errors: "authorize error"
                    })
                }
                break;
            case "farmer":
                const uid = req.session.uidFarmer
                if (!uid) {
                    return res.status(403).send({
                        errors: "authorize error"
                    });
                }
                break;
            default:
                return res.status(403).send({
                    errors: "authorize error"
                });
        }

        try {
            const betweenReal = (7 * 60 * 60 * 1000)
            const data = await pool.executeQuery(
                `
                    SELECT ws.id , CONCAT(
                        DATE_FORMAT(timestamp, '%Y-%m-%dT%H:%i:%s') 
                        , ".000Z"
                    ) as timestamp , 
                        temperature , humidity ,light , rainfall , pressure, batt
                    FROM weather_station ws
                    LEFT JOIN sensor_weather_station sws ON sws.device_id = ws.device_id
                    WHERE sws.station_signature = ? AND ws.timestamp BETWEEN ? AND ?
                    ORDER BY ws.timestamp DESC
                `, [station_signature, new Date(Number(st) - betweenReal), new Date(Number(et) - betweenReal)]
            );

            return res.status(200).send({
                details: data
            }); // ส่งข้อมูลพร้อม status code 200
        } catch (err) {
            return res.status(500).send({
                "errors": "external"
            })
        }
    })

    app.put("/api/sensor/weather-station/:station_signature", async (req, res) => {
        const { body: { device_id }, params: { station_signature }, query: { r: role } } = req

        switch (role) {
            case "doctor":
                const username = req.session.user_doctor;
                const password = req.session.pass_doctor;

                if (username === '' || password === '') {
                    return res.status(403).send({
                        errors: "authorize error"
                    })
                }
                break;
            case "farmer":
                const uid = req.session.uidFarmer
                if (!uid) {
                    return res.status(403).send({
                        errors: "authorize error"
                    });
                }
                break;
            default:
                return res.status(403).send({
                    errors: "authorize error"
                });
        }

        if (!device_id || !station_signature) {
            return res.status(400).json({
                message: 'กรุณาระบุ device_id และ station_signature'
            })
        }

        try {
            const devicesExists = await pool.executeQuery(
                `SELECT * FROM sensor_weather_station WHERE device_id = ? LIMIT 1`,
                [device_id]
            )

            if (devicesExists.length === 0) return res.status(404).json({
                message: 'ไม่พบอุปกรณ์นี้ในระบบ'
            })

            const device = devicesExists[0];

            if (device.status !== 'not register') return res.status(409).json({
                message: 'อุปกรณ์นี้อยู่ในสถานะ เปิดใช้งาน\nไม่สามารถลงทะเบียนใหม่ได้'
            });

            const { affectedRows } = await pool.executeQuery(`
                UPDATE sensor_weather_station 
                SET status = 'on' , station_signature = ?
                WHERE device_id = ?
            `, [station_signature, device_id])

            if (affectedRows) return res.json({ message: 'ลงทะเบียนอุปกรณ์สำเร็จ' });
            else return res.status(409).json({ message: 'ลงทะเบียนอุปกรณ์ไม่สำเร็จ' });
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                message: 'ระบบมีปัญหา'
            })
        }
    })

    app.put("/api/sensor/weather-station", async (req, res) => {
        const { query: { r: role }, body: { id, type } } = req;

        switch (role) {
            case "doctor":
                const username = req.session.user_doctor;
                const password = req.session.pass_doctor;

                if (username === '' || password === '') {
                    return res.status(403).send({
                        errors: "authorize error"
                    })
                }
                break;
            case "farmer":
                const uid = req.session.uidFarmer
                if (!uid) {
                    return res.status(403).send({
                        errors: "authorize error"
                    });
                }
                break;
            default:
                return res.status(403).send({
                    errors: "authorize error"
                });
        }

        try {
            let sqlQuery = ""
            let params = []
            switch (type) {
                case "unregister":
                    sqlQuery = `
                        UPDATE sensor_weather_station 
                        SET status = 'not register', station_signature = NULL 
                        WHERE id = ?
                    `
                    params = [id]
                    break;
            }

            const result = await pool.executeQuery(sqlQuery, params)

            if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบอุปกรณ์ที่ต้องการอัปเดต' });

            res.json({ message: 'แก้ไขข้อมูลเรียบร้อยแล้ว' });
        } catch (err) {
            console.log(err)
            return res.status(500).json({ error: err.message });
        }
    })

    // insert sensor
    app.post("/api/sensor/weather-station", async (req, res) => {

        const { device_id, timestamp, temperature, humidity, light, rainfall, pressure, batt } = req.body

        try {
            await pool.executeQuery(
                `
                    INSERT INTO weather_station
                        (device_id, timestamp, temperature, humidity, light, rainfall , pressure, batt) 
                    VALUES
                        (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    device_id,
                    timestamp,
                    temperature,
                    humidity,
                    light,
                    rainfall,
                    pressure,
                    batt
                ]
            )

            return res.status(200).send("success");
        } catch (err) {
            console.error(`DB Error: ${new Date()}`, err);
            return res.status(500).send("Failed to insert sensor data");
        }
    })
}