# 🚀 คู่มือ Setup โปรเจค GAP (GAPV4)

> โปรเจคนี้เป็น **React + Express.js + MySQL** ประกอบด้วย 3 หน้าเว็บ: Admin, Doctor, Farmer

---

## ✅ สิ่งที่ต้องติดตั้งก่อน (Prerequisites)

| โปรแกรม | เวอร์ชั่นแนะนำ | ดาวน์โหลด |
|--------|-------------|----------|
| **Node.js** | v18 หรือ v20 LTS | https://nodejs.org |
| **MySQL** | v8.0+ | https://dev.mysql.com/downloads/ |
| **MySQL Workbench** (optional) | ล่าสุด | https://dev.mysql.com/downloads/workbench/ |

ตรวจสอบว่าติดตั้งแล้วหรือยัง โดยเปิด PowerShell แล้วพิมพ์:
```powershell
node -v
npm -v
mysql --version
```

---

## 📋 ขั้นตอน Setup (ทำตามลำดับ)

### ขั้นตอนที่ 1 — ติดตั้ง Node Packages

เปิด PowerShell แล้ว `cd` เข้าไปในโฟลเดอร์โปรเจค:
```powershell
cd "d:\งาน\GAPV4-main"
npm install
```

> ⏳ ใช้เวลาสักครู่ (อาจ 3-10 นาที ขึ้นกับ internet)

---

### ขั้นตอนที่ 2 — สร้าง Database และ Import โครงสร้าง

เปิด **MySQL Workbench** หรือใช้ MySQL command line:

#### 2.1 สร้าง Database
```sql
CREATE DATABASE gapv3 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_0900_ai_ci;

USE gapv3;
```

> [!NOTE]
> ชื่อ database เริ่มต้นคือ `gapv3` (สามารถเปลี่ยนได้ใน `.env` ภายหลัง)

#### 2.2 Import โครงสร้างตาราง (Structure)
นำเข้าไฟล์: `SQL/main/Structure Database.sql`

```powershell
# วิธีที่ 1: ใช้ command line
mysql -u root -p gapv3 < "d:\งาน\GAPV4-main\SQL\main\Structure Database.sql"
```

หรือใน MySQL Workbench:
- กด `File → Open SQL Script`
- เลือก `SQL/main/Structure Database.sql`
- กด Execute (⚡)

#### 2.3 Import ข้อมูล (ถ้ามี)
ถ้าต้องการข้อมูลเริ่มต้น ให้ import ไฟล์ `gapv3_data.sql`:
```powershell
mysql -u root -p gapv3 < "d:\งาน\GAPV4-main\gapv3_data.sql"
```

#### 2.4 เพิ่ม Admin User
```sql
INSERT INTO `admin` (username, password, phone, address)
VALUES ('admin', SHA2('your_password_here', 256), '0812345678', POINT(0, 0));
```
> ⚠️ เปลี่ยน `your_password_here` เป็น password ที่ต้องการ

---

### ขั้นตอนที่ 3 — ตั้งค่า Environment (.env)

#### 3.1 แก้ไขไฟล์ `InitEnv/jsonEnv.json`

เปิดไฟล์ `d:\งาน\GAPV4-main\InitEnv\jsonEnv.json` แล้วแก้ค่าเหล่านี้:

```json
{
  "HOST": "localhost",
  "DATABASE_DEV": "gapv3",
  "USER_DBDEV": "root",
  "PASSWORD_DBDEV": "รหัสผ่าน MySQL ของคุณ",
  "REACT_APP_API_LOCAL": "localhost",
  "REACT_APP_API_PORT": "3001",
  "ADMIN_PORT": "3003",
  "DOCTOR_PORT": "3004",
  "FARMER_PORT": "3005"
}
```

> [!IMPORTANT]
> ค่าที่ **ต้องแก้** คือ `PASSWORD_DBDEV` ใส่รหัสผ่าน MySQL ของคุณ
> ถ้า MySQL ไม่มี password ให้ปล่อยว่าง `""`

#### 3.2 Run คำสั่ง init-env เพื่อสร้างไฟล์ .env

```powershell
npm run init-env
```

คำสั่งนี้จะสร้างไฟล์ `.env` ในโฟลเดอร์โปรเจคให้อัตโนมัติ

---

### ขั้นตอนที่ 4 — รันโปรแกรม (Development Mode)

ต้องเปิด **PowerShell หลายหน้าต่าง** พร้อมกัน:

#### หน้าต่างที่ 1 — Start Backend API
```powershell
cd "d:\งาน\GAPV4-main"
npm run server-dev
```
> Backend จะรันที่ `http://localhost:3001`

#### หน้าต่างที่ 2 — Start หน้า Admin
```powershell
cd "d:\งาน\GAPV4-main"
npm run server-admin
```
> Admin จะรันที่ `http://localhost:3003`

#### หน้าต่างที่ 3 — Start หน้า Doctor (ถ้าต้องการ)
```powershell
cd "d:\งาน\GAPV4-main"
npm run server-doctor
```
> Doctor จะรันที่ `http://localhost:3004`

#### หน้าต่างที่ 4 — Start หน้า Farmer (ถ้าต้องการ)
```powershell
cd "d:\งาน\GAPV4-main"
npm run server-farmer
```
> Farmer จะรันที่ `http://localhost:3005`

---

## 🌐 URL สรุป (Development)

| หน้า | URL |
|------|-----|
| Backend API | http://localhost:3001 |
| Admin | http://localhost:3003 |
| Doctor | http://localhost:3004 |
| Farmer | http://localhost:3005 |

---

## ❗ ปัญหาที่พบบ่อย

### ปัญหา: `npm install` ช้าหรือ error
```powershell
# ลองล้าง cache ก่อน
npm cache clean --force
npm install
```

### ปัญหา: MySQL connection refused
- ตรวจสอบว่า MySQL Service รันอยู่
- ไปที่ `Services` (กด Win+R → `services.msc`) → หา MySQL80 → Start

### ปัญหา: Port already in use
```powershell
# ดูว่าอะไรใช้ port 3001 อยู่
netstat -ano | findstr :3001
# ยิง process นั้นทิ้ง (แทน PID ด้วยเลขที่เห็น)
taskkill /PID <PID> /F
```

### ปัญหา: Error `Cannot find module`
```powershell
# ลบ node_modules แล้ว install ใหม่
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📁 โครงสร้างโปรเจค

```
GAPV4-main/
├── server/          ← Backend Express.js API
├── app/             ← Frontend React source
├── SQL/main/        ← ไฟล์ SQL สร้าง database
├── InitEnv/         ← ไฟล์ config สำหรับสร้าง .env
├── scripts/         ← Scripts สำหรับ run React dev server
├── config/          ← Webpack config
└── package.json     ← รายการ packages และ npm scripts
```
