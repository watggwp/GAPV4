"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusSnapshot = getStatusSnapshot;
// src/services/device-status.service.ts
const client_1 = require("@prisma/client");
const main_1 = require("../main");
const prisma = new client_1.PrismaClient();
const DEVICE_OFF_MIN = Number(process.env.DEVICE_OFF_MIN ?? 10);
const CHECK_EVERY_MS = 60000; // ทุก 1 นาที
async function checkOffline() {
    const threshold = new Date(Date.now() - DEVICE_OFF_MIN * 60000);
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
    const toOffline = [];
    const toUnknown = [];
    for (const dev of devices) {
        const devStatus = dev.status?.status ?? client_1.Status.UNKNOWN;
        const lastSeen = dev.status?.last_seen;
        const gatewayStatuses = dev.gateways.map(g => g.gateway?.status?.status ?? client_1.Status.UNKNOWN);
        const anyGatewayOnline = gatewayStatuses.some(status => status === client_1.Status.ONLINE);
        const allGatewayOffline = gatewayStatuses.every(status => status !== client_1.Status.ONLINE);
        if (allGatewayOffline) {
            // ✅ Gateway ทั้งหมด offline → Device = UNKNOWN
            if (devStatus !== client_1.Status.UNKNOWN) {
                toUnknown.push(dev.device_id);
            }
        }
        else if (anyGatewayOnline) {
            // ✅ Gateway online → ถ้าไม่เคยส่งข้อมูลเลย หรือส่งนานแล้ว → OFFLINE
            if (!lastSeen && devStatus !== client_1.Status.OFFLINE) {
                toOffline.push(dev.device_id);
            }
            else if (lastSeen &&
                lastSeen < threshold &&
                (devStatus === client_1.Status.ONLINE || devStatus === client_1.Status.UNKNOWN)) {
                toOffline.push(dev.device_id);
            }
        }
    }
    if (toUnknown.length > 0) {
        await prisma.device_status.updateMany({
            where: { device_id: { in: toUnknown } },
            data: { status: client_1.Status.UNKNOWN },
        });
        for (const id of toUnknown) {
            console.log(`[emit] UNKNOWN → ${id}`);
            main_1.io.emit('status:update', {
                gwStatus: {},
                devStatus: {
                    [id]: {
                        status: client_1.Status.UNKNOWN,
                        time: null,
                    }
                }
            });
        }
    }
    if (toOffline.length > 0) {
        await prisma.device_status.updateMany({
            where: { device_id: { in: toOffline } },
            data: { status: client_1.Status.OFFLINE },
        });
        for (const id of toOffline) {
            main_1.io.emit('status:update', {
                gwStatus: {},
                devStatus: {
                    [id]: {
                        status: client_1.Status.OFFLINE,
                        time: null,
                    }
                }
            });
        }
    }
}
let lastSnapshot = null;
async function getStatusSnapshot() {
    const gateways = await prisma.gateway_status.findMany({ select: { gateway_id: true, status: true } });
    const devices = await prisma.device_status.findMany({ select: { device_id: true, status: true } });
    const gwStatus = {};
    const devStatus = {};
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
    }
    else {
        changed = true; // ครั้งแรกถือว่าเปลี่ยน
    }
    // อัปเดต snapshot
    lastSnapshot = { gwStatus, devStatus };
    return { gwStatus, devStatus, changed };
}
checkOffline();
setInterval(checkOffline, CHECK_EVERY_MS);
