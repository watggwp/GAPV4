// src/services/device-status.service.ts
import { PrismaClient, Status } from '@prisma/client';
import { io } from '../main';

const prisma = new PrismaClient();

const DEVICE_OFF_MIN = Number(process.env.DEVICE_OFF_MIN ?? 10);
const CHECK_EVERY_MS = 60_000;   // ทุก 1 นาที

async function checkOffline() {
    const threshold = new Date(Date.now() - DEVICE_OFF_MIN * 60_000);

    const devices = await prisma.device.findMany({
        include: {
            status: true,
            gateways: {
                include: {
                    gateway: {
                        include: {
                            status: true,
                        }
                    }
                }
            }
        }
    });

    const toOffline: string[] = [];
    const toUnknown: string[] = [];

    for (const dev of devices) {
        const devStatus = dev.status?.status ?? Status.UNKNOWN;
        const lastSeen = dev.status?.last_seen;

        const gatewayStatuses = dev.gateways.map(g => g.gateway?.status?.status ?? Status.UNKNOWN);
        const anyGatewayOnline = gatewayStatuses.some(status => status === Status.ONLINE);
        const allGatewayOffline = gatewayStatuses.every(status => status !== Status.ONLINE);

        if (allGatewayOffline) {
            // ✅ Gateway ทั้งหมด offline → Device = UNKNOWN
            if (devStatus !== Status.UNKNOWN) {
                toUnknown.push(dev.device_id);
            }
        } else if (anyGatewayOnline) {
            // ✅ Gateway online → ถ้าไม่เคยส่งข้อมูลเลย หรือส่งนานแล้ว → OFFLINE
            if (!lastSeen && devStatus !== Status.OFFLINE) {
                toOffline.push(dev.device_id);
            } else if (
                lastSeen &&
                lastSeen < threshold &&
                (devStatus === Status.ONLINE || devStatus === Status.UNKNOWN)
            ) {
                toOffline.push(dev.device_id);
            }
        }
    }
    if (toUnknown.length > 0) {
        await prisma.device_status.updateMany({
            where: { device_id: { in: toUnknown } },
            data: { status: Status.UNKNOWN },
        });

        for (const id of toUnknown) {
            console.log(`[emit] UNKNOWN → ${id}`);
            io.emit('status:update', {
                gwStatus: {},
                devStatus: {
                    [id]: {
                        status: Status.UNKNOWN,
                        time: null,
                    }
                }
            });
        }
    }

    if (toOffline.length > 0) {
        await prisma.device_status.updateMany({
            where: { device_id: { in: toOffline } },
            data: { status: Status.OFFLINE },
        });

        for (const id of toOffline) {
            io.emit('status:update', {
                gwStatus: {},
                devStatus: {
                    [id]: {
                        status: Status.OFFLINE,
                        time: null,
                    }
                }
            });
        }
    }
}

let lastSnapshot: { gwStatus: Record<string, string>, devStatus: Record<string, string> } | null = null;

export async function getStatusSnapshot(): Promise<{
    gwStatus: Record<string, string>;
    devStatus: Record<string, string>;
    changed: boolean;
}> {
    const gateways = await prisma.gateway_status.findMany({ select: { gateway_id: true, status: true } });
    const devices = await prisma.device_status.findMany({ select: { device_id: true, status: true } });

    const gwStatus: Record<string, string> = {};
    const devStatus: Record<string, string> = {};

    gateways.forEach(gw => { gwStatus[gw.gateway_id] = gw.status; });
    devices.forEach(dev => { devStatus[dev.device_id] = dev.status; });

    // 🔍 เปรียบเทียบกับ snapshot ล่าสุด
    let changed = false;

    if (lastSnapshot) {
        for (const [id, newStatus] of Object.entries(gwStatus)) {
            const prev = lastSnapshot.gwStatus[id];
            if (prev !== newStatus) {
                console.log(`[Logger] Gateway status changed: ${id}: ${prev} → ${newStatus}`);
                changed = true;
                break;
            }
        }

        for (const [id, newStatus] of Object.entries(devStatus)) {
            const prev = lastSnapshot.devStatus[id];
            if (prev !== newStatus) {
                console.log(`[Logger] Device status changed: ${id}: ${prev} → ${newStatus}`);
                changed = true;
                break;
            }
        }
    } else {
        changed = true; // ครั้งแรกถือว่าเปลี่ยน
    }

    // อัปเดต snapshot
    lastSnapshot = { gwStatus, devStatus };

    return { gwStatus, devStatus, changed };
}
checkOffline();
setInterval(checkOffline, CHECK_EVERY_MS);
