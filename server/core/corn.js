'use strict';

const cron = require('node-cron');

const ConnectPool = require("../connectPool");
const RoyalGapLine = require("../configLine");
const MessageLineTemplate = require('./messageLineTemplate');
const RoyalGapEnv = require('./env');

const schedulePlan = require('./corns/schedulePlan');

module.exports = function Schedules(connectionPool = new ConnectPool()) {
    // cron.schedule("0 8 * * *" , async (now) => {
    cron.schedule("0 0 8 * * *" , async (now) => {
        console.log("Start Schedules GAP")
        const schedule_plan = schedulePlan.queryPlan(connectionPool)

        schedule_plan.forEach( async ({ greenhouse_id , form_id , name , title , category , schedule_details , uid_line }) => {
            const messages = schedulePlan.generateMessage(title, name, category, greenhouse_id, form_id, JSON.parse(schedule_details))

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