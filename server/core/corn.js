const cron = require('node-cron');
const ConnectPool = require("../connectPool");
const RoyalGapLine = require("../configLine");
const MessageLineTemplate = require('./messageLineTemplate');
const RoyalGapEnv = require('./env');

module.exports = function Schedules(connectionPool = new ConnectPool()) {
    // cron.schedule("0 8 * * *" , async (now) => {
    cron.schedule("0 0 8 * * *" , async (now) => {
        console.log("Start Schedules GAP")
        const schedule_plan = await connectionPool.executeQuery(`
            SELECT fp.id as form_id , gh.id_farm_house as greenhouse_id , sdl.* , gh.uid_line
            FROM formplant fp
            INNER JOIN (
                SELECT name , sd.* , (
                    SELECT GROUP_CONCAT(
                        CONCAT(
                            '{',
                                '"fertilizer":"', IFNULL(sdf.fertilizer,''), '",',
                                '"formula_fertilizer":"', IFNULL(sdf.formula_fertilizer,''), '",',
                                '"volume":"', IFNULL(sdf.volume,''), '",',
                                '"unit_volume":"', IFNULL(sdf.unit_volume,''), '",',
                                '"how_use":"', IFNULL(sdf.how_use,''), '"',
                            '}'
                        )
                    )
                    FROM schedules_detail_fertilizer sdf
                    WHERE sdf.schedule_id = sd.id
                ) AS schedule_details
                FROM plant_list pl
                INNER JOIN schedules sd ON sd.plant_id = pl.id
            ) sdl ON sdl.name = fp.name_plant AND IF(
                sdl.repeat = 1,
                DATEDIFF(NOW(), STR_TO_DATE(fp.date_plant, '%Y-%m-%d %H:%i:%s.%f')) % sdl.age_plant = 0,
                DATEDIFF(NOW(), STR_TO_DATE(fp.date_plant, '%Y-%m-%d %H:%i:%s.%f')) = sdl.age_plant
            )
            INNER JOIN housefarm gh ON gh.id_farm_house = fp.id_farm_house
        `)

        schedule_plan.forEach( async ({ greenhouse_id , form_id , name , title , category , schedule_details , uid_line }) => {
            const details = JSON.parse(schedule_details)
            
            switch(category) {
                case 1 :
                    const { fertilizer , formula_fertilizer , volume , unit_volume , how_use } = details

                    const messages = MessageLineTemplate.bubbleTemplateUrl(
                        title,
                        [
                            title,
                            `ชนิดพืช: ${name}`,
                            `ปุ๋ย: ${fertilizer}`,
                            `สูตร: ${formula_fertilizer}`,
                            `ปริมาณ: ${volume} ${unit_volume}`,
                            `วิธีใช้: ${how_use}`
                        ],
                        `${RoyalGapEnv.url_line.get_greenhouse}/${greenhouse_id}/${form_id}/p`
                    )

                    try {
                        await RoyalGapLine.pushMessage(
                            uid_line,
                            messages
                        )
                    } catch(err) {
                        console.log("uid:" , uid_line)
                        console.log("message:" , messages)
                    }
                    break;
                case 2 :
                    break;
            }
        })
    })
}