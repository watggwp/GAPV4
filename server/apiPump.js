'use strict';

require('dotenv').config();
const axios = require("axios");
const base64 = require('base-64');
const cron = require('node-cron');

const Pool = require("./connectPool");
const AuthorizeUser = require('./core/authorize');

// const TTN_API_KEY = process.env.TTN_API_KEY;
// const APP_ID = process.env.TTN_APP_ID;
// const TTN_ENDPOINT = process.env.TTN_ENDPOINT;

let scheduleCache = [];

module.exports = function apiPump(app, pool = new Pool()) {

    async function updateScheduleCache() {
        try {
            const schedules = await pool.executeQuery(`SELECT device_id, start_time, duration, account_type, account_id FROM pump_schedule`)
            scheduleCache = schedules;
            console.log(`[scheduleCache] updated (${schedules.length} records)`);
        } catch (err) {
            console.error("[scheduleCache] failed to update:", err);
        }
    }

    cron.schedule('*/10 * * * *', updateScheduleCache);
    updateScheduleCache();

    app.get('/api/pump/:greenhouse_id', async (req, res) => {
        const { params: { greenhouse_id }, query: { r: role } } = req

        switch (role) {
            case "doctor":
                const username = req.session.user_doctor;
                const password = req.session.pass_doctor;
                const adminUser = req.session.user_username;
                const adminPass = req.session.user_password;

                if ((username === '' || password === '' || !username || !password) && (!adminUser || !adminPass)) {
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
            const devices = await pool.executeQuery(`
                SELECT spg.id, spg.device_id, spg.status
                FROM sensor_pump_greenhouse spg
                ${greenhouse_id !== undefined ? "WHERE spg.greenhouse_id = ?" : ""
                }
                ORDER BY create_timestamp DESC
            ` , greenhouse_id ? [greenhouse_id] : undefined);

            res.json({
                devices: devices
            })
        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'DB error'
            });
        }
    })

    app.put("/api/pump/:greenhouse_id", async (req, res) => {
        const { body: { device_id }, params: { greenhouse_id }, query: { r: role } } = req

        switch (role) {
            case "doctor":
                const username = req.session.user_doctor;
                const password = req.session.pass_doctor;
                const adminUser = req.session.user_username;
                const adminPass = req.session.user_password;

                if ((username === '' || password === '' || !username || !password) && (!adminUser || !adminPass)) {
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

        if (!device_id || !greenhouse_id) {
            return res.status(400).json({
                message: 'กรุณาระบุ device_id และ greenhouse_id'
            })
        }

        try {
            const devicesExists = await pool.executeQuery(
                `SELECT status FROM sensor_pump_greenhouse WHERE device_id = ? LIMIT 1`,
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
                UPDATE sensor_pump_greenhouse 
                SET status = 'on' , greenhouse_id = ?
                WHERE device_id = ?
            `, [greenhouse_id, device_id])

            if (affectedRows) return res.json({ message: 'ลงทะเบียนอุปกรณ์สำเร็จ' });
            else return res.status(409).json({ message: 'ลงทะเบียนอุปกรณ์ไม่สำเร็จ' });
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                message: 'ระบบมีปัญหา'
            })
        }
    })

    app.put("/api/pump", async (req, res) => {
        const { query: { r: role }, body: { id, type } } = req;

        switch (role) {
            case "doctor":
                const username = req.session.user_doctor;
                const password = req.session.pass_doctor;
                const adminUser = req.session.user_username;
                const adminPass = req.session.user_password;

                if ((username === '' || password === '' || !username || !password) && (!adminUser || !adminPass)) {
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
                        UPDATE sensor_pump_greenhouse 
                        SET status = 'not register', greenhouse_id = NULL 
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

    app.post("/api/pump/:device_id/control", async (req, res) => {
        const { params: { device_id }, body: { action }, query: { r: roleUser } } = req
        const { user_doctor, pass_doctor, role_doctor, uidFarmer: uid_line, user_username, user_password } = req.session

        const Authen = new AuthorizeUser(pool)
        const { profile: { id } = {}, result: AuthenResult, reason, accountType } = await Authen.deviceSystem(
            {
                uid_line,
                username: user_doctor,
                password: pass_doctor,
                adminUsername: user_username,
                adminPassword: user_password
            },
            roleUser,
            "pump",
            device_id
        )

        if (!AuthenResult) {
            return res.status(403).send({
                result: "authen invalid"
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
                ` SELECT id, action, source, timestamp FROM pump_log WHERE device_id = ? AND source = ?`,
                [device_id, "manual"]
            )
            return res.status(400).json({
                status: "failed",
                logs: logs
            });
        }

        const insertLog = await pool.executeQuery(
            `INSERT INTO pump_log (device_id, action, source , account_type , account_id) VALUES (?, ?, ? , ? , ?)`,
            [device_id, action, "manual", accountType, id]
        );

        const { insertId } = insertLog

        const lastLogs = await pool.executeQuery(
            `SELECT id, action, source, timestamp FROM pump_log WHERE id = ?`,
            [insertId]
        )

        res.json({
            status: "pump_control_logged",
            data: lastLogs
        });
    });


    app.post("/api/pump/:device_id/schedule", async (req, res) => {
        const { device_id } = req.params
        const { start_time, duration, source = "auto" } = req.body;

        const { r: roleUser } = req.query
        const { user_doctor, pass_doctor, role_doctor, uidFarmer: uid_line, user_username, user_password } = req.session

        const Authen = new AuthorizeUser(pool)
        const { profile: { id } = {}, result: AuthenResult, reason, accountType } = await Authen.deviceSystem(
            {
                uid_line,
                username: user_doctor,
                password: pass_doctor,
                adminUsername: user_username,
                adminPassword: user_password
            },
            roleUser,
            "pump",
            device_id
        )

        if (!AuthenResult) {
            return res.status(403).send({
                result: "authen invalid"
            })
        }

        // Validate input
        if (!device_id || !start_time || duration == null) {
            return res.status(400).json({ error: "Missing required fields (device_id, start_time, duration)" });
        }

        // อุปกรณ์รับระยะเวลาเป็น 1 byte (หน่วยนาที) จึงรับได้ 1-255 นาทีเท่านั้น
        const durationMinutes = Number(duration)
        if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > MAX_DURATION_MINUTES) {
            return res.status(400).json({ error: `duration must be a whole number of minutes between 1 and ${MAX_DURATION_MINUTES}` });
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
                `SELECT id FROM pump_schedule WHERE device_id = ? AND start_time = ?`,
                [device_id, newStartTime]
            );
            if (existing.length > 0) {
                return res.status(409).json({ error: "Schedule already exists for this device and time." });
            }
            const insertSchedule = await pool.executeQuery(
                `INSERT INTO pump_schedule (device_id, start_time, duration , account_type , account_id) VALUES (?, ?, ? , ? , ?)`,
                [device_id, newStartTime, durationMinutes, accountType, id]
            );
            await updateScheduleCache();

            const { insertId } = insertSchedule

            const lastSchedules = await pool.executeQuery(
                `SELECT id, start_time, duration, created_at FROM pump_schedule WHERE id = ?`,
                [insertId]
            )

            res.json({
                status: "schedule_added",
                data: lastSchedules
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "insert schedule failed" });
        }
    });


    app.get("/api/pump/:device_id/schedule", async (req, res) => {
        const { device_id } = req.params;

        const { r: roleUser } = req.query
        const { user_doctor, pass_doctor, role_doctor, uidFarmer: uid_line, user_username, user_password } = req.session

        const Authen = new AuthorizeUser(pool)
        const { result: AuthenResult, reason } = await Authen.deviceSystem(
            {
                uid_line,
                username: user_doctor,
                password: pass_doctor,
                adminUsername: user_username,
                adminPassword: user_password
            },
            roleUser,
            "pump",
            device_id
        )

        if (!AuthenResult) {
            return res.status(403).send({
                result: "authen invalid"
            })
        }

        try {
            const schedules = await pool.executeQuery(
                `SELECT id, start_time, duration, created_at FROM pump_schedule WHERE device_id = ? ORDER BY start_time`,
                [device_id]
            );
            res.json({
                schedules: schedules
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "failed to fetch schedule" });
        }
    });

    app.get('/api/pump/:device_id/log', async (req, res) => {
        const { device_id } = req.params;

        const { r: roleUser } = req.query
        const { user_doctor, pass_doctor, role_doctor, uidFarmer: uid_line, user_username, user_password } = req.session

        const Authen = new AuthorizeUser(pool)
        const { result: AuthenResult, reason } = await Authen.deviceSystem(
            {
                uid_line,
                username: user_doctor,
                password: pass_doctor,
                adminUsername: user_username,
                adminPassword: user_password
            },
            roleUser,
            "pump",
            device_id
        )

        if (!AuthenResult) {
            return res.status(403).send({
                result: "authen invalid"
            })
        }

        try {
            let sql = `SELECT id, action, source, timestamp FROM pump_log`;
            let params = [];

            if (device_id) {
                sql += ` WHERE device_id = ? ORDER BY timestamp DESC`;
                params.push(device_id);
            } else {
                sql += ` ORDER BY timestamp DESC`;
            }

            const logs = await pool.executeQuery(sql, params);
            res.json({
                logs: logs
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'DB error' });
        }
    });

    app.delete("/api/pump/:device_id/schedule/:id", async (req, res) => {
        const { device_id, id } = req.params;

        const { r: roleUser } = req.query
        const { user_doctor, pass_doctor, role_doctor, uidFarmer: uid_line, user_username, user_password } = req.session

        const Authen = new AuthorizeUser(pool)
        const { result: AuthenResult, reason } = await Authen.deviceSystem(
            {
                uid_line,
                username: user_doctor,
                password: pass_doctor,
                adminUsername: user_username,
                adminPassword: user_password
            },
            roleUser,
            "pump",
            device_id
        )

        if (!AuthenResult) {
            return res.status(403).send({
                result: "authen invalid"
            })
        }

        try {
            // ลบได้เฉพาะตารางเวลาของอุปกรณ์ที่ผ่านการตรวจสิทธิ์ข้างบน
            const result = await pool.executeQuery(`DELETE FROM pump_schedule WHERE id = ? AND device_id = ?`, [id, device_id]);
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
            const { device_id, duration, account_type, account_id } = row;
            const mode = 0x02;

            try {
                console.log(`Trigger schedule → ${device_id} (${duration} min)`);

                const result = await sendDownlink(device_id, mode, duration);

                if (!result.success) {
                    console.warn(`[SCHEDULE ERROR] Device: ${device_id} →`, result.message);
                    continue; // skip logging if failed
                }

                await pool.executeQuery(
                    `INSERT INTO pump_log (device_id, action, source , account_type , account_id) VALUES (? , ? , ? , ? , ?)`,
                    [device_id, "on", "auto", account_type, account_id]
                );
            } catch (err) {
                console.error(`[SCHEDULE ERROR] Device: ${device_id} →`, err.message);
            }
        }

        if (dueSchedules.length > 0) {
            await updateScheduleCache();
        }
    });
}

// ระยะเวลาสูงสุดที่ส่งให้อุปกรณ์ได้ (payload 1 byte หน่วยนาที)
const MAX_DURATION_MINUTES = 255;

async function sendDownlink(device_id, mode, duration = 0) {
    const group1 = new Set(["mae-tho-pump", "kae-noi-pump", "nong-khiew-pump"]);
    let endpoint, appId, apiKey;
    if (group1.has(device_id)) {
        endpoint = process.env.TTN_ENDPOINT;  // แทน TTN_ENDPOINT เดิม
        appId = process.env.TTN_APP_ID;    // แทน APP_ID เดิม
        apiKey = process.env.TTN_API_KEY;   // แทน TTN_API_KEY เดิม
    } else if (device_id === "rmutt-pump-gap") {
        endpoint = process.env.TTN2_ENDPOINT;
        appId = process.env.TTN2_APP_ID;
        apiKey = process.env.TTN2_API_KEY;
    }

    if (!endpoint || !appId || !apiKey) {
        return {
            success: false,
            status_code: 500,
            message: `Missing TTN credentials for device ${device_id}`
        };
    }

    const url = `${endpoint}/api/v3/as/applications/${appId}/devices/${device_id}/down/replace`;
    let payload = [mode];
    if (mode === 0x02) {
        const minutes = Number(duration);
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_DURATION_MINUTES) {
            return {
                success: false,
                status_code: 400,
                message: `Invalid duration ${duration} (must be 1-${MAX_DURATION_MINUTES} minutes)`
            };
        }
        payload.push(minutes);
    }

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
                Authorization: `Bearer ${apiKey}`,
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