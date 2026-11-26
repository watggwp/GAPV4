// จำบทบาทล่าสุดที่หมอ login ด้วยรหัสผ่าน ไว้ใช้ตอนเข้าผ่านปุ่มแจ้งเตือนใน LINE (ไม่ต้องกรอกรหัสผ่าน)
// server ตรวจอีกครั้งว่าบัญชีมีบทบาทนั้นจริง ค่านี้จึงเป็นแค่ "บทบาทที่อยากได้"
const LAST_ROLE_KEY = "doctor_last_role"

export const saveLastRole = (role) => {
    try { localStorage.setItem(LAST_ROLE_KEY, role || "") } catch (e) { }
}

export const loadLastRole = () => {
    try { return localStorage.getItem(LAST_ROLE_KEY) || "" } catch (e) { return "" }
}
