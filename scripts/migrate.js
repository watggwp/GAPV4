'use strict';

// ตัวรัน migration ของฐานข้อมูล
//   npm run migrate              รัน migration ที่ยังไม่ได้รัน (ฐานข้อมูล dev)
//   npm run migrate -- deploy    รันกับฐานข้อมูล server (DATABASE_SER)
//   npm run migrate:status       ดูสถานะ
// ไฟล์อยู่ใน SQL/migrations/NNN_name.sql รันตามลำดับชื่อไฟล์ ไฟล์ละครั้ง
// สำรองฐานข้อมูลก่อนรันกับ production ทุกครั้ง

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const mysql = require('mysql2/promise')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const MIGRATIONS_DIR = path.join(__dirname, '..', 'SQL', 'migrations')
const args = process.argv.slice(2)
const command = args.includes('status') ? 'status' : 'up'
const isDeploy = args.includes(process.env.BUILD || 'deploy')

function connectionConfig() {
    return isDeploy ? {
        database: process.env.DATABASE_SER,
        user: process.env.USER_DB,
        password: process.env.PASS_DB || process.env.PASSWORD_DB || ''
    } : {
        database: process.env.DATABASE_DEV,
        user: process.env.USER_DBDEV,
        password: process.env.PASSWORD_DBDEV || ''
    }
}

const checksum = (sql) => crypto.createHash('sha256').update(sql).digest('hex')

async function main() {
    const config = connectionConfig()
    const connection = await mysql.createConnection({
        host: process.env.HOST_DB_CONTAINER || process.env.HOST_DB,
        port: process.env.PORT || 3306,
        ...config,
        multipleStatements: true,
        charset: 'utf8mb4'
    })

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version varchar(255) NOT NULL,
                checksum char(64) NOT NULL,
                applied_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (version)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `)

        const [appliedRows] = await connection.query('SELECT version, checksum FROM schema_migrations')
        const applied = new Map(appliedRows.map((row) => [row.version, row.checksum]))
        const files = fs.readdirSync(MIGRATIONS_DIR).filter((file) => /^\d+_.+\.sql$/.test(file)).sort()

        console.log(`database: ${config.database} (${isDeploy ? 'deploy' : 'dev'})`)

        for (const file of files) {
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
            const sum = checksum(sql)

            if (applied.has(file)) {
                const note = applied.get(file) === sum ? '' : '  (ไฟล์ถูกแก้หลังรันแล้ว ควรสร้าง migration ใหม่แทน)'
                console.log(`  applied  ${file}${note}`)
                continue
            }

            if (command === 'status') {
                console.log(`  pending  ${file}`)
                continue
            }

            process.stdout.write(`  running  ${file} ... `)
            await connection.query(sql)
            await connection.query('INSERT INTO schema_migrations (version, checksum) VALUES (?, ?)', [file, sum])
            console.log('done')
        }
    } finally {
        await connection.end()
    }
}

main().catch((err) => {
    console.error('\nmigration failed:', err.message)
    process.exit(1)
})
