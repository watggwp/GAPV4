# วิธี Setup LINE OA + ngrok สำหรับทดสอบ

## สิ่งที่ต้องเตรียม

- บัญชี [LINE Developers](https://developers.line.biz) (ฟรี)
- บัญชี [ngrok](https://ngrok.com) (ฟรี)
- Node.js ติดตั้งแล้ว
- MySQL รันอยู่และ import database แล้ว

---

## ขั้นตอนที่ 1 — สร้าง LINE OA และ Messaging API

1. เข้า [LINE Developers Console](https://developers.line.biz/console)
2. กด **Create a Provider** → ตั้งชื่อ เช่น `GAP Project`
3. กด **Create a channel** → เลือก **Messaging API**
4. กรอกข้อมูล:
   - Channel name: `GAP`
   - Channel description: อะไรก็ได้
   - Category / Subcategory: เลือกตามต้องการ
5. กด **Create**

### เก็บค่าต่อไปนี้

เข้า Channel ที่สร้าง → แท็บ **Basic settings**:
- **Channel secret** → copy เก็บไว้

เข้าแท็บ **Messaging API**:
- **Channel access token** → กด **Issue** → copy เก็บไว้

---

## ขั้นตอนที่ 2 — สร้าง LIFF App (6 ตัว)

ใน Channel เดิม → แท็บ **LIFF** → กด **Add**

สร้างทีละตัวตามตารางนี้ (ใส่ URL ชั่วคราวก่อน จะเปลี่ยนทีหลังตอนได้ ngrok URL):

| ชื่อ LIFF | Size | Endpoint URL (ชั่วคราว) |
|---|---|---|
| GAP-Signup | Full | `https://example.com/farmer/signup` |
| GAP-House | Full | `https://example.com/farmer/house` |
| GAP-HouseList | Full | `https://example.com/farmer/houses` |
| GAP-Form | Full | `https://example.com/farmer/form` |
| GAP-WeatherStation | Full | `https://example.com/farmer/weather-station` |
| GAP-Doctor | Full | `https://example.com/doctor` |

หลังสร้างแต่ละตัว → เก็บ **LIFF ID** (รูปแบบ `xxxxxxxxxx-xxxxxxxx`)

---

## ขั้นตอนที่ 3 — สร้าง Rich Menu

### 3.1 สร้าง Rich Menu ใน LINE Developers Console

เข้า Channel → แท็บ **Messaging API** → เลื่อนลงหา **Rich menu** → กด **Create**

**Rich Menu ที่ 1 — Login (สำหรับคนที่ยังไม่ได้สมัคร)**
- ตั้งชื่อ: `GAP-Login`
- Chat bar text: `เข้าสู่ระบบ`
- Template: เลือกแบบ 2 ช่อง
- Area 1 → Action: URI → URL: `https://liff.line.me/<LIFF ID ของ GAP-Signup>`
- Area 2 → Action: URI → URL: `https://liff.line.me/<LIFF ID ของ GAP-Doctor>`
- อัปโหลดรูป: `API/assets/GAPV4.png`
- กด **Save** → เก็บ **Rich Menu ID** (รูปแบบ `richmenu-xxxxxxxx`)
- กด **Set as default**

**Rich Menu ที่ 2 — Farmer (สำหรับคนที่สมัครแล้ว)**
- ตั้งชื่อ: `GAP-Farmer`
- Chat bar text: `เมนูเกษตรกร`
- Area 1 → Action: Postback → Data: `house_add`
- อัปโหลดรูป: `API/assets/farmer-menuV4-small.png`
- กด **Save** → เก็บ **Rich Menu ID**

### 3.2 หรือสร้างผ่าน Script

```bash
# แก้ LIFF URL ใน API/api_line_gap.js ให้ตรงก่อน แล้วรัน
node API/api_line_gap.js
```

---

## ขั้นตอนที่ 4 — ตั้งค่า ngrok

### 4.1 สมัครและเอา Authtoken

1. ไปที่ [ngrok.com](https://ngrok.com) → Sign up
2. เข้า Dashboard → **Your Authtoken** → copy

### 4.2 ใส่ค่าใน .env

เปิดไฟล์ `.env` แล้วแก้ค่า:

```env
NGROK_AUTHTOKEN=ใส่ token ที่ copy มา
```

---

## ขั้นตอนที่ 5 — ตั้งค่าไฟล์ .env ให้ครบ

```env
# Database
HOST_DB=localhost
DATABASE_DEV=ชื่อ database
USER_DBDEV=username mysql
PASSWORD_DBDEV=password mysql

# Session
KEY_SESSION=สร้างรหัสอะไรก็ได้ เช่น gap_secret_2024
cookie=gap_session

# LINE Messaging API
channelAccessToken=ใส่ Channel Access Token จากขั้นตอนที่ 1
channelSecret=ใส่ Channel Secret จากขั้นตอนที่ 1

# Rich Menu IDs จากขั้นตอนที่ 3
RICH_SIGN=richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RICH_HOUSE=richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# LIFF IDs จากขั้นตอนที่ 2
REACT_APP_LINE_SIGNUP=xxxxxxxxxx-xxxxxxxx
REACT_APP_LINE_HOUSE=xxxxxxxxxx-xxxxxxxx
REACT_APP_LINE_HOUSELIST=xxxxxxxxxx-xxxxxxxx
REACT_APP_LINE_FORM=xxxxxxxxxx-xxxxxxxx
REACT_APP_LINE_GAP=xxxxxxxxxx-xxxxxxxx
REACT_APP_LIFF_DOCTOR=xxxxxxxxxx-xxxxxxxx
REACT_APP_WEATHER_STATION=xxxxxxxxxx-xxxxxxxx

# Server ports
REACT_APP_API_PORT=3001
ADMIN_PORT=3002
DOCTOR_PORT=3003
FARMER_PORT=3004

# ngrok
NGROK_AUTHTOKEN=ใส่ token ที่ได้จาก ngrok

# Build mode
BUILD=deploy
GENERATE_SOURCEMAP=false
```

---

## ขั้นตอนที่ 6 — Build Frontend

```bash
npm install
npm run build
```

รอจนเสร็จ จะได้โฟลเดอร์ `build/admin`, `build/doctor`, `build/farmer`

---

## ขั้นตอนที่ 7 — รัน Server และ ngrok

เปิด **Terminal 1** — รัน server:

```bash
npm run server-dev
```

เห็น `Start on port 3001 !!!` แสดงว่าพร้อมแล้ว

เปิด **Terminal 2** — รัน ngrok:

```bash
npm run server-ngrok
```

จะเห็น URL แบบนี้:

```
url admin :  https://aaaa-xx-xx.ngrok-free.app
url doctor : https://bbbb-xx-xx.ngrok-free.app
url farmer : https://cccc-xx-xx.ngrok-free.app
url api :    https://dddd-xx-xx.ngrok-free.app
```

เก็บ **url farmer** และ **url api** ไว้ใช้ขั้นตอนถัดไป

---

## ขั้นตอนที่ 8 — อัปเดต LIFF Endpoint URL

กลับไปที่ LINE Developers Console → แท็บ **LIFF** → แก้ Endpoint URL แต่ละตัว:

| LIFF | Endpoint URL ใหม่ |
|---|---|
| GAP-Signup | `https://cccc-xx-xx.ngrok-free.app/farmer/signup` |
| GAP-House | `https://cccc-xx-xx.ngrok-free.app/farmer/house` |
| GAP-HouseList | `https://cccc-xx-xx.ngrok-free.app/farmer/houses` |
| GAP-Form | `https://cccc-xx-xx.ngrok-free.app/farmer/form` |
| GAP-WeatherStation | `https://cccc-xx-xx.ngrok-free.app/farmer/weather-station` |
| GAP-Doctor | `https://cccc-xx-xx.ngrok-free.app/doctor` |

---

## ขั้นตอนที่ 9 — ตั้งค่า Webhook

LINE Developers Console → แท็บ **Messaging API**:

1. **Webhook URL**: `https://dddd-xx-xx.ngrok-free.app/messageAPI`
2. กด **Verify** → ต้องได้ `Success`
3. เปิด **Use webhook: ON**
4. ปิด **Auto-reply messages: OFF**
5. ปิด **Greeting messages: OFF** (ถ้าต้องการ)

---

## ขั้นตอนที่ 10 — อัปเดต .env และ Restart

เปิด `.env` แก้ค่าให้ตรงกับ ngrok URL ที่ได้:

```env
URL_SERVER=https://dddd-xx-xx.ngrok-free.app
REACT_APP_API_PUBLIC=dddd-xx-xx.ngrok-free.app
```

แล้ว restart server (Terminal 1):

```bash
# กด Ctrl+C แล้วรันใหม่
npm run server-dev
```

---

## ทดสอบ

1. เปิด LINE → ค้นหา LINE OA ที่สร้าง → Add friend
2. จะเห็น Rich Menu ด้านล่าง (Login menu)
3. กด "สมัคร" → จะเปิดหน้า LIFF signup
4. กรอกข้อมูลและสมัคร → Rich Menu จะเปลี่ยนเป็น Farmer menu
5. ส่งข้อความใน LINE OA → เช็ค server log ว่า `/messageAPI` ถูกเรียก

---

## ข้อควรระวัง

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| LIFF ไม่เปิด | Endpoint URL ผิด หรือ server ยังไม่รัน | ตรวจสอบ URL และ server log |
| Webhook Verify ไม่ผ่าน | Server ยังไม่รัน หรือ URL ผิด | ตรวจสอบ `/messageAPI` ใน server |
| URL เปลี่ยนทุกครั้ง | ngrok free plan ไม่ให้ fixed domain | ต้องอัปเดต LIFF + Webhook ทุกครั้งที่รัน ngrok ใหม่ |
| Session หาย | CORS หรือ cookie ผิด | ตรวจสอบ `origins` ใน `server/configExpress.js` |

---

## ทุกครั้งที่เริ่มทดสอบใหม่

```bash
# Terminal 1
npm run server-dev

# Terminal 2
npm run server-ngrok
# → เอา URL ใหม่ไปอัปเดต LIFF + Webhook + .env ทุกครั้ง
```