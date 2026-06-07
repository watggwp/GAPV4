# CLAUDE.md — AI Agent Project Guide for GAPV4

> **อ่านไฟล์นี้ก่อนเริ่มทำงานทุกครั้ง** เพื่อเข้าใจบริบทของโปรเจค หลีกเลี่ยง pattern ที่ผิด และทำงานได้อย่างมีประสิทธิภาพ

---

## 🎯 โปรเจคคืออะไร

**GAPV4** (Good Agricultural Practices Version 4) คือระบบ **Web Application แบบ Monorepo** สำหรับจัดการมาตรฐานการเกษตรที่ดี (GAP) ภายใต้โครงการหลวง โดยครอบคลุม:

- **การจัดการโรงเรือนเกษตร** — ข้อมูลโรงเรือน, พืชที่ปลูก, ปัจจัยการผลิต (ปุ๋ย/สารเคมี)
- **ระบบแบบฟอร์ม GAP** — กรอก-ตรวจ-อนุมัติแบบฟอร์มมาตรฐาน GAP
- **ระบบ IoT** — เซ็นเซอร์วัดสภาพอากาศ, EC/pH, ควบคุมปั๊มน้ำ ผ่าน MQTT
- **แชทบอท LINE OA** — แจ้งเตือน, ส่งแผนปลูก, ควบคุมผ่าน Rich Menu
- **Dashboard & Report** — สรุปข้อมูล, ส่งออก PDF/Excel

### กลุ่มผู้ใช้ 3 กลุ่ม
| กลุ่ม | คำอธิบาย | Frontend Path |
|-------|----------|---------------|
| **Admin** | ผู้ดูแลระบบ — จัดการหมอพืช, ดูข้อมูลรวม | `app/src/web/admin/` |
| **Doctor** | หมอพืช/นักวิเคราะห์ — ตรวจแบบฟอร์ม, ให้คำปรึกษา | `app/src/web/doctor/` |
| **Farmer** | เกษตรกร — กรอกข้อมูล, ดูผล, ใช้ผ่าน LINE LIFF | `app/src/web/farmer/` |

---

## 🏗 สถาปัตยกรรม (Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                        LINE Platform                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────────┐ │
│  │ Rich Menu│  │ LIFF Apps│  │ Messaging API (Webhook)    │ │
│  └──────────┘  └──────────┘  └────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Express.js Backend                         │
│  Port: 3001 (dev) / 8080 (docker)                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────────┐  │
│  │apiAdmin │ │apiDoctor│ │apiFarmer│ │apiMessaging      │  │
│  └─────────┘ └─────────┘ └─────────┘ └──────────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────────┐  │
│  │apiPump  │ │apiEcph  │ │apiWeather│ │endpoints/        │  │
│  └─────────┘ └─────────┘ └──────────┘ │ schedules, pest  │  │
│  ┌──────────────┐ ┌──────────────────┐ │ fertilizer, chem │  │
│  │ Socket.io    │ │ node-cron        │ └──────────────────┘  │
│  │ (real-time)  │ │ (แผนปลูกรายวัน)  │                       │
│  └──────────────┘ └──────────────────┘                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     MySQL 8.0+                               │
│  Database: gapv3 (dev) / gap_dev1163 (prod)                  │
│  Charset: utf8mb4_0900_ai_ci (รองรับภาษาไทย)                │
│  Connection: mysql2 pool (connectionLimit: 10)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   React Frontend (x3)                        │
│  Admin  :3002  │  Doctor :3003  │  Farmer :3004              │
│  Webpack 5 custom config, SCSS + MUI v7 + Bootstrap 5        │
│  Build output → build/admin, build/doctor, build/farmer      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  IoT / MQTT Layer                             │
│  TTN (The Things Network) → mqtt_to_api.py → Backend API     │
│  Sensors: สภาพอากาศ, EC/pH, ปั๊มน้ำ                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 โครงสร้างโฟลเดอร์สำคัญ

```
GAPV4-main/
├── server/                          # ⭐ Backend Express.js (Node.js)
│   ├── server.js                    #   Entry point — ทดสอบ DB แล้วเรียก appRun
│   ├── appRun.js                    #   สร้าง HTTP server + optional ngrok tunnel
│   ├── configExpress.js             #   ⭐ Setup ทุกอย่าง: middleware, CORS, API routes, WebSocket
│   ├── connectPool.js               #   ConnectionPool class (mysql2 pool + executeQuery helper)
│   ├── dbConfig.js                  #   DB config factory
│   ├── configLine.js                #   LINE Bot SDK client (class LineGAP extends Line.Client)
│   ├── routerApi.js                 #   SPA fallback routes สำหรับ production (serve index.html)
│   ├── webSocket.js                 #   Socket.io: doctor online status, messaging, notifications
│   ├── apiAdmin.js                  #   API routes สำหรับ Admin (~112KB)
│   ├── apiDoctor.js                 #   API routes สำหรับ Doctor (~257KB ⚠️ ไฟล์ใหญ่ที่สุด)
│   ├── apiFarmer.js                 #   API routes สำหรับ Farmer (~188KB)
│   ├── apiMessaging.js              #   LINE Webhook handler + messaging
│   ├── apiPump.js                   #   API ควบคุมปั๊มน้ำ IoT
│   ├── apiWeatherStation.js         #   API ข้อมูลสถานีอากาศ
│   ├── apiWeatherGreenhouse.js      #   API สภาพอากาศในโรงเรือน
│   ├── apiEcph.js                   #   API ข้อมูล EC/pH
│   ├── apiAddDevice.js              #   API เพิ่มอุปกรณ์ IoT
│   ├── callServices.js              #   Device online/offline notification via LINE
│   ├── core/                        #   Business logic core
│   │   ├── authorize.js             #     AuthorizeUser class (admin/doctor/farmer/device auth)
│   │   ├── corn.js                  #     node-cron scheduler (แจ้งแผนปลูกรายวัน ตี 5)
│   │   ├── corns/schedulePlan.js    #     Logic สร้างข้อความแจ้งแผนปลูก
│   │   ├── env.js                   #     Environment helpers
│   │   ├── util.js                  #     Device type utility
│   │   └── messageLineTemplate.js   #     LINE message templates
│   ├── endpoints/                   #   REST API endpoints แยกตามหมวด
│   │   ├── schedules.js             #     CRUD แผนปลูก (16KB)
│   │   ├── fertilizer.js            #     CRUD ปุ๋ย
│   │   ├── chemical.js              #     CRUD สารเคมี
│   │   └── pest.js                  #     CRUD ศัตรูพืช
│   ├── middleware/
│   │   ├── authorizer.js            #     Session-based auth middleware
│   │   └── userAccessLogs.js        #     Access logging middleware
│   └── mqtt/                        #   MQTT bridge (Python)
│       ├── mqtt_to_api.py           #     Subscribe TTN → POST to API
│       └── device_config.json       #     Device mapping config
│
├── app/                             # ⭐ Frontend React
│   ├── public/                      #   Static HTML entry points
│   └── src/
│       ├── env.js                   #   Runtime env config (API URL, subpath)
│       ├── SocketIO.jsx             #   Socket.io client context
│       ├── ThemeProvider.jsx        #   MUI Theme config
│       ├── assets/                  #   ⭐ Shared resources ข้ามทุก web app
│       │   ├── components/          #     Shared React components
│       │   │   ├── DatePickerApp.jsx, DateRange.jsx, PopupApp.jsx, SelectApp.jsx
│       │   │   ├── useRoyalGAP.jsx  #     Custom hook สำหรับ GAP utilities
│       │   │   ├── pump-management/ #     Pump control components
│       │   │   ├── sensor/          #     Sensor display components
│       │   │   ├── schedule-management/ # Schedule CRUD components
│       │   │   ├── ecph-management/ #     EC/pH management components
│       │   │   ├── device-management/ #   Device management components
│       │   │   └── weather-management/ #  Weather display components
│       │   ├── core/                #     Core utilities (DateGAP, RoyalGapUtil)
│       │   ├── style/               #     Global SCSS stylesheets
│       │   ├── font/                #     Custom fonts
│       │   ├── img/                 #     Shared images
│       │   ├── icon/                #     Icons
│       │   └── js/                  #     Shared JS utilities
│       └── web/                     #   ⭐ 3 แอปแยกกัน
│           ├── admin/               #     Admin web app
│           │   ├── index.js         #       React entry point
│           │   └── src/
│           │       ├── main.js, Login.js, Admin.js
│           │       ├── AdminDashboardLayout.js, AdminHeader.js, AdminSidebar.js
│           │       └── page/        #       Admin pages
│           ├── doctor/              #     Doctor web app
│           │   ├── index.js
│           │   └── src/
│           │       ├── main.js, Login.js, Doctor.js
│           │       ├── DashboardLayout.js, DoctorHeader.js, Sidebar.js
│           │       ├── PageTemplate.js
│           │       └── page/        #       Doctor pages
│           └── farmer/              #     Farmer web app (LIFF-based)
│               ├── index.js
│               ├── router.jsx       #       React Router v7 routes
│               └── src/
│                   ├── main.js      #         LIFF initialization + auth
│                   ├── singupFile/   #         Farmer registration
│                   ├── houseFile/    #         Greenhouse management
│                   ├── HouseList/    #         Greenhouse list + setup
│                   ├── content/     #         GAP forms, sensor, pump, schedules, reports
│                   └── weather-station/
│
├── config/                          # Webpack 5 configuration (custom, ไม่ใช้ CRA)
│   ├── webpack.config.js            #   Main webpack config (~31KB)
│   ├── webpackDevServer.config.js   #   Dev server config
│   ├── paths.js                     #   Path resolution
│   ├── env.js                       #   Env variable injection
│   └── webpack/                     #   Additional webpack plugins
│
├── scripts/                         # Build & dev scripts
│   ├── start.js                     #   Dev server launcher (รับ arg: admin/doctor/farmer)
│   └── build.js                     #   Production build (รับ arg: admin/doctor/farmer)
│
├── SQL/                             # Database scripts
│   └── main/
│       └── Structure Database.sql   #   ⭐ Full schema definition
│
├── InitEnv/                         # Environment setup
│   ├── jsonEnv.json                 #   Template config values
│   └── setupEnv.js                  #   Generates .env from jsonEnv.json
│
├── deploy/                          # Deployment configs
│   ├── Dockerfile                   #   node:20-slim + pm2
│   ├── docker-compose-uat.yaml
│   ├── docker-compose-production.yaml
│   ├── docker-compose-reverse-proxy.yaml
│   ├── nginx.conf
│   └── build-client/                #   Build scripts for UAT/production
│
├── API/                             # LINE Bot Design
│   ├── DESIGN.lbd                   #   LINE Bot Designer file
│   ├── api_line_gap.js              #   LINE API integration helper
│   └── assets/                      #   Rich Menu images
│
├── sysmonitor/
│   └── heartbeat.js                 #   Health check → Discord webhook alert
│
├── services/                        # Microservices (gap-device-dashboard)
├── workFlow/                        # Deployment workflow scripts
├── logs/                            # Error & access logs
├── .env                             #   ⚠️ Environment variables (ข้อมูลลับ)
├── package.json                     #   npm scripts & dependencies
└── UrlServer.json                   #   ngrok URL storage
```

---

## ⚙️ Tech Stack Summary

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Frontend** | React | 18.2 | Custom Webpack 5, ไม่ใช่ CRA |
| **Routing** | React Router | 7 | `react-router` (ไม่ใช่ `react-router-dom`) |
| **UI** | MUI (Material-UI) | 7 | `@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`, `@mui/x-date-pickers` |
| **UI** | Bootstrap | 5 | `react-bootstrap` |
| **Styling** | SCSS/Sass | - | Global styles in `app/src/assets/style/` |
| **CSS** | Tailwind CSS | 3 | ใช้ร่วมกับ SCSS |
| **Maps** | Google Maps + Leaflet | - | `@react-google-maps/api`, `react-leaflet@4` |
| **Charts** | Chart.js + Recharts | - | `react-chartjs-2`, `recharts` |
| **Backend** | Express.js | 4 | Custom config, ไม่ใช้ generator |
| **Database** | MySQL | 8.0+ | `mysql2` pool, charset `utf8mb4_0900_ai_ci` |
| **Real-time** | Socket.io | 4.7 | Doctor online status, notifications |
| **LINE** | @line/bot-sdk | 9 | Messaging API, Rich Menu |
| **LINE** | @line/liff | 2.23 | LIFF apps (farmer web in LINE) |
| **IoT** | MQTT (TTN) | - | Python bridge → REST API |
| **Scheduler** | node-cron | 3 | แผนปลูกรายวัน 05:00 |
| **HTTP Client** | axios | 1.7 | Frontend API calls |
| **Date** | dayjs + date-fns | - | จัดการวันที่ภาษาไทย |
| **Export** | jspdf + html2canvas + sheetjs-style | - | PDF/Excel |
| **Search** | Fuse.js | 7 | Fuzzy search |
| **Thai NLP** | thai-wordcut / wordcut | - | ตัดคำภาษาไทย |
| **Process Manager** | PM2 | 5 | Production runtime |
| **Tunnel** | @ngrok/ngrok | 1.5 | Dev LINE webhook testing |
| **Docker** | node:20-slim | - | Production deployment |
| **Monitoring** | Discord Webhook | - | Health check alerts |

---

## 🔑 Critical Patterns — ต้องปฏิบัติตาม

### 1. Database Access Pattern
```javascript
// ✅ ถูกต้อง — ใช้ ConnectionPool.executeQuery (Promise-based)
const results = await Pool.executeQuery(
    `SELECT * FROM housefarm WHERE id_farm_house = ?`,
    [id]
);

// ❌ ผิด — อย่าสร้าง connection ตรงๆ ใน route handler
const conn = mysql.createConnection(...)  // ❌ ไม่ใช้
```

- Connection Pool ถูกสร้างครั้งเดียวใน `configExpress.js` แล้วส่งผ่าน parameter `Pool` ไปทุก API module
- ใช้ **parameterized queries** เสมอ (`?` placeholder) เพื่อป้องกัน SQL injection
- Pool มี `connectionLimit: 10`

### 2. API Route Registration Pattern
API routes ลงทะเบียนใน `configExpress.js` แบบ function injection:
```javascript
// ใน configExpress.js:
apiAdmin(app, db, Pool, apifunc, dbpackage, listDB, io)
apiDoctor(app, db, Pool, apifunc, dbpackage, listDB, hostServer, io)
apiFarmer(app, db, Pool, dbpackage, listDB, io)

// ใน apiXxx.js:
module.exports = function apiXxx(app, db, Pool, ...) {
    app.get("/api/xxx/...", async (req, res) => { ... })
    app.post("/api/xxx/...", async (req, res) => { ... })
}
```

**Newer pattern** สำหรับ endpoints ใน `server/endpoints/`:
```javascript
module.exports = function apiSchedules(app, Pool) {
    app.get("/api/schedules", ...) 
    // ไม่ต้องรับ db, dbpackage, listDB — ใช้ Pool.executeQuery ตรง
}
```

### 3. Authentication System
- ใช้ **express-session** (ไม่ใช่ JWT)
- Session ถูกเก็บใน memory (default store)
- Cookie config แยกตาม mode: `secure: true` + `sameSite: none` สำหรับ production
- Middleware `authorizer.js` ตรวจ session แล้ว verify กับ DB ผ่าน `AuthorizeUser` class
- Admin: ตรวจ `username` + `SHA2(password, 256)`
- Doctor: ตรวจ `id_doctor` + `SHA2(password_doctor, 256)` + role flag
- Farmer: ตรวจ `uid_line` (LINE User ID)

### 4. Frontend Build System
- **ไม่ใช่ Create React App** — ใช้ custom Webpack 5 config ที่ `config/webpack.config.js`
- Build แยก 3 ตัว: `npm run build` = build admin → doctor → farmer
- Dev server แยก 3 ตัว: `npm run server-admin`, `server-doctor`, `server-farmer`
- Script argument กำหนดว่า build/run ตัวไหน: `node scripts/start.js admin`
- Build output ไปที่ `build/admin/`, `build/doctor/`, `build/farmer/`

### 5. LIFF (LINE Frontend Framework) — เฉพาะ Farmer
- Farmer app ถูกออกแบบให้ **รันภายใน LINE app** ผ่าน LIFF
- LIFF initialization อยู่ใน `app/src/web/farmer/src/main.js`
- LIFF IDs ถูกกำหนดใน `.env` (REACT_APP_LINE_SIGNUP, REACT_APP_LINE_HOUSE, ...)
- มี UID test สำหรับ dev: `REACT_APP_UID_USER_TEST` ใน `.env`
- Farmer ไม่มี login page — ใช้ LINE UID จาก LIFF profile

### 6. Socket.io Events
```
"connect-doctor-list"    → join room "admin:doctor:list" (admin ดู list หมอ)
"connect-account"        → doctor online tracking
"disconnect-account"     → doctor offline tracking  
"connect msg"            → join room uid_line (messaging)
"connect_notify_doctor"  → join room "notify-{station}" (notifications)
```

### 7. Cron Jobs
- แจ้งแผนปลูกทุกวัน **05:00 น.** ผ่าน LINE push message
- ดู config ที่ `server/core/corn.js` → `server/core/corns/schedulePlan.js`
- บันทึกประวัติลง `schedules_history` table

### 8. File Uploads
- ใช้ `multer` middleware (in-memory, ไม่มี disk storage config)
- `app.use(upload.any())` — รับทุกไฟล์ทุก field name

---

## 🗄 Database Schema Overview

Database: `gapv3` (dev) / `gap_dev1163` (prod)

### ตาราง User Accounts
| Table | Description |
|-------|-------------|
| `admin` | Admin users (username + SHA2 password) |
| `acc_doctor` | Doctor accounts (มี role flags: doctor_role, analyst_role, consultant_role, protection_role) |
| `acc_farmer` | Farmer accounts (ใช้ LINE uid_line, register_auth: 0=รอ, 1=อนุมัติ, 2=ลบ) |

### ตาราง Core Business
| Table | Description |
|-------|-------------|
| `housefarm` | โรงเรือน (name_house, id_farm_house, uid_line, link_user) |
| `formplant` | แบบฟอร์ม GAP (id, id_farm_house, name_plant) |
| `station_list` | รายการสถานีหลวง |

### ตาราง IoT
| Table | Description |
|-------|-------------|
| `sensor_pump_greenhouse` | ปั๊มน้ำ IoT per greenhouse |
| `sensor_weather_greenhouse` | เซ็นเซอร์อากาศ per greenhouse |

### ตาราง Schedules & History
| Table | Description |
|-------|-------------|
| `schedules` | แผนปลูก |
| `schedules_history` | ประวัติแจ้งเตือนแผนปลูก |

### ตาราง Logging
| Table | Description |
|-------|-------------|
| `user_access_logs` | Log การเข้าใช้ระบบ |
| `log_admin` | Log admin เข้าใช้รายวัน |

> 💡 Full schema อยู่ที่ `SQL/main/Structure Database.sql`

---

## 📌 npm Scripts Reference

### Development
```bash
npm run server-dev          # Start backend API (nodemon, auto-reload)
npm run server-admin        # Start Admin React dev server (:3002)
npm run server-doctor       # Start Doctor React dev server (:3003)
npm run server-farmer       # Start Farmer React dev server (:3004)
npm run server-dev-router   # Backend with SPA routing (post-build testing)
npm run server-ngrok        # Start ngrok tunnel (LINE webhook testing)
```

### Build
```bash
npm run build               # Build ทั้ง 3 apps (admin → doctor → farmer)
npm run init-env            # Generate .env from InitEnv/jsonEnv.json
```

### Production
```bash
npm run server              # PM2 start (production)
npm run server-node         # Foreground mode
npm run server-restart      # PM2 restart
npm run server-stop         # PM2 stop
npm run server-docker       # PM2-runtime (Docker)
npm run monitoring          # Start heartbeat health check
```

---

## ⚠️ สิ่งที่ต้องระวัง (Gotchas & Pitfalls)

### 1. ไฟล์ API ขนาดใหญ่มาก
- `apiDoctor.js` = **257KB**, `apiFarmer.js` = **188KB**, `apiAdmin.js` = **112KB**
- ไฟล์เหล่านี้มี API routes จำนวนมากรวมอยู่ในไฟล์เดียว
- เมื่อแก้ไข ให้ **ระบุ line number ให้ชัดเจน** และ **อ่านเฉพาะส่วนที่เกี่ยวข้อง** (ใช้ search/grep)
- Pattern ใหม่ที่ดีกว่า: แยก endpoint ไปที่ `server/endpoints/` (ดูตัวอย่าง `schedules.js`)

### 2. อย่าแก้ `.env` ตรงๆ โดยไม่ระวัง
- `.env` มีข้อมูลลับ (API keys, tokens, passwords)
- มี LINE Channel Access Token, Channel Secret, LIFF IDs
- มี TTN (The Things Network) API keys
- มี Discord Webhook URL
- **ห้ามลบหรือเปลี่ยน** key เดิมที่มีอยู่ ถ้าไม่ได้รับคำสั่ง

### 3. Trust Proxy Setting
- `app.set('trust proxy', 1)` — จำเป็นสำหรับ ngrok/reverse proxy
- ถ้าปิด → session cookie จะทำงานผิดพลาดบน HTTPS

### 4. Database Character Set
- ใช้ `utf8mb4_0900_ai_ci` — รองรับภาษาไทย + emoji
- **อย่าเปลี่ยนเป็น utf8** (3 bytes ไม่รองรับ emoji)

### 5. React Router Version
- ใช้ `react-router` v7 (ไม่ใช่ v6) — import จาก `"react-router"` ไม่ใช่ `"react-router-dom"`
- `BrowserRouter` + `Routes` + `Route` import จาก `"react-router"`

### 6. Webpack Config Path Resolution
- `config/paths.js` กำหนด entry point ตาม argument (admin/doctor/farmer)
- `app/src/web/[target]/index.js` คือ entry point ของแต่ละ app

### 7. CORS Origins
- Hardcoded origins ใน `configExpress.js` — ถ้าเพิ่มบริการใหม่ต้องเพิ่ม origin
- Production domains: `admin.gapv4.online`, `doctor.gapv4.online`, `api.gapv4.online`, `farmer.gapv4.online`

### 8. Password Hashing
- ใช้ MySQL `SHA2(password, 256)` — **ไม่ใช่ bcrypt**
- Hash ทำฝั่ง DB ไม่ใช่ฝั่ง Node.js
- ตรวจ password ใน query: `WHERE password = SHA2(?, 256)`

### 9. Session Data Structure
```javascript
req.session = {
    user_doctor: "username",     // Doctor
    pass_doctor: "password",     // Doctor (plain text in session!)
    user_username: "username",   // Admin
    user_password: "password",   // Admin
    uid_line: "Uxxxx",          // Farmer (LINE UID)
    role_primary: "admin",       // "admin" | undefined
    role_doctor: "doctor",       // "doctor" | "analyst" | "consultant" | "protection"
    user_id: 123,               // DB primary key
    account_type: "farmer",     // For access logs
    admin_id: 1,                // Admin DB ID
    profile: { ... }            // Populated by authorizer middleware
}
```

### 10. Subpath / Prefix Support
- `process.env.PREFIX_PATH` — optional subpath prefix for all redirects
- `res.redirect` ถูก override ใน middleware เพื่อเพิ่ม prefix อัตโนมัติ
- Frontend ใช้ `env.subpath_server` สำหรับ `BrowserRouter basename`

---

## 🔧 วิธีเพิ่ม Feature ใหม่

### เพิ่ม API Endpoint ใหม่
1. **สร้างไฟล์ใน `server/endpoints/`** (ดูตัวอย่าง `schedules.js`)
2. **Register ใน `configExpress.js`**:
   ```javascript
   const apiNewFeature = require('./endpoints/newFeature');
   // ... ใน function appConfig:
   apiNewFeature(app, Pool)
   ```
3. ถ้าต้องการ auth → เพิ่ม middleware: `app.use("/api/new-feature", authorizer(Pool))`

### เพิ่มหน้า Frontend ใหม่
1. **สร้าง component** ใน `app/src/web/[target]/src/page/` หรือ folder ที่เหมาะสม
2. **เพิ่ม route** ใน router file ของ target นั้น
   - Farmer: `app/src/web/farmer/router.jsx`
   - Admin/Doctor: ใน main.js หรือ navFirst.js ของแต่ละ app
3. ถ้า production → เพิ่ม SPA fallback route ใน `server/routerApi.js`

### เพิ่ม Shared Component
- สร้างใน `app/src/assets/components/` — ใช้ร่วมทุก app
- Import ด้วย relative path: `import XYZ from "../../assets/components/XYZ"`

### เพิ่ม IoT Device Type ใหม่
1. เพิ่ม API ใน `server/` (ตัวอย่าง: `apiPump.js`, `apiWeatherStation.js`)
2. เพิ่ม component ใน `app/src/assets/components/[device]-management/`
3. เพิ่ม device config ใน `server/mqtt/device_config.json`
4. อัปเดต `server/core/util.js` สำหรับ device type mapping

---

## 🚫 สิ่งที่ห้ามทำ (Don'ts)

1. **ห้ามติดตั้ง Create React App** — โปรเจคนี้ใช้ custom Webpack config
2. **ห้ามเปลี่ยน database charset** จาก `utf8mb4_0900_ai_ci`
3. **ห้าม import จาก `react-router-dom`** — ใช้ `react-router` v7
4. **ห้ามสร้าง connection ใหม่** แทน Pool ที่ส่งมา — ใช้ `Pool.executeQuery()`
5. **ห้ามเปลี่ยน session store** โดยไม่ได้วางแผน migration
6. **ห้ามแก้ไข `config/webpack.config.js`** โดยไม่เข้าใจผลกระทบ — กระทบทั้ง 3 apps
7. **ห้าม hardcode LIFF IDs** — ใช้ environment variables (`process.env.REACT_APP_LINE_*`)
8. **ห้ามลบ `app.set('trust proxy', 1)`** — ทำให้ session พังบน reverse proxy
9. **ห้ามใช้ `res.send()` สำหรับ error** ที่ไม่ได้ set status code — ใช้ `res.status(xxx).json({})` แทน

---

## 🌍 Environment Variables ที่สำคัญ

| Variable | ใช้งาน | ตัวอย่าง |
|----------|--------|---------|
| `DATABASE_DEV` | ชื่อ DB สำหรับ dev | `gapv3` |
| `USER_DBDEV` / `PASSWORD_DBDEV` | DB credentials (dev) | `root` / `""` |
| `REACT_APP_API_PORT` | Backend port | `3001` |
| `ADMIN_PORT` / `DOCTOR_PORT` / `FARMER_PORT` | Frontend dev ports | `3002/3003/3004` |
| `channelAccessToken` / `channelSecret` | LINE Messaging API | (secret) |
| `RICH_SIGN` / `RICH_HOUSE` | LINE Rich Menu IDs | `richmenu-xxx` |
| `REACT_APP_LINE_*` | LIFF App IDs (7 ตัว) | `2009108007-xxxx` |
| `REACT_APP_API_LOCAL` | Frontend → Backend URL (dev) | `localhost` |
| `REACT_APP_API_PUBLIC` | Frontend → Backend URL (prod) | domain |
| `URL_SERVER` | Full backend URL | `https://xxx.com` |
| `NGROK_AUTHTOKEN` | ngrok auth | (secret) |
| `TTN_*` | The Things Network IoT config | (secret) |
| `WEBHOOK_NOTIFIER` | Discord health check webhook | Discord URL |
| `REACT_APP_UID_USER_TEST` | Test farmer LINE UID | `Uaxxxx` |
| `PREFIX_PATH` | Subpath prefix (optional) | `/uat` |
| `BUILD` | Production mode flag | `deploy` |

---

## 🧪 Testing & Development Tips

1. **Dev mode ต้องเปิดหลายหน้าต่าง**: Backend (3001) + Frontend ที่ต้องการ (3002/3003/3004)
2. **ทดสอบ LINE features**: ต้อง build → run server-dev → run server-ngrok → อัปเดต webhook URL
3. **Farmer dev โดยไม่ต้องมี LINE**: ใช้ `REACT_APP_UID_USER_TEST` ใน `.env`
4. **ดู logs**: PM2 logs `pm2 logs gap-backend` หรือดูที่ `logs/` directory
5. **Database schema changes**: เพิ่ม SQL ใน `SQL/` directory เสมอเพื่อ track changes
6. **Hot reload**: Backend ใช้ nodemon, Frontend ใช้ webpack-dev-server HMR

---

## 📝 Coding Conventions

- **Language**: JavaScript (CommonJS สำหรับ backend, ESM/JSX สำหรับ frontend)
- **Module system**: `require()` / `module.exports` (backend), `import/export` (frontend)
- **ไม่ใช้ TypeScript** ในตัว app หลัก (มี `@types/*` เป็น devDependencies สำหรับ IDE support เท่านั้น)
- **Naming**: camelCase สำหรับ variables/functions, PascalCase สำหรับ React components/classes
- **SQL**: ใช้ template literals กับ `?` placeholders — ห้ามใช้ string interpolation กับ user input
- **Error handling**: try/catch กับ `Pool.executeQuery()`, ส่ง error response กลับเป็น JSON
- **Comments**: ใช้ภาษาไทยและอังกฤษปนกัน — เขียน comment ภาษาไทยก็ได้

---

## 🔗 Production URLs

| Service | URL |
|---------|-----|
| Admin | `https://admin.gapv4.online` |
| Doctor | `https://doctor.gapv4.online` |
| Farmer | `https://farmer.gapv4.online` |
| API | `https://api.gapv4.online` |
