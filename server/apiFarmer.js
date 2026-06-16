require('dotenv').config().parsed
const fs = require('fs')
const ConnentPool = require('./connectPool');

const RichSign = process.env.RICH_SIGN
const RichHouse = process.env.RICH_HOUSE

const { Server } = require('socket.io');
const AuthorizeUser = require('./core/authorize');
const RoyalGapEnv = require('./core/env');
const RoyalGapLine = require('./configLine');
const checkMismatch = require('./core/corns/checkMismatch');
const io = new Server()

module.exports = function apiFarmer(app, Database, pool = new ConnentPool(), dbpacket, listDB, socket = io) {

    app.post('/api/farmer/sign', async (req, res) => {
        if (req.session.user_doctor != undefined || req.session.pass_doctor != undefined) {
            delete req.session.pass_doctor
            delete req.session.user_doctor
        }

        if (req.body['uid']) {
            req.session.uidFarmer = req.body['uid']
            let con = Database.createConnection(listDB)
            try {
                const auth = await authCheck(con, req)
                con.end()

                req.session.user_id = auth["data"]["id_table"]
                req.session.account_type = RoyalGapEnv.access_type.farmer

                res.send(auth.result)
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }
        } else res.send("error auth")
    })

    app.post('/api/farmer/account/check', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)
            try {
                const auth = await authCheck(con, req)
                // req.session.token = {
                //     data : new Date().getTime().toString(),
                //     time : new Date().
                // }
                con.end()
                res.send(auth.result)
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }
        } else res.send("error auth")
    })

    app.post('/api/farmer/station/search', (req, res) => {
        const uidLine = req.session.uidFarmer ? req.session.uidFarmer : req.body.uidLine
        if (uidLine) {
            let con = Database.createConnection(listDB)
            con.connect((err) => {
                if (err) {
                    dbpacket.dbErrorReturn(con, err, res);
                    console.log("connect");
                    return 0;
                }

                con.query(`SELECT * FROM station_list WHERE is_use = 1`, (err, result) => {
                    con.end()
                    if (!err) res.send(result)
                    else res.send("error auth")
                })
            })
        } else res.send("error auth")
    })

    app.post('/api/farmer/station/get/name', (req, res) => {
        const uidLine = req.session.uidFarmer ? req.session.uidFarmer : req.body.uidLine
        if (uidLine) {
            let con = Database.createConnection(listDB)
            con.connect((err) => {
                if (err) {
                    res.send("error auth")
                } else {
                    con.query(`SELECT name FROM station_list WHERE id=? and is_use = 1`, [req.body.id_station],
                        (err, result) => {
                            con.end()
                            if (!err) res.send(result)
                            else res.send("error auth")
                        })
                }
            })
        } else res.send("error auth")
    })

    app.get("/image/farmer/:id_table", (req, res) => {
        if (req.params.id_table) {
            let con = Database.createConnection(listDB)
            con.connect((err) => {
                if (!err) {
                    con.query(`SELECT img FROM acc_farmer WHERE id_table = ?`,
                        [req.params.id_table],
                        (err, result) => {
                            con.end()
                            if (!err) {
                                if (result[0]) {
                                    const base64Image = result[0]["img"].toString(); //Buffer to string
                                    const base64Data = base64Image.replace(`data:image/jpeg;base64,`, '');

                                    // // แปลง Base64 เป็น Buffer
                                    const imageBuffer = Buffer.from(base64Data, 'base64');

                                    // // // ตั้งค่า Header 'Content-Type'
                                    res.setHeader('Content-Type', 'image/png');
                                    res.setHeader('Transfer-Encoding', 'chunked')

                                    // ส่งกลับรูปภาพให้กับผู้ใช้
                                    res.end(imageBuffer);
                                }
                                else res.send("not found")
                            } else {
                                res.send("not found")
                            }
                        })
                } res.send("not found")
            })
        } else {
            res.send("not found")
        }

    })

    app.post('/api/farmer/signup', async (req, res) => {
        const uidLine = req.session.uidFarmer ? req.session.uidFarmer : req.body.uidLine
        const userLine = await new Promise(async (resole, reject) => {
            try {
                await RoyalGapLine.getLinkToken(uidLine)
                resole(true)
            } catch (e) {
                resole(false)
            }
        })

        if (userLine && uidLine && /^[ก-ฮะ-์]+$/.test(req.body['firstname']) && /^[ก-ฮะ-์]+$/.test(req.body['firstname'])) {
            let con = Database.createConnection(listDB)
            con.connect((err) => {
                if (!err) {
                    con.query(`SELECT id_table FROM acc_farmer WHERE uid_line = ? and (register_auth = 0 || register_auth = 1)`,
                        [uidLine], (err, search) => {
                            if (!err) {
                                if (!search[0]) {
                                    con.query(`INSERT INTO acc_farmer(
                                    id_farmer,
                                    fullname,
                                    img,
                                    station,
                                    location,
                                    password,
                                    register_auth,
                                    uid_line,
                                    date_doctor_confirm,
                                    id_table_doctor,
                                    link_user,
                                    tel_number,
                                    text_location
                                    ) 
                                VALUES ("" , ? , ? , ? , POINT(?,?) , SHA2(? , 256) , 0 , ? , "" , "" , ? , ? , ?)` ,
                                        [
                                            `${req.body['firstname'].trim()} ${req.body['lastname'].trim()}`,
                                            req.body['Img'],
                                            req.body['station'],
                                            req.body['lat'],
                                            req.body['lng'],
                                            req.body['password'].trim(),
                                            uidLine,
                                            uidLine,
                                            req.body['telnumber'].trim(),
                                            req.body['text_location'].trim()
                                        ], (err, result) => {
                                            con.end()
                                            if (!err) {
                                                if (result.affectedRows > 0) {
                                                    if (!RoyalGapLine.changeRichMenu(uidLine, RichHouse)) {
                                                        fs.appendFileSync(__dirname.replace('\server', '/logs/errorfile.json'), `richMenuAddFarm : {id:${req.session.uidFarmer} , date : ${new Date().getTime}}`)
                                                    }

                                                    try {
                                                        sendNotifyToDoctor(result.insertId, req.body['station'], "มีเกษตรกรสมัครบัญชีเข้ามาใหม่")
                                                    } catch (e) { }

                                                    res.send("insert complete")
                                                } else {
                                                    res.send("error auth")
                                                }
                                            } else {
                                                res.send("error auth")
                                            }
                                        })
                                } else {
                                    con.end()
                                    // มีบัญชีอยู่แล้ว → เปลี่ยน rich menu ให้เป็นเมนูหลัก
                                    RoyalGapLine.changeRichMenu(uidLine, RichHouse)
                                    res.send("search")
                                }
                            } else {
                                con.end()
                                res.send("error auth")
                            }
                        })
                } else {
                    res.send("error")
                }
            })
        } else res.send("error auth")
    })

    app.post('/api/farmer/farmhouse/add', async (req, res) => {
        const UidLine = req.session.uidFarmer ? req.session.uidFarmer : req.body.uidLine
        if (UidLine) {

            let con = Database.createConnection(listDB)
            try {
                const auth = await authCheck(con, req)
                if (auth) {

                    const overlap = await new Promise((resolve) => {
                        con.query(
                            `
                            SELECT id_farm_house
                            FROM housefarm 
                            WHERE uid_line = ? AND name_house = ?
                            LIMIT 1` ,
                            [
                                auth.data.uid_line, req.body['name'].toString().trim()
                            ], (err, resultOverlab) => {
                                resolve(resultOverlab[0])
                            })
                    })

                    if (!overlap) {
                        con.query(
                            `
                            INSERT INTO housefarm 
                                (
                                    uid_line , 
                                    name_house , 
                                    img_house , 
                                    link_user,
                                    location
                                )
                            VALUES (? , ? , ? , ? , POINT(? , ?))` ,
                            [
                                auth.data.uid_line, req.body['name'].toString().trim(), req.body['img'], auth.data.link_user, req.body['lag'], req.body['lng']
                            ], (err, insert) => {
                                con.end()
                                if (!err) {
                                    if (insert.affectedRows > 0) {
                                        if (insert.affectedRows > 1) console.log(insert)
                                        res.send("133")
                                    } else {
                                        res.send("130")
                                    }
                                } else {
                                    res.send("error auth")
                                }
                            })
                    } else {
                        con.end()
                        res.send("130")
                    }
                }
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }
        } else res.send("error auth")
    })

    app.post('/api/farmer/farmhouse/select', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)
            try {
                const auth = await authCheck(con, req)
                con.query(`
                            SELECT id_farm_house FROM housefarm
                            WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                        ` , [
                    auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse
                ],
                    (err, result) => {
                        con.end()
                        if (!err) {
                            if (result[0]) res.send("access")
                            else res.send("not")
                        } else res.send("error auth")
                    })
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }
        } else res.send("error auth")
    })

    app.get('/api/farmer/farmhouse/get/detail', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)
            try {
                const auth = await authCheck(con, req)
                con.query(
                    `
                        SELECT name_house , img_house , id_farm_house , location
                        FROM housefarm
                        WHERE id_farm_house = ? and link_user = ?
                        ` ,
                    [req.query.id_farmhouse, auth.data.link_user],
                    (err, result) => {
                        con.end()
                        if (!err) {
                            if (result[0]) {
                                result.map(val => {
                                    val.img_house = val.img_house.toString()
                                    return val
                                })
                                res.send(result)
                            }
                            else res.send("not")
                        } else res.send("error auth")
                    })
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }
        } else res.send("error auth")
    })


    app.get('/api/farmer/farmhouse/get/HouseList', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB);
            try {
                const auth = await authCheck(con, req);
                con.query(
                    `
                    SELECT id_farm_house, name_house, img_house, location, status
                    FROM housefarm
                    WHERE link_user = ?
                    `,
                    [auth.data.link_user],
                    (err, result) => {
                        console.log("SQL Error:", err); // ดูข้อผิดพลาด SQL (ถ้ามี)
                        console.log("SQL Result:", result); // ตรวจสอบข้อมูลที่ได้จาก SQL
                        con.end();
                        if (!err) {
                            if (result.length > 0) {
                                result = result.map(val => {
                                    val.img_house = val.img_house.toString(); // แปลง Blob เป็น String
                                    return val;
                                });
                                res.send(result); // ส่งข้อมูลที่มี status กลับไป
                            } else res.send([]);
                        } else res.send("error auth");
                    }
                );

            } catch (err) {
                con.end();
                if (err === "no" || err === "no account") res.send("close");
                else res.send("error auth");
            }
        } else res.send("error auth");
    });

    app.post('/api/farmer/farmhouse/updateStatus', async (req, res) => {
        const { id_farm_house, status } = req.body;

        if (!req.session.uidFarmer) {
            return res.status(401).json({ status: "error", message: "Authentication required" });
        }

        let con = Database.createConnection(listDB);
        try {
            const auth = await authCheck(con, req);

            if (!auth || !auth.data || !auth.data.link_user) {
                return res.status(403).json({ status: "error", message: "Invalid authentication data" });
            }

            con.query(
                `UPDATE housefarm SET status = ? WHERE id_farm_house = ? AND link_user = ?`,
                [status, id_farm_house, auth.data.link_user],
                (err, result) => {
                    con.end();

                    if (err) {
                        return res.status(500).json({ status: "error", message: "Database error", error: err });
                    }

                    if (result.affectedRows > 0) {
                        res.json({ status: "success", message: `House ${id_farm_house} updated successfully` });
                    } else {
                        res.status(400).json({ status: "fail", message: "No rows affected" });
                    }
                }
            );
        } catch (err) {
            con.end();
            res.status(500).json({ status: "error", message: "Unexpected error occurred", error: err });
        }
    });






    app.post('/api/farmer/farmhouse/edit', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)
            try {
                const auth = await authCheck(con, req)
                const name = (req.body.name) ? `name_house = "${req.body.name}"` : ""
                const img = (req.body.img) ? `img_house = "${req.body.img}"` : ""
                const location = (req.body.lag && req.body.lng) ? `location = POINT(${req.body.lag} , ${req.body.lng})` : ""
                const SET = [name, img, location].filter(val => val).join(" , ")
                if (SET.length != 0) {
                    con.query(
                        `
                        UPDATE housefarm
                        SET ${SET}
                        WHERE id_farm_house = ? and link_user = ?
                        ` ,
                        [req.body.id_farmhouse, auth.data.link_user],
                        (err, result) => {
                            con.end()
                            if (!err) res.send("113")
                            else res.send("error auth")
                        })
                } else res.send("error auth")
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }
        } else res.send("error auth")
    })

    // start formplant
    app.post('/api/farmer/formplant/select', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB);

            try {
                const auth = await authCheck(con, req);
                const where = (req.body.id_formplant) ? `and formplant.id = "${req.body.id_formplant}"` : "";

                const select = (req.body.id_formplant) ?
                    `formplant.*` :
                    `formplant.id, formplant.name_plant, formplant.state_status, 
                    formplant.date_plant, formplant.generation, formplant.qty,
                    (
                        SELECT EXISTS (
                            SELECT id
                            FROM report_detail
                            WHERE report_detail.id_plant = formplant.id 
                            AND report_detail.is_read = 0
                        )
                    ) as report,
                    (
                        SELECT EXISTS (
                            SELECT id
                            FROM check_form_detail
                            WHERE check_form_detail.id_plant = formplant.id AND check_form_detail.acknowledged = 0
                        ) 
                    ) as form , 
                    (
                        SELECT EXISTS (
                            SELECT id
                            FROM check_plant_detail
                            WHERE check_plant_detail.id_plant = formplant.id AND check_plant_detail.acknowledged = 0
                        ) 
                    ) as plant,
                    (
                        SELECT EXISTS (
                            SELECT id
                            FROM success_detail
                            WHERE id_plant = formplant.id and date_of_farmer = ""
                        )
                    ) as success`;

                con.query(`
                    SELECT ${select},
                    (
                        SELECT type_plant 
                        FROM plant_list 
                        WHERE plant_list.name = formplant.name_plant and plant_list.is_use = 1
                        LIMIT 1
                    ) as type_plant
                    FROM formplant,
                    (
                        SELECT id_farm_house FROM housefarm
                        WHERE (housefarm.uid_line = ? OR housefarm.link_user = ?) and housefarm.id_farm_house = ?
                    ) as houseFarm
                    WHERE formplant.id_farm_house = houseFarm.id_farm_house ${where}
                    ORDER BY formplant.state_status ASC, id DESC
                `,
                    [
                        auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse
                    ],
                    async (err, result) => {
                        if (!err) {
                            if (result[0]) {
                                if (req.body.id_formplant) {
                                    const History = await new Promise(resolve => {
                                        con.query(
                                            `
                                        SELECT
                                            GROUP_CONCAT(
                                                DISTINCT formchemical.insect ORDER BY formchemical.insect ASC
                                            ) AS insect
                                        FROM formplant
                                        LEFT JOIN formchemical ON formplant.id = formchemical.id_plant
                                        WHERE formplant.name_plant = ? AND formplant.id_farm_house = ? AND NOT formplant.id = ?
                                        GROUP BY formplant.id, formplant.generation
                                        ORDER BY formplant.generation DESC
                                        LIMIT 1
                                        `, [result[0].name_plant, req.body.id_farmhouse, req.body.id_formplant],
                                            async (err, result_history) => {
                                                resolve(result_history);
                                            }
                                        );
                                    })
                                    const ResultEdit = await new Promise((resolve, reject) => {
                                        con.query(
                                            `
                                        SELECT editform.id_edit, editform.status
                                        FROM editform,
                                        (
                                            SELECT formplant.id
                                            FROM formplant,
                                            (
                                                SELECT id_farm_house FROM housefarm
                                                WHERE (housefarm.uid_line = ? OR housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                            ) as houseFarm
                                            WHERE formplant.id_farm_house = houseFarm.id_farm_house and formplant.id = ?
                                        ) as formplant
                                        WHERE editform.id_form = formplant.id and type_form = "plant"
                                        ORDER BY date DESC
                                        `, [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_formplant],
                                            async (err, resultEditList) => {
                                                const subjectResultPass = new Map();
                                                for (let edit of resultEditList) {
                                                    await new Promise((resolve, reject) => {
                                                        con.query(
                                                            `
                                                        SELECT subject_form
                                                        FROM detailedit
                                                        WHERE id_edit = ?
                                                        `, [edit.id_edit],
                                                            (err, resultDetail) => {
                                                                for (let detail of resultDetail) {
                                                                    if (!subjectResultPass.has(detail.subject_form) && edit.status != 0) {
                                                                        subjectResultPass.set(detail.subject_form, edit.status);
                                                                    }
                                                                }
                                                                resolve("");
                                                            }
                                                        );
                                                    });
                                                }
                                                resolve(subjectResultPass);
                                            }
                                        );
                                    });

                                    con.end();
                                    result[0].subjectResult = Object.fromEntries(ResultEdit);
                                    result[0].previousData = History
                                    res.send(result);
                                } else {
                                    con.end();
                                    res.send(result);
                                }
                            } else {
                                con.end();
                                if (req.body.id_formplant) res.send("not found");
                                else res.send(result);
                            }
                        } else {
                            con.end();
                            res.send("error auth");
                        }
                    });
            } catch (err) {
                con.end();
                if (err === "no" || err === "no account") res.send("close");
                else res.send("error auth");
            }
        } else res.send("error auth");
    });


    app.post('/api/farmer/formplant/check', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)

            try {
                const auth = await authCheck(con, req)
                con.query(`
                            SELECT formplant.id , formplant.state_status
                            FROM formplant , 
                                (
                                    SELECT id_farm_house FROM housefarm
                                    WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                ) as houseFarm
                            WHERE formplant.id = ? and houseFarm.id_farm_house = formplant.id_farm_house
                        ` ,
                    [
                        auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_form_plant
                    ],
                    (err, result) => {
                        con.end()
                        if (!err) {
                            if (result[0]) res.send(result)
                            else res.send("not found")
                        } else res.send("error auth")
                    })
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }
        } else res.send("error auth")
    })

    // start formplant
    // app.post('/api/farmer/formplant/select', async (req, res) => {
    //     if (req.session.uidFarmer) {
    //         let con = Database.createConnection(listDB);

    //         try {
    //             const auth = await authCheck(con, req);
    //             const where = (req.body.id_formplant) ? `and formplant.id = "${req.body.id_formplant}"` : "";

    //             const select = (req.body.id_formplant) ? 
    //                 `formplant.*` :
    //                 `formplant.id, formplant.name_plant, formplant.state_status, 
    //                 formplant.date_plant, formplant.generation, formplant.qty,
    //                 (
    //                     SELECT EXISTS (
    //                         SELECT id
    //                         FROM report_detail
    //                         WHERE report_detail.id_plant = formplant.id
    //                     ) 
    //                 ) as report,
    //                 (
    //                     SELECT EXISTS (
    //                         SELECT id
    //                         FROM check_form_detail
    //                         WHERE check_form_detail.id_plant = formplant.id
    //                     ) 
    //                 ) as form, 
    //                 (
    //                     SELECT EXISTS (
    //                         SELECT id
    //                         FROM check_plant_detail
    //                         WHERE check_plant_detail.id_plant = formplant.id
    //                     ) 
    //                 ) as plant, 
    //                 (
    //                     SELECT EXISTS (
    //                         SELECT id
    //                         FROM success_detail
    //                         WHERE id_plant = formplant.id and date_of_farmer = ""
    //                     )
    //                 ) as success`;

    //             con.query(`
    //                 SELECT ${select},
    //                 (
    //                     SELECT type_plant 
    //                     FROM plant_list 
    //                     WHERE plant_list.name = formplant.name_plant and plant_list.is_use = 1
    //                     LIMIT 1
    //                 ) as type_plant
    //                 FROM formplant, 
    //                 (
    //                     SELECT id_farm_house FROM housefarm
    //                     WHERE (housefarm.uid_line = ? OR housefarm.link_user = ?) and housefarm.id_farm_house = ?
    //                 ) as houseFarm
    //                 WHERE formplant.id_farm_house = houseFarm.id_farm_house ${where}
    //                 ORDER BY formplant.state_status ASC, id DESC
    //             `,
    //             [
    //                 auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse
    //             ],
    //             async (err, result) => {
    //                 console.log(err)
    //                 if (!err) {
    //                     if (result[0]) {
    //                         if (req.body.id_formplant) {
    //                             const ResultEdit = await new Promise((resolve, reject) => {
    //                                 con.query(
    //                                     `
    //                                     SELECT editform.id_edit, editform.status
    //                                     FROM editform, 
    //                                     (
    //                                         SELECT formplant.id
    //                                         FROM formplant, 
    //                                         (
    //                                             SELECT id_farm_house FROM housefarm
    //                                             WHERE (housefarm.uid_line = ? OR housefarm.link_user = ?) and housefarm.id_farm_house = ?
    //                                         ) as houseFarm
    //                                         WHERE formplant.id_farm_house = houseFarm.id_farm_house and formplant.id = ?
    //                                     ) as formplant
    //                                     WHERE editform.id_form = formplant.id and type_form = "plant"
    //                                     ORDER BY date DESC
    //                                     `,
    //                                     [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_formplant],
    //                                     async (err, resultEditList) => {
    //                                         const subjectResultPass = new Map();
    //                                         for (let edit of resultEditList) {
    //                                             await new Promise((resolve, reject) => {
    //                                                 con.query(
    //                                                     `
    //                                                     SELECT subject_form
    //                                                     FROM detailedit
    //                                                     WHERE id_edit = ?
    //                                                     `,
    //                                                     [edit.id_edit],
    //                                                     (err, resultDetail) => {
    //                                                         for (let detail of resultDetail) {
    //                                                             if (!subjectResultPass.has(detail.subject_form) && edit.status != 0) {
    //                                                                 subjectResultPass.set(detail.subject_form, edit.status);
    //                                                             }
    //                                                         }

    //                                                         resolve("");
    //                                                     }
    //                                                 );
    //                                             });
    //                                         }
    //                                         resolve(subjectResultPass);
    //                                     }
    //                                 );
    //                             });

    //                             con.end();
    //                             result[0].subjectResult = Object.fromEntries(ResultEdit);
    //                             res.send(result);
    //                         } else {
    //                             con.end();
    //                             res.send(result);
    //                         }
    //                     } else {
    //                         con.end();
    //                         if (req.body.id_formplant) res.send("not found");
    //                         else res.send(result);
    //                     }
    //                 } else {
    //                     con.end();
    //                     res.send("error auth");
    //                 }
    //             });
    //         } catch (err) {
    //             console.log(err)
    //             con.end();
    //             if (err === "no" || err === "no account") res.send("close");
    //             else res.send("error auth");
    //         }
    //     } else {
    //         console.log("uid")
    //         res.send("error auth");
    //     }
    // });

    // app.post('/api/farmer/varieties', authCheck, (req, res) => {
    //     let con = Database.createConnection(listDB);
    //     const plantId = req.body.plant_id;
    //     console.log('Received plant_id:', plantId);

    //     con.query(`SELECT variety_id, plant_id, variety_name, dates FROM varieties WHERE plant_id = ?`, [plantId], (err, result) => {
    //         con.end();
    //         if (!err) {
    //             console.log('Query result:', result);
    //             res.json(result);
    //         } else {
    //             console.error('Query error:', err);
    //             res.status(500).send("Database query error");SS
    //         }
    //     });
    // });

    // app.post('/api/farmer/varieties', async (req, res) => {
    //     if (req.session.uidFarmer) {
    //         let con = Database.createConnection(listDB);
    //         try {
    //             const auth = await authCheck(con, req);
    //             const plantId = req.body.plant_id;
    //             con.query(`SELECT variety_id, plant_id, variety_name, dates FROM varieties WHERE plant_id = ?`, [plantId], (err, result) => {
    //                 con.end();
    //                 if (!err) {
    //                     res.json(result);
    //                 } else {
    //                     console.error('Query error:', err);
    //                     res.status(500).send("Database query error");
    //                 }
    //             });
    //         } catch (err) {
    //             con.end();
    //             res.status(403).send("error auth");
    //         }
    //     } else {
    //         res.status(401).send("error auth");
    //     }
    // });


    app.post('/api/farmer/pests', async (req, res) => {
        let con = Database.createConnection(listDB); // สร้างการเชื่อมต่อฐานข้อมูล

        console.log('Fetching all pests...');

        // คำสั่ง SQL เพื่อดึงข้อมูล pest_name ทั้งหมด
        try {
            const auth = await authCheck()
        } catch (err) {

        }
        con.query(`SELECT pest_id, pest_name, type_pest FROM pests`, (err, result) => {
            con.end(); // ปิดการเชื่อมต่อฐานข้อมูล
            if (!err) {
                console.log('Query result:', result); // แสดงผลลัพธ์ใน console
                result.sort((a, b) => a.pest_name.localeCompare(b.pest_name, 'th'));
                res.json(result); // ส่งข้อมูลทั้งหมดกลับในรูปแบบ JSON
            } else {
                console.error('Query error:', err); // แสดงข้อผิดพลาดใน console
                res.status(500).send("Database query error"); // ส่งกลับข้อผิดพลาด
            }
        });
    });



    app.post('/api/farmer/pest-chemical', async (req, res) => {
        const con = Database.createConnection(listDB);
        const formId = req.body.id_form_plant;

        console.log("Received formId:", formId);

        try {
            const auth = await authCheck()
        } catch (err) {

        }

        const queryFormplant = `SELECT name_plant FROM formplant WHERE id = ?;`;
        con.query(queryFormplant, [formId], (err, formResult) => {
            if (err) {
                console.error("Error in queryFormplant:", err);
                con.end();
                return res.status(500).send("Error fetching formplant data");
            }

            if (formResult.length === 0) {
                console.warn("No formplant data found");
                con.end();
                return res.status(404).send("Formplant not found");
            }

            const namePlant = formResult[0].name_plant;
            console.log("name_plant:", namePlant);

            const queryPlantList = `SELECT id FROM plant_list WHERE name = ?;`;
            con.query(queryPlantList, [namePlant], (err, plantResult) => {
                if (err) {
                    console.error("Error in queryVarieties:", err);
                    con.end();
                    return res.status(500).send("Error fetching varieties data");
                }

                if (plantResult.length === 0) {
                    console.warn("No plent data found");
                    con.end();
                    return res.status(404).send("plant not found");
                }

                const plantId = plantResult[0].id;
                console.log("id:", plantId);

                const queryPestChemical = `
                SELECT 
                 pc.pest_id, p.pest_name, p.type_pest, 
                 pc.chemical_id, cl.name AS chemical_name,
                 pc.safe_days
                FROM pest_chemical pc
                JOIN pests p ON pc.pest_id = p.pest_id
                JOIN chemical_list cl ON pc.chemical_id = cl.id
                WHERE pc.plant_id = ?;
            `;
                con.query(queryPestChemical, [plantId], (err, pestChemicalResult) => {
                    con.end();

                    if (err) {
                        console.error("Error in queryPestChemical:", err);
                        return res.status(500).send("Error fetching pest-chemical data");
                    }

                    console.log("Pest-Chemical Data:", pestChemicalResult);

                    if (pestChemicalResult.length === 0) {
                        return res.status(200).json({
                            message: "No data found",
                            data: []
                        });
                    }

                    res.status(200).json({
                        plant_name: namePlant,
                        plant_id: plantId,
                        data: pestChemicalResult
                    });
                });
            });
        });
    });



    app.post('/api/farmer/report/acknowledge', async (req, res) => {
        let con = Database.createConnection(listDB);

        const { id, type } = req.body;

        console.log("Received acknowledge request:", req.body);
        try {
            const auth = await authCheck()
        } catch (err) {

        }

        if (!id || !type) {
            console.log("Missing parameters");
            return res.status(400).json({ success: false, message: "Missing parameters" });
        }

        let tableName = "";
        let updateField = "";

        if (type === "cf") {
            tableName = "check_form_detail";
            updateField = "acknowledged";
        } else if (type === "cp") {
            tableName = "check_plant_detail";
            updateField = "acknowledged";
        } else if (type === "report") {
            tableName = "report_detail";
            updateField = "is_read";
        } else {
            console.log("Invalid type:", type);
            return res.status(400).json({ success: false, message: "Invalid type" });
        }

        console.log(`Updating acknowledgment for ${tableName} ID: ${id}`);

        con.query(`UPDATE ${tableName} SET ${updateField} = 1 WHERE id = ?`, [id], (err, result) => {
            con.end();

            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ success: false, message: "Database query error", error: err });
            }

            if (result.affectedRows > 0) {
                console.log(`Acknowledgment updated for ID ${id}`);
                return res.json({ success: true, message: "Acknowledged successfully" });
            } else {
                console.log(`No record found for ID ${id}`);
                return res.status(404).json({ success: false, message: "Record not found" });
            }
        });
    });


    app.post('/api/farmer/plant/list', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)
            try {
                const auth = await authCheck(con, req)
                con.query(`SELECT id, name, qty_harvest,
                                  COUNT(*) as variety_count,
                                  SUM(CASE WHEN variety_name IS NOT NULL AND variety_name != '' AND variety_name != '-' THEN 1 ELSE 0 END) as has_variety_name_count
                            FROM plant_list
                            WHERE is_use = 1
                            GROUP BY name
                            ORDER BY name COLLATE utf8mb4_thai_520_w2 ASC;
                            ` , (err, result) => {
                    con.end()
                    if (!err) {
                        res.send(result)
                    } else res.send("error auth")
                })
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }
        } else res.send("error auth")
    })

    app.post('/api/farmer/schedules/plant', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)
            try {
                const auth = await authCheck(con, req)
                const { plant_id, name_plant, name_varieties } = req.body

                let resolved_plant_id = plant_id;
                let has_varieties = false;

                if (name_plant) {
                    const variety = name_varieties || "";

                    has_varieties = await new Promise((resolve) => {
                        con.query(`
                            SELECT 
                                COUNT(*) as total_count,
                                SUM(CASE WHEN variety_name IS NOT NULL AND variety_name != '' AND variety_name != '-' THEN 1 ELSE 0 END) as variety_name_count
                            FROM plant_list 
                            WHERE name = ? AND is_use = 1
                        `, [name_plant], (err, result) => {
                            if (!err && result.length > 0) {
                                const total = result[0].total_count;
                                const withVariety = result[0].variety_name_count;
                                resolve(total > 1 || withVariety > 0);
                            } else {
                                resolve(false);
                            }
                        });
                    });

                    const isVarietyEmpty = !variety || variety === "" || variety === "-";
                    const hasHarvestDate = req.body.date_harvest && req.body.date_harvest !== "";
                    if (has_varieties && isVarietyEmpty && !hasHarvestDate) {
                        resolved_plant_id = null;
                    } else {
                        resolved_plant_id = await new Promise((resolve) => {
                            con.query(`
                                SELECT id 
                                FROM plant_list 
                                WHERE name = ? 
                                  AND (variety_name = ? OR (variety_name IS NULL AND ? = '') OR (variety_name = '-' AND ? = '-')) 
                                  AND is_use = 1 
                                LIMIT 1
                            `, [name_plant, variety, variety, variety], (err, result) => {
                                if (!err && result.length > 0) resolve(result[0].id);
                                else resolve(null);
                            });
                        });
                    }
                }

                if (!resolved_plant_id) {
                    con.end()
                    return res.json({ schedule_plants: [], has_varieties, resolved_plant_id: null })
                }

                con.query(`SELECT station FROM acc_farmer WHERE uid_line = ?`, [auth.data.uid_line], (err, stationResult) => {
                    if (err || !stationResult || stationResult.length === 0) {
                        con.end()
                        return res.json({ schedule_plants: [] })
                    }
                    const station_id = stationResult[0].station;

                    const query = `
                        SELECT s.id , s.uid , s.plant_id , s.station_id , s.category , s.title , s.age_plant , s.repeat , s.last_update ,
                            IF(s.category = 1 , 
                                CONCAT('{',
                                    '"name_fertilizer":"', IFNULL(sdf.fertilizer, ''), '",',
                                    '"formula_fertilizer":"', IFNULL(sdf.formula_fertilizer, ''), '",',
                                    '"volume":"', IFNULL(sdf.volume, ''), '",',
                                    '"unit_volume":"', IFNULL(sdf.unit_volume, ''), '",',
                                    '"how_use":"', IFNULL(sdf.how_use, ''), '"'
                                ,'}')
                                , 
                                CONCAT('{',
                                    '"pest":"', IFNULL(sdd.pest, ''), '",',
                                    '"chemical":"', IFNULL(sdd.chemical, ''), '",',
                                    '"rate":"', IFNULL(sdd.rate, ''), '",',
                                    '"how_use":"', IFNULL(sdd.how_use, ''), '",',
                                    '"volume":"', IFNULL(sdd.volume, ''), '",',
                                    '"unit_volume":"', IFNULL(sdd.unit_volume, ''), '"'
                                ,'}')
                            ) AS details
                        FROM schedules s
                        LEFT JOIN schedules_detail_fertilizer sdf ON sdf.schedule_id = s.id AND s.category = 1
                        LEFT JOIN schedules_detail_disease sdd ON sdd.schedule_id = s.id AND s.category = 2
                        WHERE s.plant_id = ? AND s.station_id = ?
                        GROUP BY s.id, s.category, s.age_plant
                        ORDER BY s.age_plant ASC , s.repeat ASC
                    `;

                    console.log("Farmer Schedule API Called!");
                    console.log("plant_id:", resolved_plant_id);
                    console.log("station_id:", station_id);

                    con.query(query, [resolved_plant_id, station_id], (err, schedule_plants) => {
                        console.log("SQL Error:", err);
                        console.log("Result length:", schedule_plants ? schedule_plants.length : 0);
                        con.query(`SELECT qty_harvest FROM plant_list WHERE id = ? LIMIT 1`, [resolved_plant_id], (err2, qtyResult) => {
                            const qty_harvest = (!err2 && qtyResult && qtyResult.length > 0) ? qtyResult[0].qty_harvest : null;
                            con.end()
                            if (!err) {
                                res.json({
                                    schedule_plants: schedule_plants || [],
                                    has_varieties,
                                    resolved_plant_id,
                                    qty_harvest,
                                    debug: {
                                        resolved_plant_id,
                                        station_id,
                                        name_plant,
                                        name_varieties,
                                        uid_line: auth.data.uid_line
                                    }
                                })
                            } else {
                                res.json({
                                    schedule_plants: [],
                                    has_varieties,
                                    resolved_plant_id: null,
                                    qty_harvest: null,
                                    debug: {
                                        error: err,
                                        resolved_plant_id,
                                        station_id,
                                        name_plant,
                                        name_varieties,
                                        uid_line: auth.data.uid_line
                                    }
                                })
                            }
                        })
                    })
                })
            } catch (err) {
                con.end()
                res.json({ schedule_plants: [] })
            }
        } else {
            res.json({ schedule_plants: [] })
        }
    })

    // app.post('/api/farmer/formplant/history' , async (req , res)=>{
    //     if(req.session.uidFarmer ) {
    //         let con = Database.createConnection(listDB)

    //         try {
    //             const auth = await authCheck(con , dbpacket , res , req )
    //             const QtyDate = await new Promise((resole , reject)=>{
    //                 con.query(
    //                     `
    //                     SELECT qty_harvest
    //                     FROM plant_list
    //                     WHERE name = ?
    //                     ` , [req.body.name_plant_list] , 
    //                     (err , result)=>{
    //                         resole(result)
    //                     }
    //                 )
    //             })

    //             con.query(`
    //                         SELECT formplant.*
    //                         FROM formplant , 
    //                             (
    //                                 SELECT id_farm_house FROM housefarm
    //                                 WHERE (housefarm.uid_line = ? or housefarm.link_user = ?) and housefarm.id_farm_house = ?
    //                             ) as houseFarm
    //                         WHERE formplant.name_plant = ? and houseFarm.id_farm_house = formplant.id_farm_house
    //                         ORDER BY date_plant DESC
    //                         LIMIT 1
    //                     ` , 
    //                     [
    //                         auth.data.uid_line , auth.data.link_user , req.body.id_farmhouse , req.body.name_plant_list
    //                     ] , 
    //                     (err , result)=>{
    //                         con.end()
    //                         if (!err) {
    //                             res.send({
    //                                 FromHistory : result,
    //                                 qtyDate : QtyDate
    //                             })
    //                         } else res.send("error auth")
    //                     })
    //         } catch (err) {
    //             con.end()
    //             if(err === "no" || err === "no account") res.send("close")
    //             else res.send("error auth")
    //         }
    //     } else res.send("error auth")
    // })



    app.post('/api/farmer/formplant/history', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB);

            try {
                const auth = await authCheck(con, req);

                // ดึงข้อมูลจำนวนวันที่ใช้เก็บเกี่ยว
                const QtyDate = await new Promise((resolve) => {
                    con.query(
                        `SELECT qty_harvest FROM plant_list WHERE name = ? AND is_use = 1`,
                        [req.body.name_plant_list],
                        (err, result) => resolve(result)
                    );
                });

                // ดึงข้อมูลทุกรุ่นของพืชที่เลือก
                const sqlQuery = `
                    SELECT 
                        formplant.*, 
                        GROUP_CONCAT(DISTINCT formchemical.insect ORDER BY formchemical.insect ASC) AS insect,
                        GROUP_CONCAT(DISTINCT formchemical.insect ) AS insect_generation
                    FROM formplant
                    LEFT JOIN formchemical ON formplant.id = formchemical.id_plant
                    WHERE formplant.name_plant = ? AND formplant.id_farm_house = ?
                    GROUP BY formplant.id, formplant.generation
                    ORDER BY formplant.generation DESC
                `;

                const queryParams = [req.body.name_plant_list, req.body.id_farmhouse];

                con.query(sqlQuery, queryParams, (err, result) => {
                    con.end();
                    if (!err) {
                        console.log("Debug: API Response =>", {
                            FromHistory: result.map(f => ({
                                id: f.id,
                                generation: f.generation,
                                name_plant: f.name_plant,
                                date_plant: f.date_plant,
                            })),
                            qtyDate: QtyDate,
                            insect: result.length > 0 && result[0]?.insect ? result[0].insect.split(',') : []
                        });

                        res.send({
                            FromHistory: result,
                            qtyDate: QtyDate,
                            insect: result.length > 0 && result[0]?.insect ? result[0].insect.split(',') : [],
                            insect_generation: result.length > 0 && result[0]?.insect_generation ? result[0].insect_generation.split(',') : []
                        });
                    } else {
                        res.send("error auth");
                    }
                });
            } catch (err) {
                con.end();
                if (err === "no" || err === "no account") res.send("close");
                else res.send("error auth");
            }
        } else res.send("error auth");
    });




    app.post('/api/farmer/formplant/insert', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB);
            try {
                const auth = await authCheck(con, req);
                con.query(`
                    SELECT id_farm_house FROM housefarm
                    WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) AND housefarm.id_farm_house = ?
                `, [
                    auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse
                ], (err, result) => {
                    if (err) {
                        console.log("CHECK HOUSE ERROR =>", err);
                        con.end();
                        return res.send("error auth");
                    }
                    if (!result[0]) {
                        con.end();
                        return res.send("not");
                    }
                    const data = req.body;
                    console.log("BODY =>", data);
                    if (
                        !data.id_farmhouse || !data.name_plant || !data.datePlant
                    ) {
                        con.end();
                        return res.send("missing required fields");
                    }

                    const valueOrNull = (value) => {
                        return (
                            value === undefined || value === "" || value === null) ? null : value;
                    };

                    const dateOrNull = (value) => {
                        if (
                            value === undefined || value === "" || value === null) { return null; }

                        if (value.toString().indexOf("#") >= 0) { return null; }

                        const newDate = new Date(value);
                        if (newDate.toString() === "Invalid Date") { return null; }

                        return newDate;

                    };

                    con.query(`INSERT INTO formplant 
                                ( 
                                    id, id_farm_house, name_plant, 
                                    generation, date_glow, date_plant,
                                    posi_w, posi_h,
                                    qty, area, unit, date_harvest, system_glow,
                                    water, water_flow,
                                    history, insect, qtyInsect,
                                    seft, state_status, date_success,
                                    expected_yield, default_yield, name_varieties
                                ) VALUES (
                                    ?, ?, ?, 
                                    ?, ?, ?,
                                    ?, ?,
                                    ?, ?, ?, ?, ?,
                                    ?, ?,
                                    ?, ?, ?,
                                    ?, 0, "",
                                    ?, ?, ?
                                );
                            `, [
                        new Date().getTime(), data.id_farmhouse, data.name_plant,
                        valueOrNull(data.generetion), dateOrNull(data.dateGlow), new Date(data.datePlant),
                        valueOrNull(data.posiW), valueOrNull(data.posiH),
                        valueOrNull(data.qty), valueOrNull(data.area), valueOrNull(data.unit), dateOrNull(data.dateOut), valueOrNull(data.system),
                        valueOrNull(data.water), valueOrNull(data.waterStep),
                        valueOrNull(data.history), valueOrNull(data.insect), valueOrNull(data.qtyInsect),
                        valueOrNull(data.seft), valueOrNull(data.expectedYield), valueOrNull(data.defaultYield), valueOrNull(data.name_varieties)
                    ], (err, insert) => {
                        if (err) {
                            console.log("INSERT ERROR =>");
                            console.log(err);
                            //dbpacket.dbErrorReturn(con, err, res);
                            //console.log("select listform");
                            con.end();
                            return res.send("error");
                        }
                        con.end();
                        try {
                            sendNotifyToDoctor(auth.data.id_table, auth.data.station, `เกษตรกร ${auth.data.fullname} มีการเพิ่มแบบบันทึก`);
                        } catch (e) { console.log(e); }
                        res.send("insert");
                    });
                });
            } catch (err) {
                console.log("CATCH ERROR =>", err);
                con.end();
                if (err === "no" || err === "no account") {
                    return res.send("close");
                }
                res.send("error auth");
            }
        }
    });


    // app.post('/api/farmer/formplant/edit', async (req, res) => {
    //     if (req.session.uidFarmer) {
    //         let con = Database.createConnection(listDB);
    //         try {
    //             const auth = await authCheck(con, req);
    //             con.query(`
    //                 SELECT formplant.*
    //                 FROM formplant, 
    //                     (
    //                         SELECT id_farm_house FROM housefarm
    //                         WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
    //                     ) as houseFarm
    //                 WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
    //             `, [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_plant],
    //                 (err, result) => {
    //                     if (!err) {
    //                         if (result[0]) {
    //                             let data = req.body;
    //                             if (result[0].state_status == 0 || result[0].state_status == 1) {
    //                                 con.query(
    //                                     `
    //                                     INSERT INTO editform 
    //                                         (id_form, id_doctor, because, note, status, type_form)
    //                                         VALUES 
    //                                         (?, ?, ?, ?, ?, "plant")
    //                                     `, [data.id_plant, "", data.because, "", 0],
    //                                     (err, resultEdit) => {
    //                                         if (err) {
    //                                             dbpacket.dbErrorReturn(con, err, res);
    //                                             console.log("insert editform");
    //                                             return 0;
    //                                         }

    //                                         if (resultEdit.insertId > 0) {
    //                                             const arrUpdate = new Array();
    //                                             let checkerr = false;
    //                                             for (let subject in data.dataChange) {
    //                                                 con.query(
    //                                                     `
    //                                                     INSERT INTO detailedit
    //                                                          (id_edit, subject_form, old_content, new_content )
    //                                                         VALUES 
    //                                                         (?, ?, ?, ?)
    //                                                     `, [resultEdit.insertId, subject, result[0][subject], data.dataChange[subject], data.unit || ''],
    //                                                     (err, Edit) => {
    //                                                         if (err) {
    //                                                             dbpacket.dbErrorReturn(con, err, res);
    //                                                             console.log("insert detailedit");
    //                                                             return 0;
    //                                                         }

    //                                                         if (Edit.insertId) {
    //                                                             arrUpdate.push(`${subject}="${data.dataChange[subject]}"`);
    //                                                             if (arrUpdate.length == data.num) {
    //                                                                 let strUpdate = arrUpdate.join(" , ");
    //                                                                 con.query(
    //                                                                     `
    //                                                                     UPDATE formplant 
    //                                                                     SET ${strUpdate}
    //                                                                     WHERE id = ?
    //                                                                     `, [data.name_varieties, data.unit, data.plant_id, data.id_plant],
    //                                                                     (err, update) => {
    //                                                                         if (err) {
    //                                                                             dbpacket.dbErrorReturn(con, err, res);
    //                                                                             console.log("update form");
    //                                                                             return 0;
    //                                                                         }
    //                                                                         con.end();
    //                                                                         try {
    //                                                                             sendNotifyToDoctor(auth.data.id_table, auth.data.station, `เกษตรกร ${auth.data.fullname} ทำการแก้ไขแบบฟอร์มบันทึกข้อมูล\nรหัสแบบฟอร์ม ${data.id_plant}`);
    //                                                                         } catch (e) { }
    //                                                                         res.send("133");
    //                                                                     }
    //                                                                 );
    //                                                             }
    //                                                         } else {
    //                                                             checkerr = true;
    //                                                         }
    //                                                     }
    //                                                 );
    //                                                 if (checkerr) {
    //                                                     con.end();
    //                                                     res.send("edit");
    //                                                     break;
    //                                                 }
    //                                             }
    //                                         } else {
    //                                             con.end();
    //                                             res.send("edit");
    //                                         }
    //                                     }
    //                                 );
    //                             } else {
    //                                 con.end();
    //                                 res.send("submit");
    //                             }
    //                         } else {
    //                             con.end();
    //                             res.send("not");
    //                         }
    //                     } else {
    //                         con.end();
    //                         res.send("error auth");
    //                     }
    //                 });
    //         } catch (err) {
    //             if (err === "no" || err === "no account") res.send("close");
    //             else res.send("error auth");
    //         }
    //     } else res.send("error auth");
    // });




    // อันเก่าก่อนแก้ใหม่
    // app.post('/api/farmer/formplant/edit', async (req, res) => {
    //     if (req.session.uidFarmer) {
    //         let con = Database.createConnection(listDB);
    //         try {
    //             const auth = await authCheck(con, req);
    //             con.query(`
    //                 SELECT formplant.*
    //                 FROM formplant, 
    //                     (
    //                         SELECT id_farm_house FROM housefarm
    //                         WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) AND housefarm.id_farm_house = ?
    //                     ) AS houseFarm
    //                 WHERE formplant.id_farm_house = houseFarm.id_farm_house AND formplant.id = ?
    //             `, [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_plant],
    //                 (err, result) => {
    //                     if (err) {
    //                         con.end();
    //                         res.send("error auth");
    //                         return;
    //                     }
    //                     if (!result[0]) {
    //                         con.end();
    //                         res.send("not");
    //                         return;
    //                     }

    //                     const data = req.body;
    //                     if (result[0].state_status === 0 || result[0].state_status === 1) {
    //                         // ตรวจสอบว่าเป็นแพทย์หรือเกษตรกร
    //                         const isDoctor = auth.data.user_type === 'doctor'; // สมมติว่ามีฟิลด์ user_type
    //                         const idDoctorEdit = isDoctor ? auth.data.id_user : null;

    //                         con.query(`
    //                         INSERT INTO editform 
    //                             (id_form, id_doctor, id_doctor_edit, because, note, status, type_form)
    //                         VALUES 
    //                             (?, ?, ?, ?, ?, ?, "plant")
    //                     `, [data.id_plant, "", idDoctorEdit, data.because, "", 0],
    //                             (err, resultEdit) => {
    //                                 if (err) {
    //                                     dbpacket.dbErrorReturn(con, err, res);
    //                                     console.log("insert editform");
    //                                     return;
    //                                 }

    //                                 if (resultEdit.insertId > 0) {
    //                                     const arrUpdate = [];
    //                                     let checkerr = false;

    //                                     for (let subject in data.dataChange) {
    //                                         con.query(`
    //                                     INSERT INTO detailedit
    //                                         (id_edit, subject_form, old_content, new_content)
    //                                     VALUES 
    //                                         (?, ?, ?, ?)
    //                                 `, [resultEdit.insertId, subject, result[0][subject], data.dataChange[subject]],
    //                                             (err, Edit) => {
    //                                                 if (err) {
    //                                                     dbpacket.dbErrorReturn(con, err, res);
    //                                                     console.log("insert detailedit");
    //                                                     checkerr = true;
    //                                                     return;
    //                                                 }

    //                                                 if (Edit.insertId) {
    //                                                     arrUpdate.push(`${subject}="${data.dataChange[subject]}"`);
    //                                                     if (arrUpdate.length === data.num) {
    //                                                         const strUpdate = arrUpdate.join(" , ");
    //                                                         con.query(`
    //                                                 UPDATE formplant 
    //                                                 SET ${strUpdate}
    //                                                 WHERE id = ?
    //                                             `, [data.id_plant],
    //                                                             (err, update) => {
    //                                                                 if (err) {
    //                                                                     dbpacket.dbErrorReturn(con, err, res);
    //                                                                     console.log("update form");
    //                                                                     return;
    //                                                                 }
    //                                                                 con.end();
    //                                                                 try {
    //                                                                     sendNotifyToDoctor(auth.data.id_table, auth.data.station, `เกษตรกร ${auth.data.fullname} ทำการแก้ไขแบบฟอร์มบันทึกข้อมูล\nรหัสแบบฟอร์ม ${data.id_plant}`);
    //                                                                 } catch (e) {
    //                                                                     console.error(e);
    //                                                                 }
    //                                                                 res.send("133");
    //                                                             });
    //                                                     }
    //                                                 }
    //                                             });
    //                                         if (checkerr) {
    //                                             con.end();
    //                                             res.send("edit");
    //                                             break;
    //                                         }
    //                                     }
    //                                 } else {
    //                                     con.end();
    //                                     res.send("edit");
    //                                 }
    //                             });
    //                     } else {
    //                         con.end();
    //                         res.send("submit");
    //                     }
    //                 });
    //         } catch (err) {
    //             con.end();
    //             console.error(err);
    //             if (err === "no" || err === "no account") res.send("close");
    //             else res.send("error auth");
    //         }
    //     } else {
    //         res.send("error auth");
    //     }
    // });

    app.post('/api/farmer/formplant/edit', async (req, res) => {

        if (!req.session.uidFarmer) {
            res.send("error auth");
            return;
        }

        let con = Database.createConnection(listDB);

        try {

            process.on("uncaughtException", (err) => {
                console.log("UNCAUGHT EXCEPTION =>", err);
            });

            process.on("unhandledRejection", (err) => {
                console.log("UNHANDLED REJECTION =>", err);
            });

            const auth = await authCheck(con, req);

            con.query(`
            SELECT formplant.*
            FROM formplant,
            (
                SELECT id_farm_house
                FROM housefarm
                WHERE
                (
                    housefarm.uid_line = ?
                    OR housefarm.link_user = ?
                )
                AND housefarm.id_farm_house = ?
            ) AS houseFarm
            WHERE
                formplant.id_farm_house = houseFarm.id_farm_house
                AND formplant.id = ?
        `,
                [
                    auth.data.uid_line,
                    auth.data.link_user,
                    req.body.id_farmhouse,
                    req.body.id_plant
                ],
                (err, result) => {

                    if (err) {

                        console.log("SELECT ERROR =>", err);

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

                    console.log("EDIT DATA =>", data);

                    if (
                        !data.dataChange ||
                        typeof data.dataChange !== "object"
                    ) {

                        con.end();
                        res.send("no dataChange");
                        return;
                    }

                    if (
                        result[0].state_status === 0 ||
                        result[0].state_status === 1
                    ) {

                        const isDoctor =
                            auth.data.user_type === 'doctor';

                        const idDoctorEdit =
                            isDoctor ? auth.data.id_user : null;

                        con.query(`
                    INSERT INTO editform
                    (
                        id_form,
                        id_doctor,
                        id_doctor_edit,
                        because,
                        note,
                        status,
                        type_form,
                        id_admin
                    )
                    VALUES
                    (
                        ?, ?, ?, ?, ?, ?, "plant", 0
                    )
                `,
                            [
                                data.id_plant,
                                "",
                                idDoctorEdit,
                                data.because ?? "",
                                "",
                                0
                            ],
                            (err, resultEdit) => {

                                if (err) {

                                    console.log("INSERT EDITFORM ERROR =>", err);

                                    dbpacket.dbErrorReturn(con, err, res);

                                    return;
                                }

                                if (!resultEdit.insertId) {

                                    con.end();
                                    res.send("edit");

                                    return;
                                }

                                const arrUpdate = [];
                                const arrValue = [];

                                const totalChange =
                                    Object.keys(data.dataChange).length;

                                let finishCount = 0;
                                let hasError = false;

                                for (let subject in data.dataChange) {

                                    con.query(`
                            INSERT INTO detailedit
                            (
                                id_edit,
                                subject_form,
                                old_content,
                                new_content
                            )
                            VALUES
                            (
                                ?, ?, ?, ?
                            )
                        `,
                                        [
                                            resultEdit.insertId,
                                            subject,
                                            result[0][subject] ?? "",
                                            data.dataChange[subject] ?? ""
                                        ],
                                        (err, Edit) => {

                                            if (hasError) return;

                                            if (err) {

                                                hasError = true;

                                                console.log(
                                                    "DETAIL EDIT ERROR =>",
                                                    err
                                                );

                                                dbpacket.dbErrorReturn(
                                                    con,
                                                    err,
                                                    res
                                                );

                                                return;
                                            }

                                            arrUpdate.push(`${subject} = ?`);

                                            arrValue.push(
                                                data.dataChange[subject] ?? null
                                            );

                                            finishCount++;

                                            console.log(
                                                "FINISH =>",
                                                finishCount,
                                                "/",
                                                totalChange
                                            );

                                            if (finishCount === totalChange) {

                                                const strUpdate =
                                                    arrUpdate.join(",");

                                                arrValue.push(data.id_plant);

                                                console.log(
                                                    "UPDATE QUERY =>",
                                                    strUpdate
                                                );

                                                console.log(
                                                    "UPDATE VALUE =>",
                                                    arrValue
                                                );

                                                con.query(`
                                    UPDATE formplant
                                    SET ${strUpdate}
                                    WHERE id = ?
                                `,
                                                    arrValue,
                                                    (err, update) => {

                                                        if (err) {

                                                            console.log(
                                                                "UPDATE ERROR =>",
                                                                err
                                                            );

                                                            dbpacket.dbErrorReturn(
                                                                con,
                                                                err,
                                                                res
                                                            );

                                                            return;
                                                        }

                                                        con.end();

                                                        try {

                                                            sendNotifyToDoctor(
                                                                auth.data.id_table,
                                                                auth.data.station,
                                                                `เกษตรกร ${auth.data.fullname} ทำการแก้ไขแบบฟอร์มบันทึกข้อมูล\nรหัสแบบฟอร์ม ${data.id_plant}`
                                                            );

                                                        } catch (e) {

                                                            console.log(
                                                                "NOTIFY ERROR =>",
                                                                e
                                                            );
                                                        }

                                                        res.send("133");
                                                    });
                                            }
                                        });
                                }
                            });

                    } else {

                        con.end();

                        res.send("submit");
                    }
                });

        } catch (err) {

            console.log("CATCH ERROR =>", err);

            con.end();

            if (
                err === "no" ||
                err === "no account"
            ) {

                res.send("close");

            } else {

                res.send("error auth");
            }
        }
    });








    // app.post('/api/farmer/formplant/edit/select', async (req, res) => {
    //     if (req.session.uidFarmer) {
    //         let con = Database.createConnection(listDB);

    //         try {
    //             const auth = await authCheck(con, req);
    //             const type = req.body.id_edit ? "*" : "id_edit";
    //             const where = req.body.id_edit ? `and editform.id_edit = '${req.body.id_edit}'` : "";
    //             con.query(` 
    //                 SELECT editform.${type}, formplant.name_varieties 
    //                 FROM editform, 
    //                 (
    //                     SELECT formplant.id, formplant.name_varieties
    //                     FROM formplant, 
    //                     (
    //                         SELECT id_farm_house FROM housefarm
    //                         WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
    //                     ) as houseFarm
    //                     WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
    //                 ) as formplant
    //                 WHERE editform.id_form = formplant.id and type_form = "plant" ${where}
    //                 ORDER BY date DESC
    //             `, [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_plant], 
    //             (err, result) => { 
    //                 console.log(err)
    //                 if (!err) {
    //                     if (req.body.id_edit) {
    //                         con.query(
    //                             `
    //                             SELECT * FROM detailedit
    //                             WHERE id_edit = ?
    //                             `, [req.body.id_edit], 
    //                             (err, detail) => {
    //                                 if (err) {
    //                                     dbpacket.dbErrorReturn(con, err, res);
    //                                     console.log("select detailedit");
    //                                     return 0;
    //                                 }

    //                                 con.end();
    //                                 res.send({
    //                                     head: result[0],
    //                                     detail: detail
    //                                 });
    //                             }
    //                         );
    //                     } else {
    //                         con.end();
    //                         res.send(result);
    //                     }
    //                 } else {
    //                     con.end();
    //                     res.send("error auth");
    //                 }
    //             });
    //         } catch (err) {
    //             console.log(err)
    //             con.end();
    //             if (err === "no" || err === "no account") res.send("close");
    //             else res.send("error auth");
    //         }
    //     } else res.send("error auth");
    // });


    app.post('/api/farmer/formplant/edit/select', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB);

            try {
                const auth = await authCheck(con, req);
                const where = req.body.id_edit
                    ? `AND editform.id_edit = '${req.body.id_edit}'`
                    : "";

                con.query(
                    `
                    SELECT editform.*, 
                           IF(editform.id_admin != 0 AND editform.id_admin IS NOT NULL, admin.fullname_admin, acc_doctor.fullname_doctor) AS fullname_doctor
                    FROM editform
                    LEFT JOIN formplant ON editform.id_form = formplant.id
                    LEFT JOIN acc_doctor ON editform.id_doctor_edit = acc_doctor.id_table_doctor
                    LEFT JOIN admin ON editform.id_admin = admin.id
                    WHERE formplant.id_farm_house = (
                        SELECT id_farm_house FROM housefarm
                        WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) 
                        AND housefarm.id_farm_house = ?
                    ) 
                    AND formplant.id = ?
                    AND editform.type_form = "plant" ${where}
                    ORDER BY editform.date DESC
                `,
                    [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_plant],
                    (err, result) => {
                        if (err) {
                            console.error(err);
                            con.end();
                            res.send("error auth");
                            return;
                        }

                        if (req.body.id_edit) {
                            // Fetch details for a specific edit
                            con.query(
                                `
                                SELECT * FROM detailedit
                                WHERE id_edit = ?
                            `,
                                [req.body.id_edit],
                                (err, detail) => {
                                    if (err) {
                                        dbpacket.dbErrorReturn(con, err, res);
                                        console.error("select detailedit", err);
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
                            // Fetch all edits
                            con.end();
                            res.send(result);
                        }
                    }
                );
            } catch (err) {
                console.error("Authorization error:", err);
                con.end();
                if (err === "no" || err === "no account") res.send("close");
                else res.send("error auth");
            }
        } else {
            res.send("error auth");
        }
    });

    app.get('/api/farmer/statistics', (req, res) => {
        const con = Database.createConnection(listDB);

        try {
            const uidFarmer = req.session?.uidFarmer;
            console.log(`Received UID_Farmer from session: ${uidFarmer}`);

            if (!uidFarmer) {
                console.error('UID_Farmer ไม่พบใน session');
                res.status(400).json({ status: "error", message: "UID_Farmer ไม่พบใน session" });
                return;
            }

            console.log(`Using UID_Farmer: ${uidFarmer}`);

            // ดึงข้อมูล station จาก uidFarmer
            con.query(
                `SELECT station FROM acc_farmer WHERE uid_line = ?;`,
                [uidFarmer],
                (err, stations) => {
                    if (err) {
                        console.error('Error fetching stations:', err);
                        res.status(500).json({ status: "error", message: "Database query error" });
                        return;
                    }

                    if (stations.length === 0) {
                        res.status(404).json({ status: "error", message: "ไม่พบ station สำหรับ UID_Farmer นี้" });
                        return;
                    }

                    const station = stations[0]?.station;
                    console.log(`Using Station: ${station}`);

                    // ดึงข้อมูลเกษตรกรและพืชใน station
                    const farmerQuery = `
                        SELECT 
                            acc_farmer.station,
                            COUNT(DISTINCT acc_farmer.uid_line) AS total_farmers,
                            COUNT(DISTINCT formplant.id_farm_house) AS total_plants,
                            GROUP_CONCAT(DISTINCT formplant.name_plant COLLATE utf8mb4_thai_520_w2 SEPARATOR ', ') AS plants,
                            CONCAT(
                                '[', 
                                GROUP_CONCAT(
                                    DISTINCT CONCAT(
                                        '{"plantName":"', subquery.name_plant, '",' ,
                                        '"id":"', subquery.id, '",' ,
                                        '"farmersCount":', subquery.total_qty, '}'
                                    )
                                        ORDER BY subquery.name_plant COLLATE utf8mb4_thai_520_w2
                                        SEPARATOR ','
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
                            SELECT
                                id_doctor,
                                fullname_doctor,
                                station_doctor,
                                doctor_role,
                                consultant_role
                                FROM acc_doctor
                                WHERE station_doctor = ?
                                AND (doctor_role = 1 OR consultant_role = 1)

                                -- สำคัญ: สั่งเรียงตามชื่ออย่างเดียว
                                ORDER BY fullname_doctor COLLATE utf8mb4_thai_520_w2 ASC

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
                                WHERE station_doctor = ? AND consultant_role = 1
                                ORDER BY fullname_doctor COLLATE utf8mb4_thai_520_w2 ASC
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
            );
        } catch (error) {
            console.error("Unexpected error:", error);
            res.status(500).json({ status: "error", message: "Internal Server Error" });
        }
    });



    // end formplant

    // start factor
    app.post('/api/farmer/factor/select', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)

            try {
                const auth = await authCheck(con, req)
                const where = (req.body.id_factor) ?
                    `and form${req.body.type}.id = "${req.body.id_factor}"` :
                    ""

                const Type = req.body.type == "fertilizer" ? "fertilizer" : "chemical";

                con.query(`
                            SELECT form${Type}.* , formPlant.state_status
                            FROM form${Type} , 
                                (
                                    SELECT formplant.id , formplant.state_status
                                    FROM formplant , 
                                        (
                                            SELECT id_farm_house FROM housefarm
                                            WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                        ) as houseFarm
                                    WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
                                ) as formPlant
                            WHERE form${Type}.id_plant = formPlant.id ${where}
                            ORDER BY ${req.body.order} DESC
                        ` ,
                    [
                        auth.data.uid_line, auth.data.link_user,
                        req.body.id_farmhouse,
                        req.body.id_plant
                    ],
                    async (err, result) => {
                        if (!err) {
                            for (let index in result) {
                                const ResultEdit = await new Promise((resole, reject) => {
                                    con.query(
                                        `
                                            SELECT editform.id_edit , editform.status
                                            FROM editform
                                            WHERE editform.id_form = ? and type_form = "${Type}"
                                            ORDER BY date DESC
                                            ` , [result[index].id],
                                        async (err, resultEditList) => {
                                            const subjectResultPass = new Map()
                                            for (let edit of resultEditList) {
                                                await new Promise((resole, reject) => {
                                                    con.query(
                                                        `
                                                            SELECT subject_form
                                                            FROM detailedit
                                                            WHERE id_edit = ?
                                                            ` , [edit.id_edit],
                                                        (err, resultDetail) => {
                                                            for (let detail of resultDetail) {
                                                                if (!subjectResultPass.has(detail.subject_form) && edit.status != 0) {
                                                                    subjectResultPass.set(detail.subject_form, edit.status)
                                                                }
                                                            }

                                                            resole("")
                                                        }
                                                    )
                                                })
                                            }
                                            resole(subjectResultPass)
                                        }
                                    )
                                })

                                result[index].subjectResult = Object.fromEntries(ResultEdit)
                            }

                            con.end()
                            res.send(result)
                        } else {
                            con.end()
                            res.send("error auth")
                        }
                    })
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }

        } else res.send("error auth")
    })

    app.post('/api/farmer/factor/get/auto', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)

            try {
                const auth = await authCheck(con, req)
                con.query(`SELECT * FROM ${req.body.type}_list WHERE is_use = 1`, (err, result) => {
                    con.end()
                    if (!err) {
                        res.send(result)
                    } else res.send("error auth")
                })
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }

        } else res.send("error auth")
    })

    // app.post('/api/farmer/factor/insert' , async (req , res)=>{
    //     if(req.session.uidFarmer) {
    //         let con = Database.createConnection(listDB)
    //         try {
    //             const auth = await authCheck(con , dbpacket , res , req )
    //             con.query(`
    //                          SELECT formplant.id, formplant.state_status
    //                 FROM formplant,
    //                     (
    //                         SELECT id_farm_house FROM housefarm
    //                         WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) AND housefarm.id_farm_house = ?
    //                     ) AS houseFarm
    //               WHERE formplant.id_farm_house = houseFarm.id_farm_house AND formplant.id = ?
    //                  `,
    //                  [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_plant],
    //                     (err , result)=>{
    //                         if (!err) {
    //                             if(result[0]) {
    //                                 if(result[0].state_status == 0 || result[0].state_status == 1) {
    //                                     let data = req.body
    //                                     const sql = data.type_request === "z" ? 
    //                                                     `INSERT INTO formfertilizer 
    //                                                     ( 
    //                                                         id_plant , name , formula_name , use_is , volume , source , date
    //                                                     ) VALUES (
    //                                                         ? , ? , ? , ? , ? , ? , ?
    //                                                     );
    //                                                     ` : 
    //                                                 data.type_request === "c" ? 
    //                                                     `INSERT INTO formchemical 
    //                                                     ( 
    //                                                         id_plant , name , formula_name , insect , use_is , rate , volume , source , date_safe , date
    //                                                     ) VALUES (
    //                                                         ? , ? , ? , ? , ? , ? , ? , ? , ? , ?
    //                                                     );
    //                                                     ` : ""
    //                                     const ArrayData = data.type_request === "z" ? 
    //                                                         [ data.id_plant , data.name , data.formula_name , data.use , data.volume , data.source , new Date(data.date) ] :
    //                                                     data.type_request === "c" ? 
    //                                                         [ data.id_plant , data.name , data.formula_name , data.insect , data.use , data.rate , data.volume , data.source , new Date(data.dateSafe) , new Date(data.date) ] : []

    //                                     con.query(sql , ArrayData ,
    //                                                 (err , insert)=>{
    //                                                     try {
    //                                                         sendNotifyToDoctor(auth.data.id_table , auth.data.station , `เกษตรกร ${auth.data.fullname}\nมีการเพิ่ม${data.type_request == "z" ? "ปัจจัยการผลิต" : "สารเคมี"}\nที่ฟอร์มไอดี ${data.id_plant}`)
    //                                                     } catch (e) {}
    //                                                     con.end()
    //                                                     res.send("insert")
    //                                                     // if(insert.affectedRows >= 1) 
    //                                                     // else res.send("130")
    //                                                 })
    //                                 } else {
    //                                     // เวลา submit แล้ว
    //                                     con.end()
    //                                     res.send("submit")
    //                                 }
    //                             }
    //                             else {
    //                                 con.end()
    //                                 res.send("not")
    //                             }
    //                         } else {
    //                             con.end()
    //                             res.send("error auth")
    //                         }
    //                     })
    //         } catch (err) {
    //             if(err === "no" || err === "no account") res.send("close")
    //             else res.send("error auth")
    //         }
    //     } else res.send("error auth")
    // })


    app.post('/api/farmer/factor/insert', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB);
            try {
                const auth = await authCheck(con, req);
                con.query(
                    `
                    SELECT formplant.id, formplant.state_status
                    FROM formplant,
                        (
                            SELECT id_farm_house FROM housefarm
                            WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) AND housefarm.id_farm_house = ?
                        ) AS houseFarm
                    WHERE formplant.id_farm_house = houseFarm.id_farm_house AND formplant.id = ?
                    `,
                    [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_plant],
                    async (err, result) => {
                        if (!err) {
                            if (result[0]) {
                                if (result[0].state_status == 0 || result[0].state_status == 1) {
                                    let data = req.body;
                                    const sql =
                                        data.type_request === 'z'
                                            ? `INSERT INTO formfertilizer 
                                                    (id_plant, name, formula_name, use_is, volume, source, date)
                                                VALUES (?, ?, ?, ?, ?, ?, ?);`
                                            : data.type_request === 'c'
                                                ? `INSERT INTO formchemical 
                                                    (id_plant, name, formula_name, insect, use_is, rate, volume, source, date_safe, date)
                                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
                                                : '';

                                    const ArrayData =
                                        data.type_request === 'z'
                                            ? [data.id_plant, data.name, data.formula_name, data.use, data.volume, data.source, new Date(data.date)]
                                            : data.type_request === 'c'
                                                ? [
                                                    data.id_plant,
                                                    data.name,
                                                    data.formula_name,
                                                    data.insect,
                                                    data.use,
                                                    data.rate,
                                                    data.volume,
                                                    data.source,
                                                    new Date(data.dateSafe),
                                                    new Date(data.date),
                                                ]
                                                : [];

                                    // ตรวจสอบความสัมพันธ์ระหว่างศัตรูพืชและสารเคมี
                                    let notificationMessage = '';
                                    if (data.type_request === 'c') {
                                        try {
                                            const pestChemicalRelationValid = await checkPestChemicalRelation(data.insect, data.name, data.id_plant, con);
                                            // ดึงประเภทศัตรูพืชจากฐานข้อมูล
                                            const [pestTypeResult] = await new Promise((resolve, reject) => {
                                                con.query(`SELECT type_pest FROM pests WHERE pest_name = ?`, [data.insect], (err, result) => {
                                                    if (err) return reject(err);
                                                    resolve(result);
                                                });
                                            });
                                            const pestType = pestTypeResult?.type_pest || 'ศัตรูพืช/โรคพืช';
                                            if (!pestChemicalRelationValid) {
                                                notificationMessage = `เกษตรกร ${auth.data.fullname}\nมีการเพิ่มสารเคมี "${data.name}"\nที่ฟอร์มไอดี ${data.id_plant}\n\nสารเคมีไม่ตรงกับ${pestType} "${data.insect}"`;

                                            } else {
                                                notificationMessage = `เกษตรกร ${auth.data.fullname}\nมีการเพิ่มสารเคมี "${data.name}"\nที่ฟอร์มไอดี ${data.id_plant}`;
                                            }
                                        } catch (err) {
                                            console.error('Error checking pest-chemical relation:', err);
                                            notificationMessage = `เกษตรกร ${auth.data.fullname}\nมีการเพิ่มสารเคมี "${data.name}"\nที่ฟอร์มไอดี ${data.id_plant}\n\nไม่สามารถตรวจสอบสารเคมีกับศัตรูพืชได้`;
                                        }
                                    } else {
                                        notificationMessage = `เกษตรกร ${auth.data.fullname}\nมีการเพิ่ม${data.type_request === 'z' ? 'ปัจจัยการผลิต' : 'สารเคมี'}\nที่ฟอร์มไอดี ${data.id_plant}`;
                                    }

                                    // ดำเนินการบันทึกข้อมูล
                                    con.query(sql, ArrayData, (err, insert) => {
                                        if (!err) {
                                            try {
                                                // ส่งแจ้งเตือนครั้งเดียว
                                                sendNotifyToDoctor(auth.data.id_table, auth.data.station, notificationMessage);
                                                
                                                // ถ้ามี schedule_id ให้บันทึกการ Tracking
                                                if (data.schedule_id) {
                                                    const insertId = insert.insertId;
                                                    const isFert = data.type_request === 'z';
                                                    
                                                    con.query(
                                                        `INSERT INTO schedule_tracking (formplant_id, schedule_id, formfertilizer_id, formchemical_id) VALUES (?, ?, ?, ?)`,
                                                        [data.id_plant, data.schedule_id, isFert ? insertId : null, !isFert ? insertId : null],
                                                        (err2) => {
                                                            if(err2) {
                                                                console.error('Tracking insert error:', err2);
                                                            } else {
                                                                checkMismatch.triggerMismatchCheck(pool, data.id_plant, data.schedule_id, socket);
                                                            }
                                                        }
                                                    );
                                                }
                                            } catch (e) {
                                                console.error('Error notifying doctor:', e);
                                            }
                                            con.end();
                                            res.send('insert');
                                        } else {
                                            console.error('Error inserting data:', err);
                                            con.end();
                                            res.send('error');
                                        }
                                    });
                                } else {
                                    con.end();
                                    res.send('submit');
                                }
                            } else {
                                con.end();
                                res.send('not');
                            }
                        } else {
                            console.error('Error querying formplant:', err);
                            con.end();
                            res.send('error auth');
                        }
                    }
                );
            } catch (err) {
                console.error('Authentication error:', err);
                if (err === 'no' || err === 'no account') res.send('close');
                else res.send('error auth');
            }
        } else {
            res.send('error auth');
        }
    });

    app.post('/api/farmer/check-schedule', async (req, res) => {
        try {
            const { formplant_id, schedule_id } = req.body;
            if (!formplant_id || !schedule_id) {
                return res.json({ recorded: false, error: 'Missing parameters' });
            }
            
            const result = await pool.executeQuery(
                `SELECT id FROM schedule_tracking WHERE formplant_id = ? AND schedule_id = ? LIMIT 1`,
                [formplant_id, schedule_id]
            );

            if (result && result.length > 0) {
                return res.json({ recorded: true });
            } else {
                return res.json({ recorded: false });
            }
        } catch (e) {
            console.error(e);
            return res.json({ recorded: false, error: 'Server error' });
        }
    });


    const checkPestChemicalRelation = (pest, chemical, formId, con) => {
        return new Promise((resolve, reject) => {
            console.log("Starting checkPestChemicalRelation with formId:", formId);

            // ดึงชนิดพืชจาก formplant
            const queryFormplant = `SELECT name_plant FROM formplant WHERE id = ?;`;
            con.query(queryFormplant, [formId], (err, formResult) => {
                if (err) {
                    console.error("Error in queryFormplant:", err);
                    return reject("Error fetching formplant data");
                }

                if (formResult.length === 0) {
                    console.warn("No formplant data found for formId:", formId);
                    return resolve(false); // ไม่มีข้อมูลชนิดพืช
                }

                const namePlant = formResult[0].name_plant;
                console.log("Found namePlant:", namePlant);

                // ดึง plant_id จาก plant_list
                const queryPlantList = `SELECT id FROM plant_list WHERE name = ?;`;
                con.query(queryPlantList, [namePlant], (err, plantResult) => {
                    if (err) {
                        console.error("Error in queryPlantList:", err);
                        return reject("Error fetching plant list data");
                    }

                    if (plantResult.length === 0) {
                        console.warn("No plant list data found for namePlant:", namePlant);
                        return resolve(false); // ไม่มีข้อมูล plant
                    }

                    const plantId = plantResult[0].id;
                    console.log("Found plantId:", plantId);

                    // ตรวจสอบความสัมพันธ์ศัตรูพืชและสารเคมีตามชนิดพืช
                    const queryPestChemical = `
                        SELECT 
                            pc.pest_id, p.pest_name, 
                            pc.chemical_id, cl.name AS chemical_name
                        FROM pest_chemical pc
                        JOIN pests p ON pc.pest_id = p.pest_id
                        JOIN chemical_list cl ON pc.chemical_id = cl.id
                        WHERE pc.plant_id = ? AND p.pest_name = ? AND cl.name = ?
                        ORDER BY cl.name COLLATE utf8mb4_thai_520_w2 ASC;
                    `;
                    con.query(queryPestChemical, [plantId, pest, chemical], (err, result) => {
                        if (err) {
                            console.error("Error in queryPestChemical:", err);
                            return reject("Error fetching pest-chemical data");
                        }

                        console.log("Pest-Chemical relation result:", result);
                        resolve(result.length > 0); // ถ้าพบข้อมูลที่สัมพันธ์กัน คืนค่า true
                    });
                });
            });
        });
    };




    // app.post('/api/farmer/factor/edit' , async (req , res)=>{
    //     if(req.session.uidFarmer) {
    //         let con = Database.createConnection(listDB)
    //         try {
    //             const auth = await authCheck(con , dbpacket , res , req )
    //             const FactorType = req.body.type_form == "fertilizer" ? "fertilizer" : req.body.type_form == "chemical" ? "chemical" : "";
    //             if(FactorType) {
    //                 con.query(` 
    //                         SELECT form${FactorType}.* , formplant.state_status
    //                         FROM form${FactorType} ,
    //                         (
    //                             SELECT formplant.id , formplant.state_status
    //                             FROM formplant , 
    //                                 (
    //                                     SELECT id_farm_house FROM housefarm
    //                                     WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
    //                                 ) as houseFarm
    //                             WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
    //                         ) as formplant
    //                         WHERE form${FactorType}.id_plant = formplant.id and form${FactorType}.id = ?
    //                     ` , [ auth.data.uid_line , auth.data.link_user , req.body.id_farmhouse , req.body.id_plant , req.body.id_form] , 
    //                     (err , result)=>{
    //                         if (!err) {
    //                             if(result[0]) {
    //                                 let data = req.body
    //                                 if(result[0].state_status == 0 || result[0].state_status == 1) {
    //                                     con.query(
    //                                         `
    //                                         INSERT INTO editform 
    //                                             ( id_form , id_doctor , because , note , status , type_form )
    //                                             VALUES 
    //                                             ( ? , ? , ? , ? , ? , ? )
    //                                         ` , [ data.id_form , "" , data.because , "" , 0 , data.type_form ] ,
    //                                         (err , resultEdit) => {
    //                                             if (err) {
    //                                                 dbpacket.dbErrorReturn(con, err, res);
    //                                                 console.log("insert editform");
    //                                                 return 0;
    //                                             }

    //                                             if(resultEdit.insertId > 0) {
    //                                                 const arrUpdate = new Array
    //                                                 let checkerr = false
    //                                                 for(let subject in data.dataChange) {
    //                                                     con.query(
    //                                                         `
    //                                                         INSERT INTO detailedit
    //                                                             (id_edit , subject_form , old_content , new_content)
    //                                                             VALUES 
    //                                                             ( ? , ? , ? , ?)
    //                                                         ` , [ resultEdit.insertId , subject , result[0][subject] , data.dataChange[subject] ] ,
    //                                                         (err , Edit) => {
    //                                                             if (err) {
    //                                                                 dbpacket.dbErrorReturn(con, err, res);
    //                                                                 console.log("insert detailedit");
    //                                                                 return 0;
    //                                                             }

    //                                                             if( Edit.insertId ) {
    //                                                                 arrUpdate.push(`${subject}="${data.dataChange[subject]}"`)
    //                                                                 if(arrUpdate.length == data.num) {
    //                                                                     let strUpdate = arrUpdate.join(" , ")
    //                                                                     con.query(
    //                                                                         `
    //                                                                         UPDATE form${FactorType} 
    //                                                                         SET ${strUpdate}
    //                                                                         WHERE id = ?
    //                                                                         ` , [ data.id_form ] , 
    //                                                                         (err , update) => {
    //                                                                             if (!err) {
    //                                                                                 try {
    //                                                                                     sendNotifyToDoctor(auth.data.id_table , auth.data.station , `เกษตรกร ${auth.data.fullname}\nทำการแก้ไข${FactorType == "fertilizer" ? "ปัจจัยการผลิต" : "สารเคมี"}\nที่ฟอร์มไอดี ${req.body.id_plant}`)
    //                                                                                 } catch (e) {}
    //                                                                                 con.end()
    //                                                                                 res.send("133")
    //                                                                             } else {
    //                                                                                 res.send("error auth")
    //                                                                             }
    //                                                                         }
    //                                                                     )
    //                                                                 }
    //                                                             } else {
    //                                                                 checkerr = true
    //                                                             }
    //                                                         }
    //                                                     )
    //                                                     if(checkerr) {
    //                                                         con.end()
    //                                                         res.send("edit")
    //                                                         break
    //                                                     }
    //                                                 }
    //                                             } else {
    //                                                 con.end()
    //                                                 res.send("edit")
    //                                             }
    //                                         }
    //                                     )
    //                                 }
    //                                 else {
    //                                     con.end()
    //                                     res.send("submit")
    //                                 }
    //                             }
    //                             else {
    //                                 con.end()
    //                                 res.send("not")
    //                             }
    //                         } else {
    //                             con.end()
    //                             res.send("error auth")
    //                         }
    //                     })
    //             } else {
    //                 res.send("error auth")
    //             }
    //         } catch (err) {
    //             console.log(err)
    //             if(err === "no" || err === "no account") res.send("close")
    //             else res.send("error auth")
    //         }
    //     } else res.send("error auth")
    // })

    app.post('/api/farmer/factor/edit', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB);
            try {
                const auth = await authCheck(con, req);
                const FactorType = (
                    req.body.type_request == "z" ?
                        "fertilizer" :
                        req.body.type_request == "c" ?
                            "chemical" :
                            ""
                )

                // , 
                // (
                //     SELECT formplant.id, formplant.state_status
                //     FROM formplant, 
                //         (
                //             SELECT id_farm_house FROM housefarm
                //             WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) AND housefarm.id_farm_house = ?
                //         ) AS houseFarm
                //     WHERE formplant.id_farm_house = houseFarm.id_farm_house AND formplant.id = ?
                // ) AS formplant

                if (FactorType) {
                    try {
                        const factorCurrent = await pool.executeQuery(
                            `
                                SELECT ft.*, fp.state_status
                                FROM form${FactorType} ft
                                LEFT JOIN formplant fp ON fp.id = ft.id_plant
                                LEFT JOIN housefarm gh ON gh.id_farm_house = fp.id_farm_house
                                WHERE (gh.uid_line = ? || gh.link_user = ?) AND gh.id_farm_house = ? AND fp.id = ? AND ft.id = ?
                                LIMIT 1
                            `,
                            [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_plant, req.body.id_form]
                        )

                        const [{ state_status, ...factorData }] = factorCurrent

                        if ([0, 1].includes(state_status)) {
                            // ตรวจสอบว่าผู้ใช้เป็นหมอพืช

                            const { id_user, user_type, id_form, because, change } = req.body;
                            const isDoctor = user_type === 'doctor'; // ตรวจสอบฟิลด์ user_type
                            const idDoctorEdit = isDoctor ? id_user : null;

                            const editForm = await pool.executeQuery(
                                `
                                    INSERT INTO editform 
                                        (id_form, id_doctor, id_doctor_edit, because, note, status, type_form, id_admin)
                                    VALUES 
                                        (?, ?, ?, ?, ?, ?, ?, 0)
                                `,
                                [id_form, "", idDoctorEdit, because, "", 0, FactorType]
                            )

                            const { insertId: insertIdEdit } = editForm
                            if (insertIdEdit > 0) {
                                const insertData = []

                                const queryUpdates = []
                                const paramUpdates = []

                                for (const subject in change) {
                                    insertData.push(
                                        [insertIdEdit, subject, factorData[subject] ?? "", change[subject] ?? ""]
                                    )

                                    queryUpdates.push(`${subject} = ?`)
                                    paramUpdates.push(change[subject])
                                }

                                const placeholders = insertData.map(() => '(?, ?, ?, ?)').join(', ')
                                const flatValues = insertData.flat()

                                let insertIdDetail;
                                try {
                                    const { insertId } = await pool.executeQuery(
                                        `
                                            INSERT INTO detailedit (id_edit, subject_form, old_content, new_content) 
                                                VALUES ${placeholders}
                                        `,
                                        flatValues
                                    )

                                    insertIdDetail = insertId
                                } catch (err) {
                                    console.log(err)

                                    await pool.executeQuery(
                                        "DELETE FROM editform WHERE id_edit = ?", [insertIdEdit]
                                    )
                                    return res.send("edit")
                                }

                                paramUpdates.push(id_form)
                                try {
                                    await pool.executeQuery(
                                        `
                                            UPDATE form${FactorType} 
                                            SET ${queryUpdates.join(" , ")}
                                            WHERE id = ?
                                        `,
                                        paramUpdates
                                    )
                                } catch (err) {
                                    console.log(err)

                                    await pool.executeQuery(
                                        "DELETE FROM editform WHERE id_edit = ?", [insertIdEdit]
                                    )
                                    await pool.executeQuery(
                                        "DELETE FROM detailedit WHERE id_detail = ?", [insertIdDetail]
                                    )
                                    return res.send("edit")
                                }

                                try {
                                    await sendNotifyToDoctor(auth.data.id_table, auth.data.station, `เกษตรกร ${auth.data.fullname} ทำการแก้ไข${FactorType == "fertilizer" ? "ปัจจัยการผลิต" : "สารเคมี"}\nรหัสฟอร์ม ${id_form}`);
                                } catch (e) {
                                    console.error(e);
                                }

                                try {
                                    const stQuery = await pool.executeQuery(
                                        `SELECT schedule_id, formplant_id FROM schedule_tracking WHERE form${FactorType}_id = ?`,
                                        [id_form]
                                    );
                                    if (stQuery.length > 0) {
                                        for (let st of stQuery) {
                                            checkMismatch.triggerMismatchCheck(pool, st.formplant_id, st.schedule_id, socket);
                                        }
                                    }
                                } catch (e) {
                                    console.error("Error triggering mismatch on edit:", e);
                                }
                            } else {
                                return res.send("edit")
                            }
                        } else {
                            return res.send("submit")
                        }

                    } catch (err) {
                        console.log(err)
                        return res.send("error auth")
                    }
                } else {
                    return res.send("error auth");
                }

                con.end();
                return res.send("133")
            } catch (err) {
                con.end();
                console.log(err);
                if (err === "no" || err === "no account") res.send("close");
                else res.send("error auth");
            }
        } else {
            res.send("error auth");
        }
    });


    // app.post('/api/farmer/factor/edit/select' , async (req , res)=>{
    //     if(req.session.uidFarmer) {
    //         let con = Database.createConnection(listDB)

    //         try {
    //             const auth = await authCheck(con , dbpacket , res , req )
    //             const type = req.body.id_edit ? "*" : "id_edit" ;
    //             const where = req.body.id_edit ? `and editform.id_edit = '${req.body.id_edit}'` : "" ;
    //             const FactorType = req.body.type_form == "fertilizer" ? "fertilizer" : req.body.type_form == "chemical" ? "chemical" : "";
    //             if(FactorType) {
    //                 con.query(` 
    //                         SELECT editform.${type} FROM editform , 
    //                         (
    //                             SELECT form${FactorType}.id
    //                             FROM form${FactorType} ,
    //                             (
    //                                 SELECT formplant.id
    //                                 FROM formplant , 
    //                                     (
    //                                         SELECT id_farm_house FROM housefarm
    //                                         WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
    //                                     ) as houseFarm
    //                                 WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
    //                             ) as formplant
    //                             WHERE form${FactorType}.id_plant = formplant.id and form${FactorType}.id = ?
    //                         ) as factor
    //                         WHERE editform.id_form = factor.id and type_form = ? ${where}
    //                     ` , [ auth.data.uid_line , auth.data.link_user , req.body.id_farmhouse , req.body.id_plant , req.body.id_form_factor , req.body.type_form] , 
    //                     (err , result)=>{
    //                         if (!err) {
    //                             if(req.body.id_edit) {
    //                                 con.query(
    //                                     `
    //                                     SELECT * FROM detailedit
    //                                     WHERE id_edit = ?
    //                                     ` , [req.body.id_edit] , 
    //                                     (err , detail) => {
    //                                         if (err) {
    //                                             dbpacket.dbErrorReturn(con, err, res);
    //                                             console.log("select detailedit");
    //                                             return 0;
    //                                         }

    //                                         con.end()
    //                                         res.send({
    //                                             head : result[0] ,
    //                                             detail : detail
    //                                         })
    //                                     }
    //                                     )
    //                             } else {
    //                                 con.end()
    //                                 res.send(result)
    //                             }
    //                         } else {
    //                             con.end()
    //                             res.send("error auth")
    //                         }
    //                     })
    //             }
    //         } catch (err) {
    //             con.end()
    //             if(err === "no" || err === "no account") res.send("close")
    //             else res.send("error auth")
    //         }

    //     } else res.send("error auth")
    // })


    app.post('/api/farmer/factor/edit/select', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB);

            try {
                const auth = await authCheck(con, req);
                const where = req.body.id_edit
                    ? `AND editform.id_edit = '${req.body.id_edit}'`
                    : "";
                const FactorType = req.body.type_form === "fertilizer" ? "fertilizer" : req.body.type_form === "chemical" ? "chemical" : null;

                if (FactorType) {
                    con.query(
                        `
                        SELECT editform.*, 
                               form${FactorType}.name AS form_name,
                               IF(editform.id_admin != 0 AND editform.id_admin IS NOT NULL, admin.fullname_admin, acc_doctor.fullname_doctor) AS fullname_doctor
                        FROM editform
                        LEFT JOIN form${FactorType} ON editform.id_form = form${FactorType}.id
                        LEFT JOIN formplant ON form${FactorType}.id_plant = formplant.id
                        LEFT JOIN acc_doctor ON editform.id_doctor_edit = acc_doctor.id_table_doctor
                        LEFT JOIN admin ON editform.id_admin = admin.id
                        WHERE formplant.id_farm_house = (
                            SELECT id_farm_house FROM housefarm
                            WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) 
                            AND housefarm.id_farm_house = ?
                        ) 
                        AND formplant.id = ?
                        AND form${FactorType}.id = ?
                        AND editform.type_form = ? ${where}
                        ORDER BY editform.date DESC
                    `,
                        [
                            auth.data.uid_line,
                            auth.data.link_user,
                            req.body.id_farmhouse,
                            req.body.id_plant,
                            req.body.id_form_factor,
                            req.body.type_form,
                        ],
                        (err, result) => {
                            if (err) {
                                console.error(err);
                                con.end();
                                res.send("error auth");
                                return;
                            }

                            if (req.body.id_edit) {
                                // Fetch details for a specific edit
                                con.query(
                                    `
                                    SELECT * FROM detailedit
                                    WHERE id_edit = ?
                                `,
                                    [req.body.id_edit],
                                    (err, detail) => {
                                        if (err) {
                                            dbpacket.dbErrorReturn(con, err, res);
                                            console.error("select detailedit", err);
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
                                // Fetch all edits
                                con.end();
                                res.send(result);
                            }
                        }
                    );
                } else {
                    res.send("error auth");
                }
            } catch (err) {
                console.error("Authorization error:", err);
                con.end();
                if (err === "no" || err === "no account") res.send("close");
                else res.send("error auth");
            }
        } else {
            res.send("error auth");
        }
    });


    // success 
    app.post('/api/farmer/success/list', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)

            try {
                const auth = await authCheck(con, req)
                con.query(
                    `
                            SELECT success_detail.id , formPlant.name_station , type_success , date_of_doctor , date_of_farmer
                            FROM success_detail , 
                            (
                                SELECT formplant.id , houseFarm.name_station
                                FROM formplant , 
                                    (
                                        SELECT id_farm_house , (
                                            SELECT name FROM station_list WHERE station_list.id = ?
                                        ) as name_station
                                        FROM housefarm
                                        WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                    ) as houseFarm
                                WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
                            ) as formPlant
                            WHERE success_detail.id_plant = formPlant.id
                            ` , [auth.data.station, auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_plant],
                    (err, result) => {
                        con.end()
                        if (!err) res.send(result)
                        else res.send("error auth")
                    }
                )

            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }

        } else res.send("error auth")
    })

    app.post('/api/farmer/success/get', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)

            try {
                const auth = await authCheck(con, req)
                con.query(
                    `
                            SELECT success_detail.id_success
                            FROM success_detail , 
                            (
                                SELECT formplant.id
                                FROM formplant , 
                                    (
                                        SELECT id_farm_house
                                        FROM housefarm
                                        WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                    ) as houseFarm
                                WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
                            ) as formPlant
                            WHERE success_detail.id_plant = formPlant.id and date_of_farmer != "" and success_detail.id = ?
                            ` , [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_plant, req.body.id_table],
                    (err, result) => {
                        con.end()
                        if (!err) res.send(result)
                        else res.send("error auth")
                    }
                )

            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }

        } else res.send("error auth")
    })

    app.post('/api/farmer/success/update', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)
            try {
                const auth = await authCheck(con, req)
                con.query(`
                            SELECT formplant.id
                            FROM formplant , 
                                (
                                    SELECT id_farm_house FROM housefarm
                                    WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                ) as houseFarm
                            WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
                        ` , [auth.data.uid_line, auth.data.link_user, req.body.id_farmhouse, req.body.id_plant],
                    (err, result) => {
                        if (!err) {
                            if (result[0]) {
                                let data = req.body
                                con.query(
                                    `
                                                UPDATE success_detail SET date_of_farmer = ? 
                                                WHERE id = ? and id_plant = ? and date_of_farmer = ""
                                                ` , [new Date(), data.id_table_success, data.id_plant],
                                    (err, result) => {
                                        if (err) {
                                            dbpacket.dbErrorReturn(con, err, res);
                                            console.log(`inst success id_table ${data.id_table_success} id_plant ${data.id_plant}`);
                                            return 0;
                                        }

                                        con.end()
                                        res.send("133")
                                    }
                                )
                            }
                            else {
                                con.end()
                                res.send("not")
                            }
                        } else {
                            con.end()
                            res.send("error auth")
                        }
                    })
            } catch (err) {
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }
        } else res.send("error auth")
    })

    //report 
    app.get('/api/farmer/report/check', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)

            try {
                const auth = await authCheck(con, req)
                con.query(
                    `
                    SELECT (
                        SELECT EXISTS (
                            SELECT id
                            FROM report_detail
                            WHERE report_detail.id_plant = formplant.id AND report_detail.is_read = 0
                        ) 
                    ) as report ,
                    (
                        SELECT EXISTS (
                            SELECT id
                            FROM check_form_detail
                            WHERE check_form_detail.id_plant = formplant.id AND check_form_detail.acknowledged = 0
                        ) 
                    ) as form , 
                    (
                        SELECT EXISTS (
                            SELECT id
                            FROM check_plant_detail
                            WHERE check_plant_detail.id_plant = formplant.id AND check_plant_detail.acknowledged = 0
                        ) 
                    ) as plant ,
                    (
                        SELECT EXISTS (
                            SELECT id
                            FROM success_detail
                            WHERE id_plant = formplant.id and date_of_farmer = ""
                        )
                    ) as success
                    FROM formplant , 
                        (
                            SELECT id_farm_house , (
                                SELECT name FROM station_list WHERE station_list.id = ?
                            ) as name_station
                            FROM housefarm
                            WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                        ) as houseFarm
                    WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
                    ` , [auth.data.station, auth.data.uid_line, auth.data.link_user, req.query.id_farmhouse, req.query.id_plant],
                    async (err, check) => {
                        if (!err) {
                            const ResultEdit = await new Promise((resole, reject) => {
                                con.query(
                                    `
                                    SELECT editform.id_edit , editform.status
                                    FROM editform , 
                                    (
                                        SELECT formplant.id
                                        FROM formplant , 
                                            (
                                                SELECT id_farm_house FROM housefarm
                                                WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                            ) as houseFarm
                                        WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
                                    ) as formplant
                                    WHERE editform.id_form = formplant.id and type_form = "plant"
                                    ORDER BY date DESC
                                    ` , [auth.data.uid_line, auth.data.link_user, req.query.id_farmhouse, req.query.id_plant],
                                    async (err, resultEditList) => {
                                        const subjectResultPass = new Map()
                                        for (let edit of resultEditList) {
                                            await new Promise((resole, reject) => {
                                                con.query(
                                                    `
                                                    SELECT subject_form
                                                    FROM detailedit
                                                    WHERE id_edit = ?
                                                    ` , [edit.id_edit],
                                                    (err, resultDetail) => {
                                                        for (let detail of resultDetail) {
                                                            if (!subjectResultPass.has(detail.subject_form) && edit.status != 0) {
                                                                subjectResultPass.set(detail.subject_form, edit.status)
                                                            }
                                                        }
                                                        resole("")
                                                    }
                                                )
                                            })
                                        }
                                        resole(Array.from(subjectResultPass).filter(val => val[1] == 2).length)
                                    }
                                )
                            })

                            const ResultEditFertilizer = await new Promise((resole, reject) => {
                                con.query(
                                    `
                                    SELECT editform.id_edit , editform.status
                                    FROM editform , 
                                    (
                                        SELECT formfertilizer.id
                                        FROM formfertilizer ,
                                        (
                                            SELECT formplant.id
                                            FROM formplant , 
                                                (
                                                    SELECT id_farm_house FROM housefarm
                                                    WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                                ) as houseFarm
                                            WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
                                        ) as formplant
                                        WHERE formfertilizer.id_plant = formplant.id
                                    ) as fertilizer
                                    WHERE editform.id_form = fertilizer.id and type_form = "fertilizer"
                                    ORDER BY date DESC
                                    ` , [auth.data.uid_line, auth.data.link_user, req.query.id_farmhouse, req.query.id_plant],
                                    async (err, resultEditList) => {
                                        const subjectResultPass = new Map()
                                        for (let edit of resultEditList) {
                                            await new Promise((resole, reject) => {
                                                con.query(
                                                    `
                                                    SELECT subject_form
                                                    FROM detailedit
                                                    WHERE id_edit = ?
                                                    ` , [edit.id_edit],
                                                    (err, resultDetail) => {
                                                        for (let detail of resultDetail) {
                                                            if (!subjectResultPass.has(detail.subject_form) && edit.status != 0) {
                                                                subjectResultPass.set(detail.subject_form, edit.status)
                                                            }
                                                        }

                                                        resole("")
                                                    }
                                                )
                                            })
                                        }
                                        resole(Array.from(subjectResultPass).filter(val => val[1] == 2).length)
                                    }
                                )
                            })

                            const ResultEditChemical = await new Promise((resole, reject) => {
                                con.query(
                                    `
                                    SELECT editform.id_edit , editform.status
                                    FROM editform , 
                                    (
                                        SELECT formchemical.id
                                        FROM formchemical ,
                                        (
                                            SELECT formplant.id
                                            FROM formplant , 
                                                (
                                                    SELECT id_farm_house FROM housefarm
                                                    WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                                ) as houseFarm
                                            WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
                                        ) as formplant
                                        WHERE formchemical.id_plant = formplant.id
                                    ) as chemical
                                    WHERE editform.id_form = chemical.id and type_form = "chemical"
                                    ORDER BY date DESC
                                    ` , [auth.data.uid_line, auth.data.link_user, req.query.id_farmhouse, req.query.id_plant],
                                    async (err, resultEditList) => {
                                        const subjectResultPass = new Map()
                                        for (let edit of resultEditList) {
                                            await new Promise((resole, reject) => {
                                                con.query(
                                                    `
                                                    SELECT subject_form
                                                    FROM detailedit
                                                    WHERE id_edit = ?
                                                    ` , [edit.id_edit],
                                                    (err, resultDetail) => {
                                                        for (let detail of resultDetail) {
                                                            if (!subjectResultPass.has(detail.subject_form) && edit.status != 0) {
                                                                subjectResultPass.set(detail.subject_form, edit.status)
                                                            }
                                                        }

                                                        resole("")
                                                    }
                                                )
                                            })
                                        }
                                        resole(Array.from(subjectResultPass).filter(val => val[1] == 2).length)
                                    }
                                )
                            })

                            con.end()
                            res.send({
                                ...check,
                                checkEditPlant: ResultEdit,
                                checkEditFertilizer: ResultEditFertilizer,
                                checkEditChemical: ResultEditChemical,
                            })
                        } else {
                            con.end()
                            res.send("error auth")
                        }
                    }
                )
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }

        } else res.send("error auth")
    })
    app.get('/api/farmer/report/export', async (req, res) => {
        if (!req.session.uidFarmer)
            return res.send("error auth");

        const con = Database.createConnection(listDB);

        try {
            const auth = await authCheck(con, req);
            const { id_farmhouse, id_plant } = req.query;

            // ✅ 1. ดึงข้อมูลเกษตรกร
            const [farmer] = await new Promise(resolve => {
                con.query(`
        SELECT fullname, id_farmer, station
        FROM acc_farmer
        WHERE uid_line = ?
        LIMIT 1
      `, [auth.data.uid_line], (err, result) => resolve(result || []));
            });

            // ✅ 2. ดึงข้อมูลฟอร์มปลูก (dataform)
            const [dataform] = await new Promise(resolve => {
                con.query(`
    SELECT 
      id,
      name_plant,
      generation,
      date_glow,
      date_plant,
      posi_w,
      posi_h,
      qty,
      area,
      date_harvest,
      system_glow,
      water,
      water_flow,
      history,
      insect,
      qtyInsect,
      unit,
      date_success,
      name_varieties
    FROM formplant
    WHERE id_farm_house = ? AND id = ?
    LIMIT 1
  `, [id_farmhouse, id_plant], (err, result) => {
                    console.log("SQL result:", result);
                    resolve(result || []);
                });
            });


            // ✅ ดึงข้อมูล "ปุ๋ย" จาก formfertilizer
            const ferti = await new Promise(resolve => {
                con.query(`
    SELECT 
      date, 
      name, 
      formula_name, 
      use_is, 
      volume, 
      source
    FROM formfertilizer
    WHERE id_plant = ?
  `, [id_plant], (err, result) => {
                    if (err) {
                        console.error("❌ ferti query error:", err);
                        return resolve([]);
                    }
                    console.log("✅ ferti result:", result);
                    resolve(result || []);
                });
            });


            // ✅ ดึงข้อมูล "สารเคมี" จาก formchemical
            const chemi = await new Promise(resolve => {
                con.query(`
    SELECT 
      date, 
      date_safe, 
      name, 
      formula_name, 
      insect, 
      use_is, 
      rate, 
      volume, 
      source
    FROM formchemical
    WHERE id_plant = ?
  `, [id_plant], (err, result) => {
                    if (err) {
                        console.error("❌ chemi query error:", err);
                        return resolve([]);
                    }
                    console.log("✅ chemi result:", result);
                    resolve(result || []);
                });
            });
            // ✅ 5. ส่งกลับให้ React (index.jsx)
            res.json({
                farmer,
                dataform: dataform || {},   // ← ต้องชื่อ key นี้ (พิมพ์เล็กทั้งหมด)
                ferti,
                chemi,
                report: []
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "server error", detail: err.message });
        } finally {
            con.end();
        }
    });

    app.get('/api/farmer/report/list', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)

            try {
                const auth = await authCheck(con, req);
                //h = เก็บเกี่ยว
                const Type = req.query.type === "h" ? "success_detail" :
                    req.query.type === "r" ? "report_detail" :
                        req.query.type === "cf" ? "check_form_detail" :
                            req.query.type === "cp" ? "check_plant_detail" : ""
                if (Type) {
                    con.query(
                        req.query.type === "h" ?
                            `
                        SELECT success_detail.id , formPlant.name_station , type_success , date_of_doctor , date_of_farmer
                        FROM success_detail , 
                        (
                            SELECT formplant.id , houseFarm.name_station
                            FROM formplant , 
                                (
                                    SELECT id_farm_house , (
                                        SELECT name FROM station_list WHERE station_list.id = ?
                                    ) as name_station
                                    FROM housefarm
                                    WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                ) as houseFarm
                            WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
                        ) as formPlant
                        WHERE success_detail.id_plant = formPlant.id
                        ` :
                            `SELECT 
                                ${Type === "report_detail" ? `${Type}.date_report , ${Type}.report_text , ${Type}.image_path,${Type}.id,${Type}.is_read` : `${Type}.*`} , 
                                IF(${Type}.id_admin != 0 AND ${Type}.id_admin IS NOT NULL, admin.fullname_admin, acc_doctor.fullname_doctor) AS name_doctor,
                                acc_doctor.doctor_role,
                                acc_doctor.consultant_role
                            FROM ${Type}
                            LEFT JOIN acc_doctor ON acc_doctor.id_table_doctor = ${Type}.id_table_doctor
                            LEFT JOIN admin ON admin.id = ${Type}.id_admin
                            LEFT JOIN (
                                SELECT formplant.id , houseFarm.name_station
                                FROM formplant , 
                                    (
                                        SELECT id_farm_house , (
                                            SELECT name FROM station_list WHERE station_list.id = ?
                                        ) as name_station
                                        FROM housefarm
                                        WHERE (housefarm.uid_line = ? || housefarm.link_user = ?) and housefarm.id_farm_house = ?
                                    ) as houseFarm
                                WHERE formplant.id_farm_house = houseFarm.id_farm_house && formplant.id = ?
                            ) as formPlant ON ${Type}.id_plant = formPlant.id
                             WHERE ${Type}.id_plant = formPlant.id
                        ` , [auth.data.station, auth.data.uid_line, auth.data.link_user, req.query.id_farmhouse, req.query.id_plant],
                        (err, list) => {
                            con.end()
                            if (!err) res.send(list)
                            else res.send("error auth")
                        }
                    )
                } else {
                    con.end()
                    res.send("error auth")
                }

            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }

        } else res.send("error auth")
    })


    //start source 
    app.post('/api/farmer/source/get', async (req, res) => {
        if (req.session.uidFarmer) {
            let con = Database.createConnection(listDB)

            try {
                const auth = await authCheck(con, req)
                con.query(`SELECT id , name FROM source_list WHERE is_use = 1`, (err, result) => {
                    con.end()
                    if (!err) res.send(result)
                    else res.send("error auth")
                })
            } catch (err) {
                con.end()
                if (err === "no" || err === "no account") res.send("close")
                else res.send("error auth")
            }

        } else res.send("error auth")
    })

    const sendNotifyToDoctor = async (id_table, stationSend, msg) => {
        let con = Database.createConnection(listDB)
        con.connect(async (err) => {
            if (!err) {
                const Uid_line_send = await new Promise(async (resole, reject) => {
                    const uid_send = new Array
                    await new Promise(async (resole, reject) => {
                        const ObjectProfile = await new Promise((resole, reject) => {
                            con.query(
                                `
                                SELECT uid_line_doctor
                                FROM acc_doctor
                                WHERE station_doctor = ? and status_account = 1 and status_delete = 0  and doctor_role = 1
                                ` , [stationSend],
                                (err, doctor) => {
                                    resole(doctor)
                                }
                            )
                        })
                        if (ObjectProfile.length > 0) {
                            const List_uid = ObjectProfile.map((val) => val.uid_line_doctor).filter((val) => val)
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
                    ` , [id_table, '{}', msg, stationSend],
                    (err, result) => {
                        con.end()
                    }
                )

                socket.to(`notify-${stationSend}`).emit("update")
                if (Uid_line_send.size != 0) {
                    RoyalGapLine.multicast([...Uid_line_send], { type: "text", text: `${msg}` })
                        .catch(e => {
                            console.log(e)
                        })
                }
            }
        })
    }

    // app.get('/api/farmer/farmhouse/get/all', async (req, res) => {
    //     if (req.session.uidFarmer) {
    //         let con = Database.createConnection(listDB);
    //         try {
    //             const auth = await authCheck(con, req); // ตรวจสอบสิทธิ์
    //             con.query(
    //                 `
    //                 SELECT id_farm_house, name_house, img_house, 
    //                 ST_X(location) as x, ST_Y(location) as y
    //                 FROM housefarm
    //                 WHERE uid_line = ? OR link_user = ?
    //                 `,
    //                 [auth.data.uid_line, auth.data.link_user],
    //                 (err, result) => {
    //                     con.end();
    //                     if (!err) {
    //                         result.forEach(house => {
    //                             house.img_house = house.img_house ? house.img_house.toString() : null; // แปลงรูปภาพเป็น String
    //                         });
    //                         res.json(result); // ส่งข้อมูลโรงเรือนทั้งหมดกลับไป
    //                     } else {
    //                         res.status(500).send("error auth");
    //                     }
    //                 }
    //             );
    //         } catch (err) {
    //             con.end();
    //             if (err === "no" || err === "no account") res.send("close");
    //             else res.status(500).send("error auth");
    //         }
    //     } else {
    //         res.status(401).send("error auth");
    //     }
    // });

    // gapv3
    // app.post("/api/farmer/ecph/save", async (req, res) => {
    //     if (!req.session.uidFarmer) return res.send("error auth");

    //     const con = Database.createConnection(listDB);
    //     try {
    //         const auth = await authCheck(con, req);
    //         const { id_formplant, ec_value, ph_value } = req.body;

    //         if (!ec_value || !ph_value) {
    //             con.end();
    //             return res.send("missing");
    //         }

    //         const uid = auth.data.uid_line;
    //         // con.query(
    //         // `SELECT id FROM formplant WHERE uid_line = ? LIMIT 1`,
    //         // [uid],
    //         // (err, rows) => {
    //         //     if (err || !rows.length) {
    //         //     con.end();
    //         //     return res.send("farmer not found");
    //         //     }

    //         //     const id_formplant = rows[0].id_formplant;
    //         con.query(
    //             `INSERT INTO ecph (id_formplant, ec_value, ph_value) VALUES (?, ?, ?)`,
    //             [id_formplant, ec_value, ph_value],
    //             (err2) => {
    //                 con.end();
    //                 if (err2) return res.send("insert error");
    //                 res.send({ success: true });
    //             }
    //         );
    //         // }
    //         // );
    //     } catch (err) {
    //         con.end();
    //         return res.send("error auth");
    //     }
    // });

    // app.post("/api/farmer/ecph/history", async (req, res) => {
    //     console.log("✅ เข้ามาที่ /api/farmer/ecph/history แล้ว");
    //     if (!req.session.uidFarmer) return res.send("error auth");

    //     const con = Database.createConnection(listDB);
    //     try {
    //         const auth = await authCheck(con, req);
    //         const uid = auth.data.uid_line;
    //         const { id_formplant } = req.body;

    //         con.query(
    //             `SELECT id, timestamp, ec_value, ph_value FROM ecph WHERE id_formplant = ? ORDER BY timestamp DESC LIMIT 10`,
    //             [id_formplant],
    //             (err2, result) => {
    //                 con.end();
    //                 if (err2) return res.send([]);
    //                 res.send(result);
    //             }
    //         );
    //     } catch (err) {
    //         console.log(err)
    //         con.end();
    //         return res.send("error auth");
    //     }
    // });

    // app.post("/api/farmer/ecph/update", async (req, res) => {
    //     if (!req.session.uidFarmer) return res.send("error auth");

    //     const con = Database.createConnection(listDB);
    //     try {
    //         const auth = await authCheck(con, req);
    //         const { id, ec_value, ph_value } = req.body;

    //         if (!id || !ec_value || !ph_value) {
    //             con.end();
    //             return res.send("missing");
    //         }

    //         con.query(
    //             `UPDATE ecph SET ec_value = ?, ph_value = ? WHERE id = ?`,
    //             [ec_value, ph_value, id],
    //             (err2, result) => {
    //                 con.end();
    //                 if (err2) {
    //                     console.error("❌ UPDATE ERROR:", err2);
    //                     return res.send("update error");
    //                 }

    //                 if (result.affectedRows === 0) {
    //                     return res.send({ success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
    //                 }

    //                 res.send({ success: true });
    //             }
    //         );
    //     } catch (err) {
    //         console.error("❌ AUTH ERROR:", err);
    //         con.end();
    //         return res.send("error auth");
    //     }
    // });

    // app.post("/api/farmer/ecph/delete", async (req, res) => {
    //     if (!req.session.uidFarmer) return res.send("error auth");

    //     const con = Database.createConnection(listDB);
    //     try {
    //         const auth = await authCheck(con, req);
    //         const { id } = req.body;

    //         if (!id) {
    //             con.end();
    //             return res.send("missing");
    //         }

    //         con.query(`DELETE FROM ecph WHERE id = ?`, [id], (err, result) => {
    //             con.end();
    //             if (err) {
    //                 console.error("❌ DELETE ERROR:", err);
    //                 return res.send("delete error");
    //             }

    //             if (result.affectedRows === 0) {
    //                 return res.send({ success: false, message: "ไม่พบแถวที่จะลบ" });
    //             }

    //             return res.send({ success: true });
    //         });
    //     } catch (err) {
    //         console.error("❌ AUTH ERROR:", err);
    //         con.end();
    //         return res.send("error auth");
    //     }
    // });

    app.get("/api/farmer/profile", async (req, res) => {
        const { session: { uidFarmer } } = req

        const authen = new AuthorizeUser(pool)
        try {
            const { profile } = await authen.farmer(uidFarmer, {
                select: "acc_farmer.fullname , station_list.id_station , station_list.name"
            })

            res.json({
                profile
            })
        } catch (err) {
            res.status(404).json({
                message: "Not found user"
            })
        }
    })
}

const authCheck = (con, req) => {
    return new Promise(async (resole, reject) => {
        const userLine = await new Promise(async (resole, reject) => {
            try {
                await RoyalGapLine.getLinkToken(req.session.uidFarmer)
                resole(true)
            } catch (e) {
                resole(false)
            }
        })

        if (userLine) {
            con.connect((err) => {
                if (!err) {
                    con.query(`
                            SELECT * FROM acc_farmer 
                            WHERE uid_line = ?
                            ORDER BY register_auth DESC , date_register DESC
                                ` ,
                        [req.session.uidFarmer],
                        (err, result) => {
                            if (!err) {
                                if (result.length != 0) {
                                    const ProfilePass = result.filter(profile => profile.register_auth == 0 || profile.register_auth == 1)
                                    if (ProfilePass.length != 0) {
                                        if (req.body['page'] === "signup") {
                                            RoyalGapLine.changeRichMenu(req.session.uidFarmer, RichHouse)
                                        }
                                        resole({
                                            result: "search",
                                            data: ProfilePass[0]
                                        })
                                    } else {
                                        RoyalGapLine.changeRichMenu(req.session.uidFarmer, RichSign)
                                        reject("no")
                                    }
                                }
                                else {
                                    RoyalGapLine.changeRichMenu(req.session.uidFarmer, RichSign)
                                    try {
                                        RoyalGapLine.unlinkRichMenuFromUser(req.session.uidFarmer)
                                        RoyalGapLine.linkRichMenuToUser(req.session.uidFarmer, RichSign)
                                    } catch (e) { }
                                    reject("no account")
                                }
                            } else reject("no")
                        })
                } else reject("no")
            })
        } else reject("no")
    })
}

// const auth = (uid , con , dbpacket , res) => {
//     return new Promise((resole , reject)=>
//         con.query(`SELECT * FROM acc_farmer WHERE uid_line = ? and (register_auth = 0 or register_auth = 1)` ,
//             [uid] , (err, result )=>{
//                 if (err) {
//                     dbpacket.dbErrorReturn(con, err, res);
//                     console.log("select account");
//                     return 0;
//                 }

//                 if(result[0]) resole(result[0])
//                 else reject("not found")
//             })
//     )
// }