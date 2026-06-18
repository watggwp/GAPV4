'use strict';

const MessageLineTemplate = require('../messageLineTemplate');
const RoyalGapLine = require('../../configLine'); // from server/core/corns to server/configLine.js
require('dotenv').config();

const checkMismatch = {
    // This is kept just in case we need batch checks later, but no longer used in cron
    queryMismatch: async (connectionPool) => {
        return await connectionPool.executeQuery(`
            SELECT
                s.id AS schedule_id,
                fp.id AS formplant_id,
                fp.id_farm_house AS greenhouse_id,
                fp.name_plant,
                s.category,
                s.title,
                hf.name_house AS greenhouse_name,
                af.uid_line AS farmer_uid_line,
                af.id_table AS farmer_id,
                af.fullname,
                af.station,
                GROUP_CONCAT(DISTINCT doc.uid_line_doctor) as doctor_uids,
                doc.id_table_doctor as doctor_id_table
            FROM formplant fp
            INNER JOIN housefarm hf ON fp.id_farm_house = hf.id_farm_house
            INNER JOIN acc_farmer af ON (af.uid_line = hf.uid_line OR af.uid_line = hf.link_user)
                AND af.register_auth IN (0, 1)
            INNER JOIN plant_list pl ON fp.name_plant = pl.name AND pl.is_use = 1
            INNER JOIN schedules s ON s.plant_id = pl.id AND s.station_id = af.station
            INNER JOIN schedule_tracking st ON st.formplant_id = fp.id AND st.schedule_id = s.id
            LEFT JOIN formfertilizer ff ON st.formfertilizer_id = ff.id
            LEFT JOIN formchemical fc ON st.formchemical_id = fc.id
            LEFT JOIN schedules_detail_fertilizer sdf ON s.category = 1 AND sdf.schedule_id = s.id
            LEFT JOIN schedules_detail_disease sdd ON s.category = 2 AND sdd.schedule_id = s.id
            LEFT JOIN acc_doctor doc ON doc.station_doctor = af.station
            WHERE (fp.state_status = 0 OR fp.state_status = 1)
              AND (
                (s.category = 1 AND (
                    IFNULL(ff.name, '') != IFNULL(sdf.fertilizer, '') OR
                    IFNULL(ff.formula_name, '') != IFNULL(sdf.formula_fertilizer, '') OR
                    TRIM(IFNULL(ff.volume, '')) != TRIM(CONCAT(IFNULL(sdf.volume, ''), ' ', IFNULL(sdf.unit_volume, ''))) OR
                    TRIM(IFNULL(ff.use_is, '')) != TRIM(IFNULL(sdf.how_use, ''))
                ))
                OR (s.category = 2 AND (
                    IFNULL(fc.name, '') != IFNULL(sdd.chemical, '') OR
                    IFNULL(fc.insect, '') != IFNULL(sdd.pest, '') OR
                    TRIM(IFNULL(fc.rate, '')) != TRIM(IFNULL(sdd.rate, '')) OR
                    TRIM(IFNULL(fc.volume, '')) != TRIM(CONCAT(IFNULL(sdd.volume, ''), ' ', IFNULL(sdd.unit_volume, ''))) OR
                    TRIM(IFNULL(fc.use_is, '')) != TRIM(IFNULL(sdd.how_use, ''))
                ))
              )
              AND NOT EXISTS (
                SELECT 1 FROM schedules_history sh
                WHERE sh.schedule_id = s.id
                  AND sh.greenhouse_id = fp.id_farm_house
                  AND sh.notified_mismatch = 1
              )
            GROUP BY fp.id, s.id
        `);
    },

    querySingleMismatch: async (connectionPool, formplant_id, schedule_id) => {
        return await connectionPool.executeQuery(`
            SELECT
                s.id AS schedule_id,
                fp.id AS formplant_id,
                fp.id_farm_house AS greenhouse_id,
                fp.name_plant,
                s.category,
                s.title,
                hf.name_house AS greenhouse_name,
                af.uid_line AS farmer_uid_line,
                af.id_table AS farmer_id,
                af.fullname,
                af.station,
                GROUP_CONCAT(DISTINCT doc.uid_line_doctor) as doctor_uids,
                doc.id_table_doctor as doctor_id_table
            FROM formplant fp
            INNER JOIN housefarm hf ON fp.id_farm_house = hf.id_farm_house
            INNER JOIN acc_farmer af ON (af.uid_line = hf.uid_line OR af.uid_line = hf.link_user)
                AND af.register_auth IN (0, 1)
            INNER JOIN plant_list pl ON fp.name_plant = pl.name AND pl.is_use = 1
            INNER JOIN schedules s ON s.plant_id = pl.id AND s.station_id = af.station
            INNER JOIN schedule_tracking st ON st.formplant_id = fp.id AND st.schedule_id = s.id
            LEFT JOIN formfertilizer ff ON st.formfertilizer_id = ff.id
            LEFT JOIN formchemical fc ON st.formchemical_id = fc.id
            LEFT JOIN schedules_detail_fertilizer sdf ON s.category = 1 AND sdf.schedule_id = s.id
            LEFT JOIN schedules_detail_disease sdd ON s.category = 2 AND sdd.schedule_id = s.id
            LEFT JOIN acc_doctor doc ON doc.station_doctor = af.station
            WHERE fp.id = ? AND s.id = ?
              AND (
                (s.category = 1 AND (
                    IFNULL(ff.name, '') != IFNULL(sdf.fertilizer, '') OR
                    IFNULL(ff.formula_name, '') != IFNULL(sdf.formula_fertilizer, '') OR
                    TRIM(IFNULL(ff.volume, '')) != TRIM(CONCAT(IFNULL(sdf.volume, ''), ' ', IFNULL(sdf.unit_volume, ''))) OR
                    TRIM(IFNULL(ff.use_is, '')) != TRIM(IFNULL(sdf.how_use, ''))
                ))
                OR (s.category = 2 AND (
                    IFNULL(fc.name, '') != IFNULL(sdd.chemical, '') OR
                    IFNULL(fc.insect, '') != IFNULL(sdd.pest, '') OR
                    TRIM(IFNULL(fc.rate, '')) != TRIM(IFNULL(sdd.rate, '')) OR
                    TRIM(IFNULL(fc.volume, '')) != TRIM(CONCAT(IFNULL(sdd.volume, ''), ' ', IFNULL(sdd.unit_volume, ''))) OR
                    TRIM(IFNULL(fc.use_is, '')) != TRIM(IFNULL(sdd.how_use, ''))
                ))
              )
              AND NOT EXISTS (
                SELECT 1 FROM schedules_history sh
                WHERE sh.schedule_id = s.id
                  AND sh.greenhouse_id = fp.id_farm_house
                  AND sh.notified_mismatch = 1
              )
            GROUP BY fp.id, s.id
        `, [formplant_id, schedule_id]);
    },

    notifyDoctorMessage: (row) => {
        const typeLabel = row.category === 1 ? 'ปุ๋ย' : 'สารเคมี';
        return `พบเกษตรกร ${row.fullname} บันทึกข้อมูล${typeLabel}ไม่ตรงตามแผน\nพืช: ${row.name_plant}\nกิจกรรม: ${row.title}\nโรงเรือน: ${row.greenhouse_name}`;
    },

    triggerMismatchCheck: async (connectionPool, formplant_id, schedule_id, socket) => {
        try {
            console.log(`Start Check Mismatch for Form ${formplant_id} Schedule ${schedule_id}`);
            const mismatches = await checkMismatch.querySingleMismatch(connectionPool, formplant_id, schedule_id);
            if (mismatches.length > 0) {
                const row = mismatches[0];
                const detailsMessage = checkMismatch.notifyDoctorMessage(row);

                // แจ้งเตือน doctor บนเว็บ
                await connectionPool.executeQuery(
                    `INSERT INTO notify_doctor (id_table_farmer, id_read, notify, station, type, ref_id)
                     VALUES (?, '{}', ?, ?, 1, ?)`,
                    [row.farmer_id, detailsMessage, row.station, row.formplant_id]
                );

                // real-time ไปยัง doctor
                if (socket) {
                    socket.to(`notify-${row.station}`).emit("update");
                }

                // mark notified in schedule_history (create or update)
                const updated = await connectionPool.executeQuery(
                    `UPDATE schedules_history SET notified_mismatch = 1
                     WHERE schedule_id = ? AND greenhouse_id = ? AND DATE(date) = CURDATE()`,
                    [row.schedule_id, row.greenhouse_id]
                );
                if (updated.affectedRows === 0) {
                    await connectionPool.executeQuery(
                        `INSERT INTO schedules_history (schedule_id, greenhouse_id, details_message, notified_mismatch)
                         VALUES (?, ?, ?, 1)`,
                        [row.schedule_id, row.greenhouse_id, detailsMessage]
                    );
                }

                // ส่ง LINE ไปให้หมอพืช (Doctor)
                if (row.doctor_uids) {
                    const uids = row.doctor_uids.split(',');
                    const baseUrl = process.env.URL_SERVER || "https://api.gapv4.online";
                    const msgTemplate = MessageLineTemplate.beautifulBubbleUrl({
                        title: "แจ้งเตือนข้อมูลไม่ตรงตามแผน",
                        subtitle: `ฟาร์ม: ${row.greenhouse_name}\nพืช: ${row.name_plant}`,
                        imageUrl: `${baseUrl}/image/house?imagefarm=${row.greenhouse_id}&v=${new Date().getTime()}&ext=.jpg`,
                        details: [
                            { label: "เกษตรกร", value: row.fullname },
                            { label: "กิจกรรม", value: row.title }
                        ],
                        url: `${baseUrl}/doctor/dashboard`,
                        buttonLabel: "คลิกเพื่อดูรายละเอียด"
                    });
                    for (let uid of uids) {
                        try {
                            await RoyalGapLine.pushMessage(uid, msgTemplate);
                        } catch (e) {
                            console.error("Line Push Error:", e.response?.data || e.message);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`triggerMismatchCheck error:`, err);
        }
    }
}

module.exports = checkMismatch;
