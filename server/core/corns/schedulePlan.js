const schedulePlan = {
    queryPlan : async (connectionPool) => {
        return await connectionPool.executeQuery(`
            SELECT fp.id as form_id , gh.id_farm_house as greenhouse_id , sdl.* , gh.uid_line
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
    generateMessage : (title, name , category , greenhouse_id , form_id, details) => {
        switch(category) {
            case 1 : {
                const { fertilizer , formula_fertilizer , volume , unit_volume , how_use } = details

                return MessageLineTemplate.bubbleTemplateUrl(
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
            }
            case 2 : {
                const { pest , chemical , volume , unit_volume } = details

                return MessageLineTemplate.bubbleTemplateUrl(
                    title,
                    [
                        title,
                        `ชนิดพืช: ${name}`,
                        `โรคพืช: ${pest}`,
                        `สารเคมี: ${chemical}`,
                        `ปริมาณ: ${volume} ${unit_volume}`,
                    ],
                    `${RoyalGapEnv.url_line.get_greenhouse}/${greenhouse_id}/${form_id}/p`
                )
            }
        }
    }
}

module.exports = schedulePlan;