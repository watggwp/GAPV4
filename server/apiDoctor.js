require('dotenv').config().parsed
const wordcut = require('thai-wordcut')
const axios = require('axios').default;
const fs = require("fs")
wordcut.init()

const {Server} = require('socket.io')
const LINE = require('./configLine');
const io = new Server()

const RichSign = process.env.RICH_SIGN
const RichHouse = process.env.RICH_HOUSE
module.exports = function apiDoctor (app , Database , apifunc , dbpacket , listDB , UrlApi , socket = io , Line = LINE) {

    app.post('/api/doctor/check' , (req , res)=>{
        if(apifunc.authCsurf("doctor" , req , res)) res.redirect('/api/doctor/auth')
        else res.clearCookie(process.env.cookieName).send("")
    })


    // API: ดึงข้อมูลการแก้ไขฟอร์มการปลูกพืช
    app.post('/api/doctor/formplant/edit/select', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection();

            try {
                const auth = await authCheck(con, res, req);
                const where = req.body.id_edit ? `AND editform.id_edit = '${req.body.id_edit}'` : '';

                con.query(
                    `
                    SELECT editform.*, COALESCE(acc_doctor.fullname_doctor, NULL) AS fullname_doctor
                    FROM editform
                    LEFT JOIN formplant ON editform.id_form = formplant.id
                    LEFT JOIN acc_doctor ON editform.id_doctor_edit = acc_doctor.id_table_doctor
                    WHERE formplant.id_farm_house = ?
                    AND formplant.id = ?
                    AND editform.type_form = "plant" \${where}
                    ORDER BY editform.date DESC
                    `,
                    [req.body.id_farmhouse, req.body.id_plant],
                    (err, result) => {
                        if (err) {
                            console.error(err);
                            con.end();
                            res.send("error auth");
                            return;
                        }

                        if (req.body.id_edit) {
                            con.query(
                                `SELECT * FROM detailedit WHERE id_edit = ?`,
                                [req.body.id_edit],
                                (err, detail) => {
                                    if (err) {
                                        console.error("select detailedit", err);
                                        con.end();
                                        res.send("error");
                                        return;
                                    }

                                    con.end();
                                    res.send({
                                        head: result[0],
                                        detail: detail,
                                    });
                                }
                            );
                        } else {
                            con.end();
                            res.send(result);
                        }
                    }
                );
            } catch (err) {
                console.error("Authorization error:", err);
                con.end();
                res.send("error auth");
            }
        } else {
            res.send("error auth");
        }
    });

    // API: บันทึกการแก้ไขข้อมูลฟอร์มการปลูกพืช
    app.post('/api/doctor/formplant/edit', async (req, res) => {
        let username = req.session.user_doctor
        let password = req.session.pass_doctor

        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }

        let con = Database.createConnection(listDB)

        apifunc.auth(con , username , password , res , "acc_doctor").then((result)=>{
            const { data : { id_table_doctor } } = result
            con.query(`
                SELECT formplant.*
                FROM formplant
                WHERE formplant.id = ?
            `, [ req.body.id_plant ],
            (err, result) => {
                if (err) {
                    con.end();
                    res.send("error auth");
                    return;
                }
                if (!result[0]) {
                    con.end();
                    res.send("not");
                    return;
                }

                const data = req.body;
                if (result[0].state_status === 0 || result[0].state_status === 1) {
                    con.query(`
                        INSERT INTO editform 
                            (id_form, id_doctor, id_doctor_edit, because, note, status, type_form)
                        VALUES 
                            (?, ?, ?, ?, ?, ?, "plant")
                    `, [data.id_plant, "", id_table_doctor, data.because || "", "", 0],
                    (err, resultEdit) => {
                        if (err) {
                            dbpacket.dbErrorReturn(con, err, res);
                            console.log("insert editform");
                            return;
                        }

                        if (resultEdit.insertId > 0) {
                            const arrUpdate = [];
                            let checkerr = false;

                            for (let subject in data.dataChange) {
                                con.query(`
                                    INSERT INTO detailedit
                                        (id_edit, subject_form, old_content, new_content)
                                    VALUES 
                                        (?, ?, ?, ?)
                                `, [resultEdit.insertId, subject, result[0][subject], data.dataChange[subject]],
                                (err, Edit) => {
                                    if (err) {
                                        dbpacket.dbErrorReturn(con, err, res);
                                        console.log("insert detailedit");
                                        checkerr = true;
                                        return;
                                    }

                                    if (Edit.insertId) {
                                        arrUpdate.push(`${subject}="${data.dataChange[subject]}"`);
                                        if (arrUpdate.length === data.num) {
                                            const strUpdate = arrUpdate.join(" , ");
                                            con.query(`
                                                UPDATE formplant 
                                                SET ${strUpdate}
                                                WHERE id = ?
                                            `, [data.id_plant],
                                            (err, update) => {
                                                if (err) {
                                                    dbpacket.dbErrorReturn(con, err, res);
                                                    console.log("update form");
                                                    return;
                                                }
                                                
                                                try {
                                                    SendToFarmerHouse(con, data.id_plant, `เจ้าหน้าที่ทำการแก้ไขแบบฟอร์มบันทึกข้อมูล\nรหัสแบบฟอร์ม ${data.id_plant}`);
                                                } catch (e) {
                                                    con.end();
                                                    console.error(e);
                                                }
                                                res.send("133");
                                            });
                                        }
                                    }
                                });
                                if (checkerr) {
                                    con.end();
                                    res.send("edit");
                                    break;
                                }
                            }
                        } else {
                            con.end();
                            res.send("edit");
                        }
                    });
                } else {
                    con.end();
                    res.send("submit");
                }
            });
        }).catch((err)=>{
            if(err == "not pass") {
                con.end()
                res.redirect('/api/logout')
            } else if( err == "connect" ) {
                res.redirect('/api/logout')
            }
        })
    });


    app.get('/api/doctor/name' , (req , res)=>{
      
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        apifunc.auth(con , username , password , res , "acc_doctor").then((result)=>{
            con.end()
            res.send(result['data'].fullname_doctor)
        }).catch((err)=>{
            if(err == "not pass") {
                con.end()
                res.redirect('/api/logout')
            } else if( err == "connect" ) {
                res.redirect('/api/logout')
            }
        })
    })

    app.post('/api/doctor/data/list' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
     
        if(username === '' || password === '') {
          res.redirect('/api/logout')
          return 0
        }
        let con = Database.createConnection(listDB)
        try {
          const auth = await apifunc.auth(con , username , password , res , "acc_doctor")
          if(auth['result'] === "pass") {
            let data = req.body
     
            const type_data = (
              data.type === "plant" ? "plant_list" :
              data.type === "station" ? "station_list" :
              data.type === "chemical" ? "chemical_list" :
              data.type === "pest" ? "pests" :
              ""
            );
            const Limit = isNaN(parseInt(data.limit)) ? 0 : parseInt(data.limit);
            const StartRow = isNaN(parseInt(data.startRow)) ? 0 : parseInt(data.startRow);
            if(!type_data) {
              res.send([])
            }
     
            const columnName = (
              data.type === "pest" ? "pest_name" : "name"
            )
     
            con.query(
              `
              SELECT * FROM ${type_data}
              WHERE INSTR( ${columnName} , ? )
              ORDER BY is_use DESC , ${columnName} ASC
              LIMIT ${Limit} OFFSET ${StartRow}
              ` , [data.textSearch]
              , (err , result)=>{
              if(err) {
                dbpacket.dbErrorReturn(con , err , res)
                console.log(`select ${type_data} err`)
                return 0
              }
              con.end()
              res.send(result)
            })
          }
        } catch (err) {
          con.end()
          if(err == "not pass") {
            res.redirect('/api/logout')
          }
        }
      })

      app.post('/api/doctor/group/gets', async (req, res) => {
        let username = req.session.user_doctor;
        let password = req.session.pass_doctor;
     
        if (!username || !password) {
          res.redirect('/api/logout');
          return;
        }
     
        let con = Database.createConnection(listDB);
     
        try {
          const auth = await apifunc.auth(con, username, password, res, "acc_doctor");
          if (auth['result'] === "pass") {
            const { search } = req.body
            con.query(
              `
              SELECT
                pc.id,
                pc.safe_days,
                p.pest_name AS pest_name,
                c.name AS chemical_name,
                pl.name AS plant_name,
                pc.status AS status
              FROM pest_chemical AS pc
              INNER JOIN pests AS p ON pc.pest_id = p.pest_id
              INNER JOIN chemical_list AS c ON pc.chemical_id = c.id
              INNER JOIN plant_list AS pl ON pc.plant_id = pl.id
              WHERE p.pest_name LIKE ? OR c.name LIKE ? OR pl.name LIKE ? OR pc.safe_days LIKE ?
              `, [ `%${search}%` , `%${search}%` , `%${search}%` , `%${search}%` ] ,
              (err, results) => {
                if (err) {
                  console.error("Database query error:", err);
                  con.end();
                  res.status(500).json({ error: "Database query failed" });
                  return;
                }
     
                if (results.length === 0) {
                  console.log("No data found");
                  con.end();
                  res.status(404).json({ message: "No data found" });
                  return;
                }
     
                console.log("Data retrieved successfully:", results);
                con.end();
                res.status(200).json(results); // ส่งข้อมูลกลับไป
              }
            );
          } else {
            res.status(401).json({ error: "Unauthorized access" });
          }
        } catch (err) {
          console.error("Unexpected error:", err);
          con.end();
          res.status(500).json({ error: "Internal server error" });
        }
      });

      app.post('/api/doctor/group/get', async (req, res) => {
        let username = req.session.user_doctor;
        let password = req.session.pass_doctor;
     
        if (!username || !password) {
          res.redirect('/api/logout');
          return;
        }
     
        let con = Database.createConnection(listDB);
     
        try {
          const auth = await apifunc.auth(con, username, password, res, "acc_doctor");
          if (auth['result'] === "pass") {
            con.query(
              `
              SELECT
                pc.id,
                pc.safe_days,
                pc.pest_id as pest_id,
                pc.chemical_id as chemical_id,
                pc.plant_id as plant_id,
                pt.type_pest as type_pest
              FROM pest_chemical AS pc
              LEFT JOIN pests pt ON pt.pest_id = pc.pest_id
              WHERE pc.id = ?
              `,
              [req.body.id] ,
              (err, results) => {
                if (err) {
                  console.error("Database query error:", err);
                  con.end();
                  res.status(500).json({ error: "Database query failed" });
                  return;
                }
     
                if (results.length === 0) {
                  console.log("No data found");
                  con.end();
                  res.status(404).json({ message: "No data found" });
                  return;
                }
     
                console.log("Data retrieved successfully:", results);
                con.end();
                res.status(200).json(results); // ส่งข้อมูลกลับไป
              }
            );
          } else {
            res.status(401).json({ error: "Unauthorized access" });
          }
        } catch (err) {
          console.error("Unexpected error:", err);
          con.end();
          res.status(500).json({ error: "Internal server error" });
        }
      });

      app.post('/api/doctor/group/edit' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
     
        if(username === '' || password === '') {
          res.redirect('/api/logout')
          return 0
        }
        let con = Database.createConnection(listDB)
        try {
          const auth = await apifunc.auth(con , username , password , res , "acc_doctor")
          if(auth['result'] === "pass") {
            const id = req.body.id
            const pest_id = req.body.pest_id
            const chemical_id = req.body.chemical_id
            const plant_id = req.body.plant_id
            const safe_days = req.body.safe_days
     
            if(id && pest_id && chemical_id && plant_id && safe_days) {
              con.query(
                `
                  UPDATE pest_chemical
                    SET
                      pest_id = ?,
                      chemical_id = ?,
                      plant_id = ?,
                      safe_days = ?
                    WHERE id = ? AND NOT EXISTS (
                      SELECT 1
                      FROM pest_chemical
                      WHERE pest_id = ? AND chemical_id = ? AND plant_id = ? AND NOT id = ?
                    )
                `
                , [
                    pest_id , chemical_id , plant_id , safe_days , id ,
                    pest_id , chemical_id , plant_id , id
                  ] , (err , dataUpdate) => {
                  if(err) {
                    console.log(err)
                    res.send({
                      status : 403,
                      result : "err insert"
                    })
                  }
     
                  if(dataUpdate.changedRows) {
                    con.query(
                      `
                        UPDATE pest_chemical SET safe_days = ?
                        WHERE chemical_id = ? AND plant_id = ?
                      ` , [ safe_days , chemical_id , plant_id ] ,
                      (err , updateSafeDate) => {
                        console.log(err)
                        con.end()
     
                        res.send({
                          status : 200,
                          result : "update group"
                        })
                      }
                    )
                  } else {
                    res.send({
                      status : 409,
                      result : "insert group"
                    })
                  }
                }
              )
            }
          }
        } catch (err) {
          con.end()
          if(err == "not pass") {
            res.redirect('/api/logout')
          }
        }
      })
     
      app.post('/api/doctor/group/insert' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
     
        if(username === '' || password === '') {
          res.redirect('/api/logout')
          return 0
        }
        let con = Database.createConnection(listDB)
        try {
          const auth = await apifunc.auth(con , username , password , res , "acc_doctor")
          if(auth['result'] === "pass") {
            const pest_id = req.body.pest_id
            const chemical_id = req.body.chemical_id
            const plant_id = req.body.plant_id
            const safe_days = req.body.safe_days
     
            if(pest_id && chemical_id && plant_id && safe_days) {
              con.query(
                `
                  INSERT INTO pest_chemical
                    ( pest_id , chemical_id , plant_id , safe_days )
                  SELECT ? , ? , ? , ?
                  WHERE NOT EXISTS (
                      SELECT 1
                      FROM pest_chemical
                      WHERE pest_id = ? AND chemical_id = ? AND plant_id = ?
                  )
                `
                , [
                    pest_id , chemical_id , plant_id , safe_days ,
                    pest_id , chemical_id , plant_id
                  ] , (err , dataInsert) => {
                  if(err) {
                    console.log(err)
                    res.send({
                      status : 403,
                      result : "err insert"
                    })
                  }
     
                  if(dataInsert.affectedRows) {
                    con.query(
                      `
                        UPDATE pest_chemical SET safe_days = ?
                        WHERE chemical_id = ? AND plant_id = ?
                      ` , [ safe_days , chemical_id , plant_id ] ,
                      (err , updateSafeDate) => {
                        console.log(err)
                        con.end()
     
                        res.send({
                          status : 200,
                          result : "insert group"
                        })
                      }
                    )
                  } else {
                    res.send({
                      status : 409,
                      result : "insert group"
                    })
                  }
                }
              )
            }
          }
        } catch (err) {
          con.end()
          if(err == "not pass") {
            res.redirect('/api/logout')
          }
        }
      })

      app.post('/api/doctor/manage/group', async (req, res) => {
        let username = req.session.user_doctor;
        let password = req.body['password'];
     
        // ตรวจสอบว่าแอดมินเข้าสู่ระบบหรือไม่
        if (username === '') {
            res.redirect('/api/logout');
            return;
        }
     
        let con = Database.createConnection(listDB);
        console.log(req.body);
     
        try {
            // ตรวจสอบสิทธิ์แอดมิน
            const auth = await apifunc.auth(con, username, password, res, "acc_doctor");
            if (auth['result'] === "pass") {
                let { id, status } = req.body;
     
                // ตรวจสอบข้อมูลที่ส่งมา
                if (id === undefined || (status !== 0 && status !== 1)) {
                    con.end();
                    return res.status(400).send({ message: "Invalid ID or status value" });
                }
     
                // ตรวจสอบว่ามีข้อมูลนี้อยู่หรือไม่
                con.query(
                    `SELECT id FROM pest_chemical WHERE id = ?`,
                    [id],
                    (err, result) => {
                        if (err) {
                            con.end();
                            console.error("Database error:", err);
                            return res.status(500).send({ message: "Database query error" });
                        }
     
                        if (result.length === 0) {
                            con.end();
                            return res.status(404).send({ message: "ID not found" });
                        }
     
                        // อัปเดตสถานะ
                        con.query(
                            `UPDATE pest_chemical SET status = ? WHERE id = ?`,
                            [status, id],
                            (err, updateResult) => {
                                if (err) {
                                    con.end();
                                    console.error("Update error:", err);
                                    return res.status(500).send({ message: "Update error" });
                                }
     
                                con.end();
                                res.send({
                                  message: `Status updated to ${status} successfully`,
                                  id,
                                  newStatus : status,
                                  status : 200
                                });
                            }
                        );
                    }
                );
            } else {
                con.end();
                res.send({ message: "password" });
            }
        } catch (err) {
            con.end();
            console.error("Authentication error:", err);
            res.status(500).send({ message: "Authentication error" });
        }
    });

    app.get('/api/doctor/profile/get' , (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        apifunc.auth(con , username , password , res , "acc_doctor").then((result)=>{
            con.query(
                `
                SELECT name,id_station
                FROM station_list
                WHERE id = ?
                ` , [result['data'].station_doctor] , 
                (err , station) => {
                    con.end()
                    result['data'].img_doctor = result['data'].img_doctor.toString()

                    delete result['data']["password_doctor"]
                    res.send({
                        ...result['data'] ,
                        name_station : station[0].name,
                        id_station : station[0].id_station
                    })
                }
            )
        }).catch((err)=>{
            if(err == "not pass") {
                con.end()
                res.redirect('/api/logout')
            } else if( err == "connect" ) {
                res.redirect('/api/logout')
            }
        })
    })

    app.post('/api/doctor/profile/image/edit' , (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        apifunc.auth(con , username , password , res , "acc_doctor").then((result)=>{
            con.query(
                `
                UPDATE acc_doctor
                SET img_doctor = ?
                WHERE id_table_doctor = ?
                ` , [ req.body.img , result["data"].id_table_doctor ] , 
                (err , resultEdit) => {
                    con.end()
                    res.send("1")
                }
            )
        }).catch((err)=>{
            if(err == "not pass") {
                con.end()
                res.redirect('/api/logout')
            } else if( err == "connect" ) {
                res.redirect('/api/logout')
            }
        })
    })

    app.post('/api/doctor/profile/text/edit' , (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        apifunc.auth(con , username , password , res , "acc_doctor").then((result)=>{
            const SET = req.body.type === "name" ? "fullname_doctor = ?" :
                            req.body.type === "station" ? "station_doctor = ?" :
                            req.body.type === "passwordNew" ? "password_doctor = SHA2( ? , 256)" : ""
            if(SET) {
                con.query(
                    `
                    UPDATE acc_doctor
                    SET ${SET}
                    WHERE id_table_doctor = ?
                    ` , [ req.body.value , result["data"].id_table_doctor ] , 
                    (err , resultEdit) => {
                        if(!err) {
                            if(req.body.type === "passwordNew") {
                                req.session.pass_doctor = req.body.value
                            }
                            con.end()
                            res.send("1")
                        } else {
                            con.end()
                            res.send("")
                        }
                    }
                )
            } else {
                res.send("")
            }
        }).catch((err)=>{
            if(err == "not pass") {
                con.end()
                res.send('password')
            } else if( err == "connect" ) {
                res.send("")
            }
        })
    })
    
    app.post('/api/doctor/checkline' , (req , res)=>{
        let con = Database.createConnection(listDB)
        con.connect((err)=>{
            if (!err) {
                con.query(`
                    SELECT id_doctor 
                    FROM acc_doctor 
                    WHERE uid_line_doctor = ?` , 
                    [ req.body['id'] ] ,
                    (err , result)=>{
                    con.end()
                    if (result[0]) {
                        res.send(result[0]['id_doctor'])
                    } else {
                        res.send('')
                    }
                })
            } else {
                res.send('')
            }
        })
    })
    
    app.post('/api/doctor/savePersonal' , (req , res)=>{
        let username = req.body['username'] ?? '';
        let password = req.body['password'] ?? '';
    
        if(username === '' || password === '' || (req.hostname !== HOST_CHECK) || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        // Database.resume()
    
        apifunc.auth(con , username , password , res , "acc_doctor").then((result)=>{
            if(result['result'] === "pass") {
                if (result['data']['status_account'] == 0
                        || result['data']['status_delete'] == 1) {
                    con.end()
                    res.send('account')
                }
                else {
                    const fullname = req.body['firstname'] + " " + req.body['lastname']
                    con.query(
                        `
                        UPDATE acc_doctor SET fullname_doctor = ? , station_doctor = ? WHERE id_doctor = ?
                        `
                    , [fullname , req.body['station'] , username]
                    , (err , val)=>{
                        if (err) {
                            dbpacket.dbErrorReturn(con, err, res);
                            console.log("query");
                            return 0
                        }
                        if(val['changedRows'] == 1){
                            req.session.tokenSession = apifunc.getTokenCsurf(req)
                            req.session.user_doctor = username
                            req.session.pass_doctor = password
                            res.send('pass')
                        } else {
                            console.log("update error")
                            res.send('error')
                        }
                        con.end()
                    })
                }
            }
        }).catch((err)=>{
            console.log(err)
            if(err == "not pass") {
                res.send('password')
                con.end()
            } else if( err == "connect" ) {
                res.redirect('/api/logout')
            }
        })
    })
    
    app.all('/api/doctor/auth' , (req , res)=>{
        // เช็คการเข้าสู่ระบบจริงๆ

        let username = req.session.user_doctor ?? req.body['username'] ?? '';
        let password = req.session.pass_doctor ?? req.body['password'] ?? '';
        let role = req.session.role_doctor ?? req.body['role'] ?? '';

        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
        // Database.resume()
    
        apifunc.auth(con , username , password , res , "acc_doctor" , role).then((result)=>{
            if(result['result'] === "pass") {
                if (result['data']['status_account'] == 0
                        || result['data']['status_delete'] == 1) {
                    con.end()
                    res.send('account')
                }
                else if(result['data']['fullname_doctor'] 
                        && result['data']['station_doctor']) {
                      
                    req.session.tokenSession = apifunc.getTokenCsurf(req)
                    req.session.user_doctor = username
                    req.session.pass_doctor = password
                    req.session.role_doctor = role
                    
                    if(req.body.uid_line) {
                        con.query(
                            `
                            UPDATE acc_doctor 
                            SET uid_line_doctor = ?
                            WHERE id_table_doctor = ? and uid_line_doctor != ?
                            ` , [ req.body.uid_line , result.data.id_table_doctor , req.body.uid_line ] ,
                            (err , uid) => {
                                con.end()
                                if(!err) if(uid.changedRows != 0) Line.pushMessage(req.body.uid_line , {type : "text" , text : "เชื่อมต่อบัญชีเจ้าหน้าที่กับบัญชีไลน์เรียบร้อยค่ะ"}).catch((e)=>{})
                            }
                        )
                    } else {
                        con.end()
                    }
                    res.send('pass')
                } else {
                    con.end()
                    res.send(`wait:${username}`)
                }
            }
        }).catch((err)=>{
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            } else if( err == "connect" ) {
                res.redirect('/api/logout')
            } else {
                res.redirect('/api/logout')
            }
        })
    
    })

    app.post('/api/doctor/station/list' , (req , res)=>{
        let con = Database.createConnection(listDB)
        con.connect(( err )=>{
            if (err) {
                dbpacket.dbErrorReturn(con, err, res);
                console.log("connect");
                return 0;
            }

            con.query(`SELECT id, name, id_station FROM station_list WHERE is_use = 1` , (err , result)=>{
                if (err) {
                    dbpacket.dbErrorReturn(con, err, res);
                    console.log("query");
                    return 0
                }
                con.end()
                res.send(result)
                
            })
        })
    })

    app.post('/api/doctor/plant/list' , (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        apifunc.auth(con , username , password , res , "acc_doctor").then((result)=>{
            if(result['result'] === "pass") {
                con.query(
                    `
                    SELECT name , 
                    (
                        SELECT COUNT(name_plant)
                        FROM formplant , 
                            (
                                SELECT id_farm_house 
                                FROM housefarm , 
                                    (
                                        SELECT uid_line , link_user
                                        FROM acc_farmer
                                        WHERE (register_auth = 0 OR register_auth = 1) and station = ?
                                    ) as farmer
                                WHERE housefarm.uid_line = farmer.uid_line OR housefarm.link_user = farmer.link_user
                            ) as house
                        WHERE formplant.name_plant = plant_list.name and house.id_farm_house = formplant.id_farm_house
                    ) as countPlant
                    FROM plant_list
                    WHERE is_use = 1
                    ORDER BY name
                    ` , [result.data.station_doctor]
                    , (err , result)=>{
                    if (err) {
                        dbpacket.dbErrorReturn(con, err, res);
                        console.log("query");
                        return 0
                    }
                    con.end()
                    res.send(result)
                    
                })
            }
        }).catch((err)=>{
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        })
    })

    app.post('/api/doctor/farmer/get/count' , (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        apifunc.auth(con , username , password , res , "acc_doctor").then((result)=>{
            if(result['result'] === "pass") {
                const queryType = req.body.auth === 1 ?
                                    `
                                    SELECT id_table , link_user
                                    FROM acc_farmer
                                    WHERE link_user = ? and register_auth = 1 and station = ?
                                    ORDER BY date_register DESC
                                    ` :
                                    `
                                    SELECT id_table , link_user
                                    FROM acc_farmer
                                    WHERE id_table = ? and register_auth = ? and station = ?
                                    ORDER BY date_register DESC
                                    `
                const queryParams = req.body.auth === 1 ? [ req.body.link_user , result['data']['station_doctor'] ] : [ req.body.id_table , req.body.auth === 0 ? 0 : 2 , result['data']['station_doctor'] ]
                
                con.query(queryType, queryParams , (err , result)=>{
                    if (err){
                        dbpacket.dbErrorReturn(con , err , res)
                        return 0
                    };
    
                    con.end()
                    res.send(result)
                })
            }
        }).catch((err)=>{
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        })
    })

    app.post('/api/doctor/farmer/get/detail' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
        try {
            const result = await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                con.query(
                    `
                    SELECT * 
                    FROM acc_farmer
                    WHERE id_table = ? and link_user = ? and station = ?
                    ` , [ req.body.id_table , req.body.link_user , result['data']['station_doctor'] ]
                    , (err , result)=>{
                    if (err){
                        dbpacket.dbErrorReturn(con , err , res)
                        return 0
                    };

                    const listFarmer = ProfileConvertImg(result , "img")
    
                    con.end()
                    res.send(listFarmer)
                })
            }
        } catch(err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/farmer/edit' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
        try {
            const result = await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                delete req.body.password
                const img = req.body.img ? `img = "${req.body.img}"` : "";
                const id = req.body.id_farmer ? `id_farmer = "${req.body.id_farmer}"` : "";
                const fullname = req.body.fullname ? `fullname = "${req.body.fullname}"` : "";
                const location = req.body.lag && req.body.lng ? `location = POINT(${req.body.lag} , ${req.body.lng})` : "";
                const station = req.body.station ? `station = "${req.body.station}"` : "";
                const tel_number = req.body.tel_number ? `tel_number = "${req.body.tel_number}"` : "";
                const text_location = req.body.text_location ? `text_location = "${req.body.text_location}"` : "";
                const newPassword = req.body.newPassword ? `password = SHA2("${req.body.newPassword}" , 256)` : "";
                
                const SET = [img , id , fullname , location , station , tel_number , text_location , newPassword].filter(val=>val).join(" , ").replaceAll(" " , "")

                if(SET) {
                    const checkProfile = await new Promise((resole , reject)=>{
                        con.query(
                            `
                            SELECT uid_line , station
                            FROM acc_farmer
                            WHERE id_table = ? and register_auth = 1 and station = ?
                            ` , [ req.body.id_table , result["data"].station_doctor ] , 
                            async (err , resultSelect) => {
                                if(!err && resultSelect.length != 0) {
                                    try {
                                        const Station = await new Promise( async (resole , reject)=>{
                                            con.query(
                                                `
                                                SELECT name
                                                FROM station_list
                                                WHERE id = ?
                                                ` , [req.body.station ? req.body.station : 0] , async (err , Station) => {
                                                    resole(Station)
                                                }
                                            )
                                        })

                                        const dataSend = {
                                            type : "text" , 
                                            text : `ผู้ส่งเสริม ${result["data"].fullname_doctor}\n\n`+
                                                    `ทำการเปลี่ยนข้อมูลของท่าน :`+
                                                    `${req.body.id_farmer ? `\nรหัสประจำตัวเกษตกร : ${req.body.id_farmer}` : ""}`+
                                                    `${req.body.fullname ? `\nชื่อ : ${req.body.fullname}` : ""}`+
                                                    `${req.body.tel_number ? `\nเบอร์โทร : ${req.body.tel_number}` : ""}`+
                                                    `${req.body.text_location ? `\nที่อยู่ : ${req.body.text_location}` : ""}`+
                                                    `${req.body.station ? `\nศูนย์ในการดูแล : ${Station[0] ? Station[0].name : ""}` : ""}`+
                                                    `${req.body.newPassword ? `\nรหัสผ่าน : ${req.body.newPassword}` : ""}`+
                                                    `${req.body.img ? `\nรูปภาพ :` : ""}`
                                        }
                                        await Line.pushMessage(resultSelect[0].uid_line , dataSend).catch(e=>{})

                                        if(req.body.img) {
                                            await new Promise( async (resole , reject) => {
                                                await Line.pushMessage(resultSelect[0].uid_line , {
                                                    "type": "image",
                                                    "originalContentUrl": `${UrlApi}/image/farmer/${req.body.id_table}`,
                                                    "previewImageUrl": `${UrlApi}/image/farmer/${req.body.id_table}`
                                                }).catch(e=>{})
                                                resole("")
                                            })
                                        }

                                        if(req.body.lag && req.body.lng) {
                                            await new Promise( async (resole , reject)=>{
                                                await Line.pushMessage(resultSelect[0].uid_line , {
                                                    type : "location",
                                                    title : "ตำแหน่งที่ตั้งที่แก้ไข",
                                                    address : "คลิกตรวจสอบ",
                                                    latitude : req.body.lag,
                                                    longitude : req.body.lng
                                                }).catch(e=>{})
                                                resole("")
                                            })
                                        }
                                        resole(true)
                                    } catch(e) {
                                        resole(false)
                                    }
                                } else {
                                    resole(false)
                                }
                            }
                        )  
                    }) 

                    if(checkProfile) {
                        con.query(
                            `
                                UPDATE acc_farmer
                                SET ${SET}
                                WHERE id_table = ?
                            ` , [ req.body.id_table ] , 
                            (err , resultEdit) => {
                                con.end()
                                if(!err) res.send("1")
                                else res.send("not edit")
                            }
                        )
                    } else {
                        res.send("not profile")
                    }
                } else {
                    res.send("value")
                }
            }
        } catch(err) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            } else {
                res.send("")
            }
        }
    })

    app.post('/api/doctor/farmer/get/account/confirm' , (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        apifunc.auth(con , username , password , res , "acc_doctor").then((result)=>{
            if(result['result'] === "pass") {
                con.query(
                    `
                    SELECT id_doctor , fullname_doctor , img_doctor
                    FROM acc_doctor
                    WHERE id_table_doctor = ?
                    ` , [ req.body.id_table_doctor ]
                    , (err , result)=>{
                    if (err){
                        dbpacket.dbErrorReturn(con , err , res)
                        return 0
                    };

                    const listFarmer = ProfileConvertImg(result , "img_doctor")
    
                    con.end()
                    res.send(listFarmer)
                })
            }
        }).catch((err)=>{
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        })
    })
    
    app.post('/api/doctor/farmer/list', (req, res) => {
        let username = req.session.user_doctor;
        let password = req.session.pass_doctor;
    
        console.log("🔹 Received API Request: /api/doctor/farmer/list");
        console.log("🔹 Request Body:", req.body);
        console.log("🔹 Session Data - Username:", username, "Password:", password ? "******" : "Not Set");
    
        if (username === '' || password === '' || !apifunc.authCsurf("doctor", req, res)) {
            console.log("🔴 Authentication Failed: Redirecting to Logout");
            res.redirect('/api/logout');
            return;
        }
    
        let con = Database.createConnection(listDB);
    
        apifunc.auth(con, username, password, res, "acc_doctor").then((result) => {
            if (result['result'] === "pass") {
                console.log("✅ Authentication Successful:", result['data']);
    
                const Limit = isNaN(parseInt(req.body.limit)) ? 10 : req.body.limit; // ตั้งค่าดีฟอลต์เป็น 10
                console.log("🔹 Query Limit:", Limit);
    
                let queryType;
                let queryParams;
    
                if (req.body.approve === 0) {
                    queryType = `
                    SELECT filterFarmer.* , 
                    (
                        SELECT date FROM message_user
                        WHERE message_user.uid_line_farmer = acc_farmer.uid_line 
                              AND COALESCE(JSON_CONTAINS(id_read, '"read"', '$."?"'), 0) = 0
                              AND type = ""
                        ORDER BY message_user.date DESC
                        LIMIT 1
                    ) as is_msg
                    FROM acc_farmer, 
                    (
                        SELECT id_table, img, date_register, fullname, link_user, uid_line, 
                        (
                            SELECT EXISTS (
                                SELECT id_table FROM acc_farmer AS farmer
                                WHERE farmer.uid_line = acc_farmer.uid_line 
                                      AND station = ? 
                                      AND register_auth = 1
                            )
                        ) as CheckOver
                        FROM acc_farmer 
                        WHERE station = ? 
                              AND register_auth = 0
                    ) as filterFarmer
                    WHERE filterFarmer.id_table = acc_farmer.id_table 
                          AND filterFarmer.CheckOver != 1
                          AND (INSTR(acc_farmer.id_farmer, ?) OR INSTR(acc_farmer.fullname, ?))
                    ORDER BY is_msg DESC, filterFarmer.date_register ASC
                    LIMIT ${Limit};`;
                    
                    queryParams = [result['data']['id_table_doctor'], result['data']['station_doctor'], result['data']['station_doctor'], req.body.textSearch, req.body.textSearch];
                } else if (req.body.approve === 1) {
                    queryType = `
                    SELECT acc_farmer.id_table, acc_farmer.img, acc_farmer.fullname, acc_farmer.link_user, acc_farmer.date_register,
                           farmer_main.Count, acc_farmer.date_doctor_confirm, acc_farmer.uid_line,
                    (
                        SELECT fullname_doctor
                        FROM acc_doctor
                        WHERE acc_doctor.id_table_doctor = acc_farmer.id_table_doctor
                    ) as name_doctor,
                    (
                        SELECT date FROM message_user
                        WHERE message_user.uid_line_farmer = (
                                  SELECT uid_line FROM acc_farmer AS farmer_check
                                  WHERE farmer_check.link_user = acc_farmer.link_user
                                  ORDER BY date_register DESC
                                  LIMIT 1
                              )
                              AND COALESCE(JSON_CONTAINS(id_read, '"read"', '$."?"'), 0) = 0
                              AND type = ""
                        ORDER BY message_user.date DESC
                        LIMIT 1
                    ) as is_msg
                    FROM acc_farmer, 
                    (
                        SELECT MAX(date_register) as DateLast, link_user, COUNT(link_user) as Count
                        FROM acc_farmer 
                        WHERE station = ? AND register_auth = 1
                        GROUP BY link_user
                    ) as farmer_main
                    WHERE acc_farmer.link_user = farmer_main.link_user 
                          AND acc_farmer.date_register = farmer_main.DateLast
                          AND (INSTR(acc_farmer.id_farmer, ?) OR INSTR(acc_farmer.fullname, ?))
                    ORDER BY is_msg DESC, date_register DESC
                    LIMIT ${Limit};`;
    
                    queryParams = [result['data']['id_table_doctor'], result['data']['station_doctor'], req.body.textSearch, req.body.textSearch];
                } else {
                    queryType = `
                    SELECT filterFarmer.*, 
                    (
                        SELECT date FROM message_user
                        WHERE message_user.uid_line_farmer = acc_farmer.uid_line 
                              AND COALESCE(JSON_CONTAINS(id_read, '"read"', '$."?"'), 0) = 0
                              AND type = ""
                        ORDER BY message_user.date DESC
                        LIMIT 1
                    ) as is_msg
                    FROM acc_farmer, 
                    (
                        SELECT id_table, img, date_register, fullname, link_user, uid_line, 
                        (
                            SELECT EXISTS (
                                SELECT id_table FROM acc_farmer AS farmer
                                WHERE farmer.uid_line = acc_farmer.uid_line 
                                      AND (register_auth = 1 OR register_auth = 0)
                            )
                        ) as CheckOver
                        FROM acc_farmer 
                        WHERE station = ? 
                              AND register_auth = 2
                    ) as filterFarmer
                    WHERE filterFarmer.id_table = acc_farmer.id_table 
                          AND filterFarmer.CheckOver != 1
                          AND (INSTR(acc_farmer.id_farmer, ?) OR INSTR(acc_farmer.fullname, ?))
                    ORDER BY is_msg DESC, filterFarmer.date_register ASC
                    LIMIT ${Limit};`;
    
                    queryParams = [result['data']['id_table_doctor'], result['data']['station_doctor'], req.body.textSearch, req.body.textSearch];
                }
    
                console.log("🔹 SQL Query:", queryType);
                console.log("🔹 Query Parameters:", queryParams);
    
                con.query(queryType, queryParams, (err, result) => {
                    if (!err) {
                        console.log("✅ Query Successful: Records Found:", result.length);
                        const listFarmer = ProfileConvertImg(result, "img");
                        con.end();
                        res.send(listFarmer);
                    } else {
                        console.error("❌ SQL Error:", err);
                        con.end();
                        res.send("");
                    }
                });
    
            }
        }).catch((err) => {
            con.end();
            console.error("❌ Authentication Error:", err);
            if (err == "not pass") {
                res.redirect('/api/logout');
            }
        });
    });
    

    app.post('/api/doctor/farmer/account/comfirm' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result = await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const OverAccount = await new Promise((resole , reject)=>{
                    con.query(
                        `
                        SELECT (
                            SELECT EXISTS (
                                SELECT id_table
                                FROM acc_farmer ,
                                (
                                    SELECT uid_line 
                                    FROM acc_farmer
                                    WHERE id_table = ?
                                ) as getUser
                                WHERE acc_farmer.uid_line = getUser.uid_line and register_auth = 1
                            )
                        ) as checkOver
                        ` , [ req.body.id_table ] , (err , check)=>{
                            resole(parseInt(check[0].checkOver))
                        }
                    )
                })

                if(!OverAccount) {
                    const convert= await new Promise((resole , reject)=> {
                        con.query(
                            `
                            SELECT link_user , uid_line , fullname
                            FROM acc_farmer
                            WHERE id_table = ? and register_auth = 1 and station = ?
                            ` , [ req.body.id_table_convert , result['data']['station_doctor'] ]
                            , (err , result)=>{
                            if (err){
                                dbpacket.dbErrorReturn(con , err , res)
                                return 0
                            };
        
                            resole(result)
                        })
                    })
    
                    let Link_user = ""
                    if(convert[0]){
                        if(convert[0].link_user.indexOf("cvpf-") >= 0) Link_user = convert[0].link_user
                        else Link_user = `cvpf-${new Date().getTime()}${convert[0].link_user.slice(0 , 3)}`
                        
                        if(convert[0].link_user != Link_user) {
                            await new Promise((resole , reject)=> {
                                con.query(
                                    `
                                    UPDATE acc_farmer 
                                    SET link_user = ?
                                    WHERE register_auth = 1 and id_table = ? and station = ?
                                    `,[ Link_user , req.body.id_table_convert , result['data']['station_doctor'] ],
                                    (err, result )=>{
                                        if (err){
                                            dbpacket.dbErrorReturn(con , err , res)
                                            return 0
                                        };
            
                                        con.query(
                                            `
                                            UPDATE housefarm 
                                            SET link_user = ?
                                            WHERE uid_line = ?
                                            ` , [ Link_user , convert[0].uid_line ] ,
                                            (err, result ) => {
                                                if (err){
                                                    dbpacket.dbErrorReturn(con , err , res)
                                                    return 0
                                                };
                                                try {
                                                    Line.pushMessage(convert[0].uid_line , {
                                                        type : "text",
                                                        text : `คุณได้ทำการเชื่อมบัญชีเรียบร้อย \u2764`
                                                    }).catch(e=>{})
                                                } catch(e) {}
                                                resole(1)
                                            }
                                        )
                                    }
                                )
                            })
                        }
                    }
    
                    const statusChange = req.body.status_change === 0 ? 0 : 2;
                    const LinkUserParams = Link_user ? [ Link_user ] : []
                    con.query(
                        `
                        UPDATE acc_farmer 
                        SET 
                            register_auth = 1 , 
                            id_table_doctor = ? , 
                            date_doctor_confirm = ? ,
                            id_farmer = ?
                            ${Link_user ? `, link_user = ?` : ""}
                        WHERE register_auth = ? and id_table = ? and station = ?
                        `,[ result['data']['id_table_doctor'] , new Date() , req.body.id_farmer , ...LinkUserParams , statusChange , req.body.id_table , result['data']['station_doctor'] ],
                        async (err, result )=>{
                            if (!err){
                                if(Link_user) {
                                    con.query(
                                        `
                                        UPDATE housefarm 
                                        SET link_user = ?
                                        WHERE uid_line = ?
                                        ` , [ Link_user , req.body.uid_line ] ,
                                        async (err, result ) => {
                                            con.end()
                                            try {
                                                Line.pushMessage(req.body.uid_line , {
                                                    type : "text",
                                                    text : `บัญชีผ่านการตรวจสอบแล้วนะคะ \nและมีการเชื่อมบัญชีกับคุณ ${convert[0].fullname}\u2764`
                                                }).catch(e=>{})
                                            } catch(e) {}
                                            try {
                                                await Line.unlinkRichMenuFromUser(req.body.uid_line)
                                            } catch(e) {}
                                            try {
                                                Line.linkRichMenuToUser(req.body.uid_line , RichHouse)
                                            } catch(e) {}
                                        }
                                    )
                                } else {
                                    con.end()
                                    try {
                                        Line.pushMessage(req.body.uid_line , {
                                            type : "text",
                                            text : "บัญชีผ่านการตรวจสอบแล้วนะคะ \u2764"
                                        }).catch(e=>{})
                                    } catch (e) {}
                                    try {
                                        await Line.unlinkRichMenuFromUser(req.body.uid_line)
                                    } catch(e) {}
                                    try {
                                        Line.linkRichMenuToUser(req.body.uid_line , RichHouse)
                                    } catch(e) {}
                                }
                                res.send("113")
                            } else {
                                con.end()
                                res.send("not account")
                            }
                        }
                    )
                } else {
                    con.end()
                    res.send("over")
                }
            }
        } catch (err ) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            }
        } 
    })

    app.post('/api/doctor/farmer/account/cancel' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result = await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                con.query(
                    `
                    UPDATE acc_farmer 
                    SET 
                        register_auth = 2 , 
                        date_doctor_confirm = ? ,
                        id_table_doctor = ?
                    WHERE id_table = ? and (register_auth = 0 || register_auth = 1)
                    ` , [new Date() , result['data']['id_table_doctor'] , req.body.id_table] , 
                    (err, result ) => {
                        if (err){
                            dbpacket.dbErrorReturn(con , err , res)
                            return 0
                        };
                        
                        con.query(
                            `
                                SELECT uid_line
                                FROM acc_farmer
                                WHERE id_table = ?
                            ` , [ req.body.id_table ] , 
                            async (err , check) => {
                                con.end()
                                if(!err , check[0]) {
                                    try {
                                        Line.pushMessage(check[0].uid_line , {
                                            type : "text",
                                            text : "บัญชีไม่ผ่านการตรวจสอบ กรุณาส่งข้อความเพื่อพูดคุยกับเจ้าหน้าที่ หรือสมัครบัญชีอีกครั้งนะคะ \u2764"
                                        }).catch(e=>{})
                                    } catch (e) {}
                                    try {
                                        await Line.unlinkRichMenuFromUser(check[0].uid_line)
                                    } catch (e) {}
                                    try {
                                        Line.linkRichMenuToUser(check[0].uid_line , RichSign)
                                    } catch(e) {}
                                }
                            }
                        )
                        res.send("113")
                    }
                )
            }
        } catch (err ) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            }
        } 
    })

    app.post('/api/doctor/farmer/convert/list' , (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        apifunc.auth(con , username , password , res , "acc_doctor").then((result)=>{
            if(result['result'] === "pass") {
                const Limit = isNaN(parseInt(req.body.limit)) ? 0 : req.body.limit;
                con.query(
                    `
                    SELECT acc_farmer.id_table , acc_farmer.fullname , acc_farmer.img , acc_farmer.id_farmer
                    FROM acc_farmer , 
                    (
                        SELECT MAX(date_register) as date , MAX(id_table) as id_table
                        FROM acc_farmer
                        WHERE id_table != ? and register_auth = 1 and station = ?
                        GROUP BY link_user
                    ) as selectList
                    WHERE acc_farmer.id_table = selectList.id_table 
                            and (INSTR(acc_farmer.fullname , ?) OR INSTR(acc_farmer.id_farmer , ?))
                    ORDER BY acc_farmer.date_register DESC
                    LIMIT ${Limit};
                    ` , [ req.body.id_table , result['data']['station_doctor'] , req.body.search , req.body.search]
                    , (err , result)=>{
                    if (err){
                        dbpacket.dbErrorReturn(con , err , res)
                        return 0
                    };
    
                    con.end()
                    res.send(result)
                })
            }
        }).catch((err)=>{
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        })
    })

    app.post('/api/doctor/farmer/convert/cancel' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result = await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                con.query(`
                    SELECT uid_line , link_user
                    FROM acc_farmer
                    WHERE id_table = ?
                ` , [req.body.id_table] ,
                async (err, search ) => {
                    if (!err){
                        await SendToFarmerLink(con , search[0].link_user , "ทำการยกเลิกการเชื่อมต่อบัญชีของท่านเรียบร้อย")
                        con.query(
                            `
                            UPDATE acc_farmer
                            SET link_user = ?
                            WHERE id_table = ?
                            ` , [search[0].uid_line , req.body.id_table] ,
                            (err, result ) => {
                                if (err){
                                    dbpacket.dbErrorReturn(con , err , res)
                                    return 0
                                };

                                con.query(
                                    `
                                    UPDATE housefarm
                                    SET link_user = ?
                                    WHERE uid_line = ?
                                    ` , [search[0].uid_line , search[0].uid_line] ,
                                    (err, update ) => {
                                        if (err){
                                            dbpacket.dbErrorReturn(con , err , res)
                                            return 0
                                        };
                                        con.end()
                                        res.send(search[0].link_user)
                                    }
                                )
                            }
                        )
                    } else {
                        con.end()
                        res.send("")
                    }
                })
            }
        } catch (err ) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            }
        } 
    })

    app.post('/api/doctor/farmer/convert/comfirm' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result = await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const convert= await new Promise((resole , reject)=> {
                    con.query(
                        `
                        SELECT link_user , uid_line , fullname
                        FROM acc_farmer
                        WHERE id_table = ? and register_auth = 1 and station = ?
                        ` , [ req.body.id_table_convert , result['data']['station_doctor'] ]
                        , (err , result)=>{
                        try {
                            Line.pushMessage(convert[0].uid_line , {
                                type : "text",
                                text : `คุณได้ทำการเชื่อมบัญชีเรียบร้อย \u2764`
                            }).catch(e=>{})
                        } catch(e) {}
                        resole(result)
                    })
                })

                let Link_user = ""
                if(convert[0]){
                    if(convert[0].link_user.indexOf("cvpf-") >= 0) Link_user = convert[0].link_user
                    else Link_user = `cvpf-${new Date().getTime()}${convert[0].link_user.slice(0 , 3)}`
                    
                    if(convert[0].link_user != Link_user) {
                        await new Promise((resole , reject)=> {
                            con.query(
                                `
                                UPDATE acc_farmer 
                                SET link_user = ?
                                WHERE register_auth = 1 and id_table = ? and station = ?
                                `,[ Link_user , req.body.id_table_convert , result['data']['station_doctor']],
                                (err, result )=>{
                                    if (err){
                                        dbpacket.dbErrorReturn(con , err , res)
                                        return 0
                                    };
        
                                    con.query(
                                        `
                                        UPDATE housefarm 
                                        SET link_user = ?
                                        WHERE uid_line = ?
                                        ` , [ Link_user , convert[0].uid_line ] ,
                                        (err, result ) => {
                                            resole(1)
                                        }
                                    )
                                }
                            )
                        })
                    }
                }

                con.query(
                    `
                    UPDATE acc_farmer 
                    SET link_user = ?
                    WHERE register_auth = 1 and id_table = ? and station = ?
                    `,[Link_user , req.body.id_table , result['data']['station_doctor'] ],
                    (err, result )=>{
                        if (!err){
                            if(Link_user) {
                                con.query(
                                    `
                                    UPDATE housefarm 
                                    SET link_user = ?
                                    WHERE uid_line = ?
                                    ` , [ Link_user , req.body.uid_line ] ,
                                    (err, result ) => {
                                        if (!err){
                                            try {
                                                Line.pushMessage(req.body.uid_line , {
                                                    type : "text",
                                                    text : `เชื่อมบัญชีกับคุณ ${convert[0].fullname} \u2764`
                                                }).catch(e=>{})
                                            } catch(e) {}
                                            con.end()
                                        }
                                    }
                                )
                            } else {
                                con.end()
                            }
                            
                            res.send(Link_user)
                        } else {
                            con.end()
                            res.send("")
                        }
                    }
                )
            }
        } catch (err ) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            }
        } 
    })
    // account end

    //massage start
    app.post('/api/doctor/farmer/msg/count' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result = await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                con.query(
                    `
                    SELECT COUNT(message_user.id) as count_msg
                    FROM message_user , 
                    (
                        SELECT uid_line
                        FROM acc_farmer
                        WHERE id_table = ? OR link_user = ?
                    ) as farmer
                    WHERE message_user.uid_line_farmer = farmer.uid_line
                            and COALESCE(JSON_CONTAINS(id_read , '"read"' , '$."?"') , 0) = 0
                            and type = ""
                    ` , [req.body.id_table , req.body.link_user , result["data"].id_table_doctor] , 
                    (err , count)=>{
                        con.end()
                        res.send(count)
                    }
                )
            }
        } catch(err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/farmer/msg/read' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result = await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                con.query(
                    `
                    UPDATE message_user
                    SET id_read = JSON_SET(id_read, '$."?"', 'read')
                    WHERE uid_line_farmer = ?
                    ` , [result["data"].id_table_doctor , req.body.uid_line] , 
                    (err , read)=>{
                        socket.to(req.body.uid_line).emit("new_msg" , "read")
                        con.end()
                        res.send("1")
                    }
                )
            }
        } catch(err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/farmer/msg/send' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result = await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const TextSend = req.body.textSend.trim()
                if(TextSend) {
                    con.query(
                        `
                        INSERT INTO message_user
                        ( message , uid_line_farmer , id_read , type , type_message ) VALUES ( ? , ? , '{"?" : "read"}' , ? , "text")
                        ` , [ TextSend , req.body.uid_line , result["data"].id_table_doctor , result["data"].id_table_doctor ] , 
                        async (err , insertMsg) => {
                            if(err) con.end()
                            else {
                                try {
                                    await Line.pushMessage(req.body.uid_line , {
                                        type : "text" , text : `ส่งจากหมอ ${result["data"].fullname_doctor} : \n${TextSend}`
                                    })
                                    socket.to(req.body.uid_line).emit("new_msg")
                                    res.send("113")
                                    con.end()
                                } catch(e){
                                    con.query(
                                        `
                                        DELETE FROM message_user
                                        WHERE id = ?
                                        ` , [ insertMsg.insertId ] , 
                                        (err)=>{
                                            con.end()
                                        }
                                    )
                                    res.send("line error")
                                }
                            }
                        }
                    )
                }
            }
        } catch(err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/farmer/msg/get' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result = await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                if(req.body.open_msg === "start") {
                    const LimitFirst = await new Promise((resole , reject)=>{
                        con.query(
                            `
                            SELECT COUNT(*) as count_unread
                            FROM message_user
                            WHERE uid_line_farmer = ? 
                                    and COALESCE(JSON_CONTAINS(id_read , '"read"' , '$."?"') , 0) = 0
                            ` , [ req.body.uid_line , result['data']['id_table_doctor'] ] , 
                            (err , list_unread)=>{
                                resole(parseInt(list_unread[0].count_unread))
                            }
                        )
                    })

                    const ListMsg = await new Promise((resole , reject)=>{
                        con.query(
                            `
                            SELECT * , 
                            (
                                SELECT fullname_doctor
                                FROM acc_doctor
                                WHERE id_table_doctor = message_user.type
                            ) as name_doctor ,
                            (
                                SELECT EXISTS (
                                    SELECT id_table_doctor
                                    FROM acc_doctor
                                    WHERE id_table_doctor = ? and id_table_doctor = message_user.type
                                )
                            ) as is_me ,
                            (
                                SELECT img_doctor
                                FROM acc_doctor
                                WHERE id_table_doctor = ? and id_table_doctor = message_user.type
                            ) as img_doctor
                            FROM message_user
                            WHERE uid_line_farmer = ?
                            ORDER BY date DESC
                            LIMIT ${LimitFirst ? LimitFirst + 5 : 15} OFFSET 0
                            ` , [ result["data"].id_table_doctor , result["data"].id_table_doctor , req.body.uid_line ] , 
                            (err , list_msg)=>{
                                resole(list_msg)
                            }
                        )
                    })

                    if(LimitFirst) ListMsg.splice(LimitFirst , 0 , {type_message : "unread"})
                    ListMsg.reverse()

                    con.end()
                    res.send(ListMsg)
                } else if (req.body.open_msg === "get") {
                    const ListMsg = await new Promise((resole , reject)=>{
                        con.query(
                            `
                            SELECT *
                            , 
                            (
                                SELECT fullname_doctor
                                FROM acc_doctor
                                WHERE id_table_doctor = message_user.type
                            ) as name_doctor ,
                            (
                                SELECT EXISTS (
                                    SELECT id_table_doctor
                                    FROM acc_doctor
                                    WHERE id_table_doctor = ? and id_table_doctor = message_user.type
                                )
                            ) as is_me ,
                            (
                                SELECT img_doctor
                                FROM acc_doctor
                                WHERE id_table_doctor = ? and id_table_doctor = message_user.type
                            ) as img_doctor
                            FROM message_user
                            WHERE uid_line_farmer = ? and id > ?
                            ORDER BY date ASC
                            LIMIT 999999
                            ` , [ result["data"].id_table_doctor , result["data"].id_table_doctor , req.body.uid_line , req.body.id_start ] , 
                            (err , list_msg)=>{
                                resole(list_msg)
                            }
                        )
                    })

                    // let countPush = 0
                    // await new Promise( async (resole , reject)=>{
                    //     for (let Msg of ListMsg) {
                    //         const MsgOfLine = (
                    //                 (Msg.type_message == "text" || Msg.type_message == "location") ? Msg.message :
                    //                 await Line.getMessageContent(Msg.message.toString())
                    //             );
                            
                    //         const MsgSend = (
                    //                 (Msg.type_message == "text" || Msg.type_message == "location") ? MsgOfLine :
                    //                 await new Promise((resole , reject)=>{
                    //                     https.get( MsgOfLine.responseUrl , {
                    //                         method : "GET",
                    //                         headers : {
                    //                             Authorization : "Bearer 3bRyKhlM01xFG6hDC+x5ZlfT0r44XF4L5wHORR9CJc87tmjrHoQJad6kLvOa8cbX7hSHVu6SB08UcWx2I9QjdNWRLo6fwsExPTbm7Wuaw7Eq6zh6DJXs9FFQqSbXxZKvHJt4jURZqu4Z0NcP6zJ4wwdB04t89/1O/w1cDnyilFU="
                    //                         }
                    //                     } , (res)=>{
                    //                         let Data = Buffer.alloc(0);
                    //                         res.on('data' , (chunk)=>{
                    //                             Data = Buffer.concat([Data, chunk]);
                    //                         })

                    //                         res.on('end', () => {
                    //                             resole(Data)
                    //                         });
                    //                     })
                    //                 })
                    //             )

                    //         delete Msg.message;
                    //         Msg.msgLine = MsgSend;
                    //         countPush++;
                    //         if(countPush == ListMsg.length) resole()
                    //     }
                    // })

                    con.end()
                    res.send(ListMsg)
                } else if (req.body.open_msg === "load") {
                    const LIMIT = isNaN(parseInt(req.body.limit)) ? 0 : req.body.limit
                    const OFFSET = isNaN(parseInt(req.body.offset)) ? 0 : req.body.offset

                    const ListMsg = await new Promise((resole , reject)=>{
                        con.query(
                            `
                            SELECT * , 
                            (
                                SELECT fullname_doctor
                                FROM acc_doctor
                                WHERE id_table_doctor = message_user.type
                            ) as name_doctor ,
                            (
                                SELECT EXISTS (
                                    SELECT id_table_doctor
                                    FROM acc_doctor
                                    WHERE id_table_doctor = ? and id_table_doctor = message_user.type
                                )
                            ) as is_me ,
                            (
                                SELECT img_doctor
                                FROM acc_doctor
                                WHERE id_table_doctor = ? and id_table_doctor = message_user.type
                            ) as img_doctor
                            FROM message_user
                            WHERE uid_line_farmer = ? and id < ?
                            ORDER BY date DESC
                            LIMIT ${LIMIT}
                            ` , [ result["data"].id_table_doctor , result["data"].id_table_doctor , req.body.uid_line , req.body.id_start ] , 
                            (err , list_msg)=>{
                                resole(list_msg)
                            }
                        )
                    })

                    ListMsg.reverse()
                    con.end()
                    res.send(ListMsg)
                }
            }
        } catch(err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })
    //massage end

    // form start
    app.post('/api/doctor/form/list' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {

                // select out table
                const TextInsert = req.body.textInput ?? "";
                const TypePlant = req.body.typePlant ? [ req.body.typePlant ] : [] ;
                const Submit = (req.body.statusForm >= 0 && req.body.statusForm <= 2) ? req.body.statusForm : null ;
                const StatusFarmer = (req.body.statusFarmer >= 0 && req.body.statusFarmer <= 1) ? req.body.statusFarmer : null;
                
                const TypeDate = (req.body.typeDate == 1) ? "date_success" : (req.body.typeDate == 0) ? "date_plant" : null;
                const StartDate = (new Date(req.body.StartDate).toString() !== "Invalid Date") ? req.body.StartDate : null ;
                const EndDate = (new Date(req.body.EndDate).toString() !== "Invalid Date") ? req.body.EndDate : null ;

                const OrderBy = (req.body.typeDate == 1) ? "date_success" : "date_plant";
                const Limit = (!isNaN(req.body.limit)) ? req.body.limit : null;

                con.query(
                    `
                    SELECT fromInsert.* 
                    FROM formplant ,
                    (
                        SELECT formplant.id , formplant.state_status , formplant.name_plant , formplant.date_plant ,
                        formplant.system_glow , formplant.insect , formplant.generation , formplant.qty , formplant.date_harvest ,
                            (
                                SELECT COUNT(id)
                                FROM formfertilizer
                                WHERE id_plant = formplant.id
                            ) as ctFer ,
                            (
                                SELECT COUNT(id)
                                FROM formchemical
                                WHERE id_plant = formplant.id
                            ) as ctChe ,
                            (
                                SELECT type_plant
                                FROM plant_list
                                WHERE name = formplant.name_plant
                                LIMIT 1
                            ) as type_main ,
                            (
                                SELECT id_plant
                                FROM success_detail
                                WHERE id_plant = formplant.id and INSTR(id_success , ?)
                                GROUP BY id_plant
                            ) as success_id_plant ,
                            (
                                SELECT acc_farmer.fullname
                                FROM acc_farmer
                                WHERE acc_farmer.link_user = house.link_user AND station = ? AND register_auth != 2
                                ORDER BY date_register DESC , register_auth DESC
                                LIMIT 1
                            ) as farmer
                        FROM formplant , 
                            (
                                SELECT id_farm_house , farmer.link_user
                                FROM housefarm , 
                                    (
                                        SELECT uid_line , link_user
                                        FROM acc_farmer
                                        WHERE ${StatusFarmer !== null ? `register_auth = ${StatusFarmer}` : "(register_auth = 0 OR register_auth = 1)"} AND station = ?
                                    ) as farmer
                                WHERE housefarm.uid_line = farmer.uid_line or housefarm.link_user = farmer.link_user
                            ) as house
                        WHERE formplant.id_farm_house = house.id_farm_house
                                ${TypePlant.length == 1 ? `and formplant.name_plant = ?` : ""}
                                ${Submit !== null ? `and formplant.state_status = ${Submit}` : ""}
                                ${(TypeDate !== null && StartDate !== null && EndDate !== null) ? `and ( UNIX_TIMESTAMP(formplant.${TypeDate}) >= UNIX_TIMESTAMP('${StartDate}') and UNIX_TIMESTAMP(formplant.${TypeDate}) <= UNIX_TIMESTAMP('${EndDate}') )` : ""}
                                
                        ORDER BY ${OrderBy}
                    ) as fromInsert
                    WHERE formplant.id = fromInsert.id and ( INSTR(formplant.id , ?) or formplant.id = fromInsert.success_id_plant )
                    ORDER BY state_status ASC
                    ${(Limit !== null) ? `LIMIT ${Limit}` : ""}
                    `
                    , [TextInsert , result['data']['station_doctor'] , result['data']['station_doctor'] , ...TypePlant , TextInsert ] , 
                    (err , listFarm)=>{
                        if (err) {
                            dbpacket.dbErrorReturn(con, err, res);
                            console.log("select form");
                        }

                        con.end()
                        res.send(listFarm)
                    }
                )
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.get('/api/doctor/form/get/detail' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const TypeForm = (req.query.type === '0') ? "plant" : (req.query.type === '1') ? "fertilizer" : "chemical";
                const subjectWhereID = (req.query.type === '0') ? "id" : (req.query.type === '1') ? "id_plant" : "id_plant";
                
                con.query(
                    `
                    SELECT * ,
                    (
                        SELECT COUNT(status)
                        FROM editform
                        WHERE status = 0 and type_form = ? and id_form = form${TypeForm}.id
                    ) as countStatus
                    FROM form${TypeForm}
                    WHERE ${subjectWhereID} = ?
                    ` , [TypeForm , req.query.id_form] ,
                    async (err, forms )=>{
                        if(err) {
                            dbpacket.dbErrorReturn(con, err, res);
                            console.log("select form");
                        }

                        const formsData = []

                        if(!forms.length) {
                            con.end()
                            res.send(formsData)
                        }

                        forms.forEach( async (form) => {
                            const userData = req.query.type === '0' ? await new Promise((resolve) => {
                                con.query(
                                    `
                                        SELECT id_table as id_farmer , fullname as fullname
                                        FROM acc_farmer , 
                                        (
                                            SELECT link_user
                                            FROM housefarm
                                            WHERE id_farm_house = ?
                                        ) as house
                                        WHERE acc_farmer.link_user = house.link_user
                                        ORDER BY date_register
                                        LIMIT 1
                                    ` , [form.id_farm_house] ,
                                    (err, users )=>{
                                        if(err) {
                                            dbpacket.dbErrorReturn(con, err, res);
                                            console.log("select user");
                                        }
                                                    
                                        resolve(users[0] || {})
                                    }
                                )
                            }) : {}
    
                            const plantData = req.query.type === '0' ? await new Promise((resolve) => {
                                con.query(
                                    `
                                        SELECT type_plant as type_main
                                        FROM plant_list
                                        WHERE name = ?
                                        LIMIT 1
                                    ` , [form.name_plant] ,
                                    (err, plants )=>{
                                        if(err) {
                                            dbpacket.dbErrorReturn(con, err, res);
                                            console.log("select user");
                                        }
                                                    
                                        resolve(plants[0] || {})
                                    }
                                )
                            }) : {}
    
                            const houseFarmData = req.query.type === '0' ? await new Promise((resolve) => {
                                con.query(
                                    `
                                        SELECT location as location_house
                                        FROM housefarm
                                        WHERE id_farm_house = ?
                                        LIMIT 1
                                    ` , [form.id_farm_house] ,
                                    (err, houseFarm )=>{
                                        if(err) {
                                            dbpacket.dbErrorReturn(con, err, res);
                                            console.log("select house");
                                        }
                                                    
                                        resolve(houseFarm[0] || {})
                                    }
                                )
                            }) : {}

                            formsData.push({
                                ...form,
                                ...userData,
                                ...plantData,
                                ...houseFarmData
                            })

                            if(forms.length === formsData.length) {
                                con.end()
                                res.send(formsData)
                            }
                        })

                    }
                )
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/form/edit/get' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const type = req.body.id_edit ? "*" : "id_edit" ;
                const queryParams = req.body.id_edit ? [ req.body.id_edit ] : [] ;
                con.query(
                    ` 
                        SELECT editform.${type} 
                        FROM editform
                        WHERE editform.id_form = ? and type_form = ? ${queryParams.length == 1 ? `and editform.id_edit = ?` : ""}
                        ORDER BY date DESC
                    ` 
                , [  req.body.id_form , req.body.type_form , ...queryParams ] , 
                (err, result )=>{
                    if (err) {
                        dbpacket.dbErrorReturn(con, err, res);
                        console.log("select plant editform");
                        return 0;
                    }

                    if(req.body.id_edit) {
                        con.query(
                            `
                            SELECT * FROM detailedit
                            WHERE id_edit = ?
                            ` , [req.body.id_edit] , 
                            (err, detail ) => {
                                if (err) {
                                    dbpacket.dbErrorReturn(con, err, res);
                                    console.log("select detailedit");
                                    return 0;
                                }

                                con.end()
                                res.send({
                                    head : result[0] ,
                                    detail : detail
                                })
                            }
                            )
                    } else {
                        con.end()
                        res.send(result)
                    }
                })
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/statistic/get', async (req, res) => {
        let username = req.session.user_doctor;
        let password = req.session.pass_doctor;
       if (username === '' || password === '') {
          res.redirect('/api/logout');
          return;
        }
     
        let con = Database.createConnection(listDB);
     
        try {
          const auth = await apifunc.auth(con, username, password, res, "acc_doctor");
          if (auth['result'] === "pass") {
            const search = req.body.search
            con.query(
              `SELECT
                  p.pest_id,
                  p.pest_name,
                  p.type_pest,
                  COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN fc.pest_id END) AS total_1_week,
                  COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN fc.pest_id END) AS total_1_month,
                  COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN fc.pest_id END) AS total_3_months,
                  COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) THEN fc.pest_id END) AS total_6_months,
                  COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN fc.pest_id END) AS total_1_year,
                  GROUP_CONCAT(DISTINCT fp.name_plant SEPARATOR ', ') AS name_plants
                FROM formchemical fc
                LEFT JOIN pests p ON fc.insect = p.pest_name
                LEFT JOIN formplant fp ON fc.id_plant = fp.id
                LEFT JOIN housefarm hf ON fp.id_farm_house = hf.id_farm_house
                LEFT JOIN acc_farmer af ON hf.uid_line = af.uid_line
                WHERE af.station = ? AND (p.pest_name LIKE ?)
                GROUP BY fc.insect
                LIMIT 25;`, [auth['data']['station_doctor'] , search] ,
              (err, result) => {
                if (err) {
                  dbpacket.dbErrorReturn(con, err, res);
                  return;
                }
     
                con.end();
                res.send(result);
              }
            );
          }
        } catch (err) {
          con.end();
          if (err == "not pass") {
            res.redirect('/api/logout');
          }
        }
      });

    app.post('/api/doctor/sendNotifyreport/get', async (req, res) => {
        let username = req.session.user_doctor;
        let password = req.session.pass_doctor;
       
        if (!username || !password) {
            res.redirect('/api/logout');
            return;
        }
       
        let con = Database.createConnection(listDB);
        console.log("Received selectedData:", req.body.selectedData);
        console.log("Received minCount:", req.body.minCount); // Log ค่า minCount
       
        try {
            const auth = await apifunc.auth(con, username, password, res, "acc_doctor");
            if (auth['result'] === "pass") {
                const { selectedData, minCount } = req.body; // รับค่าจาก request
       
                // บันทึกค่า minCount ลงในตาราง statistic
                selectedData.forEach((item) => {
       
                });
                con.query(
                  `
                    INSERT INTO statistic (role, count_day ,id_role)
                    VALUES (?,?,?)
                    ON DUPLICATE KEY UPDATE count_day = VALUES(count_day)
                  `,
                  ["doctor" , minCount , auth['data']['id']],
                  (err) => {
                      if (err) {
                          console.error("Database error:", err);
                          dbpacket.dbErrorReturn(con, err, res);
                          return;
                      }
                  }
              );
       
                con.query(
                    `SELECT
                        af.uid_line
                     FROM formchemical fc
                     LEFT JOIN pests p ON fc.insect = p.pest_name
                     LEFT JOIN formplant fp ON fc.id_plant = fp.id
                     LEFT JOIN housefarm hf ON fp.id_farm_house = hf.id_farm_house
                     LEFT JOIN acc_farmer af ON hf.uid_line = af.uid_line
                     WHERE af.station = ?
                     LIMIT 25;`, [auth['data']['station_doctor']],
                    (err, result) => {
                        if (err) {
                            dbpacket.dbErrorReturn(con, err, res);
                            return;
                        }
       
                        try {
                            console.log("Query Result:", result);
                            let uid = result.map(row => row.uid_line);
                            let textSend = selectedData.map(item => `${item.name_plants}: ${item.count}`).join("\n");
       
                            console.log("UIDs to send:", uid);
                            console.log("Text to send:", textSend);
       
                            Line.multicast([...(new Set(uid))], { type: "text", text: textSend });
                        } catch (e) {
                            console.error("Error sending Line message:", e);
                        }
       
                        con.end();
                        res.send(result);
                    }
                );
            }
        } catch (err) {
            con.end();
            if (err == "not pass") {
                res.redirect('/api/logout');
            }
        }
      });

    app.post('/api/doctor/chemical_pest/get', async (req, res) => {
        let username = req.session.user_doctor
        let password = req.session.pass_doctor;
     
        if (!username || !password) {
            res.redirect('/api/logout');
            return;
        }
     
        let con = Database.createConnection(listDB);
     
        try {
            const auth = await apifunc.auth(con, username, password, res, "acc_doctor");
            if (auth['result'] === "pass") {
                con.query(
                    `
                    SELECT
                        pc.pest_id AS pest_id,
                        pc.chemical_id AS chemical_id,
                        p.pest_name AS pest_name,
                        c.name AS chemical_name,
                        c.name_formula AS chemical_formula
                    FROM pest_chemical AS pc
                    LEFT JOIN pests AS p ON p.pest_id = pc.pest_id
                    LEFT JOIN chemical_list AS c ON c.id = pc.chemical_id
                    WHERE pc.pest_id = ? AND pc.status = 1
                    `,
                    [req.body.pest_id],
                    (err, results) => {
                        if (err) {
                            console.error("Database query error:", err);
                            con.end();
                            res.status(500).json({ error: "Database query failed" });
                            return;
                        }
     
                        if (results.length === 0) {
                            console.log("No data found");
                            con.end();
                            res.status(404).json({ message: "No data found" });
                            return;
                        }
     
                        // กรองข้อมูล: ถ้า name และ name_formula ซ้ำกันให้ใช้แค่ name
                        const uniqueChemicalNames = new Set();
                        results.forEach(item => {
                            if (!uniqueChemicalNames.has(item.chemical_name)) {
                                uniqueChemicalNames.add(item.chemical_name);
                            }
                        });
     
                        // แปลงเป็น string พร้อมส่งไปยัง frontend
                        const chemicalNames = Array.from(uniqueChemicalNames).join(", ");
     
                        console.log("Data retrieved successfully:", chemicalNames);
                        con.end();
                        res.status(200).send({ chemical_used: chemicalNames });
                    }
                );
            } else {
                res.status(401).json({ error: "Unauthorized access" });
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            con.end();
            res.status(500).json({ error: "Internal server error" });
        }
    });

    app.post('/api/doctor/report/list', async(req, res) => {
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
       
        if(username === '' || password === '') {
          res.redirect('/api/logout')
          return 0
        }
       
        let con = Database.createConnection(listDB)
       
        try {
          const auth = await apifunc.auth(con , username , password , res , "acc_doctor")
          if(auth['result'] === "pass") {
            const station = auth['data']['station_doctor']
            const { search } = req.body
       
            const isNumber = !isNaN(search) && search.trim() !== '';
       
          // ดึงข้อมูลเกษตรกรและพืชใน station
          const farmerQuery = `
                          SELECT
                              acc_farmer.station,
                              COUNT(DISTINCT acc_farmer.uid_line) AS total_farmers,
                              COUNT(DISTINCT formplant.id_farm_house) AS total_plants,
                              GROUP_CONCAT(DISTINCT formplant.name_plant SEPARATOR ', ') AS plants,
                              CONCAT(
                                  '[',
                                  GROUP_CONCAT(
                                      DISTINCT CONCAT(
                                          '{"plantName":"', subquery.name_plant, '",' ,
                                          '"id":"', subquery.id, '",' ,
                                          '"farmersCount":', subquery.total_qty, '}'
                                      )
                                  ),
                                  ']'
                              ) AS plantDetails
                          FROM acc_farmer
                          LEFT JOIN housefarm ON acc_farmer.uid_line = housefarm.uid_line
                          LEFT JOIN formplant ON housefarm.id_farm_house = formplant.id_farm_house
                          LEFT JOIN (
                              SELECT
                                  formplant.id,
                                  formplant.name_plant,
                                  COUNT(formplant.name_plant) AS total_qty,
                                  id_farm_house
                              FROM formplant
                              WHERE (formplant.state_status = 1 OR formplant.state_status = 0)
                              GROUP BY id_farm_house , formplant.name_plant
                          ) AS subquery ON housefarm.id_farm_house = subquery.id_farm_house
                          WHERE acc_farmer.station = ?
                          AND (formplant.name_plant LIKE ?)
                          GROUP BY acc_farmer.station;
                      `;
       
                      con.query(farmerQuery, [station, `%${search}%`], (err, farmerStatistics) => {
                            if (err) {
                                console.error('Error fetching farmer statistics:', err);
                                res.status(500).json({ status: "error", message: "Database query error" });
                                return;
                            }
       
                            console.log('Farmer Statistics:', farmerStatistics);
       
                            // ดึงรายชื่อหมอพืช (เฉพาะที่ doctor_role = 1)
                            const doctorQuery = `
                            SELECT id_doctor, fullname_doctor, station_doctor, 'หมอพืช' AS role
                            FROM acc_doctor
                            WHERE station_doctor = ?
                            AND doctor_role = 1
                            AND (fullname_doctor LIKE ? OR 'หมอพืช' LIKE ?);
                        `;
       
                          con.query(doctorQuery, [station, `%${search}%`, `%${search}%`], (err, doctors) => {
                              if (err) {
                                  console.error('Error fetching doctor data:', err);
                                  res.status(500).json({ status: "error", message: "Database query error" });
                                  return;
                              }
       
                              console.log('Doctors:', doctors);
       
                              // ดึงรายชื่อที่ปรึกษาเกษตรกร (เฉพาะที่ consultant_role = 1)
                              const consultantQuery = `
                                  SELECT id_doctor, fullname_doctor, station_doctor, 'ที่ปรึกษาเกษตรกร' AS role
                                  FROM acc_doctor
                                  WHERE station_doctor = ?
                                  AND consultant_role = 1
                                  AND (fullname_doctor LIKE ? OR 'ที่ปรึกษาเกษตรกร' LIKE ?);
                              `;
       
                              con.query(consultantQuery, [station, `%${search}%`, `%${search}%`], (err, consultants) => {
                                  if (err) {
                                      console.error('Error fetching consultant data:', err);
                                      res.status(500).json({ status: "error", message: "Database query error" });
                                      return;
                                  }
       
                                    console.log('Consultants:', consultants);
       
                                    // ส่งผลลัพธ์กลับไป
                                    con.end()
                                    res.status(200).json({
                                        status: "success",
                                        data: {
                                            farmerStatistics: farmerStatistics.map((stat) => ({
                                                station: stat.station,
                                                totalFarmers: stat.total_farmers,
                                                totalPlants: stat.total_plants,
                                                plants: stat.plants,
                                                plantDetails: JSON.parse(stat.plantDetails || "[]").reduce((prev, curr) => {
                                                    const indexFind = prev.findIndex(({ plantName }) => plantName === curr["plantName"]);
                                                    if (indexFind >= 0) {
                                                        prev[indexFind]["farmersCount"] += curr["farmersCount"];
                                                    } else {
                                                        prev.push({
                                                            plantName: curr["plantName"],
                                                            farmersCount: curr["farmersCount"]
                                                        });
                                                    }
                                                    return prev;
                                                }, []),
                                            })),
                                            doctors,
                                            consultants,
                                        },
                                    });
                                });
                            });
                        });
                    }
            } catch (error) {
                console.error("Unexpected error:", error);
                res.status(500).json({ status: "error", message: "Internal Server Error" });
            }
        });

    app.get('/api/doctor/form/report/edit/gets' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const id_report = req.query.id_report 
                con.query(
                    ` 
                        SELECT *
                        FROM record_edit
                        WHERE id_report_detail = ?
                        ORDER BY edit_date DESC
                    ` 
                , [ id_report ] , 
                (err, result )=>{
                    if (err) {
                        dbpacket.dbErrorReturn(con, err, res);
                        console.log("select plant editform");
                        return 0;
                    }

                    con.end()
                    res.send({
                        status : 200,
                        data : result
                    })
                })
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.put('/api/doctor/form/edit/change/status' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                con.query(
                    `
                        UPDATE editform
                        SET status = ? , note = ? , id_doctor = ?
                        WHERE id_edit = ?
                    ` , [ req.body.status , req.body.note , result['data']['id_table_doctor'] , req.body.id_edit ] ,
                    async (err, result ) => {
                        if (!err) {
                            if(req.body.status == 2) {
                                // con.query(
                                //     `
                                //     SELECT uid_line , house.name_house as name_house
                                //     FROM acc_farmer ,
                                //     (
                                //         SELECT link_user , name_house
                                //         FROM housefarm ,
                                //         (
                                //             SELECT id_farm_house
                                //             FROM formplant
                                //             WHERE id = ?
                                //         ) as formPlant
                                //         WHERE housefarm.id_farm_house = formPlant.id_farm_house
                                //     ) as house
                                //     WHERE house.link_user = acc_farmer.link_user and acc_farmer.register_auth != 2
                                //     ` , [ req.body.id_plant ] ,
                                //     (err , listFarmer) => {
                                //         con.end()
                                //         if(!err) {
                                //             const uid = listFarmer.filter(val=>val.uid_line)
                                //             const nameHouse = [...(new Set(listFarmer.filter(val=>val.name_house)))]
                                //             if(uid.length != 0 && nameHouse.length != 0) {
                                //                 try {
                                //                     Line.multicast([...(new Set(uid))] , {type : "text" , text : `ผลการตรวจสอบการแก้ไขแบบบันทึก\nผลการตรวจสอบ ไม่ผ่าน\nในโรงเรือน ${nameHouse[0]}`})
                                //                 } catch(e) {}
                                //             }
                                //         }
                                //     }
                                // )
                                await SendToFarmerHouse(con , req.body.id_plant , "ผลการตรวจสอบการแก้ไขแบบบันทึก\nผลการตรวจสอบ ไม่ผ่าน")
                                con.end()
                            } else con.end()
                            res.send("133")
                        } else {
                            con.end()
                            res.send("")
                        }
                    }
                )
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    //profile farmer
    app.get('/api/doctor/form/get/farmer' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                con.query(
                    `
                    SELECT acc_farmer.*
                    FROM acc_farmer , 
                        (
                            SELECT link_user
                            FROM housefarm , 
                            (
                                SELECT id_farm_house
                                FROM formplant
                                WHERE id = ?
                            ) as plant
                            WHERE housefarm.id_farm_house = plant.id_farm_house
                        ) as house
                    WHERE acc_farmer.link_user = house.link_user AND station = ? AND register_auth != 2
                    ORDER BY date_register DESC , register_auth DESC
                    LIMIT 1
                    ` , [req.query.id_form , result['data']['station_doctor']] ,
                    (err , result) => {
                        if (err) {
                            dbpacket.dbErrorReturn(con, err, res);
                            console.log("get profile");
                            return 0;
                        }

                        result.map(val=>{
                            val.img = val.img.toString()
                            return val
                        })
                        con.end()
                        res.send(result)
                    }
                )
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    //manage
    app.get('/api/doctor/form/manage/get' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const TypePage = req.query.typePage === "success_detail" || req.query.typePage === "report_detail" || req.query.typePage === "check_form_detail" || req.query.typePage === "check_plant_detail" ?
                                    req.query.typePage : "";

                const Order = req.query.typePage === "success_detail" ? "date_of_doctor DESC" 
                                : req.query.typePage === "report_detail" ? "date_report"
                                : "date_check";
                
                if(TypePage) {
                    con.query(
                        `
                            SELECT * , 
                            (
                                SELECT fullname_doctor
                                FROM acc_doctor
                                WHERE id_table_doctor = ${TypePage}.id_table_doctor
                            ) as name_doctor ,
                            (
                                SELECT id_doctor
                                FROM acc_doctor
                                WHERE id_table_doctor = ${TypePage}.id_table_doctor
                            ) as id_doctor ,
                            (
                                SELECT EXISTS (
                                    SELECT id_table_doctor
                                    FROM acc_doctor
                                    WHERE id_table_doctor = ? and id_table_doctor = ${TypePage}.id_table_doctor
                                )
                            ) as check_doctor
                            FROM ${TypePage}
                            WHERE id_plant = ?
                            ORDER BY ${Order}
                        ` , [result.data.id_table_doctor , req.query.id_plant ] ,
                        (err, result ) => {
                            if (err) {
                                dbpacket.dbErrorReturn(con, err, res);
                                console.log("get manage");
                                return 0;
                            }
    
                            if(TypePage === "success_detail" || TypePage === "check_plant_detail") {
                                con.query(
                                    `
                                    SELECT 
                                    ${ TypePage === "success_detail" ?
                                        `
                                        (
                                            SELECT EXISTS (
                                                SELECT id
                                                FROM check_plant_detail
                                                WHERE id_plant = ? and state_check = 0
                                                LIMIT 1
                                            )
                                        ) as check_plant_before 
                                        , 
                                        (
                                            SELECT EXISTS (
                                                SELECT id
                                                FROM check_plant_detail
                                                WHERE id_plant = ? and state_check = 1
                                                LIMIT 1
                                            )
                                        ) as check_plant_after ,
                                        (
                                            SELECT EXISTS (
                                                SELECT id
                                                FROM success_detail
                                                WHERE id_plant = ? and type_success = 1
                                                LIMIT 1
                                            )
                                        ) as Check_success_after
                                        ` : 
                                        TypePage === "check_plant_detail" ? 
                                        `
                                        (
                                            SELECT EXISTS (
                                                SELECT id
                                                FROM success_detail
                                                WHERE id_plant = ? and type_success = 0
                                                LIMIT 1
                                            )
                                        ) as check_success_before 
                                        , 
                                        (
                                            SELECT EXISTS (
                                                SELECT id
                                                FROM success_detail
                                                WHERE id_plant = ? and type_success = 1
                                                LIMIT 1
                                            )
                                        ) as check_success_after ,
                                        (
                                            SELECT EXISTS (
                                                SELECT id
                                                FROM check_plant_detail
                                                WHERE id_plant = ? and state_check = 1
                                                LIMIT 1
                                            )
                                        ) as check_plant_after
                                        ` 
                                        : ""
                                    }
                                    ` , [ req.query.id_plant , req.query.id_plant , req.query.id_plant ] ,
                                    (err , optionCheck) => {
                                        if (err) {
                                            dbpacket.dbErrorReturn(con, err, res);
                                            console.log("get manage");
                                            return 0;
                                        }
        
                                        con.end()
                                        res.send({
                                            list : result,
                                            option : optionCheck
                                        })
                                    }
                                )
                            } else {
                                con.end()
                                res.send({
                                    list : result,
                                    option : []
                                })
                            }
                        }
                    )
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/form/manage/success/insert' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const CheckInsert = req.body.type == 1 ? await new Promise((resole , reject)=>{
                    con.query(
                        `
                            SELECT (
                                SELECT EXISTS (
                                    SELECT id
                                    FROM check_plant_detail
                                    WHERE id_plant = ? and state_check = 0
                                )
                            ) as ResultAfter
                        ` , [ req.body.id_plant ] , 
                        (err, result ) => {
                            resole(parseInt(result[0].ResultAfter))
                        }
                    )
                }) : req.body.type == 0 ? await new Promise((resole , reject)=>{
                    con.query(
                        `
                            SELECT (
                                SELECT EXISTS (
                                    SELECT id
                                    FROM check_plant_detail
                                    WHERE id_plant = ? and state_check = 1
                                )
                            ) as ResultBefore
                        ` , [ req.body.id_plant ] , 
                        (err, result ) => {
                            resole(!parseInt(result[0].ResultBefore))
                        }
                    )
                }) : "";

                const CheckSuccess = await new Promise((resole , reject)=>{
                    con.query(
                        `
                        SELECT
                        (
                            SELECT EXISTS (
                                SELECT id
                                FROM success_detail
                                WHERE id_plant = ? and type_success = 1
                                LIMIT 1
                            )
                        ) as Check_success_after
                        ` , [req.body.id_plant] ,
                        (err , resultCheck)=>{
                            resole(parseInt(resultCheck[0].Check_success_after))
                        }
                    )
                })
                
                if(CheckInsert && !CheckSuccess) {
                    const Random = await new Promise( async (resole , reject)=>{
                        while(true) {
                            let random = apifunc.generateID(4 , "num")
                            let resultFound= await new Promise((resole , reject)=> {
                                con.query(
                                    `
                                    SELECT id
                                    FROM success_detail
                                    WHERE id_success = ?
                                    ` , [ random ] , 
                                    (err, result ) => {
                                        resole(result)
                                    }
                                )
                            })
    
                            if(resultFound.length === 0) {
                                resole(random)
                                break;
                            }
                        }
                    })

                    con.query(
                        `
                            INSERT success_detail
                            ( id_plant , id_success , id_table_doctor , type_success , date_of_farmer )
                            VALUES 
                            ( ? , ? , ? , ? , '')
                        ` , [ req.body.id_plant , Random , result["data"].id_table_doctor , req.body.type ] ,
                        async (err, result ) => {
                            if (err) {
                                dbpacket.dbErrorReturn(con, err, res);
                                console.log("get manage");
                                return 0;
                            }

                            // await new Promise((resole , reject)=>{
                            //     con.query(
                            //         `
                            //         SELECT uid_line , house.name_house as name_house
                            //         FROM acc_farmer ,
                            //         (
                            //             SELECT link_user , name_house
                            //             FROM housefarm ,
                            //             (
                            //                 SELECT id_farm_house
                            //                 FROM formplant
                            //                 WHERE id = ?
                            //             ) as formPlant
                            //             WHERE housefarm.id_farm_house = formPlant.id_farm_house
                            //         ) as house
                            //         WHERE house.link_user = acc_farmer.link_user and acc_farmer.register_auth != 2
                            //         ` , [ req.body.id_plant ] ,
                            //         (err , listFarmer) => {
                            //             if(!err) {
                            //                 const uid = listFarmer.filter(val=>val.uid_line)
                            //                 const nameHouse = [...(new Set(listFarmer.filter(val=>val.name_house)))]
                            //                 if(uid.length != 0 && nameHouse.length != 0) {
                            //                     try {
                            //                         Line.multicast([...(new Set(uid))] , {type : "text" , text : `หมอพืชมีการสั่งเก็บเกี่ยวผลผลิตตัวอย่างในโรงเรือน ${nameHouse[0]}`})
                            //                     } catch(e) {}
                            //                 }
                            //             }
                            //             resole("")
                            //         }
                            //     )
                            // })
                            await SendToFarmerHouse(con , req.body.id_plant , "หมอพืชมีการสั่งเก็บเกี่ยวผลผลิตตัวอย่าง")
    
                            if(req.body.type == 0) {
                                con.query(
                                    `
                                    UPDATE formplant 
                                    SET state_status = 1
                                    WHERE id = ? and state_status = 0
                                    ` , [ req.body.id_plant ] , 
                                    (err , update)=>{
                                        con.end()
                                        res.send("113")
                                    }
                                )
                            } else if (req.body.type == 1) {
                                // con.query(
                                //     `
                                //     UPDATE formplant 
                                //     SET state_status = 2
                                //     WHERE id = ? and state_status = 1
                                //     ` , [ req.body.id_plant ] , 
                                //     (err , update)=>{
                                        
                                //     }
                                // )
                                con.end()
                                res.send("113")
                            }
                        }
                    )
                } else {
                    con.end()
                    res.send("not")
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            }
        }
    })

    app.post('/api/doctor/form/manage/report/insert' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                try {
                    const name = req.body.img_report ? 
                        await new Promise((resole , reject)=>{
                            const name_image = `${result.data.id_table_doctor}${req.body.id_plant}${new Date().getTime()}.jpg`
                            const Path = __dirname.replace("server" , "app") + `/src/assets/img/doctor/report/${name_image}`
                            const base64Data = req.body.img_report.replace("data:image/jpeg;base64," , "")
                            const imageBuffer = Buffer.from(base64Data, 'base64');
                            fs.writeFile( Path , imageBuffer , (err)=>{
                                console.log(err)
                                if(err) reject("not image")
                                else resole(name_image)
                            })
                        }) : ""
                    
                    con.query(
                        `
                            INSERT report_detail
                            (id_plant , report_text , id_table_doctor , image_path)
                            VALUES
                            (? , ? , ? , ?)
                        ` , [ req.body.id_plant , req.body.report_text , result.data.id_table_doctor , name ] ,
                        async (err , result) =>{
                            if (!err) {
                                const arrUID = await SendToFarmerHouse(con , req.body.id_plant , "หมอพืชให้คำแนะนำกับการปลูก" , `\nคำแนะนำ : ${req.body.report_text}`)
                                if(name) {
                                    const imageURL = `${UrlApi}/doctor/report/${name}`;
                                    try{
                                        Line.multicast(arrUID , {type : "image" , originalContentUrl : imageURL , previewImageUrl : imageURL})
                                    } catch(e) {}
                                }

                                con.end()
                                res.send("113")
                            } else {
                                con.end()
                                res.send("not")
                            }
                        }
                    )
                } catch (e) {
                    if(e === "not image") {
                        con.end()
                        res.send("not image")
                    }
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            }
        }
    })

    app.post('/api/doctor/form/manage/report/edit' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                try {

                    const img_path = req.body.image_object != undefined ?
                        await new Promise((resole , reject)=>{
                            con.query(
                                `
                                SELECT image_path
                                FROM report_detail
                                WHERE id_plant = ? and id = ? and id_table_doctor = ?
                                ` , [ req.body.id_plant , req.body.id , result.data.id_table_doctor ] ,
                                async (err , resoleImg) => {
                                    if(!err) {
                                        const Path = __dirname.replace("server" , "src") + `/assets/img/doctor/report/`
                                        // หากเจอภาพเก่า จึงลบออก
                                        if(resoleImg[0].image_path)
                                            try { fs.rmSync(Path + `${resoleImg[0].image_path}`) } catch(e){}

                                        // อัปไฟล์ใหม่ลง server
                                        if(req.body.image_object) {
                                            const name_image = `${result.data.id_table_doctor}${req.body.id_plant}${new Date().getTime()}.jpg`
                                            const base64Data = req.body.image_object.replace("data:image/jpeg;base64," , "")
                                            const imageBuffer = Buffer.from(base64Data, 'base64');
                                            fs.writeFile( Path + name_image , imageBuffer , (err)=>{
                                                if(err) reject("not image")
                                                else resole(name_image)
                                            })
                                        } else resole("")
                                    } else reject("not update")
                                }
                            )
                        }) : null;

                    if(req.body.report_text || img_path != null) {
                        const SET = new Array(req.body.report_text ? `report_text = '${req.body.report_text}'` : "" , img_path != null ? `image_path = '${img_path}'` : "")
                                        .filter(val=>val).join(",").replaceAll(" " , "")
                        
                        const old_report = await new Promise((resolve) => {
                            con.query(
                                `
                                SELECT id , report_text , image_path
                                FROM report_detail
                                WHERE id = ? 
                                LIMIT 1
                                ` , [ req.body.id ],
                                (err , oldData) => {
                                    if (err) {
                                        console.log("edit report");
                                        return 0;
                                    }
        
                                    resolve(oldData[0])
                                }
                            )
                        })

                        con.query(
                            `
                            UPDATE report_detail
                            SET ${SET}
                            WHERE id_plant = ? and id = ? and id_table_doctor = ?
                            ` , [ req.body.id_plant , req.body.id , result.data.id_table_doctor ],
                            (err , resultEdit) => {
                                if (err) {
                                    dbpacket.dbErrorReturn(con, err, res);
                                    console.log("edit report");
                                    return 0;
                                }

                                con.query(
                                    `
                                    INSERT INTO record_edit 
                                        ( edit_date , report_text , image_path , id_report_detail ) VALUES 
                                        ( ? , ? , ? , ? )
                                    ` , [ new Date() , old_report.report_text , old_report.image_path , old_report.id ],
                                    (err , resultEdit) => {
                                        if (err) {
                                            dbpacket.dbErrorReturn(con, err, res);
                                            console.log("edit report");
                                            return 0;
                                        }
        
                                        con.end()
                                        res.send("113")
                                    }
                                )
                            }
                        )
                    }
                } catch (e) {
                    console.log(e)
                    con.end()
                    res.send("not")
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            }
        }
    })

    app.post('/api/doctor/form/manage/checkplant/insert' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {

                const Check = await new Promise((resolve , reject)=>{
                    con.query(
                        `
                        SELECT (
                            SELECT EXISTS (
                                SELECT id
                                FROM success_detail
                                WHERE type_success = ? and id_plant = ?
                            )
                        ) as check_success
                        ` , [ req.body.stateCheck , req.body.id_plant ] , 
                        (err , result) => {
                            resolve(result[0].check_success)
                        }
                    )
                })

                if(parseInt(Check)) {
                    con.query(
                        `
                            INSERT check_plant_detail
                            (id_plant , status_check , state_check , note_text , id_table_doctor)
                            VALUES
                            (? , ? , ? , ? , ?)
                        ` , [ req.body.id_plant , req.body.statusCheck , req.body.stateCheck , req.body.report_text , result.data.id_table_doctor ] ,
                        async (err , result) =>{
                            if (!err) {
                                await SendToFarmerHouse(con , req.body.id_plant , "มีผลการตรวจสอบผลผลิต")
                                if(req.body.stateCheck == 1) {
                                    con.query(
                                        `
                                        UPDATE formplant 
                                        SET state_status = 2 , date_success = ?
                                        WHERE id = ? and state_status = 1
                                        ` , [new Date() , req.body.id_plant ] , 
                                        (err , update)=>{
                                            con.end()
                                            res.send("113")
                                        }
                                    )
                                } else {
                                    con.end()
                                    res.send("113")
                                }
                            }
                        }
                    )
                } else {
                    con.end()
                    res.send("not")
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            }
        }
    })

    app.post('/api/doctor/form/manage/checkform/insert' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                con.query(
                    `
                    SELECT EXISTS (
                        SELECT id
                        FROM check_form_detail
                        WHERE id_plant = ?
                    ) as CheckResult
                    ` , [ req.body.id_plant ] , 
                    (err , check) => {
                        if (err) {
                            dbpacket.dbErrorReturn(con, err, res);
                            console.log("insert form check");
                            return 0;
                        }

                        if(!parseInt(check[0].CheckResult)) {
                            con.query(
                                `
                                    INSERT check_form_detail
                                    (id_plant , status_check , note_text , id_table_doctor)
                                    VALUES
                                    (? , ? , ? , ?)
                                ` , [ req.body.id_plant , req.body.statusCheck , req.body.report_text , result.data.id_table_doctor ] ,
                                async (err , result) =>{
                                    if (!err) {
                                        await SendToFarmerHouse(con , req.body.id_plant , "มีผลการตรวจสอบแบบบันทึก")
                                        con.end()
                                        res.send("113")
                                    } else {
                                        con.end()
                                        res.send("")
                                    }
                                }
                            )
                        } else {
                            con.end()
                            res.send("not") 
                        }
                    }
                )
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            }
        }
    })

    // export
    app.post('/api/doctor/form/export' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {

                // select out table
                const TextInsert = req.body.textInput ?? "";
                const TypePlant = req.body.typePlant ? [req.body.typePlant] : [] ;
                const Submit = (req.body.statusForm >= 0 && req.body.statusForm <= 2) ? req.body.statusForm : null ;
                const StatusFarmer = (req.body.statusFarmer >= 0 && req.body.statusFarmer <= 1) ? req.body.statusFarmer : null;
                
                const TypeDate = (req.body.typeDate == 1) ? "date_success" : (req.body.typeDate == 0) ? "date_plant" : null;
                const StartDate = (new Date(req.body.StartDate).toString() !== "Invalid Date") ? req.body.StartDate : null ;
                const EndDate = (new Date(req.body.EndDate).toString() !== "Invalid Date") ? req.body.EndDate : null ;

                const OrderBy = (req.body.typeDate == 1) ? "date_success" : "date_plant";

                con.query(
                    `
                    SELECT fromInsert.* 
                    FROM formplant ,
                    (
                        SELECT formplant.* ,
                            (
                                SELECT type_plant
                                FROM plant_list
                                WHERE name = formplant.name_plant
                            ) as type_main ,
                            (
                                SELECT id_plant
                                FROM success_detail
                                WHERE id_plant = formplant.id and INSTR(id_success , ?)
                                GROUP BY id_plant
                            ) as success_id_plant
                        FROM formplant , 
                            (
                                SELECT id_farm_house
                                FROM housefarm , 
                                    (
                                        SELECT uid_line , link_user
                                        FROM acc_farmer
                                        WHERE ${StatusFarmer !== null ? `register_auth = ${StatusFarmer}` : "(register_auth = 0 OR register_auth = 1)"} and station = ?
                                    ) as farmer
                                WHERE housefarm.uid_line = farmer.uid_line or housefarm.link_user = farmer.link_user
                            ) as house
                        WHERE formplant.id_farm_house = house.id_farm_house
                                ${TypePlant.length == 1 ? `and formplant.name_plant = ?` : ""}
                                ${Submit !== null ? `and formplant.state_status = ${Submit}` : ""}
                                ${(TypeDate !== null && StartDate !== null && EndDate !== null) ? `and ( UNIX_TIMESTAMP(formplant.${TypeDate}) >= UNIX_TIMESTAMP('${StartDate}') and UNIX_TIMESTAMP(formplant.${TypeDate}) <= UNIX_TIMESTAMP('${EndDate}') )` : ""}
                                
                        ORDER BY ${OrderBy}
                    ) as fromInsert
                    WHERE formplant.id = fromInsert.id and ( INSTR(formplant.id , ?) or formplant.id = fromInsert.success_id_plant )
                    `
                    , [TextInsert , result['data']['station_doctor'] , ...TypePlant , TextInsert ] , 
                    async (err , listFarm)=>{
                        if (err) {
                            dbpacket.dbErrorReturn(con, err, res);
                            console.log("select form");
                        }

                        const DataExport = await new Promise( async (resole , reject)=>{
                            const Data = new Array
                            for(let val of listFarm){

                                const Farmer = await new Promise((resole , reject)=>{
                                    con.query(
                                        `
                                        SELECT acc_farmer.id_farmer , acc_farmer.fullname , 
                                            (
                                                SELECT name
                                                FROM station_list
                                                WHERE id = acc_farmer.station
                                            ) as station
                                        FROM acc_farmer , 
                                            (
                                                SELECT link_user
                                                FROM housefarm , 
                                                (
                                                    SELECT id_farm_house
                                                    FROM formplant
                                                    WHERE id = ?
                                                ) as plant
                                                WHERE housefarm.id_farm_house = plant.id_farm_house
                                            ) as house
                                        WHERE acc_farmer.link_user = house.link_user AND station = ? AND register_auth != 2
                                        ORDER BY date_register DESC , register_auth DESC
                                        LIMIT 1
                                        ` , [val.id , result['data']['station_doctor']] ,
                                        (err , result) => {
                                            resole(result)
                                        }
                                    )
                                })

                                const Fertirizer = await new Promise((resole , reject)=>{
                                    con.query(
                                        `
                                            SELECT * 
                                            FROM formfertilizer
                                            WHERE id_plant = ?
                                        ` , [val.id] ,
                                        (err , result) => {
                                            const ResultEx = result.map((val , key)=>{
                                                val.source = wordcut.cut(val.source)
                                                return val
                                            })
                                            resole(ResultEx)
                                        }
                                    )
                                })
    
                                const chemical = await new Promise((resole , reject)=>{
                                    con.query(
                                        `
                                            SELECT * 
                                            FROM formchemical
                                            WHERE id_plant = ?
                                        ` , [val.id] ,
                                        (err , result) => {
                                            const ResultEx = result.map((val , key)=>{
                                                val.source = wordcut.cut(val.source)
                                                return val
                                            })
                                            resole(ResultEx)
                                        }
                                    )
                                })
    
                                const Report = await new Promise((resole , reject)=>{
                                    con.query(
                                        `
                                            SELECT * , 
                                            (
                                                SELECT fullname_doctor
                                                FROM acc_doctor
                                                WHERE id_table_doctor = report_detail.id_table_doctor
                                            ) as name_doctor
                                            FROM report_detail
                                            WHERE id_plant = ?
                                        ` , [val.id] ,
                                        (err , result) => {
                                            const ResultEx = result.map((val , key)=>{
                                                val.report_text = wordcut.cut(val.report_text)
                                                return val
                                            })
                                            resole(ResultEx)
                                        }
                                    )
                                })
    
                                const CheckForm = await new Promise((resole , reject)=>{
                                    con.query(
                                        `
                                            SELECT * , 
                                            (
                                                SELECT fullname_doctor
                                                FROM acc_doctor
                                                WHERE id_table_doctor = check_form_detail.id_table_doctor
                                            ) as name_doctor
                                            FROM check_form_detail
                                            WHERE id_plant = ?
                                        ` , [val.id] ,
                                        (err , result) => {
                                            const ResultEx = result.map((val , key)=>{
                                                val.note_text = wordcut.cut(val.note_text)
                                                return val
                                            })
                                            resole(ResultEx)
                                        }
                                    )
                                })
    
                                const CheckPlant = await new Promise((resole , reject)=>{
                                    con.query(
                                        `
                                            SELECT * , 
                                            (
                                                SELECT fullname_doctor
                                                FROM acc_doctor
                                                WHERE id_table_doctor = check_plant_detail.id_table_doctor
                                            ) as name_doctor
                                            FROM check_plant_detail
                                            WHERE id_plant = ?
                                        ` , [val.id] ,
                                        (err , result) => {
                                            resole(result)
                                        }
                                    )
                                })
    
                                Data.push({
                                    dataForm : val,
                                    farmer : Farmer,
                                    ferti : Fertirizer,
                                    chemi : chemical,
                                    report : Report,
                                    checkForm : CheckForm,
                                    checkPlant : CheckPlant
                                })
                            }
                            con.end()
                            resole(Data)
                        })

                        res.send(DataExport)
                    }
                )
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })
    // end formplant

    //data
    app.post('/api/doctor/data/get' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            
            console.log(result)
            if(result['result'] === "pass") {
                const From = req.body.type == "plant" ? "plant_list" : 
                                req.body.type == "fertilizer" ? "fertilizer_list" : 
                                req.body.type == "chemical" ? "chemical_list" :
                                req.body.type == "source" ? "source_list" : 
                                req.body.type == "pest" ? "pests" : ""
                
                const QuerySearch = Object.entries(req.body.check).map((Data)=>{
                    // Data[0] = Key ของ column ในแต่ละ table ซึ่ง table ก็มี plant fertilizer chemical source , Data[1] ข้อมูลที่ต้องการค้นหา
                    // Object.entries จะทำการแยก Object ออกเป็น Array จะได้เป็น [ [ key , value ] ]
                    const Check = req.body.type == "plant" ? { name : 1 , type_plant : 1 } : 
                                    req.body.type == "fertilizer" ? { name : 1 , name_formula : 1 } : 
                                    req.body.type == "chemical" ? { name : 1 , name_formula : 1 } :
                                    req.body.type == "source" ? { name : 1 } : 
                                    req.body.type == "pest" ? { pest_name : 1 , type_pest : 1 } : 
                                    ""
                    if(!Check || !Check[Data[0]]) return null
                    else if(Data[0] == "name_formula" && req.body.type == "fertilizer") return `( ${Data[0]} LIKE '${Data[1]}' )` // สำหรับค้นหาสูตรปุ๋ย เลยใช้ LIKE เพราะทาง client จะส่งค่าที่มี %% มาด้วยหากพิมพ์มาไม่ครบช่อง
                    else return `INSTR( ${Data[0]} , '${Data[1]}' )`
                })

                const StartRow = !isNaN(req.body.StartRow) ? req.body.StartRow : 0
                const Limit = !isNaN(req.body.Limit) ? req.body.Limit : 0
                if(From && QuerySearch.filter(val => val == null).length === 0) {
                    const columnName = (
                        req.body.type == "pest" ? "pest_name" : "name"
                    )
                    con.query(
                        `
                        SELECT * 
                        FROM ${From}
                        ${QuerySearch.join(" and ") ? `WHERE ${QuerySearch.join(" and ").replaceAll(";" , "")}` : ""}
                        ORDER BY is_use DESC , ${columnName} ASC
                        LIMIT ${Limit} OFFSET ${StartRow}
                        ` , 
                        (err , list) => {
                            if(err) {
                                console.log(err)
                                con.end()
                                res.send("error")
                                return 0
                            }
    
                            con.end()
                            res.send(list)
                        }
                    )
                } else {
                    con.end()
                    res.send("error")
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/data/check/overlape' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const From = (
                    req.body.type == "plant" ? "plant_list" : 
                    req.body.type == "fertilizer" ? "fertilizer_list" : 
                    req.body.type == "chemical" ? "chemical_list" :
                    req.body.type == "source" ? "source_list" : 
                    req.body.type == "pest" ? "pests" : ""
                )
                if(From) {
                    try {
                        const where = Object.entries(req.body.check).map((checkData)=>{
                            checkData[1] = `"${checkData[1].trim()}"`
                            return checkData.join("=").replaceAll(" " , "").replaceAll(";" , "")
                        }).join(" and ")

                        const id = (
                            req.body.type == "pest" ? "pest_id" : "id"
                        )
                        con.query(
                            `
                            SELECT (
                                SELECT EXISTS (
                                    SELECT ${id} 
                                    FROM ${From}
                                    WHERE ${where} and is_use = 1
                                )
                            ) as checkData
                            ` , 
                            (err , data) => {
                                if(err) console.log(err)
        
                                con.end()
                                res.send(data[0].checkData.toString())
                            }
                        )
                    } catch (err) {
                        con.end()
                        res.send("error")
                    }
                } else {
                    con.end()
                    res.send("error")
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/data/insert' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const From = (
                    req.body.type == "plant" ? "plant_list" : 
                    req.body.type == "fertilizer" ? "fertilizer_list" : 
                    req.body.type == "chemical" ? "chemical_list" :
                    req.body.type == "source" ? "source_list" : 
                    req.body.type == "pest" ? "pests" : ""
                )
                if(From) {
                    try {
                        const where = Object.entries(req.body.check).map((checkData)=>{
                            checkData[1] = `"${checkData[1].trim()}"`
                            return checkData.join("=").replaceAll(" " , "").replaceAll(";" , "")
                        }).join(" and ")
                        const id = (
                            req.body.type == "pest" ? "pest_id" : "id"
                        )
                        con.query(
                            `
                            SELECT (
                                SELECT EXISTS (
                                    SELECT ${id} 
                                    FROM ${From}
                                    WHERE ${where}
                                )
                            ) as checkData
                            ` , 
                            (err , data) => {
                                if(err) console.log(err)
        
                                if(!data[0].checkData) {
                                    const {
                                        varietie , ...body
                                    }= req.body.data
                                    const Key = Object.entries(body).map(val=>val[0])
                                    const InsertArray = Object.entries(body).map(val=> val[0] === "location" && val[1] ? "ST_PointFromText(?)" : "?")
                                    const dataInsert = Object.entries(body).map(val=>val[1])
                                    try {
                                        con.query(
                                            `
                                                INSERT INTO ${From} 
                                                ( ${Key.join(",").replaceAll(" " , "").replaceAll(";" , "")} )
                                                VALUES 
                                                ( ${InsertArray.join(",")} )
                                            ` , dataInsert , (err , result)=>{

                                                if(err){
                                                    con.end()
                                                    res.send("error")
                                                } else {
                                                    
                                                    if(req.body.type == "plant"){
                                                        const insertId = result.insertId
                                                        const {
                                                            name , qty_harvest 
                                                        } = varietie
                                                        con.query(
                                        
                                                            `INSERT INTO varieties
                                                            ( plant_id , variety_name , dates ) 
                                                            VALUES ( ? , ? , ?)`
                                                         , [insertId , name , qty_harvest ] , (err , result) => {
                                                            if(err){
                                                                con.end()
                                                                res.send("error")
                                                            }
                
                                                            con.end()
                                                            res.send("insert")
                                                        }
                                                    )
                                                    } else {
                                                      res.send("insert")
                                                    }
                                                }
                                            }
                                        )
                                    } catch(err) {
                                        con.end()
                                        res.send("error")
                                    }
                                } else {
                                    con.end()
                                    res.send("over")
                                }
                            }
                        )
                    } catch (err) {
                        con.end()
                        res.send("error")
                    }
                } else {
                    con.end()
                    res.send("error")
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.send("password")
            }
        }
    })

    app.post('/api/doctor/data/edit' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.body.password
    
        if(username === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const data_id = req.body.id_list
                const type_request = req.body.type
                const From = (
                    type_request == "plant" ? "plant_list" : 
                    type_request == "fertilizer" ? "fertilizer_list" : 
                    type_request == "chemical" ? "chemical_list" :
                    type_request == "pest" ? "pests" : 
                    type_request == "source" ? "source_list" : ""
                )
                if(From && data_id) {
                    const columnID = (
                        type_request == "pest" ? "pest_id" : "id"
                    )
                    try {
                        // ตัดการส่ง check จากหน้าบ้าน ให้หลังบ้าน check แทน
                        // revise code
                        const OverCheck = Object.entries(req.body.check).map((checkData)=>{
                            checkData[1] = `"${checkData[1].trim()}"`
                            return checkData.join("=").replaceAll(" " , "")
                        })
                            .join(" and ")
                            .replaceAll(";" , "")

                        const resultCheck = OverCheck.length ? await new Promise((resole , reject)=>{
                            con.query(
                                `
                                SELECT (
                                    SELECT EXISTS (
                                        SELECT ${columnID} 
                                        FROM ${From}
                                        WHERE ${OverCheck}
                                    )
                                ) as checkData
                                ` , (err , resultIn)=>{
                                    console.log(resultIn)
                                    if(err) {
                                        console.log(err)
                                        resole(0)
                                    }
                                    resole(parseInt(resultIn[0].checkData))
                                }
                            )
                        }) : false;

                        if(!resultCheck) {
                            const update = Object.entries(req.body.data).map(data=>{
                                if(data[0] === "location") {
                                    data[1] = data[1] != "0" ? `ST_PointFromText("${data[1].trim()}")` : "NULL"
                                }
                                else data[1] = `"${data[1].trim()}"`
                                return data.join(" = ")
                            })
                                .join(' , ')
                                .replaceAll(";" , "")
                                .replaceAll(" " , "")

                            await new Promise((resole , reject)=>{
                                con.query(
                                    `
                                    UPDATE ${From}
                                    SET ${update}
                                    WHERE ${columnID} = ?
                                    ` , [data_id] , (err , updateData) => {
                                        resole()
                                    }
                                )
                            })

                            con.query(
                                `
                                SELECT * 
                                FROM ${From} 
                                WHERE ${columnID} = ?
                                ` , [data_id] , (err , select) => {
                                    if(err){
                                        con.end()
                                        res.send("err select")
                                        return 0
                                    }

                                    con.end()
                                    res.send({
                                        data : select,
                                        result : "pass"
                                    })
                                }
                            )
                        } else {
                            con.end()
                            res.send({
                                result : "over"
                            })
                        }
                    } catch (err) {
                        console.log(err)
                        con.end()
                        res.send({
                            result : "error"
                        })
                    }
                } else {
                    con.end()
                    res.send({
                        result : "error"
                    })
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.send({
                    result : "password"
                })
            }
        }
    })

    app.post('/api/doctor/data/change' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const type_request = req.body.type
                const From = (
                    type_request == "plant" ? "plant_list" : 
                    type_request == "pest" ? "pests" : 
                    type_request == "fertilizer" ? "fertilizer_list" : 
                    type_request == "chemical" ? "chemical_list" :
                    type_request == "source" ? "source_list" : ""
                )
                const state = req.body.state == 0 ? 0 : 1; 
                if(From) {
                    const columnID = (
                        type_request == "pest" ? "pest_id" : "id"
                    )
                    try {
                        const checkDataOpenDuplicate = state ? await new Promise((resole , reject)=>{
                            const Where = (
                                type_request == "plant" || type_request == "source" ? "fromMain.name = fromSub.name" : 
                                type_request == "fertilizer" || type_request == "chemical" ? "fromMain.name = fromSub.name AND fromMain.name_formula = fromSub.name_formula" :
                                type_request == "pest" ? "fromMain.pest_name = fromSub.pest_name" : 
                                ""
                            )

                            con.query(
                                `
                                    SELECT (
                                        SELECT EXISTS (
                                            SELECT ${columnID}
                                            FROM ${From} as fromSub
                                            WHERE ${Where} and ${columnID} <> ? and is_use = 1
                                        )
                                    ) as verify
                                    FROM ${From} as fromMain
                                    WHERE ${columnID} = ?
                                ` , [ req.body.id_list , req.body.id_list ] , 
                                (err , result) => {
                                    if(err) reject(err)
                                    else resole(!result[0].verify)
                                }
                            )
                        }) : true
                        if(checkDataOpenDuplicate) {
                            con.query(
                                `
                                UPDATE ${From} SET is_use = ? WHERE ${columnID} = ? and is_use != ?
                                ` , [ state , req.body.id_list , state ] ,
                                (err , list) => {
                                    if(err) {
                                        con.end()
                                        res.send("error")
                                        return 0
                                    }
            
                                    con.end()
                                    res.send('113')
                                }
                            )
                        } else {
                            con.end()
                            res.send('over')
                        }
                    } catch(e) {
                        con.end()
                        res.send("error")
                    }
                } else {
                    con.end()
                    res.send("error")
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.get('/api/doctor/notify/get' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                const countUnRead = await new Promise((resole , reject)=>{
                    con.query(
                        `
                        SELECT COUNT(id) as count
                        FROM notify_doctor
                        WHERE COALESCE(JSON_CONTAINS(id_read , '"read"' , '$."?"') , 0) = 0 
                                AND station = ?
                        ` , [ result.data.id_table_doctor , result.data.station_doctor ] , 
                        (err , COUNT) => {
                            resole(isNaN(parseInt(COUNT[0].count)) ? 0 : parseInt(COUNT[0].count))
                        }
                    )
                })

                const Oparetor = (req.query.type != "count") ? (req.query.type == "start" || req.query.type == "update") ? ">" : "<" : ""; 
                const getNotify = (Oparetor) ? await new Promise((resole , reject)=>{
                    con.query(
                        `
                        SELECT * ,
                        (
                            SELECT img
                            FROM acc_farmer
                            WHERE acc_farmer.id_table = notify_doctor.id_table_farmer
                        ) as img_farmer
                        FROM notify_doctor
                        WHERE station = ? AND id ${Oparetor} ?
                        ORDER BY id DESC
                        LIMIT ${req.query.type == "start" ? countUnRead != 0 ? countUnRead + 3 : 10 :
                                req.query.type == "update" ? "999999" :
                                req.query.type == "get" ? "10" : 0}
                        ` , [ result.data.station_doctor , req.query.id ] , 
                        (err , list) => {
                            if(list.length) list.map(val=>{
                                val.img_farmer = val.img_farmer ? val.img_farmer.toString() : "/acc_doctor.jpg"
                                return val
                            })

                            con.query(
                                `
                                UPDATE notify_doctor
                                SET id_read = JSON_SET(id_read, '$."?"', 'read')
                                WHERE id <= ?
                                ` , [result["data"].id_table_doctor , list[0] ? list[0].id : 0] , 
                                (err , read)=>{
                                    resole(list)
                                }
                            )
                        }
                    )
                }) : []
                
                const Send = {
                    List : getNotify,
                    countUn : countUnRead,
                    station : result.data.station_doctor
                }

                con.end()
                res.send(Send)
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/notify/read' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                // fuction api read notify of ID all of client
                con.query(
                    `
                    UPDATE notify_doctor
                    SET id_read = JSON_SET(id_read, '$."?"', 'read')
                    WHERE id <= ?
                    ` , [result["data"].id_table_doctor , req.body.id_notify] , 
                    (err , read)=>{
                        // socket.to(req.body.uid_line).emit("new_msg" , "read")
                        con.end()
                        res.send("1")
                    }
                )
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    app.post('/api/doctor/google/maps/get' , async (req , res)=>{
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
    
        if(username === '' || password === '' || !apifunc.authCsurf("doctor" , req , res)) {
            res.redirect('/api/logout')
            return 0
        }
    
        let con = Database.createConnection(listDB)
    
        try {
            const result= await apifunc.auth(con , username , password , res , "acc_doctor")
            if(result['result'] === "pass") {
                try {
                    const Maps = await axios.request({
                        method : "GET",
                        maxBodyLength: Infinity,
                        url : req.body.link,
                        headers : {}
                    })

                    res.send({
                        PathMap : Maps.request.path,
                        DataMaps : JSON.stringify(Maps.data)
                    })
                    // res.send(JSON.stringify(Maps.data))
                } catch(e) {
                    res.send("")
                }
            }
        } catch (err) {
            con.end()
            if(err == "not pass") {
                res.redirect('/api/logout')
            }
        }
    })

    const ProfileConvertImg = (profile , column_img) => {
        const listFarmer = profile.map((val)=>{
            val[column_img] = val[column_img].toString()
            return val
        })
        return listFarmer
    }

    const SendToFarmerHouse = async (con , id_plant , textSend , otherText = "") => {
        return await new Promise((resole , reject)=>{
            con.query(
                `
                SELECT uid_line , house.name_house as name_house
                FROM acc_farmer ,
                (
                    SELECT link_user , name_house
                    FROM housefarm ,
                    (
                        SELECT id_farm_house
                        FROM formplant
                        WHERE id = ?
                    ) as formPlant
                    WHERE housefarm.id_farm_house = formPlant.id_farm_house
                ) as house
                WHERE house.link_user = acc_farmer.link_user and acc_farmer.register_auth != 2
                ` , [ id_plant ] ,
                async (err , listFarmer) => {
                    if(!err) {
                        const uid = listFarmer.map(val=>val.uid_line).filter(val=>val)
                        const nameHouse = [...(new Set(listFarmer.map(val=>val.name_house).filter(val=>val)))]
                        if(uid.length != 0 && nameHouse.length != 0) {
                            try {
                                await Line.multicast([...(new Set(uid))] , {type : "text" , text : `${textSend}\nในโรงเรือน : ${nameHouse[0]}${otherText}`})
                                resole([...(new Set(uid))])
                            } catch(e) {
                                resole("")
                            }
                        } else resole("")
                    } else resole("")
                }
            )
        })
    }

    const SendToFarmerLink = async (con , link_user , textSend) => {
        return await new Promise((resole , reject)=>{
            con.query(
                `
                SELECT uid_line
                FROM acc_farmer
                WHERE acc_farmer.link_user = ? and acc_farmer.register_auth != 2
                ` , [ link_user ] ,
                (err , listFarmer) => {
                    if(!err) {
                        const uid = listFarmer.map(val=>val.uid_line).filter(val=>val)
                        if(uid.length) {
                            try {
                                Line.multicast([...(new Set(uid))] , {type : "text" , text : `${textSend}`})
                            } catch(e) {}
                        }
                    }
                    resole("")
                }
            )
        })
    }

    app.post('/api/doctor/data/statistic/get', async (req, res) => {
        let username = req.session.user_doctor;
        let password = req.session.pass_doctor;
        
        if (username === '' || password === '') {
            res.redirect('/api/logout');
            return;
        }
        
        let con = Database.createConnection(listDB);
        
        try {
            const auth = await apifunc.auth(con, username, password, res, "acc_doctor");
            if (auth['result'] === "pass") {
            con.query(
                `
                SELECT
                    p.pest_name,
                    p.type_pest,
                    COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN fc.pest_id END) AS total_1_week,
                    COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN fc.pest_id END) AS total_1_month,
                    COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN fc.pest_id END) AS total_3_months,
                    COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) THEN fc.pest_id END) AS total_6_months,
                    COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN fc.pest_id END) AS total_1_year
                FROM formchemical fc
                LEFT JOIN pests p ON fc.insect = p.pest_name
                GROUP BY fc.insect
                LIMIT 25;
                `,
                (err, result) => {
                if (err) {
                    dbpacket.dbErrorReturn(con, err, res);
                    return;
                }
        
                con.end();
                res.send(result); // ส่งข้อมูลสรุป pest_name, type_pest และจำนวน pest ตามระยะเวลา
                }
            );
            }
        } catch (err) {
            con.end();
            if (err == "not pass") {
            res.redirect('/api/logout');
            }
        }
    });

    app.get('/api/doctor/data/report/list', async(req, res) => {
        let username = req.session.user_doctor
        let password = req.session.pass_doctor
        if(username === '' || password === '') {
          res.redirect('/api/logout')
          return 0
        }
        let con = Database.createConnection(listDB)
        try {
          const auth = await apifunc.auth(con , username , password , res , "acc_doctor")
          if(auth['result'] === "pass") {
            const station = auth['data']['station_data']
    // ดึงข้อมูลเกษตรกรและพืชใน station
            const farmerQuery = `
                SELECT
                acc_farmer.station,
                COUNT(DISTINCT acc_farmer.uid_line) AS total_farmers,
                COUNT(DISTINCT formplant.id_farm_house) AS total_plants,
                GROUP_CONCAT(DISTINCT formplant.name_plant SEPARATOR ', ') AS plants,
                CONCAT(
                    '[',
                    GROUP_CONCAT(
                        DISTINCT CONCAT(
                            '{"plantName":"', subquery.name_plant, '",' ,
                            '"id":"', subquery.id, '",' ,
                            '"farmersCount":', subquery.total_qty, ',' ,
                            '"duplicateCount":', subquery.duplicate_count, '}'
                        )
                    ),
                    ']'
                ) AS plantDetails
                FROM acc_farmer
                LEFT JOIN housefarm ON acc_farmer.uid_line = housefarm.uid_line
                LEFT JOIN formplant ON housefarm.id_farm_house = formplant.id_farm_house
                LEFT JOIN (
                    SELECT
                        formplant.id,
                        formplant.name_plant,
                        COUNT(formplant.name_plant) AS total_qty,
                        id_farm_house,
                        SUM(CASE WHEN COUNT(formplant.name_plant) > 1 THEN 1 ELSE 0 END) OVER (PARTITION BY formplant.name_plant) AS duplicate_count
                    FROM formplant
                    GROUP BY id_farm_house, formplant.name_plant
                ) AS subquery ON housefarm.id_farm_house = subquery.id_farm_house
                WHERE acc_farmer.station = ?
                GROUP BY acc_farmer.station;
            `;
            con.query(farmerQuery, [station], (err, farmerStatistics) => {
                if (err) {
                    console.error('Error fetching farmer statistics:', err);
                    res.status(500).json({ status: "error", message: "Database query error" });
                    return;
                }
                console.log('Farmer Statistics:', farmerStatistics);
        // ดึงรายชื่อหมอพืชสำหรับ station นี้
                const doctorQuery = `
                    SELECT id_doctor, fullname_doctor, station_doctor
                    FROM acc_doctor
                    WHERE station_doctor = ?;
                `;
                con.query(doctorQuery, [station], (err, doctors) => {
                    if (err) {
                        console.error('Error fetching doctor data:', err);
                        res.status(500).json({ status: "error", message: "Database query error" });
                        return;
                    }
                    console.log('Doctors:', doctors);
        // ส่งผลลัพธ์กลับไป
                    res.status(200).json({
                        status: "success",
                        data: {
                            farmerStatistics: farmerStatistics.map((stat) => ({
                                station: stat.station,
                                totalFarmers: stat.total_farmers,
                                totalPlants: stat.total_plants,
                                plants: stat.plants,
                                plantDetails: JSON.parse(stat.plantDetails || "[]").reduce((prev , curr) => {
                                    const indexFind = prev.findIndex(({ plantName }) => plantName === curr["plantName"])
                                    if(indexFind >= 0) {
                                        prev[indexFind]["farmersCount"] += curr["farmersCount"]
                                    } else {
                                        prev.push({
                                            plantName : curr["plantName"],
                                            farmersCount : curr["farmersCount"]
                                        })
                                    }
                                    return prev
                                } , []),
                            })),
                            doctors,
                        },
                    });
                });
            });
          }
        } catch (err) {
          con.end()
          if(err == "not pass") {
            res.redirect('/api/logout')
          }
        }
    });

    

}