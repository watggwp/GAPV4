"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/utils/logdaily.ts
const google_logger_1 = require("../log-to-sheet/google-logger");
const time_1 = require("./time");
const device_status_service_1 = require("../services/device-status.service");
const CHECK_EVERY_MS = 60000; // ตรวจทุก 1 นาที
async function checkDeviceStatus() {
    try {
        const { gwStatus, devStatus, changed } = await (0, device_status_service_1.getStatusSnapshot)();
        if (changed || (0, time_1.shouldLogDaily)()) {
            await (0, google_logger_1.logStatus)(gwStatus, devStatus);
            console.log(`[Logger] ✅ Logged at ${new Date().toLocaleTimeString()}`);
        }
        else {
            console.log(`[Logger] ⏳ No change, skip log`);
        }
    }
    catch (err) {
        console.error('[Logger] ❌ Error:', err);
    }
}
// เรียกทันที + ทำซ้ำทุกนาที
checkDeviceStatus();
setInterval(checkDeviceStatus, CHECK_EVERY_MS);
