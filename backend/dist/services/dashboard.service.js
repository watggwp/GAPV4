"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColumnData = getColumnData;
// src/services/dashboard.service.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getColumnData() {
    const groups = await prisma.device_group.findMany({
        include: {
            devices: {
                include: {
                    status: true,
                },
            },
            gateways: {
                include: {
                    status: true,
                },
            }
        }
    });
    return groups.map(group => ({
        id: group.group_id,
        title: group.name,
        cards: [
            ...group.devices.map(device => ({
                id: device.device_id,
                status: device.status?.status || 'UNKNOWN',
                time: device.status?.status === 'UNKNOWN' ? null : device.status?.last_seen,
            })),
            ...group.gateways.map(gateway => ({
                id: gateway.gateway_id,
                status: gateway.status?.status || 'UNKNOWN',
                time: gateway.status?.status === 'UNKNOWN' ? null : gateway.status?.last_seen,
            })),
        ]
    }));
}
