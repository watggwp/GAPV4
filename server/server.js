const db  = require('mysql')
const appRun = require("./appRun")
require('dotenv').config().parsed

function connectionParams() {
    const mode = process.argv[2]
    switch(mode) {
        case process.env.BUILD :
            return {
                database : process.env.DATABASE_SER,
                username : process.env.USER_DB || "",
                password : process.env.PASS_DB || ""
            }
        default:
            return {
                database : process.env.DATABASE_DEV,
                username : process.env.USER_DBDEV || "",
                password : process.env.PASSWORD_DBDEV || ""
            }
    }
}

const { database , username , password } = connectionParams()
const errors = {
    "ECONNREFUSED" : "Database connection not found",
    "ER_ACCESS_DENIED_ERROR" : 'Access denied connect Database',
}

async function serverInitial() {
    while(true) {
        const result = await new Promise((resolve) => {
            setTimeout(() => {
                const datetime = new Date()
                const connection = db.createConnection({
                    host: process.env.HOST_DB_CONTAINER || process.env.HOST_DB,
                    user: username,
                    password : password,
                    database : database
                })
                
                connection.connect((err)=>{
                    if (err) {
                        errors[err.code] && console.error(errors[err.code])
                        console.error(`Connection database fail ${datetime.toISOString()} !!!`)

                        resolve(false)
                    } else {
                        console.log("Database connection success !!!");
                        
                        // Seed doctor 666 if it doesn't exist
                        const checkQuery = "SELECT 1 FROM acc_doctor WHERE id_doctor = '666'";
                        connection.query(checkQuery, (err, rows) => {
                            if (!err && rows && rows.length === 0) {
                                const insertQuery = `
                                    INSERT INTO acc_doctor (
                                        id_table_doctor,
                                        id_doctor,
                                        password_doctor,
                                        fullname_doctor,
                                        station_doctor,
                                        img_doctor,
                                        status_account,
                                        status_delete,
                                        doctor_role,
                                        analyst_role,
                                        consultant_role,
                                        protection_role
                                    ) VALUES (
                                        666,
                                        '666',
                                        SHA2('666', 256),
                                        'Admin (Doctor Mode)',
                                        '1',
                                        '',
                                        1,
                                        0,
                                        1,
                                        1,
                                        1,
                                        1
                                    )
                                `;
                                connection.query(insertQuery, (insertErr) => {
                                    if (insertErr) {
                                        console.error("Failed to seed doctor 666:", insertErr);
                                    } else {
                                        console.log("Successfully seeded doctor 666 into acc_doctor!");
                                    }
                                    connection.end();
                                    resolve(true);
                                });
                            } else {
                                connection.end();
                                resolve(true);
                            }
                        });
                    };
                })
            }, 10000);
        })

        if(result) break;
    }

    try {
        appRun(username , password)
    } catch (err) {
        console.error(err)
    }
}

serverInitial()