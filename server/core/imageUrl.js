'use strict';

require('dotenv').config().parsed
const crypto = require('crypto')

// ลิงก์รูปเกษตรกร/โรงเรือนต้องเปิดได้โดยไม่ login (LINE เป็นคนดึงรูปไปแสดงในข้อความ)
// จึงแนบลายเซ็น sig ไว้ในลิงก์แทน ไล่เปลี่ยนเลข id เพื่อดูรูปคนอื่นไม่ได้
// เปลี่ยน IMAGE_URL_SECRET (หรือ KEY_SESSION ถ้าไม่ได้ตั้ง) แล้วลิงก์รูปในข้อความเก่าจะใช้ไม่ได้

const secret = () => process.env.IMAGE_URL_SECRET || process.env.KEY_SESSION || "gap_project_royal"

function sign(kind, id) {
    return crypto.createHmac("sha256", secret()).update(`${kind}:${id}`).digest("hex").slice(0, 32)
}

function verify(kind, id, sig) {
    if (typeof sig !== "string" || id === undefined || id === null || id === "") return false
    const expected = Buffer.from(sign(kind, id))
    const given = Buffer.from(sig)
    return expected.length === given.length && crypto.timingSafeEqual(expected, given)
}

const farmerImageUrl = (baseUrl, idTable) =>
    `${baseUrl}/image/farmer/${encodeURIComponent(idTable)}?sig=${sign("farmer", idTable)}`

// extraQuery เช่น "&v=123&ext=.jpg" (ต่อท้ายเพื่อให้ ext ยังอยู่ท้ายลิงก์)
const houseImageUrl = (baseUrl, greenhouseId, extraQuery = "") =>
    `${baseUrl}/image/house?imagefarm=${encodeURIComponent(greenhouseId)}&sig=${sign("house", greenhouseId)}${extraQuery}`

module.exports = { sign, verify, farmerImageUrl, houseImageUrl }
