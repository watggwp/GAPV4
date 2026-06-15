'use strict';

const cron = require('node-cron');

const ConnectPool = require("../connectPool");
const RoyalGapLine = require("../configLine");
const MessageLineTemplate = require('./messageLineTemplate');

const schedulePlan = require('./corns/schedulePlan');
const checkUnrecorded = require('./corns/checkUnrecorded');

module.exports = function Schedules(connectionPool = new ConnectPool(), socket) {
    cron.schedule("*/2 * * * *", async () => {
        console.log("Start Schedules GAP")
        try {
            const schedule_plan = await schedulePlan.queryPlan(connectionPool)

            const groupedPlans = schedule_plan.reduce((acc, curr) => {
                const uid = curr.uid_line;
                if (!acc[uid]) acc[uid] = [];
                acc[uid].push(curr);
                return acc;
            }, {});

            const sent = [];

            for (const [uid_line, schedules] of Object.entries(groupedPlans)) {
                try {
                    const chunks = [];
                    for (let i = 0; i < schedules.length; i += 10) {
                        chunks.push(schedules.slice(i, i + 10));
                    }

                    for (const chunk of chunks) {
                        const bubbles = [];
                        const chunkSentInfo = [];

                        for (const schedule of chunk) {
                            const result = schedulePlan.generateMessage(schedule);
                            if (result && result.length === 2) {
                                const [bubbleMsg, details_message] = result;
                                bubbles.push(bubbleMsg);
                                chunkSentInfo.push({ 
                                    schedule_id: schedule.id, 
                                    greenhouse_id: schedule.greenhouse_id, 
                                    details_message 
                                });
                            }
                        }

                        if (bubbles.length > 0) {
                            const carouselMsg = MessageLineTemplate.carouselTemplateUrl("แจ้งเตือนกิจกรรมการปลูก (GAP)", bubbles);
                            await RoyalGapLine.pushMessage(uid_line, carouselMsg);
                            sent.push(...chunkSentInfo);
                        }
                    }
                } catch (err) {
                    console.error(`Schedule plan carousel error for uid: ${uid_line}:`, err);
                }
            }

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
                        const detailsMessage = checkUnrecorded.notifyDoctorMessage(row);
                        await connectionPool.executeQuery(
                            `INSERT INTO schedules_history (schedule_id, greenhouse_id, details_message, notified_unrecorded)
                             VALUES (?, ?, ?, 1)`,
                            [row.schedule_id, row.greenhouse_id, detailsMessage]
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