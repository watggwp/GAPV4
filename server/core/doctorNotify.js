'use strict';

require('dotenv').config()

// ประเภทการแจ้งเตือนหมอพืช (notify_doctor.type) และหน้าที่ต้องเปิดเมื่อกดการแจ้งเตือน
// ref_id เก็บรหัสที่ใช้เปิดหน้า: id_table ของเกษตรกร หรือ id ของแบบบันทึก (formplant)
// ต้องตรงกับ app/src/web/doctor/src/notifyTarget.js ฝั่งหน้าเว็บ
const NOTIFY_TYPE = {
    GENERAL: 0,
    MISMATCH: 1,          // ข้อมูลการปลูกไม่ตรงตามแผน (cron)
    UNRECORDED: 2,        // ยังไม่บันทึกข้อมูลตามแผน (cron)
    FARMER_REGISTER: 3,   // เกษตรกรสมัครใหม่ รอตรวจสอบ
    FORM_NEW: 4,          // เพิ่มแบบบันทึก (ใบ GAP)
    FORM_EDIT: 5,         // แก้ไขแบบบันทึก
    FERTILIZER: 6,        // เพิ่ม/แก้ไขปัจจัยการผลิต
    CHEMICAL: 7,          // เพิ่ม/แก้ไขสารเคมี
}

// path ในเว็บหมอ (ไม่รวม subpath) หรือ null ถ้าการแจ้งเตือนนี้ไม่มีหน้าให้เปิด
function targetPath(type, refId) {
    if (refId === null || refId === undefined || refId === "" || refId === "0") return null
    const ref = encodeURIComponent(String(refId))
    switch (Number(type)) {
        case NOTIFY_TYPE.FARMER_REGISTER: return `/doctor/farmer/wt?farmer=${ref}`
        case NOTIFY_TYPE.MISMATCH:
        case NOTIFY_TYPE.UNRECORDED:
        case NOTIFY_TYPE.FORM_NEW:
        case NOTIFY_TYPE.FORM_EDIT: return `/doctor/form?id_form=${ref}`
        case NOTIFY_TYPE.FERTILIZER: return `/doctor/form?id_form=${ref}&tab=fertilizer`
        case NOTIFY_TYPE.CHEMICAL: return `/doctor/form?id_form=${ref}&tab=chemical`
        default: return null
    }
}

// ลิงก์ที่ใส่ในข้อความ LINE: เปิดผ่าน LIFF ของหมอเพื่อให้เข้าระบบด้วยบัญชี LINE ได้ทันที
// (LIFF endpoint ของหมอคือ <web>/doctor ดังนั้น /doctor/form?x -> https://liff.line.me/<id>/form?x)
// ถ้าไม่ได้ตั้ง REACT_APP_LIFF_DOCTOR จะใช้ลิงก์เว็บปกติ (ต้อง login ด้วยรหัสผ่าน)
function lineUrl(path) {
    const liffId = (process.env.REACT_APP_LIFF_DOCTOR || "").trim()
    if (liffId) return `https://liff.line.me/${liffId}${path.replace(/^\/doctor/, "")}`
    const web = (process.env.URL_DOCTOR || "https://doctor.gapv4.online").replace(/\/$/, "")
    return `${web}${path}`
}

// ข้อความ LINE ของการแจ้งเตือน: มีปุ่ม "เปิดดู" เมื่อมีหน้าให้เปิด ไม่งั้นเป็นข้อความธรรมดาแบบเดิม
function lineMessage(text, type, refId) {
    const path = targetPath(type, refId)
    if (!path) return { type: "text", text: text }
    return {
        type: "flex",
        altText: text.slice(0, 390),
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                contents: [
                    { type: "text", text: "แจ้งเตือนหมอพืช", weight: "bold", size: "sm", color: "#189D85" },
                    { type: "text", text: text, wrap: true, size: "md", color: "#333333" },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [{
                    type: "button",
                    style: "primary",
                    color: "#189D85",
                    height: "sm",
                    action: { type: "uri", label: "เปิดดู", uri: lineUrl(path) },
                }],
            },
        },
    }
}

module.exports = { NOTIFY_TYPE, targetPath, lineUrl, lineMessage }
