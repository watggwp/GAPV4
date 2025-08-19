"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertGateway = upsertGateway;
exports.initGatewayStatuses = initGatewayStatuses;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function upsertGateway(gateway_id, received_at, status) {
    return prisma.$transaction(async (tx) => {
        const gateway = await tx.gateway.upsert({
            where: { gateway_id },
            update: { name: gateway_id },
            create: { gateway_id, name: gateway_id }
        });
        const gwStatus = await tx.gateway_status.upsert({
            where: { gateway_id },
            update: { status, last_seen: received_at },
            create: { gateway_id, status, last_seen: received_at }
        });
        return { gateway, status: gwStatus };
    });
}
async function initGatewayStatuses() {
    const allGateways = await prisma.gateway.findMany({
        select: { gateway_id: true }
    });
    for (const gw of allGateways) {
        await prisma.gateway_status.upsert({
            where: { gateway_id: gw.gateway_id },
            update: {},
            create: {
                gateway_id: gw.gateway_id,
                status: client_1.Status.OFFLINE,
                last_seen: null,
            }
        });
    }
    console.log(`[Init] ✅ Initialized gateway_status for ${allGateways.length} gateways`);
}
