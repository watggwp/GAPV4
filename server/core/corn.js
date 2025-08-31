'use strict';

const cron = require('node-cron');

const ConnectPool = require("../connectPool");
const RoyalGapLine = require("../configLine");

const schedulePlan = require('./corns/schedulePlan');

module.exports = function Schedules(connectionPool = new ConnectPool()) {
    cron.schedule("0 0 5 * * *" , async (now) => {
        console.log("Start Schedules GAP")
        const schedule_plan = await schedulePlan.queryPlan(connectionPool)

        schedule_plan.forEach( async ({ uid_line , ...schedule }) => {
            const messages = schedulePlan.generateMessage(schedule)

            try {
                await RoyalGapLine.pushMessage(
                    uid_line,
                    messages
                )
            } catch(err) {
                console.log("uid:" , uid_line)
                console.log("message:" , messages)
            }
        })
    })
}