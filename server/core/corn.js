'use strict';

const cron = require('node-cron');

const ConnectPool = require("../connectPool");
const RoyalGapLine = require("../configLine");

const schedulePlan = require('./corns/schedulePlan');
const checkUnrecorded = require('./corns/checkUnrecorded');

module.exports = function Schedules(connectionPool = new ConnectPool(), socket) {
    cron.schedule("0 0 5 * * *", async (now) => {
        console.log("Start Schedules GAP")
        const schedule_plan = await schedulePlan.queryPlan(connectionPool)

        const schedule_history_params = []
        const schedule_history_values = []
        for (const { uid_line, ...schedule } of schedule_plan) {
            const { id: schedule_id, greenhouse_id } = schedule
            const [messages, details_message] = schedulePlan.generateMessage(schedule)

            try {
                await RoyalGapLine.pushMessage(
                    uid_line,
                    messages
                )

                schedule_history_params.push("( ? , ? , ? )")
                schedule_history_values.push(schedule_id, greenhouse_id, details_message.join("\n"))
            } catch (err) {
                console.log("uid:", uid_line)
                console.log("message:", messages)
            }
        }

        try {
            await connectionPool.executeQuery(
                `
                    INSERT INTO schedules_history (schedule_id , greenhouse_id , details_message)
                        VALUES ${schedule_history_params.join(",")}
                `,
                schedule_history_values
            )
        } catch (error) {
            console.error(`Save schedule history: ${error}`)
        }
    })

    cron.schedule("0 0 20 * * *", async () => {
        console.log("Start Check Unrecorded GAP")
        try {
            const unrecorded = await checkUnrecorded.queryUnrecorded(connectionPool)
            if (!unrecorded.length) return

            const notifiedIds = []

            for (const row of unrecorded) {
                try {
                    // แจ้งเตือน doctor บนเว็บ
                    await connectionPool.executeQuery(
                        `INSERT INTO notify_doctor (id_table_farmer, id_read, notify, station)
                         VALUES (?, '{}', ?, ?)`,
                        [row.farmer_id, checkUnrecorded.notifyDoctorMessage(row), row.station]
                    )

                    // real-time ไปยัง doctor
                    if (socket) socket.to(`notify-${row.station}`).emit("update")

                    // LINE reminder ไปยังเกษตรกร
                    await RoyalGapLine.pushMessage(
                        row.uid_line,
                        checkUnrecorded.generateReminderMessage(row)
                    )

                    notifiedIds.push(row.id)
                } catch (err) {
                    console.error(`Unrecorded notify error (history id: ${row.id}):`, err)
                }
            }

            // mark notified
            if (notifiedIds.length) {
                await connectionPool.executeQuery(
                    `UPDATE schedules_history SET notified_unrecorded = 1
                     WHERE id IN (${notifiedIds.map(() => '?').join(',')})`,
                    notifiedIds
                )
            }
        } catch (error) {
            console.error(`Check unrecorded error: ${error}`)
        }
    })
}