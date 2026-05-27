'use strict';

const MessageLineTemplate = require('../messageLineTemplate');
const RoyalGapEnv = require('../env');

const checkUnrecorded = {
    queryUnrecorded: async (connectionPool) => {
        return await connectionPool.executeQuery(`
            SELECT
                sh.id,
                sh.schedule_id,
                sh.greenhouse_id,
                s.category,
                s.title,
                hf.name_house as greenhouse_name,
                hf.uid_line as greenhouse_uid,
                af.uid_line,
                af.id_table as farmer_id,
                af.fullname,
                af.station
            FROM schedules_history sh
            JOIN schedules s  ON sh.schedule_id = s.id
            JOIN housefarm hf ON sh.greenhouse_id = hf.id_farm_house
            JOIN acc_farmer af ON (af.uid_line = hf.uid_line OR af.uid_line = hf.link_user)
                AND af.register_auth IN (0, 1)
            WHERE sh.date = CURDATE()
              AND sh.notified_unrecorded = 0
              AND (
                (s.category = 1 AND NOT EXISTS (
                    SELECT 1 FROM formfertilizer ff
                    JOIN formplant fp ON ff.id_plant = fp.id
                    WHERE fp.id_farm_house = sh.greenhouse_id
                      AND ff.date LIKE CONCAT(CURDATE(), '%')
                ))
                OR
                (s.category = 2 AND NOT EXISTS (
                    SELECT 1 FROM formchemical fc
                    JOIN formplant fp ON fc.id_plant = fp.id
                    WHERE fp.id_farm_house = sh.greenhouse_id
                      AND fc.date LIKE CONCAT(CURDATE(), '%')
                ))
              )
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
            `${RoyalGapEnv.url_line.get_greenhouse}/${greenhouse_id}/z?open-insert=true`,
            { buttonLabel: `บันทึก${typeLabel}ที่นี่` }
        )
    },

    notifyDoctorMessage: (row) => {
        const typeLabel = row.category === 1 ? 'ปุ๋ย' : 'สารเคมี'
        return `เกษตรกร ${row.fullname} ยังไม่บันทึกการใช้${typeLabel}\nโรงเรือน: ${row.greenhouse_name}`
    }
}

module.exports = checkUnrecorded
