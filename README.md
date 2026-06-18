# PROJECT-LINE-OA-GAP React

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![LINE](https://img.shields.io/badge/LINE-00C300?style=for-the-badge&logo=line&logoColor=white)
![MUI](https://img.shields.io/badge/Material%20UI-007FFF?style=for-the-badge&logo=mui&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

### Install Project
   - Install Package
      ```
      npm install
      ```
      ```
      npm install leaflet react-leaflet@4
      ```
   - Init env
      ```
      npm run init-env
      ```
      or
      ```
      node InitEnv/setupEnv.js
      ```

   - Install Database
      - SQL/main/Structure Database.sql
      - setup user admin
        ```sql
        INSERT INTO `admin` 
         (username , password , phone , address) 
         VALUES ('--username--' , SHA2('--password--', 256) , '--number phone--' , POINT(0000 , 0000))
        ```

### Build Project

   - After install packages and .env
      ```
      npm run build
      ```
   
### Start Server

   - Development
      - start ngrok (หากจะทดสอบ line liff)
         ```
         npm run server-ngrok
         ```
      - start API
         ```
         npm run server-dev
         ```
      - start server react admin , doctor , farmer
        - admin
          ```
          npm run server-admin
          ```
        - doctor
          ```
          npm run server-doctor
          ```
        - farmer
          ```
          npm run server-farmer
          ```

   - Development test after build
      - start API
         ```
         npm run server-dev-router
         ```

   - Product pm2
      - start
         ```
         npm run server 'username-db' 'password-db'
         ```
      - restart
         ```
         npm run server-restart
         ```
      - stop
         ```
         npm run server-stop
         ```
   
   - Product Foreground
      ```
      npm run server-node 'username-db' 'password-db'
      ```

### Deployment
   - Build frontend
     - setup env
         ```powershell
         set REACT_APP_API_PROD="<--Public url server API-->"
         ```

     - uat
         ```powershell
         deploy/build-client/uat.bat
         ```

     - production
         ```powershell
         deploy/build-client/production.bat
         ```

   - Start services server
      - setup env create file docker.env
         ```
         USER_DB_DEV=""
         PASS_DB_DEV=""

         USER_DB_PROD=""
         PASS_DB_PROD=""

         PORT_REVERSE_PROXY=""
         ```

      - uat
         ```
         docker compose --env-file ./docker.env -f deploy/docker-compose-uat.yaml up -d
         ```

      - production
         ```
         docker compose --env-file ./docker.env -f deploy/docker-compose-production.yaml up -d
         ```

      - reverse proxy
         ```
         docker compose -f deploy/docker-compose-reverse-proxy.yaml up -d
         ```

      - service start
         ```
         http://localhost:3010 or "REACT_APP_API_PROD"
         ```
         - path uat
            ```
            /uat
            ```
         - path production
            ```
            /
            ```

   - Update UAT
      ```powershell
         deploy/build-client/uat.bat
      ```
      ```
         docker restart <--container name uat-->
      ```

### Tool and Technical
   - Fontend
      - React library
      - Google maps API
      - Scss
   - Backend
      - Expressjs
      - Web-socket
      - Bot-line-SDK
      - SQL
   - Tool 
      - LINE Bot Designer

   - Database 
     - utf8mb4_0900_ai_ci
       - utf8mb4 คือ รองรับ Unicode(UTF-8) พร้อมกับสัญลักษณ์ที่มีขนาด 4 byte
       - 0900 คือ เวอร์ชั่นที่รองรับอักขระได้ซับซ้อนมากขึ้น รวมถึง ภาษาไทย
       - ai (Accent-insensitive) คือ เปรียบเทียบแบบไม่สนใจเครื่องหมายอักขระ
       - ci (Case-insensitive) คือ เปรียบเทียบแบบไม่สนใจตัวอักษร พิมพ์เล็ก - พิมพ์ใหญ่

---

### Environment Variables (`.env`)
เอกสารส่วนนี้อธิบายถึงตัวแปร Environment Variables ในไฟล์ `.env` ที่จำเป็นสำหรับการรันระบบ

#### การตั้งค่า Database (Database Configuration)
* **`DATABASE_DEV`** : ชื่อฐานข้อมูลสำหรับ Development (ค่าเริ่มต้น: `gap_dev1163`)
* **`USER_DBDEV`** : Username สำหรับ Development Database
* **`PASSWORD_DBDEV`** : Password สำหรับ Development Database
* **`DATABASE_SER`** : ชื่อฐานข้อมูลสำหรับ Production/Server
* **`USER_DB`** : Username สำหรับ Production Database
* **`PASSWORD_DB`** : Password สำหรับ Production Database
* **`HOST_DB`** : IP หรือ Hostname ของฐานข้อมูล (เช่น `localhost`)

#### การตั้งค่า LINE Official Account (LINE Messaging API)
* **`channelAccessToken`** : Token สำหรับเชื่อมต่อ LINE Messaging API (เอามาจากหน้า LINE Developers)
* **`channelSecret`** : Secret Key ประจำ Channel ของ LINE

#### การตั้งค่า LINE Rich Menu
* **`RICH_SIGN`** : ID ของ Rich Menu ที่ใช้แสดง **ตอนเริ่มต้น** (ก่อนสมัคร หรือยังไม่มีบัญชี)
* **`RICH_HOUSE`** : ID ของ Rich Menu ที่ใช้แสดง **ตอน farmer สมัครสำเร็จแล้ว หรือมีบัญชีอยู่แล้ว**

#### การตั้งค่า LINE LIFF IDs
* **`REACT_APP_LINE_SIGNUP`** : ID ของ LIFF สำหรับหน้า **สมัครสมาชิกเกษตรกร** (Endpoint: `/farmer/signup`)
* **`REACT_APP_LINE_HOUSE`** : ID ของ LIFF สำหรับหน้า **ข้อมูลโรงเรือนเดี่ยว** (Endpoint: `/farmer/house`)
* **`REACT_APP_LINE_HOUSELIST`** : ID ของ LIFF สำหรับหน้า **รายการโรงเรือนทั้งหมด** (Endpoint: `/farmer/houses`)
* **`REACT_APP_LINE_FORM`** : ID ของ LIFF สำหรับหน้า **แบบฟอร์มบันทึกข้อมูล GAP** (Endpoint: `/farmer/form`)
* **`REACT_APP_LINE_GAP`** : ID ของ LIFF สำหรับหน้า **ดูใบ GAP** (Endpoint: `/farmer/gap`)
* **`REACT_APP_LIFF_DOCTOR`** : ID ของ LIFF สำหรับหน้า **เชื่อมต่อ LINE OA ของหมอพืช** (Endpoint: `/doctor`)
* **`REACT_APP_WEATHER_STATION`** : ID ของ LIFF สำหรับหน้า **ดูสถานีตรวจวัดสภาพอากาศ** (Endpoint: `/farmer/weather-station`)

#### การตั้งค่า Server & Ports (Application Config)
* **`BUILD`** : กำหนด Environment Mode เช่น `deploy`
* **`KEY_SESSION`** : Secret Key สำหรับเข้ารหัส Session ของระบบ
* **`cookie`** : ชื่อ Cookie ที่ใช้เก็บ Session
* **`pathCertFile`** / **`pathKeyFile`** : Path ของไฟล์ SSL Certificate สำหรับเปิด HTTPS (ถ้ามี)
* **`URL_SERVER`** : Base URL ของระบบ (เช่น `https://api.gapv4.online`)
* **`REACT_APP_API_LOCAL`** : Domain หรือ IP ของ API แบบ Local
* **`REACT_APP_API_PUBLIC`** : Domain หรือ IP ที่อนุญาตให้เข้าใช้งาน API (Public)
* **`REACT_APP_API_DEV`** : URL ชี้ไปหา API สำหรับ Development 
* **`REACT_APP_API_PROD`** : URL ชี้ไปหา API สำหรับ Production
* **`REACT_APP_API_PORT`** : Port หลักที่ API (Server หลัก) รันอยู่ (เช่น `3001`)
* **`ADMIN_PORT`** : Port สำหรับฝั่ง Admin (หน้าเว็บแอดมิน)
* **`DOCTOR_PORT`** : Port สำหรับฝั่ง Doctor (หน้าเว็บหมอพืช)
* **`FARMER_PORT`** : Port สำหรับฝั่ง Farmer (หน้าเว็บเกษตรกร)
* **`REACT_APP_KEY_MAP`** : API Key สำหรับใช้งานแผนที่ (Google Maps API)

#### การตั้งค่า The Things Network (TTN) - เซ็นเซอร์ IoT
* **`TTN_API_KEY`** : API Key สำหรับเชื่อมต่อดึงข้อมูลจาก TTN
* **`TTN_APP_ID`** : Application ID บนแพลตฟอร์ม TTN
* **`TTN_ENDPOINT`** : URL Endpoint ของระบบ TTN
* **`TTN_SENSOR_BROKER`** : MQTT Broker Address ของ TTN
* **`TTN_SENSOR_USERNAME`** : Username ในการต่อ MQTT ของ TTN
* **`TTN_SENSOR_PASSWORD`** : Password (หรือ API Key) สำหรับต่อ MQTT ของ TTN
* **`TTN_SENSOR_TOPIC`** : Topic MQTT ที่ใช้ Subscribe อ่านค่าเซ็นเซอร์ที่ส่งเข้ามา (Uplink)

#### การตั้งค่า Ngrok
* **`NGROK_URL`** : URL ชั่วคราวที่ได้จาก Ngrok
* **`NGROK_AUTHTOKEN`** : Auth Token ประจำบัญชี Ngrok

#### การตั้งค่า Discord Webhook (แจ้งเตือน)
* **`WEBHOOK_NOTIFIER`** : URL ของ Discord Webhook สำหรับส่งข้อความแจ้งเตือน Error หรือสถานะต่างๆ
* **`CHANNEL_ID`** : ID ของช่องแชทใน Discord

#### ระบบ Testing & Debugging
* **`REACT_APP_UID_USER_TEST`** : ใส่ LINE UID ของเกษตรกร เพื่อจำลองการล็อกอิน (ใช้ทดสอบตอน Dev แบบรันบน Local โดยไม่ต้องเปิดผ่านไลน์)
* **`GENERATE_SOURCEMAP`** : ถ้าตั้งเป็น `false` จะไม่สร้างไฟล์ sourcemap ตอน build React