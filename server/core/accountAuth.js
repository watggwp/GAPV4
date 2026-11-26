'use strict';

require('dotenv').config().parsed
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

// จัดการรหัสผ่าน admin / หมอ
// - รหัสผ่านใหม่เก็บเป็น bcrypt
// - รหัสผ่านเก่า (SHA-256) ยังใช้ login ได้ และจะถูกแปลงเป็น bcrypt ตอน login สำเร็จ
// - session ไม่เก็บรหัสผ่านจริง เก็บ "session credential" ที่เซ็นด้วย KEY_SESSION แทน
//   credential ผูกกับ hash ปัจจุบัน เปลี่ยนรหัสผ่านแล้ว session เก่าจะใช้ไม่ได้

const BCRYPT_ROUNDS = 10
const CREDENTIAL_PREFIX = "sess1."

const ACCOUNT_TABLES = {
    admin: { table: "admin", username: "username", password: "password", id: "id" },
    acc_doctor: { table: "acc_doctor", username: "id_doctor", password: "password_doctor", id: "id_table_doctor" }
}

function hashPassword(plain) {
    return bcrypt.hashSync(String(plain), BCRYPT_ROUNDS)
}

const isBcryptHash = (hash) => typeof hash === "string" && /^\$2[aby]\$/.test(hash)

function safeEqual(a, b) {
    const bufA = Buffer.from(String(a))
    const bufB = Buffer.from(String(b))
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

function sign(type, row) {
    const t = ACCOUNT_TABLES[type]
    return crypto.createHmac("sha256", process.env.KEY_SESSION || "gap_project_royal")
        .update(`${type}|${row[t.id]}|${row[t.username]}|${row[t.password]}`)
        .digest("hex")
}

function sessionCredential(type, row) {
    return `${CREDENTIAL_PREFIX}${row[ACCOUNT_TABLES[type].id]}.${sign(type, row)}`
}

const isSessionCredential = (value) => typeof value === "string" && value.startsWith(CREDENTIAL_PREFIX)

function matchesCredential(type, row, credential) {
    const [id, signature] = credential.slice(CREDENTIAL_PREFIX.length).split(".")
    return String(row[ACCOUNT_TABLES[type].id]) === id && safeEqual(signature || "", sign(type, row))
}

async function matchesPassword(plain, stored) {
    if (typeof plain !== "string" || !plain || typeof stored !== "string" || !stored) return false
    if (isBcryptHash(stored)) return bcrypt.compare(plain, stored)
    const sha256 = crypto.createHash("sha256").update(plain).digest("hex")
    return safeEqual(sha256, stored.toLowerCase())
}

// rows: บัญชีที่ username ตรงกัน (เรียงตามลำดับที่ต้องการแล้ว)
// password: รหัสผ่านจริง หรือ session credential
// runQuery(sql, params): ใช้แปลงรหัสผ่าน SHA-256 เป็น bcrypt
// คืนแถวแรกที่ผ่าน (hash ในแถวเป็นค่าล่าสุดแล้ว) หรือ null
async function verifyAccount(type, rows, password, runQuery) {
    const t = ACCOUNT_TABLES[type]
    if (!t) return null

    for (const row of rows) {
        if (isSessionCredential(password)) {
            if (matchesCredential(type, row, password)) return row
            continue
        }

        if (!(await matchesPassword(password, row[t.password]))) continue

        if (!isBcryptHash(row[t.password]) && runQuery) {
            const newHash = hashPassword(password)
            try {
                await runQuery(
                    `UPDATE ${t.table} SET ${t.password} = ? WHERE ${t.id} = ? AND ${t.password} = ?`,
                    [newHash, row[t.id], row[t.password]]
                )
                row[t.password] = newHash
            } catch (err) {
                console.error("password rehash failed", err.message)
            }
        }
        return row
    }
    return null
}

module.exports = { ACCOUNT_TABLES, hashPassword, sessionCredential, isSessionCredential, verifyAccount }
