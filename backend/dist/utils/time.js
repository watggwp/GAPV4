"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldLogDaily = shouldLogDaily;
exports.parseUtc = parseUtc;
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
function shouldLogDaily() {
    const nowTH = (0, dayjs_1.default)().tz('Asia/Bangkok');
    const hhmm = nowTH.format('HH:mm');
    return ['23:50', '23:55', '00:00'].includes(hhmm);
}
function parseUtc(iso) {
    return new Date(iso); // เก็บเป็น UTC Date
}
