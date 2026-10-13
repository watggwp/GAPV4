'use strict';

const Pool = require("../connectPool")

// จำกัดให้หมอเข้าถึงได้เฉพาะเกษตรกร / แปลง / ข้อความ ของศูนย์ (station) ตัวเอง
// ใช้เงื่อนไขเดียวกับหน้ารายการแปลง: acc_farmer.station = acc_doctor.station_doctor
// และโรงเรือนผูกกับเกษตรกรผ่าน uid_line หรือ link_user

const FARMER_OF_HOUSE = `
    JOIN acc_farmer af ON (af.uid_line = hf.uid_line OR af.link_user = hf.link_user)
`

const scopeQueries = {
    form: `
        SELECT 1 FROM formplant fp
        JOIN housefarm hf ON hf.id_farm_house = fp.id_farm_house
        ${FARMER_OF_HOUSE}
        WHERE fp.id = ? AND af.station = ? LIMIT 1
    `,
    farmhouse: `
        SELECT 1 FROM housefarm hf
        ${FARMER_OF_HOUSE}
        WHERE hf.id_farm_house = ? AND af.station = ? LIMIT 1
    `,
    farmer: `SELECT 1 FROM acc_farmer WHERE id_table = ? AND station = ? LIMIT 1`,
    linkUser: `SELECT 1 FROM acc_farmer WHERE link_user = ? AND station = ? LIMIT 1`,
    lineUser: `SELECT 1 FROM acc_farmer WHERE uid_line = ? AND station = ? LIMIT 1`,
    report: `
        SELECT 1 FROM report_detail rd
        JOIN formplant fp ON fp.id = rd.id_plant
        JOIN housefarm hf ON hf.id_farm_house = fp.id_farm_house
        ${FARMER_OF_HOUSE}
        WHERE rd.id = ? AND af.station = ? LIMIT 1
    `,
    fertilizer: `
        SELECT 1 FROM formfertilizer ff
        JOIN formplant fp ON fp.id = ff.id_plant
        JOIN housefarm hf ON hf.id_farm_house = fp.id_farm_house
        ${FARMER_OF_HOUSE}
        WHERE ff.id = ? AND af.station = ? LIMIT 1
    `,
    chemical: `
        SELECT 1 FROM formchemical fc
        JOIN formplant fp ON fp.id = fc.id_plant
        JOIN housefarm hf ON hf.id_farm_house = fp.id_farm_house
        ${FARMER_OF_HOUSE}
        WHERE fc.id = ? AND af.station = ? LIMIT 1
    `,
    lineMessage: `
        SELECT 1 FROM message_user mu
        JOIN acc_farmer af ON af.uid_line = mu.uid_line_farmer
        WHERE mu.message = ? AND af.station = ? LIMIT 1
    `
}

// ค่าจาก body (JSON / multipart), query string หรือ path params
const input = (req, name) => {
    const fromBody = req.body && req.body[name]
    if (fromBody !== undefined && fromBody !== "") return fromBody
    if (req.query && req.query[name] !== undefined && req.query[name] !== "") return req.query[name]
    return req.params && req.params[name]
}

module.exports = function doctorScope(pool = new Pool()) {
    async function doctorStation(req) {
        const username = req.session && req.session.user_doctor
        if (!username) return null
        const [doctor] = await pool.executeQuery(
            `SELECT station_doctor FROM acc_doctor WHERE BINARY id_doctor = ? ORDER BY status_delete ASC LIMIT 1`,
            [username]
        )
        return doctor ? doctor.station_doctor : null
    }

    // checks: [[resource, field], ...] ทุกค่าที่ส่งมาต้องอยู่ในศูนย์ของหมอ
    return (...checks) => async (req, res, next) => {
        try {
            const pending = checks
                .map(([resource, field]) => [typeof resource === "function" ? resource(req) : resource, input(req, field)])
                .filter(([resource, value]) => resource && value !== undefined && value !== null && value !== "")
            if (!pending.length) return next()

            // ไม่มี session หมอ: ให้ route เดิมจัดการ (redirect logout)
            const station = await doctorStation(req)
            if (station === null) return next()

            for (const [resource, value] of pending) {
                const rows = await pool.executeQuery(scopeQueries[resource], [value, station])
                if (!rows.length) return res.status(403).send("")
            }
            return next()
        } catch (err) {
            console.error("doctorScope", err)
            return res.status(500).send("")
        }
    }
}
