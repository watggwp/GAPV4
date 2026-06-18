const MessageLineTemplate = require('../messageLineTemplate');
const RoyalGapEnv = require('../env');
const plantingScheduleReminder = {
    queryPlan: async (connectionPool) => {
        return await connectionPool.executeQuery(`
            SELECT 
                fp.id as form_id , 
                gh.id_farm_house as greenhouse_id , 
                gh.name_house as greenhouse_name , 
                sdl.* , 
                gh.uid_line,
                gh.reminder_days_advance
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
            ) sdl ON sdl.name = fp.name_plant
            INNER JOIN (
                SELECT 
                    gh.id_farm_house , 
                    gh.name_house , 
                    gh.uid_line , 
                    af.station as station_id,
                    MAX(IFNULL(af.reminder_days_advance, 1)) as reminder_days_advance
                FROM housefarm gh
                INNER JOIN acc_farmer af ON af.uid_line = gh.uid_line OR af.uid_line = gh.link_user
                WHERE status = 1 AND IFNULL(af.reminder_days_advance, 1) > 0
                GROUP BY gh.id_farm_house
            ) gh ON gh.id_farm_house = fp.id_farm_house 
                AND gh.station_id = sdl.station_id
                AND IF(
                    sdl.repeat = 1,
                    (DATEDIFF(NOW(), STR_TO_DATE(fp.date_plant, '%Y-%m-%d %H:%i:%s.%f')) + gh.reminder_days_advance) % sdl.age_plant = 0,
                    DATEDIFF(NOW(), STR_TO_DATE(fp.date_plant, '%Y-%m-%d %H:%i:%s.%f')) = sdl.age_plant - gh.reminder_days_advance
                )
        `);
    },
    generateMessage: (schedule) => {
        const { title, name, category, greenhouse_id, greenhouse_name, form_id, schedule_details, id: schedule_id, reminder_days_advance } = schedule
        const details = JSON.parse(schedule_details)
        const days = Number(reminder_days_advance !== undefined && reminder_days_advance !== null ? reminder_days_advance : 1)

        // Calculate advance date
        const date = new Date()
        date.setDate(date.getDate() + days)
        const dateString = `${date.getDate()} เดือน ${date.getMonth() + 1} ปี ${date.getFullYear() + 543}`
        
        const actionName = category === 1 ? "ใส่ปุ๋ย" : (category === 2 ? "ใส่สารเคมี" : "")
        let reminderTitle = ""
        if (days === 0) {
            reminderTitle = `วันนี้อย่าลืม${actionName}`
        } else if (days === 1) {
            reminderTitle = `พรุ่งนี้อย่าลืม${actionName}`
        } else {
            reminderTitle = `อีก ${days} วัน อย่าลืม${actionName}ด้วย`
        }

        const subtitle = `โรงเรือน: ${greenhouse_name}\nพืช: ${name} | วันที่ทำกิจกรรม: ${dateString}`;
        const baseUrl = process.env.URL_SERVER || "https://api.gapv4.online";
        const greenhouseImage = `${baseUrl}/image/house?imagefarm=${greenhouse_id}&v=${date.getTime()}&ext=.jpg`;
        switch (category) {
            case 1: {
                const { name_fertilizer, formula_fertilizer, volume, unit_volume, how_use } = details

                const details_list = [
                    { label: "ปุ๋ย", value: name_fertilizer || "-" },
                    { label: "สูตร", value: formula_fertilizer || "-" },
                    { label: "ปริมาณ", value: `${volume || "-"} ${unit_volume || ""}`.trim() },
                    { label: "วิธีใช้", value: `${how_use || "-"} (หากไม่แน่ใจ ให้ดูบนฉลาก)` }
                ];

                const details_message = details_list.map(d => `${d.label}: ${d.value}`);
                return [
                    MessageLineTemplate.beautifulBubbleUrl({
                        title: reminderTitle,
                        subtitle: subtitle,
                        imageUrl: greenhouseImage,
                        details: details_list // Keep empty to avoid displaying details table on bubble
                    }),
                    details_message
                ]
            }
            case 2: {
                const { pest, chemical, rate, volume, unit_volume, how_use } = details

                const details_list = [
                    { label: "โรคพืช", value: pest || "-" },
                    { label: "สารเคมี", value: chemical || "-" },
                    { label: "อัตราส่วน", value: rate || "-" },
                    { label: "ปริมาณ", value: `${volume || "-"} ${unit_volume || ""}`.trim() },
                    { label: "วิธีใช้", value: `${how_use || "-"} (หากไม่แน่ใจ ให้ดูบนฉลาก)` }
                ];

                const details_message = details_list.map(d => `${d.label}: ${d.value}`);
                return [
                    MessageLineTemplate.beautifulBubbleUrl({
                        title: reminderTitle,
                        subtitle: subtitle,
                        imageUrl: greenhouseImage,
                        details: details_list // Keep empty to avoid displaying details table on bubble
                    }),
                    details_message
                ]
            }
            default:
                return []
        }
    }
};
module.exports = plantingScheduleReminder;