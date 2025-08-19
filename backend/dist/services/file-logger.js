"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileLogger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOG_ROOT = path_1.default.join(__dirname, "../../logs"); // โฟลเดอร์รวม log
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
}
// สร้างชื่อไฟล์แบบรายวัน: <name>-YYYY-MM-DD.log
function getLogFile(name, date = new Date()) {
    const d = date.toISOString().slice(0, 10); // YYYY-MM-DD
    return path_1.default.join(LOG_ROOT, `${name}-${d}.log`);
}
// เขียนบรรทัดเดียวเป็น JSON (JSONL)
function writeJsonLine(filePath, obj) {
    ensureDir(path_1.default.dirname(filePath));
    const line = JSON.stringify(obj) + "\n";
    fs_1.default.appendFileSync(filePath, line, "utf8");
}
function log(name, level, msg, meta) {
    const ts = new Date().toISOString();
    // ป้องกัน circular ใน error
    const safeMeta = meta instanceof Error
        ? { error: { message: meta.message, stack: meta.stack } }
        : meta;
    const payload = { ts, level, msg, ...(safeMeta || {}) };
    writeJsonLine(getLogFile(name), payload);
}
// ------------- public api -------------
exports.FileLogger = {
    info(name, msg, meta) {
        log(name, "info", msg, meta);
    },
    warn(name, msg, meta) {
        log(name, "warn", msg, meta);
    },
    error(name, msg, meta) {
        log(name, "error", msg, meta);
    },
    // ช่วย log error แบบสั้น ๆ ด้วย error object
    errorE(name, msg, err, meta) {
        const base = err instanceof Error ? { error: { message: err.message, stack: err.stack } } : { error: String(err) };
        log(name, "error", msg, { ...base, ...(meta || {}) });
    },
};
