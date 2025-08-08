# PROJECT-LINE-OA-GAP React

### Install Project
   - Install Package
      ```
      npm install
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
        ```
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

### Revise
   - Search "revise code"

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