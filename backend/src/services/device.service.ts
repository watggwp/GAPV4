//src/services/device.service.ts
import { PrismaClient, Status } from "@prisma/client";
import axios from "axios";
import { notifyDeviceOffline, notifyDeviceOnline } from "./line-notify.service";
const prisma = new PrismaClient();

export async function upsertDeviceLastSeen(device_id: string, time: Date | null, status: Status) {
    const exists = await prisma.device.findUnique({
        where: { device_id }
    });

    if (!exists) {
        console.warn(`[DeviceStatus] ❌ device_id not found: ${device_id}`);
        return;
    }

    const currentStatus = await prisma.device_status.findUnique({
        where: { device_id },
        select: { status: true }
    });

    const prevStatus = currentStatus?.status;

    // ถ้าสถานะเปลี่ยน → ส่งแจ้งเตือน
    if (prevStatus !== status) {
        try {
            if (status === Status.ONLINE) {
                await notifyDeviceOnline(device_id);
            } else {
                await notifyDeviceOffline(device_id);
            }
        } catch (err) {
            console.warn(`[LINE] ❗ Failed to notify LINE for ${device_id}:`, err);
        }
    }

    // อัปเดตหรือสร้าง status ใหม่
    await prisma.device_status.upsert({
        where: { device_id },
        update: { status, last_seen: time },
        create: { device_id, status, last_seen: time }
    });
}
export async function initDeviceStatuses() {
    const allDevices = await prisma.device_info.findMany({
        select: { device_id: true }
    });

    for (const dev of allDevices) {
        await prisma.device_status.upsert({
            where: { device_id: dev.device_id },
            update: {}, // ไม่ต้องเปลี่ยนอะไรถ้ามีอยู่แล้ว
            create: {
                device_id: dev.device_id,
                status: Status.UNKNOWN,
                last_seen: null
            }
        });
    }

    console.log(`[Init] ✅ Initialized device_status for ${allDevices.length} devices`);
}
