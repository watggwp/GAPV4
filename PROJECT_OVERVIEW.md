# ภาพรวมโปรเจกต์ GAPV4 (Project Overview & Structure)

เอกสารนี้สรุปเทคโนโลยี (Tech Stack) และโครงสร้างโฟลเดอร์ (Folder Structure) ของโปรเจกต์ เพื่อให้ง่ายต่อการทำความเข้าใจและใช้เป็นคู่มือสำหรับนักพัฒนาครับ

---

## 🛠 เทคโนโลยีที่ใช้ในโปรเจกต์ (Tech Stack)

โปรเจกต์นี้ทำงานอยู่บนโครงสร้างแบบ **MERN / PERN Stack** โดยใช้ฐานข้อมูลเป็น **MySQL** และมีการผสานระบบ **IoT** รวมถึงแพลตฟอร์ม **LINE** เข้ามาทำงานร่วมกันอย่างเต็มรูปแบบ

### 1. Frontend (ฝั่งหน้าเว็บแอปพลิเคชัน)
* **Core Framework:** React.js (v18.2) 
* **Routing:** React Router (v7)
* **Styling & UI Components:** SCSS / Sass, Material-UI (MUI v7), Bootstrap 5, และ Tailwind CSS
* **Maps & Location:** Google Maps API (`@react-google-maps/api`) และ Leaflet
* **Charts & Data Visualization:** Chart.js (`react-chartjs-2`) และ Recharts
* **Bundler:** Webpack 5 (ตั้งค่า Custom Config เอง)
* **LINE Integration:** LINE LIFF (`@line/liff`) สำหรับรันแอปบนแอปพลิเคชัน LINE โดยตรง

### 2. Backend (ฝั่งเซิร์ฟเวอร์และ API)
* **Runtime:** Node.js
* **Framework:** Express.js
* **Real-time Communication:** Socket.io (สำหรับอัปเดตข้อมูลแดชบอร์ดแบบ Real-time)
* **IoT & Messaging:** 
  * LINE Messaging API (`@line/bot-sdk`) สำหรับเชื่อมต่อระบบแชทบอทและการแจ้งเตือนต่างๆ
  * MQTT Protocol สำหรับรับส่งและมอนิเตอร์ข้อมูลจากเซ็นเซอร์โรงเรือน (IoT)
* **Task Scheduling:** `node-cron` สำหรับการรันคำสั่งอัตโนมัติเบื้องหลัง
* **File Uploads:** Multer

### 3. Database (ฐานข้อมูล)
* **Database Management System:** MySQL
* **Database Driver:** `mysql` และ `mysql2` (จัดการ Connection Pool เพื่อความเสถียร)

### 4. Infrastructure & Tools
* **Process Manager:** PM2 (สำหรับการรัน Backend, Microservices และระบบ Monitor ตลอดเวลา)
* **Local Development Proxy:** Ngrok (ใช้เพื่อรับ Webhook จาก LINE หรือระบบภายนอกเวลาเขียนโค้ดในเครื่อง)
* **Export Utilities:** `jspdf`, `html2canvas` (สำหรับออก PDF) และ `sheetjs-style` (สำหรับ Excel)
* **Date Management:** `dayjs` และ `date-fns`

---

## 📁 โครงสร้างโฟลเดอร์ (Folder Structure)

โปรเจกต์นี้ออกแบบโครงสร้างในลักษณะ **Monorepo** คือเก็บโค้ดทั้งหมด (Frontend, Backend, Microservices, Scripts) รวมไว้ในโฟลเดอร์เดียวกันเพื่อให้จัดการง่ายครับ

### ฝั่งผู้ใช้งาน (Frontend / React)
อยู่ที่โฟลเดอร์ **`app/`**
* **`app/public/`** — ไฟล์เริ่มต้นของระบบ เช่น `index.html` และรูปภาพ Static
* **`app/src/`** — ซอร์สโค้ดหลักของ React
  * **`app/src/assets/`** — ไฟล์ส่วนกลางที่ทุกระบบดึงไปใช้ (ภาพ, สไตล์ SCSS กลาง, ฟังก์ชัน JS ย่อย)
  * **`app/src/web/`** — **(ส่วนสำคัญ)** แยกโปรเจกต์เว็บออกเป็น 3 แอปพลิเคชันตามกลุ่มผู้ใช้งาน:
    * 💻 **`admin/`** : ระบบสำหรับผู้ดูแลระบบ (Admin)
    * 👨‍⚕️ **`doctor/`** : ระบบสำหรับหมอพืช และผู้ให้คำปรึกษา
    * 👨‍🌾 **`farmer/`** : ระบบสำหรับเกษตรกร (มักจะผูกการทำงานเข้ากับหน้าต่าง LINE LIFF)

### ฝั่งระบบหลังบ้าน (Backend / Express API)
อยู่ที่โฟลเดอร์ **`server/`**
* **`server/endpoints/`** หรือโค้ดรูทของเซิร์ฟเวอร์ เช่น `apiAdmin.js`, `apiDoctor.js` — ใช้จัดการการเรียก API ทั้งหมด
* **`server/middleware/`** — ด่านตรวจเช็คก่อนการเข้าถึง API (เช่น ระบบ Login/Token Authentication)
* **`server/mqtt/`** — ตัวกลางที่คอยคุยกับเซ็นเซอร์และอุปกรณ์ฮาร์ดแวร์ IoT
* **`server/webSocket.js`** — จัดการระบบการแจ้งเตือนและการสตรีมข้อมูลสดๆ เข้าสู่หน้าเว็บ
* **`server/dbConfig.js` / `connectPool.js`** — โค้ดสำหรับต่อฐานข้อมูล MySQL

### ระบบย่อยและการจัดการฮาร์ดแวร์ (Microservices & IoT)
* **`services/`** — เก็บโปรเจกต์ย่อยอื่นๆ เช่น โปรเจกต์ `gap-device-dashboard` สำหรับทำหน้าจอ Monitor ตัวฮาร์ดแวร์แยกต่างหาก

### ฐานข้อมูล (Database Management)
* **`SQL/`** — เก็บสคริปต์ Database Schema, ข้อมูลจำลอง หรือไฟล์ Backup ฐานข้อมูล (เช่น `gapv3_data.sql`)

### การตั้งค่า, ระบบ Build และการทำงานเบื้องหลัง (DevOps & Build Tools)
* **`scripts/`** — โค้ดคำสั่งต่างๆ เมื่อเรารัน Node script เช่น การ Build React แยกออกเป็น admin/doctor/farmer
* **`config/`** — ไฟล์คอนฟิกของระบบ โดยเฉพาะ Webpack ที่ใช้ควบคุมการ Compile โค้ด React (ไม่ได้ใช้ Create React App ทั่วไป)
* **`sysmonitor/`** — โค้ดเช็คสถานะการทำงาน (Health check / Heartbeat) เพื่อให้มั่นใจว่า Server ยังคงทำงานอยู่ปกติ
* **`deploy/` / `workFlow/`** — ไฟล์สคริปต์ต่างๆ สำหรับการนำโปรเจกต์ขึ้น Server จริง (Production)
* **`logs/`** — ที่เก็บประวัติการทำงานและข้อผิดพลาดที่เกิดขึ้น (Error Logs) ของระบบ
