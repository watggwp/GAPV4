import fs from "fs";
import path from "path";

type Level = "info" | "warn" | "error";
type Meta = Record<string, any>;

const LOG_ROOT = path.join(__dirname, "../../logs"); // โฟลเดอร์รวม log

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// สร้างชื่อไฟล์แบบรายวัน: <name>-YYYY-MM-DD.log
function getLogFile(name: string, date = new Date()) {
    const d = date.toISOString().slice(0, 10); // YYYY-MM-DD
    return path.join(LOG_ROOT, `${name}-${d}.log`);
}

// เขียนบรรทัดเดียวเป็น JSON (JSONL)
function writeJsonLine(filePath: string, obj: any) {
    ensureDir(path.dirname(filePath));
    const line = JSON.stringify(obj) + "\n";
    fs.appendFileSync(filePath, line, "utf8");
}

function log(name: string, level: Level, msg: string, meta?: Meta) {
    const ts = new Date().toISOString();
    // ป้องกัน circular ใน error
    const safeMeta =
        meta instanceof Error
            ? { error: { message: meta.message, stack: meta.stack } }
            : meta;

    const payload = { ts, level, msg, ...(safeMeta || {}) };
    writeJsonLine(getLogFile(name), payload);
}

// ------------- public api -------------
export const FileLogger = {
    info(name: string, msg: string, meta?: Meta) {
        log(name, "info", msg, meta);
    },
    warn(name: string, msg: string, meta?: Meta) {
        log(name, "warn", msg, meta);
    },
    error(name: string, msg: string, meta?: Meta) {
        log(name, "error", msg, meta);
    },
    // ช่วย log error แบบสั้น ๆ ด้วย error object
    errorE(name: string, msg: string, err: unknown, meta?: Meta) {
        const base =
            err instanceof Error ? { error: { message: err.message, stack: err.stack } } : { error: String(err) };
        log(name, "error", msg, { ...base, ...(meta || {}) });
    },
};
