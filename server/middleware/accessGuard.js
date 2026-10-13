'use strict';

require('dotenv').config().parsed
const crypto = require('crypto')

// ตรวจว่ามี session ของ role ที่อนุญาตหรือไม่ (session เกิดจากการ login สำเร็จเท่านั้น)
const sessionRoles = {
    admin: (session) => Boolean(session.user_username),
    doctor: (session) => Boolean(session.user_doctor),
    farmer: (session) => Boolean(session.uidFarmer)
}

function requireRole(...roles) {
    return (req, res, next) => {
        const session = req.session || {}
        if (roles.some((role) => sessionRoles[role] && sessionRoles[role](session))) return next()
        return res.status(401).send("error auth")
    }
}

const loopbackAddresses = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"])

function safeEqual(a, b) {
    const bufA = Buffer.from(String(a))
    const bufB = Buffer.from(String(b))
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

// สำหรับ API ที่ระบบภายในเรียก (MQTT bridge, gap-device-dashboard)
// ผ่านได้เมื่อส่ง header x-internal-api-key ตรงกับ INTERNAL_API_KEY
// หรือเรียกตรงจากเครื่องเดียวกัน (loopback) โดยไม่ผ่าน proxy/ngrok
function internalOnly(req, res, next) {
    const expectedKey = process.env.INTERNAL_API_KEY
    const givenKey = req.get("x-internal-api-key")
    if (expectedKey && givenKey && safeEqual(givenKey, expectedKey)) return next()

    const viaProxy = req.get("x-forwarded-for") || req.get("x-forwarded-proto") || req.get("forwarded")
    if (!viaProxy && loopbackAddresses.has(req.socket.remoteAddress)) return next()

    return res.status(401).json({ error: "unauthorized" })
}

module.exports = { requireRole, internalOnly }
