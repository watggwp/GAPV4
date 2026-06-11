'use strict';

const cron = require('node-cron');

const ConnectPool = require("../connectPool");
const RoyalGapLine = require("../configLine");

const schedulePlan = require('./corns/schedulePlan');
const checkUnrecorded = require('./corns/checkUnrecorded');

module.exports = function Schedules(connectionPool = new ConnectPool(), socket) {
    cron.schedule("*/2 * * * *", async () => {
        console.log("Start Schedules GAP")
        try {
            const schedule_plan = await schedulePlan.queryPlan(connectionPool)

            const sendTasks = schedule_plan.map(async ({ uid_line, ...schedule }) => {
                const { id: schedule_id, greenhouse_id } = schedule
                try {
                    const [messages, details_message] = schedulePlan.generateMessage(schedule)
                    await RoyalGapLine.pushMessage(uid_line, messages)
                    return { schedule_id, greenhouse_id, details_message }
                } catch (err) {
                    console.error(`Schedule plan error (schedule id: ${schedule_id}):`, err)
                    return null
                }
            })

            const sent = (await Promise.all(sendTasks)).filter(Boolean)

            if (sent.length > 0) {
                await connectionPool.executeQuery(
                    `INSERT INTO schedules_history (schedule_id, greenhouse_id, details_message) VALUES ${sent.map(() => "(?,?,?)").join(",")}`,
                    sent.flatMap(r => [r.schedule_id, r.greenhouse_id, r.details_message.join("\n")])
                )
            }
        } catch (error) {
            console.error(`Schedule plan cron error: ${error}`)
        }
    })
    //ปรับเวลาแจ้งเตือนตรงนี้
    cron.schedule("*/1 * * * *", async () => {
        console.log("Start Check Unrecorded GAP")
        try {
            const unrecorded = await checkUnrecorded.queryUnrecorded(connectionPool)
            if (!unrecorded.length) return

            await Promise.all(unrecorded.map(async (row) => {
                try {
                    // แจ้งเตือน doctor บนเว็บ
                    await connectionPool.executeQuery(
                        `INSERT INTO notify_doctor (id_table_farmer, id_read, notify, station)
                         VALUES (?, '{}', ?, ?)`,
                        [row.farmer_id, checkUnrecorded.notifyDoctorMessage(row), row.station]
                    )

                    // real-time ไปยัง doctor
                    if (socket) socket.to(`notify-${row.station}`).emit("update")


                    // mark notified — update record ที่ schedulePlan สร้างไว้ก่อน ถ้าไม่มีค่อย insert ใหม่
                    const updated = await connectionPool.executeQuery(
                        `UPDATE schedules_history SET notified_unrecorded = 1
                         WHERE schedule_id = ? AND greenhouse_id = ? AND DATE(date) = CURDATE()`,
                        [row.schedule_id, row.greenhouse_id]
                    )
                    if (updated.affectedRows === 0) {
                        await connectionPool.executeQuery(
                            `INSERT INTO schedules_history (schedule_id, greenhouse_id, details_message, notified_unrecorded)
                             VALUES (?, ?, '', 1)`,
                            [row.schedule_id, row.greenhouse_id]
                        )
                    }
                } catch (err) {
                    console.error(`Unrecorded notify error (schedule: ${row.schedule_id}, greenhouse: ${row.greenhouse_id}):`, err)
                }
            }))
        } catch (error) {
            console.error(`Check unrecorded error: ${error}`)
        }
    })
}