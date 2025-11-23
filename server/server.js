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
                        connection.end()

                        resolve(true)
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