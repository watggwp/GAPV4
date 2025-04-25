'use strict';

const Pool = require("../connectPool")

class AuthorizeUser {
    constructor(pool = new Pool()) {
        this.Pool = pool
    }

    async doctor(username , password , role) {
        try {
            const [ profile ] = await this.Pool.executeQuery(
                `
                SELECT * 
                FROM acc_doctor
                WHERE BINARY id_doctor = ? AND password_doctor = SHA2( ? , 256)
                LIMIT 1
                ${
                    role=="doctor" ? 
                        "AND doctor_role = 1" : 
                    role=="analyst" ? 
                        "AND analyst_role = 1" : 
                    role=="consultant" ? 
                        "AND consultant_role = 1" : 
                        ""
                } 
                ORDER BY status_delete ASC
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
}

module.exports = AuthorizeUser;