'use strict';


const checkUnrecorded = {
    queryUnrecorded: async (connectionPool) => {
        return await connectionPool.executeQuery(`
            SELECT
                fp.id AS formplant_id,
                s.id AS schedule_id,
                fp.id_farm_house AS greenhouse_id,
                fp.name_plant,
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
                (s.repeat = 0
                    AND DATEDIFF(CURDATE(), DATE(fp.date_plant)) >= s.age_plant
                    AND DATEDIFF(CURDATE(), DATE(fp.date_plant)) <= s.age_plant + 3)
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


    notifyDoctorMessage: (row) => {
        const typeLabel = row.category === 1 ? 'ปุ๋ย' : 'สารเคมี'
        return `เกษตรกร ${row.fullname} ยังไม่บันทึกการใช้${typeLabel}\nพืช: ${row.name_plant}\nกิจกรรม: ${row.title}\nโรงเรือน: ${row.greenhouse_name}`
    },

    queryDoctorsByStation: async (connectionPool, station) => {
        return await connectionPool.executeQuery(
            `SELECT uid_line_doctor
             FROM acc_doctor
             WHERE station_doctor = ?
               AND uid_line_doctor != ''
               AND status_account = 1
               AND status_delete = 0
               AND doctor_role = 1`,
            [station]
        )
    },

    notifyDoctorLineMessage: (row) => {
        const typeLabel = row.category === 1 ? 'ปุ๋ย' : 'สารเคมี'
        return [
            `เกษตรกร: ${row.fullname}`,
            `พืช: ${row.name_plant}`,
            `กิจกรรม: ${row.title} (${typeLabel})`,
            `โรงเรือน: ${row.greenhouse_name}`
        ]
    }
}

module.exports = checkUnrecorded
