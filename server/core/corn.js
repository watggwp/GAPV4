'use strict';

const cron = require('node-cron');

const ConnectPool = require("../connectPool");
const RoyalGapLine = require("../configLine");

const schedulePlan = require('./corns/schedulePlan');

module.exports = function Schedules(connectionPool = new ConnectPool()) {
    cron.schedule("0 0 5 * * *" , async (now) => {
        console.log("Start Schedules GAP")
        const schedule_plan = await schedulePlan.queryPlan(connectionPool)

        const schedule_history_params = []
        const schedule_history_values = []
        schedule_plan.forEach( async ({ uid_line , ...schedule }) => {
            const { greenhouse_id } = schedule
            const [messages , details_message] = schedulePlan.generateMessage(schedule)

            try {
                await RoyalGapLine.pushMessage(
                    uid_line,
                    messages
                )

                schedule_history_params.push("( ? , ? )")
                schedule_history_values.push(greenhouse_id , details_message)
            } catch(err) {
                console.log("uid:" , uid_line)
                console.log("message:" , messages)
            }
        })

        await connectionPool.executeQuery(
            `
                INSERT INTO schedules_history (greenhouse_id , details_message)
                    VALUES ${schedule_history_params.join(",")}
            `,
            schedule_history_values
        )
    })
}