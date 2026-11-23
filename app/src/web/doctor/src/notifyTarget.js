import env from "../../../env";

// หน้าที่ต้องเปิดเมื่อกดการแจ้งเตือนหมอพืช (ต้องตรงกับ server/core/doctorNotify.js)
// type 1, 2 (แผนการปลูก) ยังเปิด popup แผนการปลูกเหมือนเดิม จึงไม่อยู่ในนี้
const NOTIFY_PATH = {
    3: (ref) => `/doctor/farmer/wt?farmer=${ref}`,          // เกษตรกรสมัครใหม่
    4: (ref) => `/doctor/form?id_form=${ref}`,              // เพิ่มแบบบันทึก (ใบ GAP)
    5: (ref) => `/doctor/form?id_form=${ref}`,              // แก้ไขแบบบันทึก
    6: (ref) => `/doctor/form?id_form=${ref}&tab=fertilizer`, // ปัจจัยการผลิต
    7: (ref) => `/doctor/form?id_form=${ref}&tab=chemical`,   // สารเคมี
}

// หน้าตาของแต่ละประเภท (ไอคอน / ชื่อ / สี) ใช้ในรายการแจ้งเตือนและ toast
// สีตรงกับการ์ด LINE ของประเภทเดียวกัน (server/core/messageLineTemplate.js)
const NOTIFY_META = {
    0: { icon: "🔔", label: "แจ้งเตือน", color: "#4FB096" },
    1: { icon: "⚠️", label: "ไม่ตรงตามแผน", color: "#B7950B" },
    2: { icon: "📝", label: "ยังไม่บันทึกตามแผน", color: "#A0620D" },
    3: { icon: "👤", label: "เกษตรกรสมัครใหม่", color: "#2E86C1" },
    4: { icon: "📄", label: "เพิ่มแบบบันทึก", color: "#1B7F5B" },
    5: { icon: "✏️", label: "แก้ไขแบบบันทึก", color: "#6C3483" },
    6: { icon: "🧪", label: "ปัจจัยการผลิต", color: "#5D7A1F" },
    7: { icon: "🛡️", label: "สารเคมี", color: "#0B7A8A" },
}

export const notifyMeta = ({ type }) => NOTIFY_META[type] || NOTIFY_META[0]

export const notifyPath = ({ type, ref_id }) => {
    const build = NOTIFY_PATH[type]
    return build && ref_id && ref_id !== "0" ? build(encodeURIComponent(ref_id)) : null
}

// เปลี่ยนหน้าในเว็บหมอ (Doctor.js ฟัง popstate แล้วเลือกหน้าตาม path)
export const openDoctorPath = (path) => {
    window.history.pushState({}, "", `${env.subpath_server}${path}`)
    window.dispatchEvent(new PopStateEvent("popstate"))
}
