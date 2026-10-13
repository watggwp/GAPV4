'use strict';

const Pool = require("../connectPool")

// ตรวจว่าเกษตรกรที่เรียก API (?r=farmer) เป็นเจ้าของโรงเรือน/แปลง/อุปกรณ์จริง
// ส่วน admin/doctor (?r=doctor) ให้ route เดิมตรวจ session ตามเดิม
const OWNER_JOIN = `
    JOIN acc_farmer af ON (af.uid_line = hf.uid_line OR af.link_user = hf.link_user)
    WHERE af.uid_line = ? AND af.register_auth IN (0, 1)
`

const ownershipQueries = {
    greenhouse: `
        SELECT 1 FROM housefarm hf
        ${OWNER_JOIN} AND hf.id_farm_house = ?
        LIMIT 1
    `,
    formplant: `
        SELECT 1 FROM formplant fp
        JOIN housefarm hf ON hf.id_farm_house = fp.id_farm_house
        ${OWNER_JOIN} AND fp.id = ?
        LIMIT 1
    `,
    ecph: `
        SELECT 1 FROM ecph e
        JOIN formplant fp ON fp.id = e.id_formplant
        JOIN housefarm hf ON hf.id_farm_house = fp.id_farm_house
        ${OWNER_JOIN} AND e.id = ?
        LIMIT 1
    `,
    weatherSensor: `
        SELECT 1 FROM sensor_weather_greenhouse s
        JOIN housefarm hf ON hf.id_farm_house = s.greenhouse_id
        ${OWNER_JOIN} AND s.id = ?
        LIMIT 1
    `,
    pumpSensor: `
        SELECT 1 FROM sensor_pump_greenhouse s
        JOIN housefarm hf ON hf.id_farm_house = s.greenhouse_id
        ${OWNER_JOIN} AND s.id = ?
        LIMIT 1
    `
}

module.exports = function ownershipGuard(pool = new Pool()) {
    // resource: ชนิดข้อมูล, pickId: ดึง id จาก request
    return (resource, pickId) => async (req, res, next) => {
        if (req.query.r !== "farmer") return next()

        const uid = req.session && req.session.uidFarmer
        const id = pickId(req)
        if (!uid) return res.status(403).send({ errors: "authorize error" })
        if (id === undefined || id === null || id === "") return next()

        try {
            const rows = await pool.executeQuery(ownershipQueries[resource], [uid, id])
            if (rows.length) return next()
            return res.status(403).send({ errors: "authorize error" })
        } catch (err) {
            console.error("ownershipGuard", resource, err)
            return res.status(500).send({ errors: "internal" })
        }
    }
}
