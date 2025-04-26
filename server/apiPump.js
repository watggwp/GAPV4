'use strict';

require('dotenv').config();
const axios = require("axios");
const base64 = require('base-64');
const cron = require('node-cron');

const Pool = require("./connectPool");
const AuthorizeUser = require('./core/authorize');

const TTN_API_KEY = process.env.TTN_API_KEY;
const APP_ID = process.env.TTN_APP_ID;
const TTN_ENDPOINT = process.env.TTN_ENDPOINT;

let scheduleCache = [];

module.exports = function apiPump(app, pool = new Pool()) {

    async function updateScheduleCache() {
        try {
            const schedules = await pool.executeQuery(`SELECT * FROM pump_schedule`)
            scheduleCache = schedules;
            console.log(`[scheduleCache] updated (${schedules.length} records)`);
        } catch (err) {
            console.error("[scheduleCache] failed to update:", err);
        }
    }

    cron.schedule('*/10 * * * *', updateScheduleCache);
    updateScheduleCache();

    app.get('/api/pump', async (req, res) => {
        const { greenhouse_id } = req.query

        try {
            const devices = await pool.executeQuery(`
                SELECT *
                FROM sensor_pump_greenhouse spg
                ${
                    greenhouse_id !== undefined ? "WHERE spg.greenhouse_id = ?" : ""
                }
                ORDER BY create_timestamp DESC
            ` , greenhouse_id ? [ greenhouse_id ] : undefined );

            res.json({
                devices : devices
            })
        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'DB error' 
            });
        }
    })

    app.post("/api/pump/:device_id/control", async (req, res) => {
        const { device_id } = req.params
        const { action } = req.body;
        
        const { r : roleUser } = req.query
        const { user_doctor , pass_doctor , role_doctor , uidFarmer : uid_line } = req.session

        const Authen = new AuthorizeUser(pool) 
        const { result : AuthenResult , reason } = await Authen.deviceSystem(
            {
                uid_line,
                username : user_doctor,
                password : pass_doctor
            },
            roleUser,
            "pump",
            device_id
        )

        if(!AuthenResult) {
            return res.status(403).send({
                result : "authen invalid"
            })
        }

        if (!["on", "off"].includes(action)) {
            return res.status(400).json({ error: "Invalid action: must be 'on' or 'off'" });
        }
        const mode = action === "on" ? 0x01 :
                     action === "off" ? 0x03 : null;
    
        if (mode === null) {
            return res.status(400).json({ error: "Invalid action" });
        }
    
        const downlink = await sendDownlink(device_id, mode);
    
        if (!downlink.success) {
            console.warn(`[TTN ERROR] Device: ${device_id} →`, downlink.message);
            const logs = await pool.executeQuery(
                ` SELECT * FROM pump_log WHERE device_id = ? AND source = ?`,
                [ device_id , "manual" ]
            )
            return res.status(400).json({
                status: "failed",
                logs : logs
            });
        }
    
        const insertLog = await pool.executeQuery(
            `INSERT INTO pump_log (device_id, action, source) VALUES (?, ?, ?)`,
            [device_id, action, "manual"]
        );

        const { insertId } = insertLog

        const lastLogs = await pool.executeQuery(
            `SELECT * FROM pump_log WHERE id = ?` , 
            [ insertId ]
        )
    
        res.json({ 
            status: "pump_control_logged",
            data : lastLogs
        });
    });
    

    app.post("/api/pump/:device_id/schedule", async (req, res) => {
        const { device_id } = req.params
        const { start_time, duration, source = "auto" } = req.body;

        const { r : roleUser } = req.query
        const { user_doctor , pass_doctor , role_doctor , uidFarmer : uid_line } = req.session

        const Authen = new AuthorizeUser(pool) 
        const { result : AuthenResult , reason } = await Authen.deviceSystem(
            {
                uid_line,
                username : user_doctor,
                password : pass_doctor
            },
            roleUser,
            "pump",
            device_id
        )

        if(!AuthenResult) {
            return res.status(403).send({
                result : "authen invalid"
            })
        }
    
        // Validate input
        if (!device_id || !start_time || duration == null) {
            return res.status(400).json({ error: "Missing required fields (device_id, start_time, duration)" });
        }
    
        // not allow manual commands in schedule
        if (source === "manual") {
            return res.status(400).json({ error: "Manual commands are not allowed in schedule" });
        }
    
        // Validate device_id ผ่าน TTN
        const downlink = await sendDownlink(device_id, 0x00, 0);
        if (!downlink.success) {
            return res.status(400).json({
                status: "failed",
                reason: "Device not found or invalid",
                detail: downlink.detail
            });
        }
    
        try {
            const newStartTime = new Date(start_time).toLocaleTimeString("th-TH")
            const existing = await pool.executeQuery(
                `SELECT * FROM pump_schedule WHERE device_id = ? AND start_time = ?`,
                [device_id, newStartTime]
            );
                if (existing.length > 0) {
                return res.status(409).json({ error: "Schedule already exists for this device and time." });
            }
            const insertSchedule = await pool.executeQuery(
                `INSERT INTO pump_schedule (device_id, start_time, duration) VALUES (?, ?, ?)`,
                [device_id, newStartTime, duration]
            );
            await updateScheduleCache();

            const { insertId } = insertSchedule

            const lastSchedules = await pool.executeQuery(
                `SELECT * FROM pump_schedule WHERE id = ?`,
                [insertId]
            )

            res.json({ 
                status: "schedule_added",
                data : lastSchedules
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "insert schedule failed" });
        }
    });
    

    app.get("/api/pump/:device_id/schedule", async (req, res) => {
        const { device_id } = req.params;

        const { r : roleUser } = req.query
        const { user_doctor , pass_doctor , role_doctor , uidFarmer : uid_line } = req.session

        const Authen = new AuthorizeUser(pool) 
        const { result : AuthenResult , reason } = await Authen.deviceSystem(
            {
                uid_line,
                username : user_doctor,
                password : pass_doctor
            },
            roleUser,
            "pump",
            device_id
        )

        if(!AuthenResult) {
            return res.status(403).send({
                result : "authen invalid"
            })
        }

        try {
            const schedules = await pool.executeQuery(
                `SELECT * FROM pump_schedule WHERE device_id = ? ORDER BY start_time`,
                [device_id]
            );
            res.json({
                schedules : schedules
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "failed to fetch schedule" });
        }
    });

    app.get('/api/pump/:device_id/log', async (req, res) => {
        const { device_id } = req.params;

        const { r : roleUser } = req.query
        const { user_doctor , pass_doctor , role_doctor , uidFarmer : uid_line } = req.session

        const Authen = new AuthorizeUser(pool) 
        const { result : AuthenResult , reason } = await Authen.deviceSystem(
            {
                uid_line,
                username : user_doctor,
                password : pass_doctor
            },
            roleUser,
            "pump",
            device_id
        )

        if(!AuthenResult) {
            return res.status(403).send({
                result : "authen invalid"
            })
        }

        try {
            let sql = `SELECT * FROM pump_log`;
            let params = [];

            if (device_id) {
                sql += ` WHERE device_id = ? ORDER BY timestamp DESC`;
                params.push(device_id);
            } else {
                sql += ` ORDER BY timestamp DESC`;
            }

            const logs = await pool.executeQuery(sql, params);
            res.json({
                logs : logs
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'DB error' });
        }
    });

    app.delete("/api/pump/:device_id/schedule/:id", async (req, res) => {
        const { device_id , id } = req.params;

        const { r : roleUser } = req.query
        const { user_doctor , pass_doctor , role_doctor , uidFarmer : uid_line } = req.session

        const Authen = new AuthorizeUser(pool) 
        const { result : AuthenResult , reason } = await Authen.deviceSystem(
            {
                uid_line,
                username : user_doctor,
                password : pass_doctor
            },
            roleUser,
            "pump",
            device_id
        )

        if(!AuthenResult) {
            return res.status(403).send({
                result : "authen invalid"
            })
        }

        try {
            const result = await pool.executeQuery(`DELETE FROM pump_schedule WHERE id = ?`, [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Schedule not found" });
            }
            await updateScheduleCache();
            res.json({ status: "schedule_deleted" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "failed to delete schedule" });
        }
    });

    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);

        const dueSchedules = scheduleCache.filter(row => 
            row.start_time.slice(0, 5) === currentTime
        );

        for (const row of dueSchedules) {
            const { device_id, duration } = row;
            const mode = 0x02;

            console.log(`Trigger schedule → ${device_id} (${duration} min)`);

            const result = await sendDownlink(device_id, mode, duration);

            if (!result.success) {
                console.warn(`[SCHEDULE ERROR] Device: ${device_id} →`, result.message);
                continue; // skip logging if failed
            }

            await pool.executeQuery(
                `INSERT INTO pump_log (device_id, action, source) VALUES (?, ?, ?)`,
                [device_id, "on", "auto"]
            );
        }

        if (dueSchedules.length > 0) {
            await updateScheduleCache();
        }
    });
}

async function sendDownlink(device_id, mode, duration = 0) {
    const url = `${TTN_ENDPOINT}/api/v3/as/applications/${APP_ID}/devices/${device_id}/down/replace`;

    let payload = [mode];
    if (mode === 0x02) payload.push(duration);

    const frm_payload = base64.encode(String.fromCharCode(...payload));

    const body = {
        downlinks: [
            {
                f_port: 1,
                frm_payload,
                priority: "NORMAL",
                confirmed: true
            }
        ]
    };

    try {
        const res = await axios.post(url, body, {
            headers: {
                Authorization: `Bearer ${TTN_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        return {
            success: true,
            status_code: res.status,
            response: res.data,
            payload_hex: Buffer.from(payload).toString('hex'),
            payload_base64: frm_payload
        };
    } catch (error) {
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.message;

        return {
            success: false,
            status_code: statusCode,
            message,
            detail: error.response?.data,
        };
    }
}