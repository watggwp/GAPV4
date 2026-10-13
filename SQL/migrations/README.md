# Database migrations

ไฟล์ในโฟลเดอร์นี้คือประวัติการเปลี่ยนโครงสร้างฐานข้อมูล รันตามลำดับชื่อไฟล์ ไฟล์ละครั้ง
ระบบบันทึกไฟล์ที่รันแล้วไว้ในตาราง `schema_migrations`

## คำสั่ง

| คำสั่ง | ผล |
|---|---|
| `npm run migrate` | รันไฟล์ที่ยังไม่ได้รันกับฐานข้อมูล dev (`DATABASE_DEV`) |
| `npm run migrate -- deploy` | รันกับฐานข้อมูล server (`DATABASE_SER`) |
| `npm run migrate:status` | แสดงไฟล์ที่รันแล้ว / ยังไม่รัน |

## กติกา

1. สำรองฐานข้อมูลก่อนรันกับ production ทุกครั้ง (`mysqldump --single-transaction --routines --triggers ...`)
2. ไฟล์ใหม่ตั้งชื่อเลขถัดไป เช่น `002_add_column_x.sql`
3. ห้ามแก้ไฟล์ที่รันไปแล้ว ให้สร้างไฟล์ใหม่แทน (ตัวรันจะเตือนถ้า checksum เปลี่ยน)
4. เขียนให้รันซ้ำได้เท่าที่ทำได้ เช่น `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS` (MariaDB)

`000_baseline.sql` สร้างจากฐานข้อมูลที่ใช้งานจริงเมื่อ 2026-10-13 ใช้ได้ทั้งฐานข้อมูลใหม่และฐานข้อมูลเดิม
