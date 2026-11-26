'use strict';

// ไม่ส่ง hash รหัสผ่านกลับไปที่ client ไม่ว่า route ไหนจะ SELECT * มา
// (เช่น /api/admin/profile/get และ form/get/farmer เคยส่ง password กลับไปด้วย)
const SENSITIVE_KEYS = new Set(["password", "password_doctor"])
const MAX_DEPTH = 5

function strip(value, depth = 0) {
    if (value === null || typeof value !== "object" || depth > MAX_DEPTH) return value
    if (Buffer.isBuffer(value) || value instanceof Date) return value
    if (Array.isArray(value)) {
        value.forEach((item) => strip(item, depth + 1))
        return value
    }
    for (const key of Object.keys(value)) {
        if (SENSITIVE_KEYS.has(key)) delete value[key]
        else strip(value[key], depth + 1)
    }
    return value
}

// res.send(object) ของ express เรียก res.json ภายใน จึงครอบที่ res.json จุดเดียว
module.exports = function stripPasswords(req, res, next) {
    const json = res.json.bind(res)
    res.json = (body) => json(strip(body))
    next()
}
