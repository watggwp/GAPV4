'use strict';

// เปลี่ยน session ID ตอนเข้าสู่ระบบ (กัน session fixation: คนร้ายฝัง session ID ไว้ก่อน แล้วรอให้เหยื่อ login)
// - เปลี่ยนเฉพาะเมื่อ "ตัวตน" ของบทบาทนั้นเปลี่ยน (login ครั้งแรก หรือเปลี่ยนบัญชี)
//   route เช่น /api/farmer/sign ถูกเรียกทุกครั้งที่เปลี่ยนหน้า ถ้าเปลี่ยน ID ทุกครั้ง request ที่ยิงพร้อมกันจะหลุด
// - ยกข้อมูลเดิมใน session ไปด้วย เพราะ admin / doctor / farmer ใช้ cookie เดียวกัน (api โดเมนเดียว)
//   จะได้ไม่ทำให้บทบาทอื่นที่ login ค้างไว้ใน browser เดียวกันหลุด (เหมือนพฤติกรรมเดิม)
function rotateOnLogin(req, role, identity) {
    return new Promise((resolve, reject) => {
        const session = req.session
        if (!session || typeof session.regenerate !== "function") return resolve()

        const key = String(identity)
        if (session.loginIdentities && session.loginIdentities[role] === key) return resolve()

        const keep = {}
        for (const name of Object.keys(session)) {
            if (name !== "cookie") keep[name] = session[name]
        }

        session.regenerate((err) => {
            if (err) return reject(err)
            Object.assign(req.session, keep)
            req.session.loginIdentities = { ...(keep.loginIdentities || {}), [role]: key }
            resolve()
        })
    })
}

module.exports = { rotateOnLogin }
