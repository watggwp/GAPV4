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

export const notifyPath = ({ type, ref_id }) => {
    const build = NOTIFY_PATH[type]
    return build && ref_id && ref_id !== "0" ? build(encodeURIComponent(ref_id)) : null
}

// เปลี่ยนหน้าในเว็บหมอ (Doctor.js ฟัง popstate แล้วเลือกหน้าตาม path)
export const openDoctorPath = (path) => {
    window.history.pushState({}, "", `${env.subpath_server}${path}`)
    window.dispatchEvent(new PopStateEvent("popstate"))
}
