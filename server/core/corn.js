const cron = require('node-cron');
const ConnectPool = require("../connectPool");
const RoyalGapLine = require("../configLine");

module.exports = function Schedules(connectionPool = new ConnectPool()) {

    console.log("Start Schedules")
    cron.schedule("* 8 * * *" , async (now) => {
        const schedule_plan = await connectionPool.executeQuery(`
            SELECT sdl.* , gh.uid_line
            FROM formplant fp
            INNER JOIN (
                SELECT name , sd.* , (
                    SELECT CONCAT(
                        '[',
                        GROUP_CONCAT(
                            CONCAT(
                                '{',
                                    '"fertilizer":"', IFNULL(sdf.fertilizer,''), '",',
                                    '"formula_fertilizer":"', IFNULL(sdf.formula_fertilizer,''), '",',
                                    '"volume":"', IFNULL(sdf.volume,''), '",',
                                    '"unit_volume":"', IFNULL(sdf.unit_volume,''), '",',
                                    '"how_use":"', IFNULL(sdf.how_use,''), '"',
                                '}'
                            )
                        ),
                        ']'
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
            GROUP BY sdl.id
        `)

        console.log(schedule_plan)
        schedule_plan.forEach(({  }) => {

        })
    })
}