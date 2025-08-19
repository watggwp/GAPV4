import { PrismaClient, Status } from '@prisma/client';
import { io } from '../main';

const prisma = new PrismaClient();

/** เรียกหลัง gateway_status เปลี่ยนเป็น OFFLINE */
export async function markDevicesUnknown(gateway_id: string) {
    // หา device ที่ map กับ gateway นี้
    const list = await prisma.gateway_device.findMany({
        where: { gateway_id },
        select: { device_id: true },
    });
    if (!list.length) return;

    // อัปเดตสถานะใน database
    await prisma.device_status.updateMany({
        where: { device_id: { in: list.map(d => d.device_id) } },
        data: { status: Status.UNKNOWN },
    });

    // ดึง last_seen ของ device เหล่านี้
    const deviceStatuses = await prisma.device_status.findMany({
        where: { device_id: { in: list.map(d => d.device_id) } },
        select: { device_id: true, last_seen: true }
    });

    const statusMap = Object.fromEntries(
        deviceStatuses.map(d => [d.device_id, d.last_seen])
    );

    // ส่ง socket โดยให้ time เป็น null ถ้าไม่เคย online
    for (const d of list) {
        const lastSeen = statusMap[d.device_id];
        io.emit('status:update', {
            gwStatus: {},
            devStatus: {
                [d.device_id]: {
                    status: Status.UNKNOWN,
                    time: lastSeen ? lastSeen.toISOString() : null,
                }
            }
        });
    }
}