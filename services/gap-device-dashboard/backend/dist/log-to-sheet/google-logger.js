"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStatus = logStatus;
// utils/google-logger.ts
const googleapis_1 = require("googleapis");
const path_1 = __importDefault(require("path"));
const dayjs_1 = __importDefault(require("dayjs"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(timezone_1.default);
const keyPath = path_1.default.resolve(process.cwd(), 'credentials.json'); // <─ ชี้ไปที่ไฟล์
const auth = new googleapis_1.google.auth.GoogleAuth({
    keyFile: keyPath, // ใช้ keyFile แทน credentials
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
/* ---------- CONST ---------- */
const SHEET_ID = "1I6MvWaeEIV7oXRE73ObvqelPjbYA-TtuNh7JgX7ktew";
const TAB = 'Log';
const DATE_FMT = 'YYYY-MM-DD';
const TIME_FMT = 'HH:mm:ss';
/* คอลัมน์ C-L ตามลำดับ */
const COL_ORDER = [
    ['nong-khiew-royal', 'gateway'],
    ['nong-khiew-greenhouse', 'device'],
    ['nong-khiew-pump', 'device'],
    ['nong-khiew-weather', 'device'],
    ['kae-noi-royal', 'gateway'],
    ['kae-noi-greenhouse', 'device'],
    ['kae-noi-pump', 'device'],
    ['mae-tho-royal', 'gateway'],
    ['mae-tho-greenhouse', 'device'],
    ['mae-tho-pump', 'device'],
    ['gap-gateway', 'gateway'],
    ['rmutt-gap', 'device'],
    ['', 'device'], // ❌ ช่องว่าง Pump ของ RMUTT → ไม่มีอุปกรณ์
    ['rmutt-weather', 'device'],
];
/* ---------- MAIN FUNC ---------- */
async function logStatus(gwStatus, devStatus) {
    // เวลาไทย
    const nowTH = (0, dayjs_1.default)().tz('Asia/Bangkok');
    const rowValues = [
        nowTH.format(DATE_FMT), // A
        nowTH.format(TIME_FMT), // B
        // 10 ช่อง C-L
        ...COL_ORDER.map(([key, kind]) => (kind === 'gateway' ? gwStatus[key] : devStatus[key]) ?? 'UNKNOWN'),
    ];
    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowValues] },
    });
    console.log('[Sheet] appended new row');
}
