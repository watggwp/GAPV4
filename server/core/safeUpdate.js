'use strict';

// สร้าง SET / WHERE สำหรับแก้ข้อมูลหลัก (พืช ปุ๋ย สารเคมี ศัตรูพืช แหล่งที่มา ศูนย์)
// แบบ parameterized: ชื่อคอลัมน์ต้องอยู่ใน whitelist และค่าทุกตัวส่งเป็น ? เท่านั้น
// (เดิมต่อ string ตรงๆ ทำให้ส่ง SQL เข้ามาทาง body ได้)

const EDITABLE_COLUMNS = {
    plant_list: ["name", "variety_name", "is_use", "type_plant", "qty_harvest"],
    fertilizer_list: ["name", "name_formula", "how_use", "is_use"],
    chemical_list: ["name", "name_formula", "how_use", "date_safe_list", "is_use"],
    pests: ["pest_name", "type_pest", "is_use"],
    source_list: ["name", "is_use", "location"],
    station_list: ["name", "is_use", "location", "id_station"],
}

const PRIMARY_KEY = { pests: "pest_id" }
const primaryKey = (table) => PRIMARY_KEY[table] || "id"

class InvalidInput extends Error { }

// หน้าเว็บบางหน้าส่งค่ามาในเครื่องหมายคำพูด เช่น "\"ชื่อ\"" ให้ตัดออกก่อน
const cleanValue = (value) => {
    if (value === null || value === undefined) return value
    const text = String(value).trim()
    return /^".*"$/s.test(text) ? text.slice(1, -1).trim() : text
}

// รับ "POINT(lat lng)", "POINT(lat , lng)" หรือ "0"/ค่าว่าง (ลบตำแหน่ง)
const locationSql = (value) => {
    const text = cleanValue(value)
    if (!text || text === "0") return { sql: "NULL", params: [] }
    const numbers = text.match(/-?\d+(?:\.\d+)?/g)
    if (!/^POINT\s*\(/i.test(text) || !numbers || numbers.length !== 2) throw new InvalidInput(`invalid location`)
    return { sql: "POINT(?, ?)", params: numbers.map(Number) }
}

function assertColumn(table, column) {
    if (!EDITABLE_COLUMNS[table] || !EDITABLE_COLUMNS[table].includes(column)) {
        throw new InvalidInput(`column ${column} is not editable in ${table}`)
    }
}

// changes: { column: value } -> { sql: "`a` = ?, `location` = POINT(?, ?)", params }
function buildSet(table, changes) {
    const parts = []
    const params = []
    for (const [column, value] of Object.entries(changes || {})) {
        assertColumn(table, column)
        if (column === "location") {
            const location = locationSql(value)
            parts.push(`\`${column}\` = ${location.sql}`)
            params.push(...location.params)
        } else {
            parts.push(`\`${column}\` = ?`)
            params.push(cleanValue(value))
        }
    }
    if (!parts.length) throw new InvalidInput("nothing to update")
    return { sql: parts.join(", "), params }
}

// conditions: { column: value } -> { sql: "`a` = ? AND `b` = ?", params }
function buildWhere(table, conditions) {
    const parts = []
    const params = []
    for (const [column, value] of Object.entries(conditions || {})) {
        assertColumn(table, column)
        if (column === "location") throw new InvalidInput("location cannot be used as a condition")
        parts.push(`\`${column}\` = ?`)
        params.push(cleanValue(value))
    }
    return { sql: parts.join(" AND "), params }
}

// คอลัมน์ของแบบบันทึกที่แก้ได้ (ไม่รวม id และคีย์ที่ผูกกับโรงเรือน/แบบบันทึกพืช)
// ใช้ตรวจชื่อ field ใน dataChange / change ที่หน้าเว็บส่งมา ก่อนนำไปต่อเป็น SET
const FORM_EDITABLE_COLUMNS = {
    formplant: ["name_plant", "generation", "date_glow", "date_plant", "posi_w", "posi_h", "qty", "area",
        "date_harvest", "system_glow", "water", "water_flow", "history", "insect", "qtyInsect", "seft",
        "state_status", "date_success", "unit", "name_varieties", "expected_yield", "default_yield"],
    formfertilizer: ["name", "formula_name", "use_is", "volume", "source", "date"],
    formchemical: ["name", "formula_name", "insect", "use_is", "rate", "volume", "date_safe", "date", "source", "pest_id"],
}

// คืนเฉพาะ field ที่เป็นคอลัมน์จริงของแบบบันทึก (หน้าเว็บส่ง field ช่วยกรอก เช่น type_main, lat, lng, mapUrl มาด้วย
// ซึ่งไม่ใช่คอลัมน์ เดิมทำให้ UPDATE ล้มเหลว) และกันชื่อ field ที่แฝง SQL มา
function pickFormChanges(table, changes) {
    const allowed = FORM_EDITABLE_COLUMNS[table] || []
    if (!changes || typeof changes !== "object") return {}
    return Object.fromEntries(Object.entries(changes).filter(([key]) => allowed.includes(key)))
}

module.exports = { EDITABLE_COLUMNS, FORM_EDITABLE_COLUMNS, primaryKey, cleanValue, buildSet, buildWhere, pickFormChanges, InvalidInput }
