const dbFunc = require('./dbConfig')
const crypto = require("crypto")
const AccountAuth = require('./core/accountAuth')

const ErrorDB = (connectDB, err, res) => {
  dbFunc.dbErrorReturn(connectDB, err, res)
}

// คอลัมน์บัญชีที่ใช้ใน auth (ไม่ดึงรูป longblob ทุก request)
const AUTH_COLUMNS = {
  admin: "id, username, password, phone, address, station_admin, fullname_admin, status_account, status_delete, time_online",
  acc_doctor: "id_table_doctor, id_doctor, uid_line_doctor, password_doctor, fullname_doctor, station_doctor, status_account, status_delete, time_online, doctor_role, analyst_role, consultant_role, protection_role"
}
// เฉพาะหน้าโปรไฟล์ที่ต้องแสดงรูป ส่ง { withImage: true } มา
const AUTH_IMAGE_COLUMN = { admin: "img_admin", acc_doctor: "img_doctor" }

const apifunc = {
  auth: (connectDB, username, password, res, authAccount, role = "", options = {}) => {
    return new Promise((resole, reject) => {
      connectDB.connect((err) => {
        if (err) {
          // ErrorDB(connectDB, err, res);
          reject("connect");
          return;
        }

        const roleAuth = authAccount === "admin" ? "admin" : authAccount === "acc_doctor" ? "acc_doctor" : "";
        const usernameDB = roleAuth == "admin" ? "username" : roleAuth == "acc_doctor" ? "id_doctor" : "";
        const passwordDB = roleAuth == "admin" ? "password" : roleAuth == "acc_doctor" ? "password_doctor" : "";

        const ORDER = roleAuth == "admin" ? "" : roleAuth == "acc_doctor" ? "ORDER BY status_delete ASC" : "";
        const ROLE = roleAuth == "admin" ? "" : roleAuth == "acc_doctor" ? (
          role == "doctor" ? "AND doctor_role = 1" : role == "analyst" ? "AND analyst_role = 1" : role == "consultant" ? "AND consultant_role = 1" : role == "protection" ? "AND protection_role = 1" : ""
        ) : "";


        if (!roleAuth || typeof password !== "string" || !password) {
          reject("not pass");
          return;
        }

        const columns = AUTH_COLUMNS[roleAuth] + (options.withImage ? `, ${AUTH_IMAGE_COLUMN[roleAuth]}` : "");

        // ดึงบัญชีด้วย username แล้วตรวจรหัสผ่าน (bcrypt / SHA-256 เดิม / session credential) ในโค้ด
        connectDB.query(
          `SELECT ${columns} FROM ${roleAuth} WHERE BINARY ${usernameDB} = ? ${ROLE} ${ORDER}`,
          [username],
          async (err, result) => {
            if (err) {
              reject("not pass");
              return;
            }
            try {
              const runQuery = (sql, params) => new Promise((ok, fail) =>
                connectDB.query(sql, params, (e, r) => e ? fail(e) : ok(r)))
              const account = await AccountAuth.verifyAccount(roleAuth, result, password, runQuery)
              if (account) resole({ data: account, result: "pass" });
              else reject("not pass");
            } catch (e) {
              reject("not pass");
            }
          }
        );
      });
    });
  },

  generateID: (length, type = "text") => {
    let result = '';
    let charText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charNumber = "0123456789"
    let characters = (type === "num") ? charNumber : charText;
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },

  DateTime: (DateCurrent) => {
    const year = DateCurrent.getFullYear();
    const month = String(DateCurrent.getMonth() + 1).padStart(2, '0');
    const day = String(DateCurrent.getDate()).padStart(2, '0');
    const hours = String(DateCurrent.getHours()).padStart(2, '0');
    const minutes = String(DateCurrent.getMinutes()).padStart(2, '0');
    const seconds = String(DateCurrent.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },

  getTokenCsurf: (request) => {
    const headers = request.headers
    //---------------------------------------------------------------------------------------------------------------------------------
    const patternCsurf = `${headers["user-agent"]} ${headers["sec-ch-ua"]} ${headers["x-forwarded-for"]} ${headers["sec-ch-ua-platform"]}`
    // ไม่ใช้ x-forwarded-for เพราะ IP เปลี่ยนเมื่อ ngrok restart หรือเปลี่ยน network
    // const patternCsurf = `${headers["user-agent"]} ${headers["sec-ch-ua"]} ${headers["sec-ch-ua-platform"]}`
    //---------------------------------------------------------------------------------------------------------------------------------
    const modiText = `${patternCsurf}`.replaceAll("undefined", "").replaceAll(" ", "").trim()
    const hashedText = crypto.createHmac('sha256', process.env.KEY_SESSION).update(modiText).digest('hex')
    return hashedText
  },

  authCsurf: (authType, request, response) => {
    const username = (authType === "admin") ? request.session.user_username : (authType === "doctor") ? request.session.user_doctor : "";
    const password = (authType === "admin") ? request.session.user_password : (authType === "doctor") ? request.session.pass_doctor : "";
    const token = request.session.tokenSession

    if ((username || password) && token !== apifunc.getTokenCsurf(request)) {
      return false;
    }
    else return true
  },

  convertBuffer2Img: (data, props_img) => {
    if (typeof data === "object") return data.map(val => {
      (val[props_img]) && (val[props_img] = val[props_img].toString());
      return val
    })
    else {
      (data[props_img]) && (data[props_img] = data[props_img].toString());
      return data
    }
  }
};

module.exports = apifunc;
