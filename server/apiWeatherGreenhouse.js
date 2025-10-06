'use strict';

require('dotenv').config();
const Pool = require("./connectPool")

module.exports = function apiWeatherGreenhouse(app, pool = new Pool()) {
    app.get('/api/sensor/weather-greenhouse/:greenhouse_id', async (req, res) => {
        const { params : { greenhouse_id } , query : { r : role } } = req
        
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
                    SELECT id , device_id , status , create_timestamp
                    FROM sensor_weather_greenhouse
                    WHERE greenhouse_id = ? AND NOT status = 'not register'
                    ORDER BY create_timestamp DESC
                `, [ greenhouse_id ]
            );
            return res.status(200).send({
                devices : data
            }); // ส่งข้อมูลพร้อม status code 200
        } catch (err) {
            return res.status(500).send({
                "errors" : "external"
            })
        }
    })

    app.get('/api/sensor/weather-greenhouse/:greenhouse_id/:device_id', async (req, res) => {
        const { params : { greenhouse_id , device_id } , query : { r : role , st , et } } = req
        
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
                    SELECT * , CONCAT(
                        DATE_FORMAT(timestamp, '%Y-%m-%dT%H:%i:%s') 
                        , ".000Z"
                    ) as timestamp
                    FROM weather_greenhouse wg
                    LEFT JOIN sensor_weather_greenhouse swg ON swg.device_id = wg.device_id
                    WHERE swg.greenhouse_id = ? AND swg.device_id = ? AND wg.timestamp BETWEEN ? AND ?
                    ORDER BY wg.timestamp DESC
                `, [
                    greenhouse_id , device_id , new Date(Number(st)) , new Date(Number(et))
                ]
            );
            return res.status(200).send({
                details : data
            }); // ส่งข้อมูลพร้อม status code 200
        } catch (err) {
            console.error('Query Error:', err);
            return res.status(500).send({
                "errors" : "external"
            })
        }
    })

    app.put("/api/sensor/weather-greenhouse/:greenhouse_id" , async (req , res) => {
        const { body : { device_id } , params : { greenhouse_id } , query : { r : role } } = req
        
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
        
        if (!device_id || !greenhouse_id) {
            return res.status(400).json({ 
                message: 'กรุณาระบุ device_id และ greenhouse_id' 
            })
        }
            
        try {
            const devicesExists = await pool.executeQuery(
                `SELECT * FROM sensor_weather_greenhouse WHERE device_id = ? LIMIT 1` ,
                [ device_id ]
            )

            if (devicesExists.length === 0) return res.status(404).json({ 
                message: 'ไม่พบอุปกรณ์นี้ในระบบ' 
            })

            const device = devicesExists[0];
    
            if (device.status !== 'not register') return res.status(409).json({
                message: 'อุปกรณ์นี้อยู่ในสถานะ เปิดใช้งาน\nไม่สามารถลงทะเบียนใหม่ได้'
            });
    
            const { affectedRows } = await pool.executeQuery(`
                UPDATE sensor_weather_greenhouse 
                SET status = 'on' , greenhouse_id = ?
                WHERE device_id = ?
            `, [greenhouse_id, device_id])

            if(affectedRows) return res.json({ message: 'ลงทะเบียนอุปกรณ์สำเร็จ' });
            else return res.status(409).json({ message: 'ลงทะเบียนอุปกรณ์ไม่สำเร็จ' });
        } catch(err) {
            console.log(err)
            return res.status(500).json({ 
                message: 'ระบบมีปัญหา' 
            })
        }
    })

    app.put("/api/sensor/weather-greenhouse" , async (req , res) => {
        const { query : { r : role } , body : { id , type } } = req;
        
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
            let sqlQuery = ""
            let params = []
            switch(type) {
                case "unregister" :
                    sqlQuery = `
                        UPDATE sensor_weather_greenhouse 
                        SET status = 'not register', greenhouse_id = NULL 
                        WHERE id = ?
                    `
                    params = [ id ]
                    break;
            }

            const result = await pool.executeQuery(sqlQuery , params)

            if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบอุปกรณ์ที่ต้องการอัปเดต' });
            
            res.json({ message: 'แก้ไขข้อมูลเรียบร้อยแล้ว' });
        } catch(err) {
            console.log(err)
            return res.status(500).json({ error: err.message });
        }
    })

    // insert sensor
    app.post("/api/sensor/weather-greenhouse", async (req, res) => {
        try {

            const { 
                device_id, 
                timestamp, 
                humidity,
                soil_humidity,
                light,
                temperature,
                soil_temperature,
                pressure,
                batt
            } = req.body

            try {
                await pool.executeQuery(
                    `
                        INSERT INTO weather_greenhouse
                            (device_id, timestamp, air_temperature, air_humidity, light, soil_temperature, soil_humidity , pressure , batt)
                        VALUES
                            (?, ?, ?, ?, ?, ?, ? , ? , ?)
                    `,
                    [
                        device_id,
                        timestamp,
                        temperature,
                        humidity,
                        light,
                        soil_temperature,
                        soil_humidity,
                        pressure,
                        batt
                    ]
                )
    
                return res.status(200).send("success");
            } catch(err) {
                console.error(`DB Error: ${new Date()}`, err);
                return res.status(500).send("Failed to insert sensor data");
            }
            
        } catch(err) {
            console.error(`Error parsing TTN data: ${new Date()}`, err);
            return res.status(400).send("Invalid data format");
        }
    })

    app.get("/api/sensor/weather-greenhouse/:greenhouse_id/:device_id/status", async (req, res) => {
        const { greenhouse_id, device_id } = req.params;
        const { r: role } = req.query;

        switch (role) {
            case "doctor":
                const username = req.session.user_doctor;
                const password = req.session.pass_doctor;
                if (!username || !password) return res.status(403).json({ error: "unauthorized" });
                break;
            case "farmer":
                const uid = req.session.uidFarmer;
                // if (!uid) return res.status(403).json({ error: "unauthorized" });
                break;
            default:
                return res.status(403).json({ error: "unauthorized" });
        }

        try {
            const rows = await pool.executeQuery(`
            SELECT timestamp FROM weather_greenhouse 
            WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1
        `, [device_id]);

            if (rows.length === 0) return res.json({ status: "offline" });

            const latest = new Date(rows[0].timestamp + "Z");
            const now = new Date();
            const diffMinutes = (now - latest) / 1000 / 60;

            return res.json({
                status: diffMinutes <= 10 ? "online" : "offline"
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "internal error" });
        }
    });
}