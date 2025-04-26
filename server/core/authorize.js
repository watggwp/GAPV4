'use strict';

const Pool = require("../connectPool")
const Util = require("./util")

class AuthorizeUser {
    constructor(pool = new Pool()) {
        this.Pool = pool
    }

    async doctor(username , password , role) {
        try {
            const [ profile ] = await this.Pool.executeQuery(
                `
                SELECT * , uid_line_doctor as uid_line
                FROM acc_doctor
                WHERE BINARY id_doctor = ? AND password_doctor = SHA2( ? , 256)
                ${
                    role == "doctor" ? 
                        "AND doctor_role = 1" : 
                    role == "analyst" ? 
                        "AND analyst_role = 1" : 
                    role == "consultant" ? 
                        "AND consultant_role = 1" : 
                        ""
                } 
                ORDER BY status_delete ASC
                LIMIT 1
                `,
                [ username , password ]
            )

            return {
                profile : profile,
                verified : Boolean(profile)
            }
        } catch(err) {
            return {
                profile : {},
                verified : false
            }
        }
    }

    async farmer(uid_line) {
        try {
            const [ profile ] = await this.Pool.executeQuery(
                `
                SELECT * 
                FROM acc_farmer 
                WHERE uid_line = ? AND (register_auth = 0 OR register_auth = 1)
                ORDER BY register_auth DESC , date_register DESC
                LIMIT 1
                `,
                [ uid_line ]
            )

            return {
                profile : profile,
                verified : Boolean(profile)
            }
        } catch(err) {
            return {
                profile : {},
                verified : false
            }
        }
    }

    async deviceSystem(
        profileAuth = { uid_line : "" , username : "" , password : "" , role : "" },
        roleAccount,
        deviceType ,
        deviceID
    ) {
        const { uid_line , username , password , role } = profileAuth
        const { table , locationTable } = Util.getDeviceData(deviceType)
        
        switch(roleAccount) {
            case "doctor" : {
                const { profile , verified } = await this.doctor(username , password , role)

                if(!verified) return {
                    result : false,
                    reason : "auth"
                }

                return {
                    result : true,
                }
            }
            case "farmer" : {
                const { verified } = await this.farmer(uid_line)

                if(!verified) return {
                    result : false,
                    reason : "auth"
                }
                
                try {
                    const authorizeGreenhouse = await this.Pool.executeQuery(`
                        SELECT gh.id_farm_house
                        FROM housefarm gh
                        LEFT JOIN ${table} sgh ON sgh.${locationTable} = gh.id_farm_house
                        WHERE sgh.device_id = ? AND gh.uid_line = ?
                        LIMIT 1
                    ` , [ deviceID , uid_line ])

                    if(!authorizeGreenhouse.length) return {
                        result : false,
                        reason : "owner"
                    }
                        
                    return {
                        result : true,
                    }

                } catch (err) {
                    return {
                        result : false,
                        reason : "owner"
                    }
                }
            }
            default :
                return {
                    result : false,
                    reason : "system"
                }
        }
    }
}

module.exports = AuthorizeUser;