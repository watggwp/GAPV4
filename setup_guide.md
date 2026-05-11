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

## 🤖 Setup LINE OA + ngrok (สำหรับทดสอบ LIFF)

> ใช้สำหรับทดสอบฟีเจอร์ LINE บนเครื่อง local โดยไม่ต้องซื้อโดเมน

### ภาพรวมระบบ LINE ในโปรเจคนี้

```
LINE OA
├── Messaging API  → รับ-ส่งข้อความ, Webhook (/messageAPI)
├── LIFF           → เว็บแอปเกษตรกรที่รันใน LINE
└── Rich Menu      → เมนูด้านล่างใน LINE chat
```

---

### ขั้นตอนที่ 1 — สร้าง LINE OA และเปิด Messaging API

1. ไปที่ https://developers.line.biz → Login ด้วย LINE account
2. กด **Create a Provider** (ถ้ายังไม่มี)
3. กด **Create a new channel** → เลือก **Messaging API**
4. กรอกข้อมูล → Create
5. เข้า tab **Messaging API** → เก็บค่า 2 อย่าง:
   - **Channel Secret** (อยู่ที่ tab Basic settings)
   - **Channel Access Token** → กด **Issue**

---

### ขั้นตอนที่ 2 — สร้าง LIFF App (7 ตัว)

เข้า LINE Developers Console → Channel เดียวกัน → tab **LIFF** → กด **Add**

สร้างทีละตัวตามนี้ (Size เลือก **Full** ทุกตัว, เปิด **BLE** ปิด, **Scan QR** เปิดถ้าต้องการ):

| ชื่อ LIFF | Endpoint URL (ใส่ชั่วคราวก่อน แก้ทีหลังตอนมี ngrok URL) |
|---|---|
| GAP-Signup | `https://placeholder.com/farmer/signup` |
| GAP-House | `https://placeholder.com/farmer/house` |
| GAP-HouseList | `https://placeholder.com/farmer/houses` |
| GAP-Form | `https://placeholder.com/farmer/form` |
| GAP-Gap | `https://placeholder.com/farmer/gap` |
| GAP-Doctor | `https://placeholder.com/doctor` |
| GAP-WeatherStation | `https://placeholder.com/farmer/weather-station` |

หลังสร้างแล้วแต่ละตัวจะได้ **LIFF ID** รูปแบบ `xxxxxxxxxx-xxxxxxxx`

---

### ขั้นตอนที่ 3 — สร้าง Rich Menu (ใน LINE Developers Console)

เข้า tab **Rich menu** → **Create a rich menu** (สร้าง 2 อัน):

**Rich Menu 1: สำหรับคนที่ยังไม่ล็อกอิน (`RICH_SIGN`)**
- ใส่ภาพจากไฟล์ `API/assets/GAPV4.png`
- Area ซ้าย → Action: URI → `https://liff.line.me/<LIFF ID ของ GAP-Signup>`
- Area ขวา → Action: URI → `https://liff.line.me/<LIFF ID ของ GAP-Doctor>`
- ตั้งเป็น Default Rich Menu

**Rich Menu 2: สำหรับเกษตรกรที่ล็อกอินแล้ว (`RICH_HOUSE`)**
- ใส่ภาพจากไฟล์ `API/assets/farmer-menuV4-small.png`
- Area → Action: Postback → data: `house_add:`

เก็บ **Rich Menu ID** ของทั้งสองอัน (รูปแบบ `richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

---

### ขั้นตอนที่ 4 — ใส่ค่าใน `.env`

เปิดไฟล์ `.env` แล้วแก้ค่าเหล่านี้:

```env
# Messaging API (จาก LINE Developers Console)
channelAccessToken = <Channel Access Token>
channelSecret = <Channel Secret>

# Rich Menu IDs
RICH_SIGN = richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RICH_HOUSE = richmenu-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

# LIFF IDs (จากขั้นตอนที่ 2)
REACT_APP_LINE_SIGNUP = xxxxxxxxxx-xxxxxxxx
REACT_APP_LINE_HOUSE = xxxxxxxxxx-xxxxxxxx
REACT_APP_LINE_HOUSELIST = xxxxxxxxxx-xxxxxxxx
REACT_APP_LINE_FORM = xxxxxxxxxx-xxxxxxxx
REACT_APP_LINE_GAP = xxxxxxxxxx-xxxxxxxx
REACT_APP_LIFF_DOCTOR = xxxxxxxxxx-xxxxxxxx
REACT_APP_WEATHER_STATION = xxxxxxxxxx-xxxxxxxx

# Ngrok Authtoken (จากขั้นตอนถัดไป)
NGROK_AUTHTOKEN = <Authtoken จาก ngrok.com>
```

---

### ขั้นตอนที่ 5 — สมัคร ngrok และเอา Authtoken

1. ไปที่ https://ngrok.com → Sign up (ฟรี)
2. Login → Dashboard → **Your Authtoken** → Copy
3. ใส่ค่าใน `.env`:
   ```env
   NGROK_AUTHTOKEN = 2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

### ขั้นตอนที่ 6 — Build Frontend

```powershell
cd "d:\งาน\GAPV4-main"
npm run build
```

> จะได้โฟลเดอร์ `build/admin`, `build/doctor`, `build/farmer`

---

### ขั้นตอนที่ 7 — รัน Server และ ngrok

เปิด **PowerShell 2 หน้าต่าง**:

**หน้าต่างที่ 1 — Start Backend**
```powershell
cd "d:\งาน\GAPV4-main"
npm run server-dev
```

**หน้าต่างที่ 2 — Start ngrok**
```powershell
cd "d:\งาน\GAPV4-main"
npm run server-ngrok
```

จะเห็น output:
```
url admin :  https://xxxx-xx-xx-xx.ngrok-free.app
url doctor : https://yyyy-xx-xx-xx.ngrok-free.app
url farmer : https://zzzz-xx-xx-xx.ngrok-free.app
url api :    https://aaaa-xx-xx-xx.ngrok-free.app
```

---

### ขั้นตอนที่ 8 — อัปเดต URL ใน LINE Developers Console

#### 8.1 อัปเดต Webhook URL
เข้า tab **Messaging API** → Webhook URL:
```
https://aaaa-xx-xx-xx.ngrok-free.app/messageAPI
```
กด **Verify** → ต้องได้ `200 OK` → เปิด **Use webhook: ON**

#### 8.2 อัปเดต LIFF Endpoint URL
เข้า tab **LIFF** → แก้ Endpoint URL ของแต่ละตัว:

| LIFF | Endpoint URL |
|---|---|
| GAP-Signup | `https://zzzz-xx-xx-xx.ngrok-free.app/farmer/signup` |
| GAP-House | `https://zzzz-xx-xx-xx.ngrok-free.app/farmer/house` |
| GAP-HouseList | `https://zzzz-xx-xx-xx.ngrok-free.app/farmer/houses` |
| GAP-Form | `https://zzzz-xx-xx-xx.ngrok-free.app/farmer/form` |
| GAP-Gap | `https://zzzz-xx-xx-xx.ngrok-free.app/farmer/gap` |
| GAP-Doctor | `https://yyyy-xx-xx-xx.ngrok-free.app/doctor` |
| GAP-WeatherStation | `https://zzzz-xx-xx-xx.ngrok-free.app/farmer/weather-station` |

---

### ขั้นตอนที่ 9 — อัปเดต `.env` ให้ตรงกับ ngrok URL

```env
URL_SERVER = https://aaaa-xx-xx-xx.ngrok-free.app
REACT_APP_API_PUBLIC = aaaa-xx-xx-xx.ngrok-free.app
```

แล้ว restart server (Ctrl+C แล้วรัน `npm run server-dev` ใหม่)

---

### URL สรุป (ทดสอบ LINE)

| ส่วน | URL |
|---|---|
| Webhook LINE | `https://aaaa-xx-xx-xx.ngrok-free.app/messageAPI` |
| หน้า Admin | `https://xxxx-xx-xx-xx.ngrok-free.app/admin` |
| หน้า Doctor | `https://yyyy-xx-xx-xx.ngrok-free.app/doctor` |
| หน้า Farmer | `https://zzzz-xx-xx-xx.ngrok-free.app/farmer/signup` |

---

### ⚠️ ข้อควรระวัง

| ปัญหา | วิธีแก้ |
|---|---|
| URL เปลี่ยนทุกครั้งที่รัน ngrok ใหม่ | ต้องอัปเดต Webhook + LIFF + `.env` ทุกรอบ |
| LIFF แสดง error "Not in LINE app" | ทดสอบผ่าน LINE app บนมือถือเท่านั้น |
| Webhook Verify ไม่ผ่าน | ตรวจสอบว่า server-dev รันอยู่ และ URL ถูกต้อง |
| Cookie/Session หาย | ตรวจสอบว่า `trust proxy` เปิดอยู่ใน configExpress.js (เปิดอยู่แล้ว) |

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
