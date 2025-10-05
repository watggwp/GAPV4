require('dotenv').config().parsed
const fs = require('fs')

const {Server} = require('socket.io')
const io = new Server()
const Report = require("./reportToAdmin")
const RoyalGapEnv = require('./core/env')
const RoyalGapLine = require('./configLine')
const ConnectionPool = require('./connectPool')

module.exports = function Messaging(app , Database , PoolMysql = new ConnectionPool() , apifunc , dbpacket , listDB , UrlApi , socket = io) {

    app.post('/messageAPI' , async (req , res)=>{
        const { body : { events } = {} } = req
        if(events?.length > 0) {
            const [ { type , postback , message , source : { userId : uid_line_message } = {} , replyToken } ] = events
            if(type === "postback") {
                const { data } = postback
                let msg
                
                const [ type , id_greenhouse ] = data.split(":")
                switch(type) {
                    case "house_add" :
                        try {
                            const result = await PoolMysql.executeQuery(
                                `
                                    SELECT 
                                        housefarm.id_farm_house , name_house , air_temperature , air_humidity , 
                                        CONCAT('[', GROUP_CONCAT(gf.id), ']') AS formgap_ids
                                    FROM housefarm
                                    JOIN (
                                        SELECT uid_line , link_user 
                                        FROM acc_farmer 
                                        WHERE uid_line = ? and (register_auth = 0 or register_auth = 1)
                                        ORDER BY date_register DESC
                                        LIMIT 1
                                    ) farmer ON housefarm.uid_line = farmer.uid_line OR housefarm.link_user = farmer.link_user
                                    LEFT JOIN (
                                        SELECT formplant.id , formplant.id_farm_house
                                        FROM formplant
                                        WHERE state_status IN (0 , 1)
                                    ) gf ON gf.id_farm_house = housefarm.id_farm_house
                                    LEFT JOIN (
                                        SELECT t.air_temperature , t.air_humidity , t.greenhouse_id
                                        FROM (
                                            SELECT air_temperature , air_humidity , greenhouse_id ,
                                                ROW_NUMBER() OVER (PARTITION BY greenhouse_id ORDER BY timestamp DESC) AS rn
                                            FROM sensor_weather_greenhouse swg
                                            LEFT JOIN weather_greenhouse wgh ON wgh.device_id = swg.device_id
                                        ) t
                                        WHERE t.rn = 1
                                    ) as swgh ON swgh.greenhouse_id = housefarm.id_farm_house
                                    WHERE housefarm.status = '1'
                                    GROUP BY housefarm.id_farm_house , name_house , air_temperature , air_humidity
                                    ORDER BY housefarm.id_farm_house DESC
                                `,
                                [ uid_line_message ]
                            )

                            if(result.length) {
                                msg = {
                                    "type": "flex",
                                    "altText": "เลือกโรงเรือน",
                                    "contents": {
                                        "type": "carousel",
                                        "contents": Array.isArray(result) ? result.map(({ id_farm_house , name_house , air_temperature , air_humidity , formgap_ids }) =>{
                                            const key = new Date().getTime()
                                            const name = name_house.toString()
                                            const formgap_ids_array = JSON.parse(formgap_ids)

                                            const prefixGreenhouseURL = `${RoyalGapEnv.url_line.get_greenhouse}/${id_farm_house}`
                                            const prefixFormGapURL = `${prefixGreenhouseURL}/${formgap_ids_array[0]}`

                                            const lineLiff = `${prefixGreenhouseURL}?date=${key}`
                                            
                                            return {
                                                "type": "bubble",
                                                "hero": {
                                                    "type": "image",
                                                    "url": `${UrlApi}/image/house?imagefarm=${id_farm_house}&date=${key}`,
                                                    "size": "full",
                                                    "aspectRatio": "20:20",
                                                    "aspectMode": "cover",
                                                    "action" : {
                                                        type : "uri",
                                                        label : "image",
                                                        uri : lineLiff
                                                    }
                                                },
                                                "body": {
                                                    "type": "box",
                                                    "layout": "vertical",
                                                    "action" : {
                                                        type : "uri",
                                                        label : "image",
                                                        uri : lineLiff
                                                    },
                                                    "spacing": "8px",
                                                    "contents": [
                                                        {
                                                            "type": "text",
                                                            "text": `${name.length > 12 ? `${name.slice(0 , 9)}..` : name}`,
                                                            "weight": "bold",
                                                            "size": "xl",
                                                            "align": "center"
                                                        },
                                                        {
                                                            "type": "box",
                                                            "layout": "horizontal",
                                                            "spacing": "md",
                                                            "margin": "md",
                                                            "contents": (air_temperature !== null || air_humidity !== null) ? [
                                                                {
                                                                    "type": "text",
                                                                    "text": air_temperature ? `อุณหภูมิ ${air_temperature}°C` : "ไม่พบค่าอุณหภูมิ",
                                                                    "size": "sm",
                                                                    "color": "#888888",
                                                                    "flex": 1,
                                                                    "align": "center"
                                                                },
                                                                {
                                                                    "type": "text",
                                                                    "text": air_humidity ? `ความชื้น ${air_humidity}%` : "ไม่พบค่าความชื้น",
                                                                    "size": "sm",
                                                                    "color": "#888888",
                                                                    "flex": 1,
                                                                    "align": "center"
                                                                }
                                                            ] : [
                                                                {
                                                                    "type": "text",
                                                                    "text": `ไม่พบเครื่องวัดสภาพอากาศ`,
                                                                    "size": "sm",
                                                                    "color": "#888888",
                                                                    "flex": 1,
                                                                    "align": "center"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "type": "box",
                                                            "layout": "vertical",
                                                            "contents": [
                                                                {
                                                                    "type": "button",
                                                                    "action": {
                                                                        "type": formgap_ids_array.length !== 1 ? "postback" : "uri",
                                                                        "label": "บันทึกปัจจัยการผลิต",
                                                                        "data": formgap_ids_array.length !== 1 ? `house_form_fertilizer:${id_farm_house}` : undefined,
                                                                        "uri": formgap_ids_array.length === 1 ? `${prefixFormGapURL}/z?open-insert=true` : undefined
                                                                    },
                                                                    "style": "primary",
                                                                    "color": "#379b7a"
                                                                },
                                                                {
                                                                    "type": "button",
                                                                    "action": {
                                                                        "type": formgap_ids_array.length !== 1 ? "postback" : "uri",
                                                                        "label": "บันทึกสารเคมี",
                                                                        "data": formgap_ids_array.length !== 1 ? `house_form_chemical:${id_farm_house}` : undefined,
                                                                        "uri": formgap_ids_array.length === 1 ? `${prefixFormGapURL}/c?open-insert=true` : undefined
                                                                    },
                                                                    "style": "primary",
                                                                    "color": "#379b7a"
                                                                }
                                                            ],
                                                            "spacing": "8px"
                                                        }
                                                    ]
                                                }
                                            }
                                        }) : []
                                    }
                                }
                            }
                            else {
                                msg = {
                                    type : "text",
                                    text : "โปรดเพิ่มโรงเรือนก่อนนะครับ"
                                }
                            }

                        } catch (e) {
                            Report(e.toString())
                        }
                        break;
                    case "house_form_fertilizer" :
                        msg = await generateMessageFormGapExtension(
                            PoolMysql,
                            id_greenhouse,
                            "z"
                        )
                        break;
                    case "house_form_chemical" :
                        msg = await generateMessageFormGapExtension(
                            PoolMysql,
                            id_greenhouse,
                            "c"
                        )
                        break;
                    default:
                        msg = {
                            type : "text",
                            text : "พบปัญหาในการค้นหาข้อมูล\nรอสักครู่นะคะ \u2764"
                        }
                }

                try {
                    await RoyalGapLine.replyMessage(replyToken , msg)
                } catch(err) {}
                return res.status(200).send('OK')
            } else if (type === "message") {
                if(message.type == "text" || message.type == "image") {
                    const con = await ConnectDB()
                    const SelectProfile = await new Promise((resole , reject)=>{
                        con.query(
                            `
                            SELECT station , register_auth
                            FROM acc_farmer
                            WHERE uid_line = ?
                            ` , [ uid_line_message ] , (err , resultCheck)=>{
                                console.log(err)
                                resole(resultCheck)
                            }
                        )
                    })

                    let msg = {}
                    if(SelectProfile?.length) {
                        const stationAll = new Set(SelectProfile.map((val)=>val.station))

                        try {

                            //check time msg
                            const TimeMessage = await new Promise((resole , reject)=>{
                                con.query(
                                    `
                                    SELECT (
                                        SELECT EXISTS (
                                            SELECT date
                                            FROM message_user
                                            WHERE uid_line_farmer = ? 
                                                    and TIMESTAMPDIFF(MINUTE, date, NOW()) < 5
                                        )
                                    ) as is_msg
                                    ` , [ uid_line_message ] , (err , is_msg)=>{
                                        resole(parseInt(is_msg[0].is_msg))
                                    }
                                )
                            })

                            // insert msg
                            await new Promise((resole , reject)=>{
                                const messagePut = (
                                    message.type == "text" ? message.text :
                                    message.type == "location" ? `{ lat : ${message.latitude} , lng : ${message.longitude}}` :
                                    message.id
                                )

                                con.query(
                                    `
                                    INSERT INTO message_user
                                    ( message , uid_line_farmer , id_read , type , type_message ) VALUES ( ? , ? , '{}' , "" , ?)
                                    ` , [ messagePut , uid_line_message , message.type] , (err , result) => {
                                        if(err) reject("err insert send")
                                        resole()
                                    }
                                )
                            })

                            try {
                                socket.to(uid_line_message).emit("new_msg")
                                if(!TimeMessage) {
                                    const checkAuth = SelectProfile.map(val=>val.register_auth.toString())
                                    const typeMessange = checkAuth.indexOf("1") >= 0 ? "บัญชีเกษตรกรที่ผ่านการตรวจสอบ" : 
                                                    checkAuth.indexOf("0") >= 0 ? "บัญชีเกษตรกรที่รอการตรวจสอบ" :
                                                    checkAuth.indexOf("2") >= 0 ? "บัญชีเกษตรกรที่ถูกปิด" : "";
                                    
                                    //send to doctor
                                    const uid_line_message_send = await new Promise( async (resole , reject)=>{
                                        const uid_send = new Array
                                        await new Promise( async (resole , reject)=>{
                                            let index = 1;
                                            for (let val of stationAll) {
                                                const ObjectProfile = await new Promise((resole , reject)=>{
                                                    con.query(
                                                        `
                                                        SELECT uid_line_doctor
                                                        FROM acc_doctor
                                                        WHERE station_doctor = ? and status_account = 1 and status_delete = 0
                                                        ` , [val] , 
                                                        (err , doctor) => {
                                                            resole(doctor)
                                                        }
                                                    )
                                                })
                                                if(ObjectProfile.length > 0) {
                                                    const List_uid = ObjectProfile.map((val)=>val.uid_line_doctor).filter((val)=>val)
                                                    uid_send.push(...List_uid)
                                                }

                                                if(stationAll.size == index) resole()
                                                index++
                                            }
                                        })
                                        resole(new Set(uid_send))
                                    })

                                    con.end()
                                    RoyalGapLine.multicast([...uid_line_message_send] , {type : "text" , text : "มีข้อความจาก"+typeMessange})
                                        .catch(e=>{
                                            RoyalGapLine.replyMessage(replyToken , {
                                                type : "text",
                                                text : "พบปัญหาในการส่งข้อความ กรุณารอสักครู่และส่งข้อความใหม่อีกครั้ง \u2764"
                                            })
                                        })
                                } else con.end()
                            } catch(e) {}

                            // msg = {
                            //     type : "text",
                            //     text : "รับเรื่องแล้ว กรุณารอการตอบกลับจากเจ้าหน้าที่นะคะ \u2764"
                            // }
                        } catch(e) {
                            console.log(e)
                            msg = {
                                type : "text",
                                text : "พบปัญหาในการส่งข้อความ กรุณารอสักครู่และส่งข้อความใหม่อีกครั้ง \u2764"
                            }
                        }
                        
                    } else {
                        msg = {
                            type : "text",
                            text : "กรุณาสมัครบัญชีก่อนนะคะ \u2764"
                        }

                        con.end()
                    }

                    if(msg.type) RoyalGapLine.replyMessage(replyToken , msg)
                } else {
                    RoyalGapLine.replyMessage(replyToken , {text : "กรุณาส่งเป็นข้อความหรือรูปภาพนะคะ" , type : "text"})
                }
            } 
        } else {
            return res.status(200).send('OK')
        }
        
    })

    app.get("/image/house" , (req , res)=>{
        if(req.query.imagefarm) {
            let con = Database.createConnection(listDB)
            con.connect(( err )=>{
                if (err) {
                    dbpacket.dbErrorReturn(con, err, res);
                    console.log("connect");
                    return 0;
                }

                con.query(`SELECT img_house FROM housefarm WHERE id_farm_house = ?` , 
                    [req.query.imagefarm] ,
                    (err , result)=>{
                        if (err) {
                            dbpacket.dbErrorReturn(con, err, res);
                            console.log("query");
                            return 0
                        }
                        con.end()
                        if(result[0]) {
                            const base64Image = result[0]["img_house"].toString(); //Buffer to string
                            const base64Data = base64Image.replace(`data:image/jpeg;base64,`, '');

                            // // แปลง Base64 เป็น Buffer
                            const imageBuffer = Buffer.from(base64Data, 'base64');
                    
                            // // // ตั้งค่า Header 'Content-Type'
                            res.setHeader('Content-Type', 'image/png');
                            res.setHeader('Transfer-Encoding' , 'chunked')
                    
                            // ส่งกลับรูปภาพให้กับผู้ใช้
                            res.end(imageBuffer);
                        }
                        else res.send("not found")
                })
            })
        } else {
            res.send("not found")
        }
        
    })

    const ConnectDB = async () => {
        return await new Promise((resole , reject)=>{
            const connect = Database.createConnection(listDB)
            connect.connect(( err )=>{
                if (err) {
                    dbpacket.dbErrorReturn(con, err, res);
                    console.log("connect");
                    return 0;
                }
                resole(connect)
            })
        })
    } 
}

const mappingType = {
    "z" : "คลิกเพื่อบันทึกปัจจัยการผลิต",
    "c" : "คลิกเพื่อบันทึกสารเคมี"
}

async function generateMessageFormGapExtension(PoolMysql , id_greenhouse  , type) {
    const formplants = await PoolMysql.executeQuery(
        `
            SELECT id , name_plant , generation
            FROM formplant
            WHERE state_status IN (0 , 1) AND id_farm_house = ?
        `,
        [ id_greenhouse ]
    )

    const prefixGreenhouseURL = `${RoyalGapEnv.url_line.get_greenhouse}/${id_greenhouse}`

    return {
        "type": "flex",
        "altText": "เลือกชนิดพืช",
        "contents": {
            "type": "carousel",
            "contents": Array.isArray(formplants) ? 
                formplants.map(({ id , name_plant , generation }) => ({
                    "type": "bubble",
                    "header": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": `${name_plant} รุ่น ${generation}`,
                                "align": "center",
                                "size": "24px"
                            }
                        ]
                    },
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": mappingType[type],
                                    "uri": `${prefixGreenhouseURL}/${id}/${type}?open-insert=true`
                                },
                                "style": "primary",
                                "color": "#379b7a"
                            }
                        ]
                    }
                })) : []
            }
    }
}

// {
//     type : "bubble" ,
//     size : "nano" ,
//     direction : "ltr" ,
//     header : {
//         type : "box" ,
//         layout : "vertical",
//         action : {
//             type : "uri",
//             label : `${result[key]["id_farm_house"]}` ,
//             uri : `https://liff.line.me/1661049098-A9PON7LB?farm=${result[key]["id_farm_house"]}`
//         },
//         backgroundColor : "#FFFFFFFF",
//         contents : [
//             {
//                 type : "text",
//                 text : `${result[key]["name_house"]}`,
//                 size : "md",
//                 align : "center",
//                 gravity : "center",
//                 margin : "none"
//             }
//         ]
//     },
//     hero : {
//         type : "image" ,
//         url : `https://ffb4-49-237-13-45.ngrok-free.app/imageHouse?imagefarm=${result[key]["id_farm_house"]}`,
//         align : "center" ,
//         gravity : "center" ,
//         size : "full",
//         aspectRatio : "1.51:1",
//         aspectMode : "fit",
//         backgroundColor : "#FFFFFFFF",
//         action : {
//             type : "uri",
//             label : `${result[key]["id_farm_house"]}` ,
//             uri : `https://liff.line.me/1661049098-A9PON7LB?farm=${result[key]["id_farm_house"]}`
//         },
//     },
//     body : {
//         type : "box" ,
//         layout : "vertical",
//         action : {
//             type : "uri",
//             label : `${result[key]["id_farm_house"]}` ,
//             uri : `https://liff.line.me/1661049098-A9PON7LB?farm=${result[key]["id_farm_house"]}`
//         },
//         contents : [
//             {
//                 type : "text" ,
//                 text : "รายละเอียด",
//                 align : "center",
//                 size : "sm"
//             }
//         ]
//     },
// }