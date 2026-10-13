'use strict';

const Pool = require("../connectPool")
const Util = require("./util")
const AccountAuth = require("./accountAuth")

class AuthorizeUser {
    constructor(pool = new Pool()) {
        this.Pool = pool
    }

    async admin(username, password, options = { select: "*" }) {
        const { select } = options
        try {
            const rows = await this.Pool.executeQuery(
                `
                SELECT *
                FROM admin
                WHERE BINARY username = ?
                `,
                [username]
            )
            const account = await AccountAuth.verifyAccount("admin", rows, password, (sql, params) => this.Pool.executeQuery(sql, params))
            const profile = account ? await this.selectColumns("admin", "id", account.id, select) : undefined

            return {
                profile: profile,
                verified: Boolean(profile)
            }
        } catch (err) {
            return {
                profile: {},
                verified: false
            }
        }
    }

    async doctor(username, password, role, options = { select: "*" }) {
        const { select } = options
        try {
            const rows = await this.Pool.executeQuery(
                `
                SELECT *
                FROM acc_doctor
                WHERE BINARY id_doctor = ?
                ${role == "doctor" ?
                    "AND doctor_role = 1" :
                    role == "analyst" ?
                        "AND analyst_role = 1" :
                        role == "consultant" ?
                            "AND consultant_role = 1" :
                            role == "protection" ?
                                "AND protection_role = 1" :
                                ""
                } 
                ORDER BY status_delete ASC
                `,
                [username]
            )
            const account = await AccountAuth.verifyAccount("acc_doctor", rows, password, (sql, params) => this.Pool.executeQuery(sql, params))
            const profile = account ? await this.selectColumns(
                "acc_doctor", "id_table_doctor", account.id_table_doctor,
                `${select} , id_table_doctor as id , uid_line_doctor as uid_line`
            ) : undefined

            return {
                profile: profile,
                verified: Boolean(profile)
            }
        } catch (err) {
            return {
                profile: {},
                verified: false
            }
        }
    }

    // ดึงคอลัมน์ตาม select ของเดิมหลังตรวจรหัสผ่านผ่านแล้ว
    async selectColumns(table, idColumn, id, select) {
        const [profile] = await this.Pool.executeQuery(
            `SELECT ${select} FROM ${table} WHERE ${idColumn} = ? LIMIT 1`,
            [id]
        )
        return profile
    }

    async farmer(uid_line, options = { select: "*" }) {
        const { select } = options
        try {
            const [profile] = await this.Pool.executeQuery(
                `
                SELECT ${select} , id_table as id
                FROM acc_farmer
                LEFT JOIN station_list ON station_list.id = acc_farmer.station
                WHERE uid_line = ? AND (register_auth = 0 OR register_auth = 1)
                ORDER BY register_auth DESC , date_register DESC
                LIMIT 1
                `,
                [uid_line]
            )

            return {
                profile: profile,
                verified: Boolean(profile)
            }
        } catch (err) {
            return {
                profile: {},
                verified: false
            }
        }
    }

    async deviceSystem(
        profileAuth = { uid_line: "", username: "", password: "", role: "", adminUsername: "", adminPassword: "" },
        roleAccount,
        deviceType,
        deviceID
    ) {
        const { uid_line, username, password, role, adminUsername, adminPassword } = profileAuth
        const { table, locationTable } = Util.getDeviceData(deviceType)

        switch (roleAccount) {
            case "doctor": {
                // หน้าโรงเรือนของ admin ใช้คอมโพเนนต์เดียวกับหมอ (r=doctor) จึงรับ session admin ด้วย
                if (!(username && password) && adminUsername && adminPassword) {
                    const { profile, verified } = await this.admin(adminUsername, adminPassword)
                    if (!verified) return { result: false, reason: "auth", profile: {} }
                    return { result: true, profile: profile, accountType: "admin" }
                }

                const { profile, verified } = await this.doctor(username, password, role)

                if (!verified) return {
                    result: false,
                    reason: "auth",
                    profile: {}
                }

                return {
                    result: true,
                    profile: profile,
                    accountType: "doctor"
                }
            }
            case "farmer": {
                const { profile, verified } = await this.farmer(uid_line)

                if (!verified) return {
                    result: false,
                    reason: "auth",
                    profile: {}
                }

                try {
                    const authorizeGreenhouse = await this.Pool.executeQuery(`
                        SELECT gh.id_farm_house
                        FROM housefarm gh
                        LEFT JOIN ${table} sgh ON sgh.${locationTable} = gh.id_farm_house
                        WHERE sgh.device_id = ? AND gh.uid_line = ?
                        LIMIT 1
                    ` , [deviceID, uid_line])

                    if (!authorizeGreenhouse.length) return {
                        result: false,
                        reason: "owner",
                        profile: {}
                    }

                    return {
                        result: true,
                        profile: profile,
                        accountType: "farmer"
                    }

                } catch (err) {
                    return {
                        result: false,
                        reason: "owner",
                        profile: {}
                    }
                }
            }
            default:
                return {
                    result: false,
                    reason: "system",
                    profile: {}
                }
        }
    }
}

module.exports = AuthorizeUser;