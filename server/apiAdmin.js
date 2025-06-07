'use strict';

const { request } = require('axios');
const ConnectionPool = require('./connectPool');
const RoyalGapEnv = require('./core/env');
const { ca } = require('date-fns/locale');
const RoyalGapLine = require('./configLine');

require('dotenv').config().parsed
const axios = require('axios').default;

module.exports = function apiAdmin (app , Database , pool = new ConnectionPool() , apifunc , dbpacket , listDB , socket) {
  
  app.post('/api/admin/check' , (req , res)=>{
    res.redirect('/api/admin/auth');
  })
  
// doctor page
  app.post('/api/admin/doctor/list' , async (req , res)=>{
    const username = req.session.user_username
    const password = req.session.user_password
    
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
  
    try {

      const result = await apifunc.auth(con , username , password , res , "admin")
      if(result['result'] === "pass") {
        let data = req.body
        let select = data.typeDelete === 0 ? ", status_account , time_online" : ""
        const Limit = isNaN(parseInt(data.limit)) ? 0 : parseInt(data.limit)
        const StartRow = isNaN(parseInt(data.startRow)) ? 0 : parseInt(data.startRow)
        con.query(
          `
            SELECT 
            (
              SELECT name FROM station_list WHERE acc_doctor.station_doctor=station_list.id
            ) as station
            , id_table_doctor , fullname_doctor , id_doctor , img_doctor ${select}
            FROM acc_doctor
            WHERE status_delete = ? AND ( INSTR( id_doctor , ? ) OR INSTR( fullname_doctor , ? ) )
            ORDER BY status_account DESC , id_table_doctor DESC
            LIMIT ${Limit} OFFSET ${StartRow};
          ` 
        , 
        [data.typeDelete , data.textSearch , data.textSearch] ,
        (err , result)=>{
          con.end()
          if (!err){
            result.map(val=>{
              val.img_doctor = val.img_doctor.toString()
              return val
            })
            res.send(result)
          } else res.send("");
        })
      }

    } catch(err) {
      con.end()
      if(err == "not pass") {
        res.redirect('/api/logout')
      }
    }
    
  })


  // admin page
  app.post('/api/admin/admin/list' , async (req , res)=>{
    const username = req.session.user_username
    const password = req.session.user_password
  
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
  
    try {

      const result = await apifunc.auth(con , username , password , res , "admin")
      if(result['result'] === "pass") {
        let data = req.body
        let select = data.typeDelete === 0 ? ", status_account , time_online" : ""
        const Limit = isNaN(parseInt(data.limit)) ? 0 : parseInt(data.limit)
        const StartRow = isNaN(parseInt(data.startRow)) ? 0 : parseInt(data.startRow)
        con.query(
          `
            SELECT 
            (
              SELECT name FROM station_list WHERE admin.station_admin=station_list.id
            ) as station
            , id , username, fullname_admin ,img_admin ${select}
            FROM admin
            WHERE status_delete = ? AND ( INSTR( id , ? ) OR INSTR( username , ? ) )
            ORDER BY status_account DESC , id DESC
            LIMIT ${Limit} OFFSET ${StartRow};
          ` 
        , 
        [data.typeDelete , data.textSearch , data.textSearch] ,
        (err , result)=>{
          con.end()
          if (!err){
            result.map(val=>{
              val.img_admin = val.img_admin.toString()
              return val
            })
            res.send(result)
          } else res.send("");
        })
      }

    } catch(err) {
      con.end()
      if(err == "not pass") {
        res.redirect('/api/logout')
      }
    }
    
  })

  app.post('/api/admin/doctor/get' , async (req , res)=>{
    let username = req.session.user_username
    let password = req.session.user_password
    
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
  
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
      if(auth['result'] === "pass") {
        let data = req.body
        con.query(
          `
            SELECT 
            (
              SELECT name FROM station_list WHERE doctor_main.station_doctor=station_list.id
            ) as station , 
            id_table_doctor , fullname_doctor , id_doctor , img_doctor , status_account , status_delete
            FROM acc_doctor as doctor_main
            WHERE id_table_doctor = ? LIMIT 25;
          ` 
        , 
        [data.id_table] ,
        (err , result)=>{
          if (err){
            dbpacket.dbErrorReturn(con , err , res)
            return 0
          };
  
          con.end()
          res.send(apifunc.convertBuffer2Img(result , 'img_doctor'))
        })
      }
    } catch (err) {
      con.end()
      if(err == "not pass") {
        res.redirect('/api/logout')
      }
    }
  })

  app.post('/api/admin/role/get', async (req, res) => {
    let username = req.session.user_username;
    let password = req.session.user_password;

    if (!username || !password) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    let con = Database.createConnection(listDB);

    try {
        const auth = await apifunc.auth(con, username, password, res, "admin");
        if (auth['result'] !== "pass") {
            return res.status(403).json({ error: "Forbidden" });
        }

        let data = req.body;
        con.query(
          `SELECT 
              id_table_doctor, 
              doctor_role,
              analyst_role,
              consultant_role
          FROM acc_doctor 
          WHERE id_table_doctor = ? 
          LIMIT 1;`,
          [data.id_table],
          (err, result) => {
              if (err) {
                  console.error("❌ Database Error:", err);
                  return res.status(500).json({ error: "Database Error" });
              }

              if (result.length === 0) {
                  console.warn("⚠️ No data found for id_table:", data.id_table);
                  return res.status(404).json({ message: "No data found" });
              }

              console.log("🔍 Raw Database Result:", result);

              // ฟังก์ชันช่วย parse ค่า Buffer ให้เป็น 0 หรือ 1
              const parseRole = (val) => {
                  if (Buffer.isBuffer(val)) {
                      // ถ้าเป็น buffer เช่น <00> หรือ <01>
                      return val[0] === 1 ? 1 : 0;
                  }
                  // ถ้าเป็นตัวเลขอยู่แล้ว
                  return val == 1 ? 1 : 0;
              };

              const formattedResult = result.map(row => ({
                  id_table_doctor: row.id_table_doctor,
                  doctor_role: parseRole(row.doctor_role),
                  analyst_role: parseRole(row.analyst_role),
                  consultant_role: parseRole(row.consultant_role),
              }));

              console.log("✅ API Returning Data:", formattedResult);

              res.json(formattedResult);
          }
      );
  } catch (err) {
      console.error("❌ Error in API:", err);
      res.status(500).json({ error: "Internal Server Error" });
  } finally {
      con.end(); // ปิด connection
  }
});

app.post('/api/admin/role/update', async (req, res) => {
  let username = req.session.user_username;
  let password = req.session.user_password;

  if (!username || !password) {
      return res.status(401).json({ error: "Unauthorized" });
  }

  let con = Database.createConnection(listDB);

  try {
      const auth = await apifunc.auth(con, username, password, res, "admin");
      if (auth['result'] !== "pass") {
          return res.status(403).json({ error: "Forbidden" });
      }

      const { 
          id_table_doctor, 
          doctor_role, 
          analyst_role, 
          consultant_role 
      } = req.body;

      // อัปเดต role
      const sql = `
          UPDATE acc_doctor
          SET 
              doctor_role = ?, 
              analyst_role = ?, 
              consultant_role = ?
          WHERE id_table_doctor = ?
      `;

      con.query(
          sql,
          [doctor_role, analyst_role, consultant_role, id_table_doctor],
          (err, result) => {
              if (err) {
                  console.error("❌ Database Error:", err);
                  return res.status(500).json({ error: "Database Error" });
              }

              // ถ้าไม่มี row ไหนโดน update => แปลว่าไม่พบ id_table_doctor นี้
              if (result.affectedRows === 0) {
                  return res.status(404).json({ message: "No data found to update" });
              }

              res.json({ message: "Roles updated successfully" });
          }
      );

  } catch (err) {
      console.error("❌ Error in API:", err);
      res.status(500).json({ error: "Internal Server Error" });
  } finally {
      con.end();
  }
});


  app.post('/api/admin/admin/get' , async (req , res)=>{
    let username = req.session.user_username
    let password = req.session.user_password
  
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
  
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
      if(auth['result'] === "pass") {
        let data = req.body
        con.query(
          `
            SELECT 
            (
              SELECT name FROM station_list WHERE admin_main.station_admin=station_list.id
            ) as station , 
            id , fullname_admin , username , img_admin , status_account , status_delete
            FROM admin as admin_main
            WHERE id = ? LIMIT 25;
          ` 
        , 
        [data.id] ,
        (err , result)=>{
          if (err){
            dbpacket.dbErrorReturn(con , err , res)
            return 0
          };
  
          con.end()
          res.send(apifunc.convertBuffer2Img(result , 'img_admin'))
        })
      }
    } catch (err) {
      con.end()
      if(err == "not pass") {
        res.redirect('/api/logout')
      }
    }
  })

  app.post('/api/admin/doctor/because/get' , async (req , res)=>{
    let username = req.session.user_username
    let password = req.session.user_password
  
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
  
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
      if(auth['result'] === "pass") {
        let data = req.body
        const type_status = data.type_status === "status_account" ? "status" : 
                              data.type_status === "status_delete" ? "delete" : "";
        if(type_status && data.id_table) {
          con.query(
            `
              SELECT * 
              FROM because_${type_status}
              WHERE id_table_doctor = ?  AND role = 1
              ORDER BY date DESC;
            ` 
          , 
          [data.id_table] ,
          (err , result)=>{
            if (err){
              dbpacket.dbErrorReturn(con , err , res)
              return 0
            };
    
            con.end()
            res.send(result)
          })
        }
      }
    } catch (err) {
      con.end()
      if(err == "not pass") {
        res.redirect('/api/logout')
      }
    }
  })

  app.post('/api/admin/because/get' , async (req , res)=>{
    let username = req.session.user_username
    let password = req.session.user_password
  
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
  
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
      if(auth['result'] === "pass") {
        let data = req.body
        const type_status = data.type_status === "status_account" ? "status" : 
                              data.type_status === "status_delete" ? "delete" : "";
        if(type_status && data.id) {
          con.query(
            `
              SELECT * 
              FROM because_${type_status}
              WHERE id_table_doctor = ? AND role = 0
              ORDER BY date DESC;
            ` 
          , 
          [data.id] ,
          (err , result)=>{
            if (err){
              dbpacket.dbErrorReturn(con , err , res)
              return 0
            };
    
            con.end()
            res.send(result)
          })
        }
      }
    } catch (err) {
      con.end()
      if(err == "not pass") {
        res.redirect('/api/logout')
      }
    }
  })

  app.get('/api/admin/name' , (req , res)=>{
      
    let username = req.session.user_username
    let password = req.session.user_password

    if(username === '' || password === '' || !apifunc.authCsurf("admin" , req , res)) {
        res.redirect('/api/logout')
        return 0
    }

    let con = Database.createConnection(listDB)

    apifunc.auth(con , username , password , res , "admin").then((result)=>{
        con.end()
        res.send(result['data'].fullname_admin)
    }).catch((err)=>{
        if(err == "not pass") {
            con.end()
            res.redirect('/api/logout')
        } else if( err == "connect" ) {
            res.redirect('/api/logout')
        }
    })
})

	app.post('/api/admin/station/list' , (req , res)=>{
		let con = Database.createConnection(listDB)
		con.connect(( err )=>{
			if (err) {
				dbpacket.dbErrorReturn(con, err, res);
				console.log("connect");
				return 0;
			}

			con.query(`SELECT * FROM station_list WHERE is_use = 1` , (err , result)=>{
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


  app.post('/api/admin/profile/text/edit' , (req , res)=>{
    let username = req.session.user_username
    let password = req.body.password

    if(username === '' || !apifunc.authCsurf("admin" , req , res)) {
        res.redirect('/api/logout')
        return 0
    }

    let con = Database.createConnection(listDB)

    apifunc.auth(con , username , password , res , "admin").then((result)=>{
      console.log(result)
        const SET = req.body.type === "name" ? "fullname_admin = ?" :
                        req.body.type === "station" ? "station_admin = ?" :
                        req.body.type === "passwordNew" ? "password = SHA2( ? , 256)" : ""
        if(SET) {
            con.query(
                `
                UPDATE admin
                SET ${SET}
                WHERE id = ?
                ` , [ req.body.value , result["data"].id ] , 
                (err , resultEdit) => {
                    if(!err) {
                        if(req.body.type === "passwordNew") {
                            req.session.user_password = req.body.value
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

app.post('/api/admin/profile/image/edit' , (req , res)=>{
  let username = req.session.user_username
  let password = req.session.user_password

  if(username === '' || password === '' || !apifunc.authCsurf("admin" , req , res)) {
      res.redirect('/api/logout')
      return 0
  }

  let con = Database.createConnection(listDB)

  apifunc.auth(con , username , password , res , "admin").then((result)=>{
      con.query(
          `
          UPDATE admin
          SET img_admin = ?
          WHERE id = ?
          ` , [ req.body.img , result["data"].id ] , 
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

app.get('/api/admin/profile/get', (req, res) => {
  let username = req.session.user_username;
  let password = req.session.user_password;

  if(username === '' || password === '' || !apifunc.authCsurf("admin" , req , res)) {
      res.redirect('/api/logout')
      return 0
  }

  let con = Database.createConnection(listDB);

  apifunc.auth(con, username, password, res, "admin")
      .then((result) => {
          con.query(
              `
              SELECT name,id_station
              FROM station_list
              WHERE id = ?
              `, [result['data'].station_admin],
              (err, station) => {
                  con.end(); 
                  if (err) {
                      console.error("Database query error:", err);
                      return res.status(500).send("Database error");
                  }
                  
                  const name_station = station[0] ? station[0].name : "Unknown Station";
                  const id_station = station[0] ? station[0].id_station : null;

                  result['data'].img_admin = result['data'].img_admin ? result['data'].img_admin.toString() : null;

                  const responsePayload = {
                      ...result['data'],
                      name_station: name_station,
                      id_station: id_station
                  };

                  console.log("Response payload:", responsePayload); 
                  res.send(responsePayload);
              }
          );
      })
      .catch((err) => {
          con.end();
          console.error("Authentication error:", err);
          res.redirect('/api/logout');
      });
});


app.post('/api/admin/add', async (req, res) => {
  console.log(req.body);
  
  if (req.body['id'] && req.body['passwordAdNew'] && req.body['passwordAd']) {
      let username = req.session.user_username;
      let password = req.body['passwordAd'];

      if (username === '') {
          res.redirect('/api/logout');
          return;
      }

      let con = Database.createConnection(listDB);

      try {
          let auth = await apifunc.auth(con, username, password, res, "admin");
          if (auth['result'] === "pass") {
              // ตรวจสอบว่า username ซ้ำหรือไม่
              con.query(`
                  SELECT COUNT(*) as count
                  FROM admin 
                  WHERE username = ? AND status_delete = 0
              `, [req.body['id']], (err, result) => {
                  
                  if (err) {
                      dbpacket.dbErrorReturn(con, err, res);
                      console.log("Error checking admin existence");
                      return;
                  }

                  if (result[0].count > 0) {
                      con.end();
                      res.status(400).send("Username already exists");
                      return;
                  }

                  // ทำการ INSERT ข้อมูล
                  con.query(`
                      INSERT INTO admin
                      (
                          username, 
                          password, 
                          img_admin, 
                          station_admin, 
                          status_account, 
                          status_delete,
                          time_online
                      ) 
                      VALUES (?, SHA2(?,256), '', '', 1, 0, "")
                  `, [req.body['id'], req.body['passwordAdNew']], (err, result) => {
                      if (err) {
                          dbpacket.dbErrorReturn(con, err, res);
                          console.log("Error inserting admin");
                          return;
                      }
                      con.end();
                      res.send(result.affectedRows.toString());
                  });
              });
          }
      } catch (err) {
          if (err == "not pass") {
              con.end();
              res.send("incorrect");
          }
      }
  } else {
      res.send('error session');
  }
});


  app.post('/api/admin/add/doctor' , async (req , res)=>{
    if(req.body['id_doctor'] && req.body['passwordDT'] && req.body['passwordAd']) {
        
        let username = req.session.user_username;
        let password = req.body['passwordAd'];
    
        if(username === '') {
            res.redirect('/api/logout');
            return;
        }
    
        let con = Database.createConnection(listDB);
    
        try {
            let auth = await apifunc.auth(con , username , password , res , "admin");
            if(auth['result'] === "pass") {
                con.query(`
                    SELECT COUNT(*) as count
                    FROM acc_doctor 
                    WHERE id_doctor = ? AND status_delete = 0
                `, [req.body['id_doctor']], (err, result) => {
                    
                    if(err) {
                        dbpacket.dbErrorReturn(con , err , res);
                        console.log("Error checking doctor existence");
                        return;
                    }

                    if(result[0].count > 0) {
                        con.end();
                        res.status(400).send("Doctor ID already exists");
                        return;
                    } 

                    const { role2 , role3 , role4 } = req.body;
                    con.query(`
                        INSERT INTO acc_doctor
                        (
                            fullname_doctor, 
                            id_doctor, 
                            uid_line_doctor, 
                            password_doctor, 
                            img_doctor, 
                            station_doctor, 
                            status_account, 
                            status_delete,
                            time_online,
                            doctor_role,
                            analyst_role,
                            consultant_role
                        ) 
                        VALUES ('', ?, '', SHA2(?,256), '', '', 1, 0, "", ?, ?, ?)
                    `, [req.body['id_doctor'], req.body['passwordDT'], role2, role3, role4], 
                    (err, result) => {
                        if(err) {
                            dbpacket.dbErrorReturn(con , err , res);
                            console.log("Error inserting doctor");
                            return;
                        }
                        con.end();
                        res.send(result.affectedRows.toString());
                    });
                });
            }
        } catch (err) {
            if(err == "not pass") {
                con.end();
                res.send("incorrect");
            }
        }
    } else {
        res.send('error session');
    }
});


  app.post('/api/admin/manage/doctor' , async (req,res)=>{
    let username = req.session.user_username
    let password = req.body['password']
  
    if(username === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
  
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
      if(auth['result'] === "pass") {
        if(req.body['id_table'] != undefined && (req.body['status'] === 1 || req.body['status'] === 0) && req.body['type_status']) {
          const type_status = req.body['type_status'] === "status_account" ? "status" : 
                              req.body['type_status'] === "status_delete" ? "delete" : "";
          if(type_status) {
            con.query(
              `
              SELECT id_table_doctor 
              FROM acc_doctor 
              WHERE id_table_doctor = ? and status_delete = 0
              `
              , [ req.body['id_table'] ] , (err , deleteResult) => {
                if(err) {
                  dbpacket.dbErrorReturn(con , err , res)
                  console.log(`select check err`)
                  return 0
                }

                if(deleteResult.length) {
                  const params = type_status === "status" ? 
                      [ req.body['id_table'] , username , req.body['because'] , new Date() , req.body['status'] ] : 
                      [ req.body['id_table'] , username , req.body['because'] , new Date() ]

                  con.query(
                    `
                      INSERT INTO because_${type_status} 
                       (id_table_doctor , id_admin , because_text , role , date ${type_status === "status" ? ", type_status" : ""}) VALUES 
                      (? , ? , ? , 1 , ? ${type_status === "status" ? `, ?` : ""});
                    ` , params ,
                    (err , resultBecause) => {
                      if(err) {
                        dbpacket.dbErrorReturn(con , err , res)
                        console.log("insert change status doctor")
                        return 0
                      }
                      if(resultBecause.affectedRows) {
                        con.query(`
                            UPDATE acc_doctor 
                            SET ${req.body['type_status']} = ? 
                            WHERE id_table_doctor = ? ${type_status === "delete" ? "and status_delete = 0" : ""};` , 
                          [req.body['status'] , req.body['id_table']] , 
                          (err,result)=>{
                            if(err) {
                              dbpacket.dbErrorReturn(con , err , res)
                              console.log(`UPDATE ${type_status} err`)
                              return 0
                            }

                            con.end()
                            res.send("133")
                          })
                      } else {
                        con.end()
                        res.send("because")
                      }
                    }
                  )
                }
                else res.send("delete")
              }
            )
          }
        } else {
          con.end()
          res.send('error ID or status')
        }
      }
    } catch(err) {
      con.end()
      if(err == "not pass") {
        res.send("password")
      }
    }
  })

  // app.post('/api/admin/manage/admin' , async (req,res)=>{
  //   let username = req.session.user_username
  //   let password = req.body['password']
  
  //   if(username === '') {
  //     res.redirect('/api/logout')
  //     return 0
  //   }
  
  //   let con = Database.createConnection(listDB)
  //   console.log(req.body)
  //   try {
  //     const auth = await apifunc.auth(con , username , password , res , "admin")
  //     if(auth['result'] === "pass") {
  //       if(req.body['id'] != undefined && (req.body['status'] === 1 || req.body['status'] === 0) && req.body['type_status']) {
  //         const type_status = req.body['type_status'] === "status_account" ? "status" : 
  //                             req.body['type_status'] === "status_delete" ? "delete" : "";
  //         if(type_status) {
  //           con.query(
  //             `
  //             SELECT id
  //             FROM admin 
  //             WHERE id = ? and status_delete = 0
  //             `
  //             , [ req.body['id'] ] , (err , deleteResult) => {
  //               if(err) {
  //                 dbpacket.dbErrorReturn(con , err , res)
  //                 console.log(`select check err`)
  //                 return 0
  //               }

  //               if(deleteResult.length) {
  //                 const params = type_status === "status" ? 
  //                                 [ req.body['id'] , username , req.body['because'] , new Date() , req.body['status'] ] : 
  //                                 [ req.body['id'] , username , req.body['because'] , new Date() ]

  //                 con.query(
  //                   `
  //                     INSERT INTO because_${type_status} 
  //                    (id_table_doctor , id_admin , because_text , role , date ${type_status === "status" ? ", type_status" : ""}) VALUES 
  //                     (? , ? , ? , 0 , ? ${type_status === "status" ? `, ?` : ""});
  //                   ` , params ,
  //                   (err , resultBecause) => {
  //                     if(err) {
  //                       dbpacket.dbErrorReturn(con , err , res)
  //                       console.log("insert change status admin")
  //                       return 0
  //                     }
  //                     if(resultBecause.affectedRows) {
  //                       con.query(`
  //                           UPDATE admin 
  //                           SET ${req.body['type_status']} = ? 
  //                           WHERE id = ? ${type_status === "delete" ? "and status_delete = 0" : ""};` , 
  //                         [req.body['status'] , req.body['id']] , 
  //                         (err,result)=>{
  //                           if(err) {
  //                             dbpacket.dbErrorReturn(con , err , res)
  //                             console.log(`UPDATE ${type_status} err`)
  //                             return 0
  //                           }

  //                           con.end()
  //                           res.send("133")
  //                         })
  //                     } else {
  //                       con.end()
  //                       res.send("because")
  //                     }
  //                   }
  //                 )
  //               }
  //               else res.send("delete")
  //             }
  //           )
  //         }
  //       } else {
  //         con.end()
  //         res.send('error ID or status')
  //       }
  //     }
  //   } catch(err) {
  //     con.end()
  //     if(err == "not pass") {
  //       res.send("password")
  //     }
  //   }
  // })

  app.post('/api/admin/manage/admin', async (req, res) => {
    let username = req.session.user_username;
    let password = req.body['password'];
  
    if (username === '') {
      res.redirect('/api/logout');
      return;
    }
  
    let con = Database.createConnection(listDB);
    console.log(req.body);
    try {
      const auth = await apifunc.auth(con, username, password, res, "admin");
      if (auth['result'] === "pass") {
        if (req.body['id'] != undefined && (req.body['status'] === 1 || req.body['status'] === 0) && req.body['type_status']) {
          const type_status = req.body['type_status'] === "status_account" ? "status" :
                              req.body['type_status'] === "status_delete" ? "delete" : "";
          if (type_status) {
            con.query(
              `
              SELECT id
              FROM admin 
              WHERE id = ? and status_delete = 0
              `,
              [req.body['id']],
              (err, deleteResult) => {
                if (err) {
                  dbpacket.dbErrorReturn(con, err, res);
                  console.log(`select check err`);
                  return;
                }
  
                if (deleteResult.length) {
                  const params = type_status === "status" ?
                    [req.body['id'], username, req.body['because'], new Date(), req.body['status']] :
                    [req.body['id'], username, req.body['because'], new Date()];
  
                  con.query(
                    `
                      INSERT INTO because_${type_status} 
                      (id_table_doctor, id_admin, because_text, role, date${type_status === "status" ? ", type_status" : ""}) VALUES 
                      (?, ?, ?, 0, ?${type_status === "status" ? `, ?` : ""});
                    `,
                    params,
                    (err, resultBecause) => {
                      if (err) {
                        dbpacket.dbErrorReturn(con, err, res);
                        console.log("insert change status admin");
                        return;
                      }
                      if (resultBecause.affectedRows) {
                        // ตรวจสอบกรณีเปลี่ยน status_delete ให้เป็น 1 (ลบ) ว่าจะไม่ลบ admin ตัวสุดท้าย
                        if (type_status === "delete" && req.body['status'] === 1) {
                          con.query(
                            `SELECT COUNT(*) AS activeCount FROM admin WHERE status_delete = 0`,
                            (err, countResult) => {
                              if (err) {
                                dbpacket.dbErrorReturn(con, err, res);
                                return;
                              }
                              // หากมี active admin เหลือเพียง 1 ตัวและรายการที่เลือกเป็นตัวนั้น ไม่ให้ลบ
                              if (countResult[0].activeCount <= 1) {
                                con.end();
                                res.send("cannot delete last admin");
                                return;
                              } else {
                                con.query(
                                  `
                                    UPDATE admin 
                                    SET ${req.body['type_status']} = ? 
                                    WHERE id = ? and status_delete = 0;
                                  `,
                                  [req.body['status'], req.body['id']],
                                  (err, result) => {
                                    if (err) {
                                      dbpacket.dbErrorReturn(con, err, res);
                                      console.log(`UPDATE ${type_status} err`);
                                      return;
                                    }
                                    con.end();
                                    res.send("133");
                                  }
                                );
                              }
                            }
                          );
                        } else {
                          // กรณีไม่ใช่การลบ (หรือไม่เปลี่ยนเป็น 1) ให้ทำ update ทันที
                          con.query(
                            `
                              UPDATE admin 
                              SET ${req.body['type_status']} = ? 
                              WHERE id = ? ${type_status === "delete" ? "and status_delete = 0" : ""};
                            `,
                            [req.body['status'], req.body['id']],
                            (err, result) => {
                              if (err) {
                                dbpacket.dbErrorReturn(con, err, res);
                                console.log(`UPDATE ${type_status} err`);
                                return;
                              }
                              con.end();
                              res.send("133");
                            }
                          );
                        }
                      } else {
                        con.end();
                        res.send("because");
                      }
                    }
                  );
                } else {
                  res.send("delete");
                }
              }
            );
          }
        } else {
          con.end();
          res.send('error ID or status');
        }
      }
    } catch (err) {
      con.end();
      if (err == "not pass") {
        res.send("password");
      }
    }
  });

  // group page

  app.post('/api/admin/group/gets', async (req, res) => {
    let username = req.session.user_username;
    let password = req.session.user_password;
  
    if (!username || !password) {
      res.redirect('/api/logout');
      return;
    }
  
    let con = Database.createConnection(listDB);
  
    try {
      const auth = await apifunc.auth(con, username, password, res, "admin");
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

  app.post('/api/admin/group/get', async (req, res) => {
    let username = req.session.user_username;
    let password = req.session.user_password;
  
    if (!username || !password) {
      res.redirect('/api/logout');
      return;
    }
  
    let con = Database.createConnection(listDB);
  
    try {
      const auth = await apifunc.auth(con, username, password, res, "admin");
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

  app.post('/api/admin/group/insert' , async (req , res)=>{
    let username = req.session.user_username
    let password = req.session.user_password
 
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
    let con = Database.createConnection(listDB)
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
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

  app.post('/api/admin/group/edit' , async (req , res)=>{
    let username = req.session.user_username
    let password = req.session.user_password
 
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
    let con = Database.createConnection(listDB)
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
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
                con.end()
                if(dataUpdate.affectedRows) {
                  res.send({
                    status : 201,
                    result : "insert group"
                  })
                  return
                }

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

  app.post('/api/admin/group/search/safedate' , async (req , res)=>{
    let username = req.session.user_username
    let password = req.session.user_password
 
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
    let con = Database.createConnection(listDB)
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
      if(auth['result'] === "pass") {
        const chemical_id = req.body.chemical_id
        const plant_id = req.body.plant_id
 
        if(chemical_id && plant_id) {
          con.query(
            `
              SELECT safe_days 
              FROM pest_chemical
              WHERE chemical_id = ? AND plant_id = ?
              LIMIT 1
            `
            , [ chemical_id , plant_id ] , (err , dataSelect) => {
              if(err) {
                con.end()
                res.send({
                  status : 403,
                  result : "err insert"
                })
              }
 
              con.end()
              res.send({
                status : 200,
                data : dataSelect
              })
            }
          )
        } else {
          res.send({
            status : 404,
            data : {}
          })
        }
      }
    } catch (err) {
      con.end()
      if(err == "not pass") {
        res.redirect('/api/logout')
      }
    }
  })

  app.post('/api/admin/manage/group', async (req, res) => {
    let username = req.session.user_username;
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
        const auth = await apifunc.auth(con, username, password, res, "admin");
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


// data page
app.post('/api/admin/data/list', async (req, res) => {
  let username = req.session.user_username;
  let password = req.session.user_password;

  if (username === '' || password === '') {
      res.redirect('/api/logout');
      return;
  }

  let con = Database.createConnection(listDB);
  try {
      const auth = await apifunc.auth(con, username, password, res, "admin");
      if (auth['result'] === "pass") {
          let data = req.body;

          const type_data = (
              data.type === "plant" ? "plant_list" :
              data.type === "station" ? "station_list" :
              data.type === "chemical" ? "chemical_list" :
              data.type === "pest" ? "pests" :
              ""
          );

          if (!type_data) {
              res.send([]);
              return;
          }

          const columnName = (data.type === "pest" ? "pest_name" : "name");
          const Limit = isNaN(parseInt(data.limit)) ? 0 : parseInt(data.limit);
          const StartRow = isNaN(parseInt(data.startRow)) ? 0 : parseInt(data.startRow);

          // เงื่อนไขเฉพาะที่มี variety_name
          const tablesWithVariety = ['plant_list']; // สมมติว่าเฉพาะ plant_list มี variety_name

          let groupByClause = tablesWithVariety.includes(type_data)
              ? `GROUP BY ${columnName}, variety_name`
              : `GROUP BY ${columnName}`;

          const query = `
              SELECT * FROM ${type_data}
              WHERE INSTR(${columnName}, ?)
              ${groupByClause}
              ORDER BY is_use DESC, ${columnName} ASC
              LIMIT ${Limit} OFFSET ${StartRow}
          `;

          con.query(query, [data.textSearch], (err, result) => {
              if (err) {
                  dbpacket.dbErrorReturn(con, err, res);
                  console.log(`SELECT ${type_data} error:`, err);
                  return;
              }
              con.end();
              res.send(result);
          });
      }
  } catch (err) {
      con.end();
      if (err == "not pass") {
          res.redirect('/api/logout');
      }
  }
});


app.post('/api/admin/data/listforgroup', async (req, res) => {
  let username = req.session.user_username;
  let password = req.session.user_password;
 
  if (username === '' || password === '') {
      res.redirect('/api/logout');
      return;
  }
 
  let con = Database.createConnection(listDB);
  try {
      const auth = await apifunc.auth(con, username, password, res, "admin");
      if (auth['result'] === "pass") {
          let data = req.body;
 
          const type_data = (
              data.type === "plant" ? "plant_list" :
              data.type === "station" ? "station_list" :
              data.type === "chemical" ? "chemical_list" :
              data.type === "pest" ? "pests" :
              ""
          );
 
          if (!type_data) {
              res.send([]);
              return;
          }
 
          const columnName = (data.type === "pest" ? "pest_name" : "name");
          const Limit = isNaN(parseInt(data.limit)) ? 0 : parseInt(data.limit);
          const StartRow = isNaN(parseInt(data.startRow)) ? 0 : parseInt(data.startRow);
 
          const query = `
              SELECT * FROM ${type_data}
              WHERE INSTR(${columnName}, ?)
              GROUP BY ${columnName}
              ORDER BY is_use DESC, ${columnName} ASC
              LIMIT ${Limit} OFFSET ${StartRow}
          `;
 
          con.query(query, [data.textSearch], (err, result) => {
              if (err) {
                  dbpacket.dbErrorReturn(con, err, res);
                  console.log(`SELECT ${type_data} error:`, err);
                  return;
              }
              con.end();
              res.send(result);
          });
      }
  } catch (err) {
      con.end();
      if (err == "not pass") {
          res.redirect('/api/logout');
      }
  }
});


  app.post('/api/admin/data/get' , async (req , res)=>{
    let username = req.session.user_username
    let password = req.session.user_password
  
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
  
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
      if(auth['result'] === "pass") {
        let data = req.body

        const From = (
          data.type === "station" ? "station_list" : 
          data.type === "plant" ? "plant_list" : 
          data.type === "chemical" ? "chemical_list" : 
          data.type === "pest" ? "pests" : 
          false
        );

        const columnID = (
          data.type === "pest" ? "pest_id" : "id"
        )
        if(From) {
          con.query(
            `
              SELECT * FROM ${From} WHERE ${columnID} = ?
            ` 
          , 
          [data.id] ,
          (err , result)=>{
            if (err){
              dbpacket.dbErrorReturn(con , err , res)
              return 0
            };
    
            con.end()
            res.send(result)
          })
        } else {
          con.end()
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

  app.post('/api/admin/data/insert', async (req, res) => {
    if (req.body.passwordAd && req.body.type) {
        let username = req.session.user_username;
        let password = req.body.passwordAd;

        if (username === '') {
            res.redirect('/api/logout');
            return 0;
        }

        let con = Database.createConnection(listDB);

        try {
            const auth = await apifunc.auth(con, username, password, res, "admin");
            if (auth['result'] === "pass") {
                const data = req.body;
                const From = (
                    data.type === "station" ? "station_list" :
                    data.type === "plant" ? "plant_list" :
                    data.type === "chemical" ? "chemical_list" :
                    data.type === "pest" ? "pests"
                    : ""
                );

                const columnName = (
                    data.type === "pest" ? "pest_name" : "name"
                );

                let checkQuery = `SELECT * FROM ${From} WHERE ${columnName} = ? `;
                let checkParams = [data.name];

                if (data.type === "plant") {
                    checkQuery += "AND variety_name = ? ";
                    checkParams.push(data.variety_name);
                }

                if (data.type === "station") {
                    checkQuery += "OR id_station = ? ";
                    checkParams.push(data.id_station);
                }

                checkQuery += "AND is_use = 1;";

                con.query(checkQuery, checkParams, (err, result) => {
                    if (!err) {
                        if (!result.length) {
                            if (From) {
                                con.query(
                                    `
                                    INSERT INTO ${From} 
                                    (
                                        ${columnName}, 
                                        is_use 
                                        ${
                                            data.type === "plant" ? ", type_plant , qty_harvest , variety_name" : 
                                            data.type === "station" ? ", location, id_station" : 
                                            data.type === "chemical" ? ", name_formula , how_use , date_safe_list" : 
                                            data.type === "pest" ? ", type_pest" :
                                            ""
                                        }
                                    ) 
                                    VALUES 
                                    (
                                        ?, 
                                        1 
                                        ${
                                            data.type === "plant" ? `, ?, ?, ?` : 
                                            data.type === "station" ? `, POINT(?, ?), ?` : 
                                            data.type === "chemical" ? ", ?, ?, ?" : 
                                            data.type === "pest" ? ", ?" :
                                            ""
                                        }
                                    )
                                    `,
                                    data.type === "plant" ? [data.name, data.type_plant, data.qtyDate, data.variety_name] :
                                    data.type === "station" ? [data.name, data.lat, data.lng, data.id_station] :
                                    data.type === "chemical" ? [data.name, data.name_formula, data.how_use, data.date_safe] :
                                    data.type === "pest" ? [data.name, data.type_pest] : []
                                    ,
                                    (err, insert) => {
                                        if (err) {
                                            dbpacket.dbErrorReturn(con, err, res);
                                            console.log(`insert ${data.type} err`);
                                            return 0;
                                        }

                                        con.end();
                                        res.send(insert.affectedRows.toString());
                                    }
                                );
                            }
                        } else {
                            con.end();
                            if (data.type === "station" && result.some(row => row.id_station === data.id_station)) {
                                res.send("duplicate_id_station");
                            } else {
                                res.send("overflow");
                            }
                        }
                    } else {
                        con.end();
                        res.send('error session');
                        console.log(`select ${From} err`);
                    }
                });
            }
        } catch (err) {
            if (err == "not pass") {
                con.end();
                res.send("incorrect");
            }
        }
    } else {
        res.send('error session');
    }
});

app.post('/api/admin/data/change', async (req, res) => {
  let username = req.session.user_username;
  let password = req.body['password'];

  if (username === '') {
    res.redirect('/api/logout');
    return;
  }

  let con = Database.createConnection(listDB);

  try {
    const auth = await apifunc.auth(con, username, password, res, "admin");
    if (auth['result'] === "pass") {
      const data = req.body;
      const From = (
        data.type === "station" ? "station_list" :
        data.type === "plant"   ? "plant_list"   :
        data.type === "chemical"? "chemical_list":
        data.type === "pest"    ? "pests"        : ""
      );

      const columnName = (data.type === "pest" ? "pest_name" : "name");
      const columnID   = (data.type === "pest" ? "pest_id"   : "id");

      if (From) {
        try {
          let verify = true;

          // ตรวจสอบซ้ำชื่อ เฉพาะ type = station/chemical เท่านั้น (ไม่ตรวจ plant/pest)
          if (
            (data.type === "station" || data.type === "chemical") &&
            data.state_use === 1
          ) {
            verify = await new Promise((resolve, reject) => {
              con.query(
                `SELECT EXISTS (
                  SELECT id
                  FROM ${From} as data_search
                  WHERE data_main.${columnName} = data_search.${columnName}
                  AND data_search.is_use = 1
                ) as verifyStatus
                FROM ${From} as data_main
                WHERE ${columnID} = ?`,
                [data.id_table],
                (err, result) => {
                  if (err) reject(err);
                  else resolve(!result[0].verifyStatus);
                }
              );
            });
          }

          if (verify) {
            con.query(
              `UPDATE ${From} SET is_use = ? WHERE ${columnID} = ?;`,
              [data.state_use, data.id_table],
              (err, result) => {
                if (err) {
                  con.end();
                  res.send("");
                } else {
                  if (From === "station" && result.changedRows) {
                    con.query(
                      `SELECT name FROM station_list WHERE id = ?`,
                      [data.id_table],
                      (err, result2) => {
                        if (!err) {
                          con.end();
                          sendNotifyToDoctor(
                            0,
                            data.id_table,
                            `${result2[0].name} ถูก${data.state_use ? "เปิด" : "ปิด"}`
                          );
                        }
                      }
                    );
                  } else {
                    con.end();
                  }
                  res.send("133");
                }
              }
            );
          } else {
            con.end();
            res.send("over");
          }
        } catch (err) {
          con.end();
          res.send("");
        }
      } else {
        res.send("no");
      }
    }
  } catch (err) {
    con.end();
    if (err == "not pass") {
      res.send("password");
    }
  }
});


  app.post('/api/admin/data/edit' , async (req , res)=>{
    let username = req.session.user_username
    let password = req.body['password']
  
    if(username === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
  
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
      if(auth['result'] === "pass") {
        const data = req.body
        const From = (
          data.type === "station" ? "station_list" :
          data.type === "plant" ? "plant_list" :
          data.type === "chemical" ? "chemical_list" :
          data.type === "pest" ? "pests"
          : ""
        );

        const columnName = (
          data.type === "pest" ? "pest_name" : "name"
        );

        if(From) {
          try {
            const verify = data.update.name ? await new Promise((resole , reject)=> {
              con.query(
                `
                SELECT (
                  SELECT EXISTS (
                    SELECT id
                    FROM ${From}
                    WHERE ${From}.${columnName} = ? and ${From}.is_use = 1
                  )
                ) as verifyStatus
                `
                ,[ data.update.name.replaceAll('"' , "") ], (err , result)=>{
                if(err) reject("")
                else resole(!result[0].verifyStatus)
              }) 
            }) : true
  
            if(verify) {
              const update = Object.entries(data.update).map(val=>{
                val[0] = val[0].replaceAll(" " , "")
                val[1] = val[1].replaceAll(" " , "")
                val = val.join("=")
                return val
              }).join(",").replaceAll(" " , "");
              con.query(
                `
                UPDATE ${From} 
                SET ${update}
                WHERE id = ?;
                `
                , [ data.id_table ] , (err , result)=>{
                if(err) {
                  con.end()
                  res.send("")
                } else {
                  con.end()
                  res.send("133")
                } 
              })
            } else {
              con.end()
              res.send("over")
            }
          } catch(err) {
            con.end()
            res.send("")
          }
        } else res.send("no")
      } 
    } catch (err) {
      con.end()
      if(err == "not pass") {
        res.send("password")
      }
    }
  })

  app.post('/api/admin/google/maps/get' , async (req , res)=>{
    let username = req.session.user_username
    let password = req.session.user_password
  
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)

    try {
        const auth = await apifunc.auth(con , username , password , res , "admin")
        if(auth['result'] === "pass") {
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
              res.send('{}')
            }
            // https.get(req.query.link , (resLink)=>{
            //     console.log(resLink)
            //     res.send(resLink.rawHeaders)
            // })
        }
    } catch (err) {
      con.end()
      if(err == "not pass") {
        res.redirect('/api/logout')
      }
    }
})
  
  app.post('/api/admin/delete' , (req , res)=>{
    let timeoutSession = 20
    if(req.body['ID'] &&
        req.session.checkDelete['value'] === process.env.KEY_SESSION + "delete" && 
        new Date().getTime() - req.session.checkDelete['time'] <= timeoutSession &&
        (req.hostname == HOST_CHECK || !HOST_CHECK)) {
      
      delete req.session.checkDelete
  
      let username = req.session.user_username
      let password = req.session.user_password
  
      if(username === '' || password === '') {
        res.redirect('/api/logout')
        return 0
      }
  
      let con = Database.createConnection(listDB)
  
      apifunc.auth(con , username , password , res , "admin").then((result)=>{
        if(result['result'] === "pass") {
          con.query(`UPDATE admin SET status_delete = 1 WHERE id=?` , [req.body['ID']] , (err , result)=>{
            if(err) {
              dbpacket.dbErrorReturn(con , err , res)
              return 0
            }
      
            con.end()
            res.send('1')
          })
        }
  
      }).catch((err)=>{
        con.end()
        if(err == "not pass") {
          res.redirect('/api/logout')
        }
      })
    }
    
    else {
      delete req.session.checkDelete
      res.send('error session')
    }
  
  })

  // check Login
  app.all('/api/admin/auth', async (req, res) => {
    // เช็คการเข้าสู่ระบบจริงๆ
    let username = req.session.user_username ?? req.body['username'] ?? '';
    let password = req.session.user_password ?? req.body['password'] ?? '';

    if (username === '' || password === '') {
        res.redirect('/api/logout');
        return;
    }

    let con = Database.createConnection(listDB);

    try {
        let auth = await apifunc.auth(con, username, password, res, "admin");

        // ตรวจสอบว่าผลลัพธ์เป็น "pass" และมีข้อมูลของบัญชี
        if (auth['result'] === "pass" && auth['data']) {
            let status_account = auth['data']['status_account'];
            let status_delete = auth['data']['status_delete'];

            // ถ้าบัญชีถูกปิดใช้งานหรือถูกลบ -> ไม่อนุญาตให้เข้าสู่ระบบ
            if (status_account == 0 || status_delete == 1) {
                con.end();
                res.send('account_disabled');  // ส่งข้อความแจ้งเตือนให้ผู้ใช้
                return;
            }

            // บัญชีปกติ สามารถเข้าสู่ระบบได้
            req.session.user_username = username;
            req.session.user_password = password;
            req.session.tokenSession = apifunc.getTokenCsurf(req);

            con.end();
            res.send('1'); // ส่งค่ากลับแจ้งว่าเข้าสู่ระบบสำเร็จ
        } else {
            con.end();
            res.redirect('/api/logout');
        }
    } catch (err) {
        con.end();
        res.redirect('/api/logout');
    }
});

  
  app.get('/api/logout' , (req , res) => {
    req.session.destroy()
    res.send('')
  })
// report page
app.post('/api/admin/report/list', async(req, res) => {
  let username = req.session.user_username
  let password = req.session.user_password

  if(username === '' || password === '') {
    res.redirect('/api/logout')
    return 0
  }

  let con = Database.createConnection(listDB)

  try {
    const auth = await apifunc.auth(con , username , password , res , "admin")
    if(auth['result'] === "pass") {
      const station = auth['data']['station_admin']
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


  app.post('/api/admin/statistic/get', async (req, res) => {
    let username = req.session.user_username;
    let password = req.session.user_password;
  
    if (username === '' || password === '') {
      res.redirect('/api/logout');
      return;
    }
  
    let con = Database.createConnection(listDB);
  
    try {
      const auth = await apifunc.auth(con, username, password, res, "admin");
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
            WHERE af.station = ? AND INSTR( p.pest_name , ? )
            GROUP BY fc.insect
            LIMIT 25;`, [auth['data']['station_admin'] , search] ,
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

  app.post('/api/admin/chemical_pest/get', async (req, res) => {
    let username = req.session.user_username;
    let password = req.session.user_password;

    if (!username || !password) {
        res.redirect('/api/logout');
        return;
    }

    let con = Database.createConnection(listDB);

    try {
        const auth = await apifunc.auth(con, username, password, res, "admin");
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

// app.post('/api/admin/sendNotifyreport/get', async (req, res) => {
//     console.log(" Raw body received:", req.body);
//     console.log(" selectedData:", req.body.selectedData);
//     console.log(" minCount:", req.body.minCount);
   
//     let username = req.session.user_username;
//     let password = req.session.user_password;
 
//     if (!username || !password) {
//         res.redirect('/api/logout');
//         return;
//     }
 
//     let con = Database.createConnection(listDB);
//     console.log("Received selectedData:", req.body.selectedData);
//     console.log("Received minCount:", req.body.minCount);
 
//     try {
//         const auth = await apifunc.auth(con, username, password, res, "admin");
//         if (auth['result'] === "pass") {
//             const { selectedData, minCount } = req.body;
 
//             // บันทึกค่า minCount ลงในตาราง statistic
//             con.query(
//                 `
//                 INSERT INTO statistic (role, count_day ,id_role)
//                 VALUES (?,?,?)
//                 ON DUPLICATE KEY UPDATE count_day = VALUES(count_day)
//                 `,
//                 ["admin" , minCount , auth['data']['id']],
//                 (err) => {
//                     if (err) {
//                         console.error("Database error:", err);
//                         dbpacket.dbErrorReturn(con, err, res);
//                         return;
//                     }
//                 }
//             );
 
//             // ดึง uid_line ของ acc_farmer ที่เกี่ยวข้อง
//             con.query(
//                 `SELECT
//                     af.uid_line
//                  FROM formchemical fc
//                  LEFT JOIN pests p ON fc.insect = p.pest_name
//                  LEFT JOIN formplant fp ON fc.id_plant = fp.id
//                  LEFT JOIN housefarm hf ON fp.id_farm_house = hf.id_farm_house
//                  LEFT JOIN acc_farmer af ON hf.uid_line = af.uid_line
//                  WHERE af.station = ?
//                  LIMIT 25;`, [auth['data']['station_admin']],
//                 (err, result) => {
//                     if (err) {
//                         dbpacket.dbErrorReturn(con, err, res);
//                         return;
//                     }
 
//                     try {
//                         console.log("Query Result:", result);
//                         let uid = result.map(row => row.uid_line);
//                         let textSend = selectedData.map(item =>
//                             `พืช: ${item.name_plants}\n` +
//                             `ศัตรูพืชที่พบ: ${item.pest_name}\n` +
//                             `จำนวน: ${item.count}\n` +
//                             `สารเคมีที่ใช้: ${item.chemical_used || "-"}`
//                         ).join("\n\n");
 
//                         console.log("UIDs to send:", uid);
//                         console.log("Text to send:", textSend);
 
//                         // ส่งข้อความแจ้งเตือนไปยัง acc_farmer
//                         RoyalGapLine.multicast([...(new Set(uid))], { type: "text", text: textSend });
//                     } catch (e) {
//                         console.error("Error sending Line message:", e);
//                     }
 
//                     con.end();
//                     res.send(result);
//                 }
//             );
//         }
//     } catch (err) {
//         con.end();
//         if (err == "not pass") {
//             res.redirect('/api/logout');
//         }
//     }
// });
 
	app.post('/api/admin/sendNotifyreport/get', async (req, res) => {
		console.log("Raw body received:", JSON.stringify(req.body, null, 2));
	
		let username = req.session.user_username;
		let password = req.session.user_password;
	
		if (!username || !password) {
			res.redirect('/api/logout');
			return;
		}
	
		let con = Database.createConnection(listDB);
		console.log("Received selectedData:", req.body.selectedData);
		console.log("Received minCount:", req.body.minCount);
	
		try {
			const auth = await apifunc.auth(con, username, password, res, "admin");
			if (auth['result'] === "pass") {
				const { selectedData, minCount } = req.body;
	
				// บันทึกค่า minCount ลงในตาราง statistic
				con.query(
					`INSERT INTO statistic (role, count_day, id_role)
					VALUES (?, ?, ?)
					ON DUPLICATE KEY UPDATE count_day = VALUES(count_day)`,
					["admin", minCount, auth['data']['id']],
					(err) => {
						if (err) {
							console.error("Database error while inserting minCount:", err);
							dbpacket.dbErrorReturn(con, err, res);
							return;
						}
					}
				);
	
				// ดึงข้อมูล uid_line ของ acc_farmer
				con.query(
					`SELECT af.uid_line
					FROM formchemical fc
					LEFT JOIN pests p ON fc.insect = p.pest_name
					LEFT JOIN formplant fp ON fc.id_plant = fp.id
					LEFT JOIN housefarm hf ON fp.id_farm_house = hf.id_farm_house
					LEFT JOIN acc_farmer af ON hf.uid_line = af.uid_line
					WHERE af.station = ?
					LIMIT 25;`,
					[auth['data']['station_admin']],
					async (err, result) => { // ใช้ async เพราะต้อง fetch chemical data
						if (err) {
							console.error("Database error while retrieving farmers:", err);
							dbpacket.dbErrorReturn(con, err, res);
							return;
						}
	
						try {
							console.log("✅ Query Result (Farmers):", result);
							let uid = result.map(row => row.uid_line);
	
							// **ดึงข้อมูลสารเคมีของแต่ละ pest_id**
							for (let item in selectedData) {
								selectedData[item]["chemical_used"] = await new Promise((resolve) => {
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
										[selectedData[item].id], 
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
						
											resolve(chemicalNames)
										}
									);
								})
								console.log(`🔍 Retrieved Chemical for Pest ${item.pest_name} (ID: ${item.pest_id}):`, item.chemical_used);
							}
	
							//  **สร้างข้อความแจ้งเตือน**
							let textSend = selectedData.map(item =>
							`📢 ประกาศ: ขณะนี้ตรวจพบโรคพืช/ศัตรูพืช ${item.pest_name} ${item.count}จำนวน ระบาดในพื้นที่\n` +
							`ขอเตือนเกษตรกรที่ปลูก ${item.name_plants}\n` +
							`ถ้าพบว่าเป็น ${item.pest_name} ให้ใช้สารเคมี ${item.chemical_used} กำจัด`
						).join("\n\n");
	
							const uidSend = [...(new Set(uid))]
							console.log("📢 UIDs to send:", uidSend);
							console.log("📨 Text Message to Send:\n", textSend);
	
							//  **ส่งข้อความแจ้งเตือน**
							con.end();
							RoyalGapLine.multicast(uidSend, { type: "text", text: textSend });
	
						} catch (e) {
						con.end();
						console.error("Error sending Line message:", e);
						}
						res.send(result);
					}
				);
			}
		} catch (err) {
			con.end();
			console.error("❌ Authentication or unexpected error:", err);
			if (err == "not pass") {
				res.redirect('/api/logout');
			}
		}
	});

	// gapv3
	app.get('/api/admin/user-access-logs' , async (req , res)=>{
		let username = req.session.user_username
		let password = req.session.user_password
		
		if(username === '' || password === '') {
			res.redirect('/api/logout')
			return 0
		}
	
		let con = Database.createConnection(listDB)
	
		try {
			const auth = await apifunc.auth(con , username , password , res , "admin")
			if(auth['result'] === "pass") {
				con.end()

				const { station_id , user_type } = req.query

				const user_mapping = {
					table : "",
					table_id : "",
					fullname : ""
				}
				const arr_where = []
				const arr_params = []

				switch(Number(user_type)) {
					case RoyalGapEnv.access_type.doctor :
						user_mapping.table = "acc_doctor u"
						user_mapping.table_id = "u.id_table_doctor"
						user_mapping.fullname = "u.fullname_doctor"
						station_id && arr_where.push("u.station_doctor = ?") && arr_params.push(station_id)
						break;
					case RoyalGapEnv.access_type.farmer :
						user_mapping.table = "acc_farmer u"
						user_mapping.table_id = "u.id_table"
						user_mapping.fullname = "u.fullname"
						station_id && arr_where.push("u.station = ?") && arr_params.push(station_id)
						break;
				}

				arr_where.push("ual.user_type = ?")
				arr_params.push(user_type)

				if (!user_mapping.table || !user_mapping.table_id || !user_mapping.fullname) {
					return res.status(400).json({
						status: "error",
						message: "Invalid user type"
					})
				}

				try {
					const user_access_logs = await pool.executeQuery(
						`
							SELECT 
                CONCAT(ual.user_id , ual.user_type) as id,
								${user_mapping.table_id} AS user_id , 
								${user_mapping.fullname} AS fullname , 
								(
									SELECT access_date
									FROM user_access_logs ual2
									WHERE ual2.user_id = ual.user_id AND ual2.user_type = ual.user_type
									ORDER BY ual2.access_date DESC
									LIMIT 1
								) as access_date ,
								COUNT(*) AS total_access
							FROM user_access_logs ual
							LEFT JOIN ${user_mapping.table} ON ual.user_id = ${user_mapping.table_id}
							WHERE ${arr_where.join(" AND ")} AND ual.access_date >= DATE(DATE_SUB(NOW(), INTERVAL 7 DAY))
							GROUP BY ual.user_id , ual.user_type
							ORDER BY ual.access_date DESC
						`,
						arr_params
					)

          const process_date = await pool.executeQuery(
            `
              SELECT DATE(DATE_SUB(NOW(), INTERVAL 7 DAY)) as start_date , DATE(NOW()) as now_date
            `
          )

					return res.status(200).json({
						status: "success",
						user_access_logs: user_access_logs,
            process_date : process_date[0]
					})
				} catch (error) {
					console.error("Error fetching user access logs:", error);
					return res.status(500).json({
						status: "error",
						message: "Database query error"
					});
				}
			}
		} catch (err) {
			con.end()
			if(err == "not pass") {
				res.redirect('/api/logout')
			}
		}
	})

	const sendNotifyToDoctor = async (id_table , stationSend , msg) => {
		let con = Database.createConnection(listDB)
		con.connect( async ( err )=>{
			if(!err) {
				const Uid_line_send = await new Promise( async (resole , reject)=>{
					const uid_send = new Array
					await new Promise( async (resole , reject)=>{
						const ObjectProfile = await new Promise((resole , reject)=>{
							con.query(
								`
								SELECT uid_line_doctor
								FROM acc_doctor
								WHERE station_doctor = ? and status_account = 1 and status_delete = 0
								` , [stationSend] , 
								(err , doctor) => {
									resole(doctor)
								}
							)
						})
						if(ObjectProfile.length > 0) {
							const List_uid = ObjectProfile.map((val)=>val.uid_line_doctor).filter((val)=>val)
							uid_send.push(...List_uid)
						}
						resole("")
					})
					resole(new Set(uid_send))
				})
				con.query(
					`
					INSERT notify_doctor 
					(id_table_farmer , id_read , notify , station ) VALUES (? , ? , ? , ? )
					` , [id_table , '{}' , msg , stationSend] , 
					(err , result) => {
						con.end()
					}
				)
				
				socket.to(`notify-${stationSend}`).emit("update")
				if(Uid_line_send.size != 0) {
					line.multicast([...Uid_line_send] , {type : "text" , text : `${msg}`})
						.catch(e=>{})
				}
			}
		})
	}
}

  // app.post('/api/admin/chkOver' , (req , res)=>{
  //   let username = req.session.user_username
  //   let password = req.session.user_password
  
  //   if(username === '' || password === '') {
  //     res.redirect('/api/logout')
  //     return 0
  //   }
  
  //   let con = Database.createConnection(listDB)
  
  //   apifunc.auth(con , username , password , res , "admin").then((result)=>{
  //     if(result['result'] === "pass") {
  //       if(req.body['ID']) {
  //         con.query(`SELECT id_doctor FROM acc_doctor WHERE id_doctor=?` , [req.body['ID']] , (err,result)=>{
  //           if(err) {
  //             dbpacket.dbErrorReturn(con , err , res)
  //             return 0
  //           }
  
  //           con.end()
            
  //           if(result[0]) res.send('over')
  //           else res.send('1')
  
  //         })
  //       } else {
  //         con.end()
  //         res.send('error ID')
  //       }
  //     }
  //   }).catch((err)=>{
  //     con.end()
  //     if(err == "not pass") {
  //       res.redirect('/api/logout')
  //     }
  //   })
  
  //   // con.connect((err) => {
  //   //   if(err) {
  //   //     dbpacket.dbErrorReturn(con , err , res)
  //   //     return 0
  //   //   }
  
  //   //   con.query(`SELECT * FROM admin WHERE username=? AND password=?` , [username , password] , (err , result)=>{
  //   //     if (err) {
  //   //       dbpacket.dbErrorReturn(con , err , res)
  //   //       return 0
  //   //     };
    
  //   //     if(result[0]){
    
  //   //       if(req.body['ID']) {
  //   //         con.query(`SELECT id_doctor FROM acc_doctor WHERE id_doctor=?` , [req.body['ID']] , (err,result)=>{
  //   //           if(err) {
  //   //             dbpacket.dbErrorReturn(con , err , res)
  //   //             return 0
  //   //           }
  
  //   //           con.end()
              
  //   //           if(result[0]) res.send('over')
  //   //           else res.send('1')
  
  //   //         })
  //   //       } else {
  //   //         con.end()
  //   //         res.send('error ID')
  //   //       }
    
  //   //     } else {
  //   //       con.end()
  //   //       res.redirect('/api/logout')
  //   //     }
  //   //   })
  //   // })
  // })
  
  // check action of user
  // app.post('/api/admin/checkUserAction' , (req , res)=> {
  //   let username = req.session.user_username ?? '';
  //   let password = req.body['password'] ?? '';
  
  //   if(username === '') {
  //     res.redirect('/api/logout')
  //     return 0
  //   }
  
  //   let con = Database.createConnection(listDB)
  
  //   con.connect((err)=>{
  //     if(err) {
  //       dbpacket.dbErrorReturn(con , err , res)
  //       return 0
  //     }
  
  //     con.query(`SELECT * FROM admin WHERE username=? AND password=SHA2( ? , 256)` , [username , password] , (err , result)=>{
  //       if (err) {
  //         dbpacket.dbErrorReturn(con , err , res)
  //         return 0
  //       };
    
  //       if(result[0]){
  //         console.log(req.session.checkADD)
  //         if(req.body['type'] == "add") 
  //             req.session.checkADD = 
  //                   {
  //                     value : process.env.KEY_SESSION + "add",
  //                     time : new Date().getTime()
  //                   }
  //         else if(req.body['type'] == "delete") 
  //             req.session.checkDelete = 
  //                   {
  //                     value : process.env.KEY_SESSION + "delete",
  //                     time : new Date().getTime()
  //                   }
  //         res.send('1')
  //       } else {
  //         res.send('incorrect')
  //       }
    
  //       con.end()
  //     })
  //   })
  // })


// import module express config
// const app = require('./apiDoctor')

// // module DB and connect DB
// const db = require('mysql')

// const dbpacket = require('./dbConfig')
// const listDB = dbpacket.listConfig()

// const apifunc = require('./apifunc')

// const HOST_CHECK = (process.argv[2] == process.env.BUILD) ? process.env.HOST_SERVER : process.env.HOST_NAMEDEV
// req
