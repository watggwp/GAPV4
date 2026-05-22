# CLAUDE.md — GAP v4 Project Guidelines

## โครงสร้างโปรเจกต์

ระบบบริหารจัดการเกษตรอินทรีย์ (GAP) แบ่งเป็น 3 Role ที่แยก React app กัน:

```
app/src/web/
  admin/    → ระบบผู้ดูแล
  doctor/   → ระบบเจ้าหน้าที่
  farmer/   → ระบบเกษตรกร (Line LIFF)

server/     → Express backend (shared)
```

**Tech Stack:** React 18 · SCSS (Sass) · MUI v7 · React-Bootstrap · Express · MySQL2 · Socket.io · MQTT · PM2

---

## Commands

```bash
# Dev frontend
npm run server-admin     # admin on port dev
npm run server-doctor    # doctor on port dev
npm run server-farmer    # farmer on port dev

# Backend
npm run server-dev       # nodemon (hot reload)
npm run server           # pm2 production

# Build
npm run build            # build all 3 apps
```

---

## React — กฎที่ต้องรู้

### ❌ อย่าใช้ 0/1 กับ boolean state

```js
// ❌ BUG: React render เลข 0 ออกมาใน DOM
setStateEdit(0)
{StateEdit && <div>...</div>}   // → renders "0"

// ✅ ถูก
setStateEdit(false)
{StateEdit && <div>...</div>}   // → renders nothing
```

> **กฎ:** State ที่ใช้ toggle ต้องเป็น `true`/`false` เสมอ ห้ามใช้ `1`/`0`

### ❌ อย่า conditional render ด้วย falsy number

```js
// ❌ BUG: ถ้า count = 0 จะ render "0"
{count && <Component />}

// ✅ ถูก
{count > 0 && <Component />}
{!!count && <Component />}
```

---

## API Pattern — clientMo

`clientMo` อยู่ที่ `app/src/assets/js/moduleClient.js` — return เป็น **plain string** เสมอ ต้อง `JSON.parse()` เอง

```js
// ✅ Pattern มาตรฐาน
const result = await clientMo.post("/api/doctor/data/edit", payload)
try {
    const data = JSON.parse(result)
    if (data.result === "pass") { /* success */ }
    else if (data.result === "over") { /* conflict/duplicate */ }
    else if (data.result === "password") { /* wrong password */ }
    else session()  // session หมดอายุ → redirect logout
} catch (e) {
    session()  // parse error → treat as session expired
}
```

### Response Codes ที่ใช้ในระบบ

| Code | ความหมาย |
|------|-----------|
| `"113"` | สำเร็จ (ใช้ใน change status) |
| `"pass"` | สำเร็จ (ใน JSON result) |
| `"over"` | ข้อมูลซ้ำ / conflict |
| `"password"` | รหัสผ่านไม่ถูกต้อง |
| `"error"` | error ที่ไม่ต้อง logout |
| `""` | network error หรือ session หมด |

### API Endpoints Pattern

```
/api/doctor/data/edit      → แก้ไขข้อมูล
/api/doctor/data/change    → เปลี่ยน status (is_use)
/api/doctor/data/delete    → ลบข้อมูล
/api/doctor/data/history   → ดูประวัติ
```

---

## SCSS Conventions

### Fonts

```scss
font-family: Sans-font;   // ฟอนต์ไทย หัวข้อ/ปุ่ม
font-family: main-font;   // ฟอนต์ตัวเลข/อังกฤษ
```

### Color Palette

```scss
$teal:         #22C7A9;       // primary
$teal-dark:    #176f3f;       // dark / text
$teal-mid:     #149e7a;       // gradient end
$teal-trans:   #22c7a98b;     // semi-transparent border
$teal-input:   #22c7a9c4;     // input background (edit mode)
$teal-light:   #edf9f7;       // input background (view mode)
$red-action:   rgb(211, 98, 98);  // danger buttons
```

### Class Naming Pattern

```scss
.manage-data-popup    // popup container
.head-form           // header ของ popup
.head-title-row      // แถว title + action buttons
.icon-btn            // base class สำหรับ icon buttons
  .icon-btn.edit     // ปุ่มแก้ไข (ซ้าย)
  .icon-btn.history  // ปุ่มประวัติ (ขวา)
  .icon-btn.delete   // ปุ่มลบ (ขวา)
.bt-manage           // footer ยืนยัน/ยกเลิก
.bt-delete-confirm   // modifier สำหรับ delete flow
```

### Icon Buttons — ใช้ inline SVG เสมอ

```jsx
<button className="icon-btn edit" title="แก้ไข">
    <svg viewBox="0 0 24 24"><path d="..."/></svg>
</button>
```
- ไม่ใช้ icon library — ใช้ Material Design SVG paths ตรงๆ
- ทุก icon button ต้องมี `title` attribute สำหรับ tooltip

---

## Popup Pattern (ManageData)

### State Machine

```
idle  →[กดแก้ไข]→  StateEdit=true  →[ยืนยัน/ยกเลิก]→  StateEdit=false
      →[กดลบ]→    StateDelete=true →[ยืนยัน/ยกเลิก]→  StateDelete=false
```

### Password Confirmation — กฎสำหรับ destructive action

ทุก action ที่แก้ไข/ลบข้อมูลต้องขอ password เสมอ:
- `bt-manage` → edit flow (password + ยืนยัน/ยกเลิก)
- `bt-manage bt-delete-confirm` → delete flow (warning + password + ยืนยันลบ/ยกเลิก)

---

## Backend — Express Patterns

### Session Keys

```js
req.session.role_primary    // "admin" | undefined
req.session.role_doctor     // doctor role
req.session.uid_line        // farmer (Line)
req.session.profile         // injected by Authorizer middleware
```

### Route Organization

```
server/
  apiAdmin.js     → /api/admin/*
  apiDoctor.js    → /api/doctor/*
  apiFarmer.js    → /api/farmer/*
  routerApi.js    → รวม routes + apply middleware
```

### Authorizer Middleware

ทุก API route ที่ต้อง auth ต้องผ่าน `Authorizer(connectionPool)` ก่อน — middleware จะ verify session และ inject `req.session.profile`

---

## ข้อผิดพลาดที่เคยเจอ (Known Pitfalls)

1. **`0` render ใน JSX** → ใช้ `false` แทน `0` สำหรับ boolean state ทุกครั้ง
2. **`clientMo` return `""`** → ต้องครอบ `try/catch` รอบ `JSON.parse` และเรียก `session()` เมื่อ parse ล้มเหลว
3. **Status toggle translateX** → `.status-frame` กว้าง 60px, content 92px (36+20+36), `translateX(-35px)` สำหรับ status=0 — อย่าเปลี่ยน span width โดยไม่คำนวณ translateX ใหม่
4. **SCSS ของ admin/doctor แยกกัน** — `PageGroup.scss` ของ doctor มี font-size ใหญ่กว่า (รองรับผู้สูงอายุ) อย่าใช้ร่วมกัน
5. **`overflow: hidden` บน popup** → จะซ่อน `.close` button ที่ `bottom: 100%` — ห้ามใส่ `overflow: hidden` บน `.manage-data-popup` โดยตรง

---

## File Structure ที่สำคัญ

```
app/src/
  assets/js/moduleClient.js     → HTTP client (clientMo)
  assets/js/module.js           → shared utilities (MapsJSX, GetLinkUrlOfSearch...)
  web/doctor/src/
    page/data/ManageData.js     → popup จัดการข้อมูล (plant/pest/fertilizer/chemical/source)
    page/data/DataHistoryModal.js → modal ประวัติการแก้ไข
    page/group/PageGroup.js     → หน้าจัดการกลุ่ม
    assets/style/page/data/ManageData.scss
    assets/style/page/PageGroup.scss
    assets/style/page/GroupHistory.scss
```
