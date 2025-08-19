// src/utils/logdaily.ts
import { logStatus } from '../log-to-sheet/google-logger';
import { shouldLogDaily } from './time';
import { getStatusSnapshot } from '../services/device-status.service';

const CHECK_EVERY_MS = 60_000; // ตรวจทุก 1 นาที

async function checkDeviceStatus() {
    try {
        const { gwStatus, devStatus, changed } = await getStatusSnapshot();

        if (changed || shouldLogDaily()) {
            await logStatus(gwStatus, devStatus);
            console.log(`[Logger] ✅ Logged at ${new Date().toLocaleTimeString()}`);
        } else {
            console.log(`[Logger] ⏳ No change, skip log`);
        }
    } catch (err) {
        console.error('[Logger] ❌ Error:', err);
    }
}

// เรียกทันที + ทำซ้ำทุกนาที
checkDeviceStatus();
setInterval(checkDeviceStatus, CHECK_EVERY_MS);
