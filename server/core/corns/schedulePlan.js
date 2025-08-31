const MessageLineTemplate = require('../messageLineTemplate');
const RoyalGapEnv = require('../env');

const schedulePlan = {
    queryPlan : async (connectionPool) => {
        return await connectionPool.executeQuery(`
            SELECT 
                fp.id as form_id , 
                gh.id_farm_house as greenhouse_id , 
                gh.name_house as greenhouse_name , 
                sdl.* , 
                gh.uid_line
            FROM formplant fp
            INNER JOIN (
                SELECT name , sd.*
                FROM plant_list pl
                INNER JOIN (
                    SELECT 
                        s.* ,
                        IF(
                            s.category = 1,
                        	CONCAT(
                                '{',
                                    '"name_fertilizer":"', IFNULL(sdf.fertilizer, ''), '",',
                                    '"formula_fertilizer":"', IFNULL(sdf.formula_fertilizer, ''), '",',
                                    '"volume":"', IFNULL(sdf.volume, ''), '",',
                                    '"unit_volume":"', IFNULL(sdf.unit_volume, ''), '",',
                                    '"how_use":"', IFNULL(sdf.how_use, ''), '"'
                                ,'}'
                            ),
                            CONCAT(
                                '{',
                                    '"pest":"', IFNULL(sdd.pest, ''), '",',
                                    '"chemical":"', IFNULL(sdd.chemical, ''), '",',
                                    '"rate":"', IFNULL(sdd.rate, ''), '",',
                                    '"how_use":"', IFNULL(sdd.how_use, ''), '",',
                                    '"volume":"', IFNULL(sdd.volume, ''), '",',
                                    '"unit_volume":"', IFNULL(sdd.unit_volume, ''), '"'
                                ,'}'
                            )
                        ) AS schedule_details
                    FROM schedules s
                    LEFT JOIN schedules_detail_fertilizer sdf ON sdf.schedule_id = s.id
                    LEFT JOIN schedules_detail_disease sdd ON sdd.schedule_id = s.id
                ) sd ON sd.plant_id = pl.id
            ) sdl ON sdl.name = fp.name_plant AND IF(
                sdl.repeat = 1,
                DATEDIFF(NOW(), STR_TO_DATE(fp.date_plant, '%Y-%m-%d %H:%i:%s.%f')) % sdl.age_plant = 0,
                DATEDIFF(NOW(), STR_TO_DATE(fp.date_plant, '%Y-%m-%d %H:%i:%s.%f')) = sdl.age_plant
            )
            INNER JOIN housefarm gh ON gh.id_farm_house = fp.id_farm_house
        `)
    },
    generateMessage : (schedule) => {
        const { title, name, category, greenhouse_id , greenhouse_name , form_id, schedule_details } = schedule
        const details = JSON.parse(schedule_details)
        const date = new Date()
        const dateString = `${date.getDate()} เดือน ${date.getMonth()+1} ปี ${date.getFullYear()+543}`

        const generalMessage = [
            `วันที่ ${dateString}`,
            `กิจกรรม: ${title}`,
            `โรงเรือน: ${greenhouse_name}`,
            `ชนิดพืช: ${name}`,
            "",
        ]

        switch(category) {
            case 1 : {
                const { name_fertilizer , formula_fertilizer , volume , unit_volume , how_use } = details
                
                return MessageLineTemplate.bubbleTemplateUrl(
                    title,
                    [
                        ...generalMessage,
                        `ปุ๋ย: ${name_fertilizer}`,
                        `สูตร: ${formula_fertilizer}`,
                        `ปริมาณ: ${volume} ${unit_volume}`,
                        `วิธีใช้: ${how_use} (หากไม่แน่ใจ ให้ดูบนฉลาก)`
                    ],
                    `${RoyalGapEnv.url_line.get_greenhouse}/${greenhouse_id}/${form_id}/f?open-insert=true`,
                    {
                        buttonLabel : "ใส่ปุ๋ยแล้ว กรอกข้อมูลที่นี่"
                    }
                )
            }
            case 2 : {
                const { pest , chemical , rate , volume , unit_volume , how_use } = details

                return MessageLineTemplate.bubbleTemplateUrl(
                    title,
                    [
                        ...generalMessage,
                        `โรคพืช: ${pest}`,
                        `สารเคมี: ${chemical}`,
                        `อัตราส่วนผสม: ${rate}`,
                        `ปริมาณ: ${volume} ${unit_volume}`,
                        `วิธีใช้: ${how_use} (หากไม่แน่ใจ ให้ดูบนฉลาก)`,
                    ],
                    `${RoyalGapEnv.url_line.get_greenhouse}/${greenhouse_id}/${form_id}/c?open-insert=true`,
                    {
                        buttonLabel : "ใส่สารเคมีแล้ว กรอกข้อมูลที่นี่"
                    }
                )
            }
        }
    }
}

module.exports = schedulePlan;