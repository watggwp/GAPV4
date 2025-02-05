require('dotenv').config().parsed
const axios = require('axios').default;

module.exports = function apiAdmin (app , Database , apifunc , dbpacket , listDB , socket , line) {
  
  app.post('/api/admin/check' , (req , res)=>{
    res.redirect('/api/admin/auth');
  })
  
// doctor page
  app.post('/api/admin/doctor/list' , async (req , res)=>{
    const username = req.session.user_admin
    const password = req.session.pass_admin
  
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
    const username = req.session.user_admin
    const password = req.session.pass_admin
  
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
            , id , username, img_admin ${select}
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
    let username = req.session.user_admin
    let password = req.session.pass_admin
  
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

  app.post('/api/admin/admin/get' , async (req , res)=>{
    let username = req.session.user_admin
    let password = req.session.pass_admin
  
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
            id , username , img_admin , status_account , status_delete
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
    let username = req.session.user_admin
    let password = req.session.pass_admin
  
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
              WHERE id_table_doctor=?
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
    let username = req.session.user_admin
    let password = req.session.pass_admin
  
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
              WHERE id_table_admin=?
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
      
    let username = req.session.user_admin
    let password = req.session.pass_admin

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
    let username = req.session.user_admin
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
                            req.session.pass_admin = req.body.value
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
  let username = req.session.user_admin
  let password = req.session.pass_admin

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
  let username = req.session.user_admin;
  let password = req.session.pass_admin;

  if(username === '' || password === '' || !apifunc.authCsurf("admin" , req , res)) {
      res.redirect('/api/logout')
      return 0
  }

  let con = Database.createConnection(listDB);

  apifunc.auth(con, username, password, res, "admin")
      .then((result) => {
          con.query(
              `
              SELECT name
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

                  result['data'].img_admin = result['data'].img_admin ? result['data'].img_admin.toString() : null;

                  const responsePayload = {
                      ...result['data'],
                      name_station: name_station
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


  app.post('/api/admin/add' , async (req , res)=>{
    console.log(req.body)
    if(req.body['id'] && req.body['passwordAdNew'] && req.body['passwordAd']) {    
      let username = req.session.user_admin
      let password = req.body['passwordAd']
  
      if(username === '') {
        res.redirect('/api/logout')
        return 0
      }
  
      let con = Database.createConnection(listDB)
  
      try {
        let auth = await apifunc.auth(con , username , password , res , "admin")
        if(auth['result'] === "pass") {
          con.query(`
                    SELECT id
                    FROM admin 
                    WHERE id = ? and status_delete = 0
                    ` , 
          [req.body['id']] , 
          (err , account)=>{

            if(err) {
              dbpacket.dbErrorReturn(con , err , res)
              console.log("check admin")
              return 0
            }

            if(account[0]) {
              con.end()
              res.send("overflow")
            } else {
              con.query(`INSERT INTO admin
                            (
                              username , 
                              password , 
                              img_admin , 
                              station_admin , 
                              status_account , 
                              status_delete ,
                              time_online
                            ) 
                            VALUES (?,SHA2(?,256),'','',1,0,"")` , 
                [req.body['id'],req.body['passwordAdNew']] , 
                (err , result)=>{
                  if(err) {
                    dbpacket.dbErrorReturn(con , err , res)
                    console.log("insert admin")
                    return 0
                  }
                  con.end()
                  res.send(result.affectedRows.toString())
              })
            }
          })   
        }
      } catch (err) {
        if(err == "not pass") {
          con.end()
          res.send("incorrect")
        }
      }
    }
    else {
      res.send('error session')
    }
  })

  app.post('/api/admin/add/doctor' , async (req , res)=>{
    if(req.body['id_doctor'] && req.body['passwordDT'] && req.body['passwordAd']) {
        
      let username = req.session.user_admin
      let password = req.body['passwordAd']
  
      if(username === '') {
        res.redirect('/api/logout')
        return 0
      }
  
      let con = Database.createConnection(listDB)
  
      try {
        let auth = await apifunc.auth(con , username , password , res , "admin")
        if(auth['result'] === "pass") {
          con.query(`
                    SELECT id_table_doctor
                    FROM acc_doctor 
                    WHERE id_doctor = ? and status_delete = 0
                    ` , 
          [req.body['id_doctor']] , 
          (err , account)=>{

            if(err) {
              dbpacket.dbErrorReturn(con , err , res)
              console.log("check doctor")
              return 0
            }

            if(account[0]) {
              con.end()
              res.send("overflow")
            } else {
              const { role2 , role3 ,role4 } = req.body
              con.query(`INSERT INTO acc_doctor
                            (
                              fullname_doctor , 
                              id_doctor , 
                              uid_line_doctor , 
                              password_doctor , 
                              img_doctor , 
                              station_doctor , 
                              status_account , 
                              status_delete ,
                              time_online,
                              doctor_role,
                              analyst_role,
                              consultant_role
                            ) 
                            VALUES ('',?,'',SHA2(?,256),'','',1,0,"" , ? , ? , ?)` , 
                [req.body['id_doctor'],req.body['passwordDT'] , role2 , role3 ,role4] , 
                (err , result)=>{
                  if(err) {
                    dbpacket.dbErrorReturn(con , err , res)
                    console.log("insert doctor")
                    return 0
                  }
                  con.end()
                  res.send(result.affectedRows.toString())
              })
            }
          })   
        }
      } catch (err) {
        if(err == "not pass") {
          con.end()
          res.send("incorrect")
        }
      }
    }
    else {
      res.send('error session')
    }
  })

  app.post('/api/admin/manage/doctor' , async (req,res)=>{
    let username = req.session.user_admin
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
                      (id_table_doctor , id_admin , because_text , date ${type_status === "status" ? ", type_status" : ""}) VALUES 
                      (? , ? , ? , ? ${type_status === "status" ? `, ?` : ""});
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

  app.post('/api/admin/manage/admin' , async (req,res)=>{
    let username = req.session.user_admin
    let password = req.body['password']
  
    if(username === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
    console.log(req.body)
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
      if(auth['result'] === "pass") {
        if(req.body['id'] != undefined && (req.body['status'] === 1 || req.body['status'] === 0) && req.body['type_status']) {
          const type_status = req.body['type_status'] === "status_account" ? "status" : 
                              req.body['type_status'] === "status_delete" ? "delete" : "";
          if(type_status) {
            con.query(
              `
              SELECT id
              FROM admin 
              WHERE id = ? and status_delete = 0
              `
              , [ req.body['id'] ] , (err , deleteResult) => {
                if(err) {
                  dbpacket.dbErrorReturn(con , err , res)
                  console.log(`select check err`)
                  return 0
                }

                if(deleteResult.length) {
                  const params = type_status === "status" ? 
                                  [ req.body['id'] , username , req.body['because'] , new Date() , req.body['status'] ] : 
                                  [ req.body['id'] , username , req.body['because'] , new Date() ]

                  con.query(
                    `
                      INSERT INTO because_${type_status} 
                      (id_table_admin ,id_admin, because_text , date ${type_status === "status" ? ", type_status" : ""}) VALUES 
                      (? , ? , ? , ? ${type_status === "status" ? `, ?` : ""});
                    ` , params ,
                    (err , resultBecause) => {
                      if(err) {
                        dbpacket.dbErrorReturn(con , err , res)
                        console.log("insert change status admin")
                        return 0
                      }
                      if(resultBecause.affectedRows) {
                        con.query(`
                            UPDATE admin 
                            SET ${req.body['type_status']} = ? 
                            WHERE id = ? ${type_status === "delete" ? "and status_delete = 0" : ""};` , 
                          [req.body['status'] , req.body['id']] , 
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

  // group page

  app.post('/api/admin/group/gets', async (req, res) => {
    let username = req.session.user_admin;
    let password = req.session.pass_admin;
  
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
            p.pest_name AS pest_name,
            c.name AS chemical_name,
            pl.name AS plant_name
          FROM pest_chemical AS pc
          INNER JOIN pests AS p ON pc.pest_id = p.pest_id
          INNER JOIN chemical_list AS c ON pc.chemical_id = c.id
          INNER JOIN plant_list AS pl ON pc.plant_id = pl.id
          `,
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
    let username = req.session.user_admin;
    let password = req.session.pass_admin;
  
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
    let username = req.session.user_admin
    let password = req.session.pass_admin
 
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
                  }
                )
              }
 
              res.send({
                status : 200,
                result : "insert group"
              })
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
    let username = req.session.user_admin
    let password = req.session.pass_admin
 
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
                pest_id , chemical_id , plant_id , safe_days , id
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
                  }
                )
              }
 
              res.send({
                status : 200,
                result : "update group"
              })
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
    let username = req.session.user_admin
    let password = req.session.pass_admin
 
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

// data page
  app.post('/api/admin/data/list' , async (req , res)=>{
    let username = req.session.user_admin
    let password = req.session.pass_admin
  
    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
    let con = Database.createConnection(listDB)
    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
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

  app.post('/api/admin/data/get' , async (req , res)=>{
    let username = req.session.user_admin
    let password = req.session.pass_admin
  
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
        if(From) {
          con.query(
            `
              SELECT * FROM ${From} WHERE id=?
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
        let username = req.session.user_admin;
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

                con.query(
                    `
                    SELECT * FROM ${From} WHERE ${columnName} = ? AND is_use = 1;
                    `,
                    [data.name],
                    (err, result) => {
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
                                res.send("overflow");
                            }
                        } else {
                            con.end();
                            res.send('error session');
                            console.log(`select ${From} err`);
                        }
                    }
                );
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



  app.post('/api/admin/data/change' , async (req , res)=>{
    let username = req.session.user_admin
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
        const From = data.type === "station" ? "station" : data.type === "plant" ? "plant" : "";
        if(From) {
          try {
            const verify = data.state_use ? await new Promise((resole , reject)=> {
              con.query(
                `
                SELECT (
                  SELECT EXISTS (
                    SELECT id
                    FROM ${From}_list as data_search
                    WHERE data_main.name = data_search.name and data_search.is_use = 1
                  )
                ) as verifyStatus
                FROM ${From}_list as data_main
                WHERE id = ?
                `
                ,[ data.id_table ], (err , result)=>{
                if(err) reject("")
                else resole(!result[0].verifyStatus)
              }) 
            }) : true
  
            if(verify) {
              con.query(
                `
                UPDATE ${From}_list SET is_use = ? WHERE id = ?;
                `
                , [ data.state_use , data.id_table] , (err , result)=>{
                if(err) {
                  con.end()
                  res.send("")
                } else {
                  if(From === "station" && result.changedRows) {
                    con.query(
                      `
                      SELECT name
                      FROM station_list
                      WHERE id = ?
                      ` , [data.id_table] , (err , result) => {
                        if(!err) {
                          con.end()
                          sendNotifyToDoctor(0 , data.id_table , `${result[0].name}ถูก${data.state_use ? "เปิด" : "ปิด"}`);
                        }
                      }
                    )
                  } else con.end();
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

  app.post('/api/admin/data/edit' , async (req , res)=>{
    let username = req.session.user_admin
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
        const From = data.type === "station" ? "station" : data.type === "plant" ? "plant" : "";
        if(From) {
          try {
            const verify = data.update.name ? await new Promise((resole , reject)=> {
              con.query(
                `
                SELECT (
                  SELECT EXISTS (
                    SELECT id
                    FROM ${From}_list
                    WHERE ${From}_list.name = ? and ${From}_list.is_use = 1
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
                UPDATE ${From}_list 
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
    let username = req.session.user_admin
    let password = req.session.pass_admin
  
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
  
      let username = req.session.user_admin
      let password = req.session.pass_admin
  
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
  app.all('/api/admin/auth' , async (req , res)=>{
    
    // เช็คการเข้าสู่ระบบจริงๆ
    let username = req.session.user_admin ?? req.body['username'] ?? '';
    let password = req.session.pass_admin ?? req.body['password'] ?? '';

    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }
  
    let con = Database.createConnection(listDB)
  
    // Database.resume()
    try {
      let auth = await apifunc.auth(con , username , password , res , "admin")
      con.end()
      if(auth['result'] === "pass") {
        req.session.user_admin = username
        req.session.pass_admin = password
        req.session.tokenSession = apifunc.getTokenCsurf(req)
        res.send('1')
      }
    } catch (err) {
      con.end()
      if(err == "not pass") {
        res.redirect('/api/logout')
      } else if( err == "connect" ) {
        res.redirect('/api/logout')
      }
    }
  })
  
  app.get('/api/logout' , (req , res) => {
    req.session.destroy()
    res.send('')
  })
// report page
  app.get('/api/admin/report/list', async(req, res) => {
    let username = req.session.user_admin
    let password = req.session.pass_admin

    if(username === '' || password === '') {
      res.redirect('/api/logout')
      return 0
    }

    let con = Database.createConnection(listDB)

    try {
      const auth = await apifunc.auth(con , username , password , res , "admin")
      if(auth['result'] === "pass") {
        const station = auth['data']['station_admin']

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
                        GROUP BY acc_farmer.station;
                    `;
   
                    con.query(farmerQuery, [station], (err, farmerStatistics) => {
                        if (err) {
                            console.error('Error fetching farmer statistics:', err);
                            res.status(500).json({ status: "error", message: "Database query error" });
                            return;
                        }
   
                        console.log('Farmer Statistics:', farmerStatistics);
   
                        // ดึงรายชื่อหมอพืช (เฉพาะที่ doctor_role = 1)
                        const doctorQuery = `
                            SELECT id_doctor, fullname_doctor, station_doctor
                            FROM acc_doctor
                            WHERE station_doctor = ? AND doctor_role = 1;
                        `;
   
                        con.query(doctorQuery, [station], (err, doctors) => {
                            if (err) {
                                console.error('Error fetching doctor data:', err);
                                res.status(500).json({ status: "error", message: "Database query error" });
                                return;
                            }
   
                            console.log('Doctors:', doctors);
   
                            // ดึงรายชื่อที่ปรึกษาเกษตรกร (เฉพาะที่ consultant_role = 1)
                            const consultantQuery = `
                                SELECT id_doctor, fullname_doctor, station_doctor
                                FROM acc_doctor
                                WHERE station_doctor = ? AND consultant_role = 1;
                            `;
   
                            con.query(consultantQuery, [station], (err, consultants) => {
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
      let username = req.session.user_admin;
      let password = req.session.pass_admin;
    
      if (username === '' || password === '') {
        res.redirect('/api/logout');
        return;
      }
    
      let con = Database.createConnection(listDB);
    
      try {
        const auth = await apifunc.auth(con, username, password, res, "admin");
        if (auth['result'] === "pass") {
          con.query(
            `SELECT 
                p.pest_name,
                p.type_pest,
                COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN fc.pest_id END) AS total_1_week,
                COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN fc.pest_id END) AS total_1_month,
                COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 3 MONTH) THEN fc.pest_id END) AS total_3_months,
                COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) THEN fc.pest_id END) AS total_6_months,
                COUNT(CASE WHEN fc.date >= DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN fc.pest_id END) AS total_1_year
              FROM formchemical fc
              LEFT JOIN pests p ON fc.insect = p.pest_name
              LEFT JOIN formplant fp ON fc.id_plant = fp.id
              LEFT JOIN housefarm hf ON fp.id_farm_house = hf.id_farm_house 
              LEFT JOIN acc_farmer af ON hf.uid_line = af.uid_line
              WHERE af.station = ?
              GROUP BY fc.insect
              LIMIT 25;`, [auth['data']['station_admin']] ,
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
  //   let username = req.session.user_admin
  //   let password = req.session.pass_admin
  
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
  //   let username = req.session.user_admin ?? '';
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
