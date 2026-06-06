'use strict';

const MessageLineTemplate = require('../messageLineTemplate');
const RoyalGapEnv = require('../env');

const checkUnrecorded = {
    queryUnrecorded: async (connectionPool) => {
        return await connectionPool.executeQuery(`
            SELECT
                s.id AS schedule_id,
                fp.id_farm_house AS greenhouse_id,
                s.category,
                s.title,
                hf.name_house AS greenhouse_name,
                hf.uid_line AS greenhouse_uid,
                af.uid_line,
                af.id_table AS farmer_id,
                af.fullname,
                af.station
            FROM formplant fp
            INNER JOIN housefarm hf ON fp.id_farm_house = hf.id_farm_house
            INNER JOIN acc_farmer af ON (af.uid_line = hf.uid_line OR af.uid_line = hf.link_user)
                AND af.register_auth IN (0, 1)
            INNER JOIN plant_list pl ON fp.name_plant = pl.name AND pl.is_use = 1
            INNER JOIN schedules s ON s.plant_id = pl.id AND s.station_id = af.station
            WHERE (fp.state_status = 0 OR fp.state_status = 1)
              AND (
                (s.repeat = 0 AND DATEDIFF(CURDATE(), DATE(fp.date_plant)) = s.age_plant)
                OR
                (s.repeat = 1 AND DATEDIFF(CURDATE(), DATE(fp.date_plant)) > 0
                               AND DATEDIFF(CURDATE(), DATE(fp.date_plant)) % s.age_plant = 0)
              )
              AND NOT EXISTS (
                SELECT 1 FROM schedules_history sh
                WHERE sh.schedule_id = s.id
                  AND sh.greenhouse_id = fp.id_farm_house
                  AND sh.date = CURDATE()
                  AND sh.notified_unrecorded = 1
              )
              AND (
                (s.category = 1 AND NOT EXISTS (
                    SELECT 1 FROM formfertilizer ff
                    WHERE ff.id_plant = fp.id
                      AND ff.date LIKE CONCAT(CURDATE(), '%')
                ))
                OR
                (s.category = 2 AND NOT EXISTS (
                    SELECT 1 FROM formchemical fc
                    WHERE fc.id_plant = fp.id
                      AND fc.date LIKE CONCAT(CURDATE(), '%')
                ))
              )
            GROUP BY fp.id, s.id
        `)
    },

    generateReminderMessage: (row) => {
        const { category, title, greenhouse_name, greenhouse_id, farmer_id } = row
        const typeLabel = category === 1 ? 'การใช้ปุ๋ย' : 'การใช้สารเคมี'
        const formSuffix = category === 1 ? 'z' : 'c'

        const date = new Date()
        const dateString = `${date.getDate()} เดือน ${date.getMonth() + 1} ปี ${date.getFullYear() + 543}`

        const message = [
            `📋 แจ้งเตือน: ยังไม่พบการบันทึก${typeLabel}`,
            `วันที่ ${dateString}`,
            `กิจกรรม: ${title}`,
            `โรงเรือน: ${greenhouse_name}`,
            '',
            'กรุณาบันทึกข้อมูลการใช้งานให้ครบถ้วน'
        ]

        return MessageLineTemplate.bubbleTemplateUrl(
            `แจ้งเตือน: ยังไม่พบการบันทึก${typeLabel}`,
            message,
            `${RoyalGapEnv.url_line.get_greenhouse}/${greenhouse_id}/${formSuffix}?open-insert=true`,
            { buttonLabel: `บันทึก${typeLabel}ที่นี่` }
        )
    },

    notifyDoctorMessage: (row) => {
        const typeLabel = row.category === 1 ? 'ปุ๋ย' : 'สารเคมี'
        return `เกษตรกร ${row.fullname} ยังไม่บันทึกการใช้${typeLabel}\nโรงเรือน: ${row.greenhouse_name}`
    }
}

module.exports = checkUnrecorded
