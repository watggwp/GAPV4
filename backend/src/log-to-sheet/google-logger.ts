// utils/google-logger.ts
import { google } from 'googleapis';
import path from 'path';
import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
dayjs.extend(tz);

const keyPath = path.resolve(process.cwd(), 'credentials.json');   // <─ ชี้ไปที่ไฟล์
const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,                                                // ใช้ keyFile แทน credentials
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

/* ---------- CONST ---------- */
const SHEET_ID = "1I6MvWaeEIV7oXRE73ObvqelPjbYA-TtuNh7JgX7ktew";
const TAB = 'Log';
const DATE_FMT = 'YYYY-MM-DD';
const TIME_FMT = 'HH:mm:ss';

/* คอลัมน์ C-L ตามลำดับ */
const COL_ORDER: [string, 'gateway' | 'device'][] = [
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
export async function logStatus(
    gwStatus: Record<string, string>,
    devStatus: Record<string, string>
) {
    // เวลาไทย
    const nowTH = dayjs().tz('Asia/Bangkok');
    const rowValues: (string | null)[] = [
        nowTH.format(DATE_FMT),          // A
        nowTH.format(TIME_FMT),          // B
        // 10 ช่อง C-L
        ...COL_ORDER.map(([key, kind]) =>
            (kind === 'gateway' ? gwStatus[key] : devStatus[key]) ?? 'UNKNOWN'
        ),
    ];
    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowValues] },
    });

    console.log('[Sheet] appended new row');
}