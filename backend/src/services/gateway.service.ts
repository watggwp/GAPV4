import { PrismaClient, Status } from "@prisma/client";

const prisma = new PrismaClient()

export async function upsertGateway(gateway_id: string, received_at: Date | null, status: Status) {
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
export async function initGatewayStatuses() {
    const allGateways = await prisma.gateway.findMany({
        select: { gateway_id: true }
    });

    for (const gw of allGateways) {
        await prisma.gateway_status.upsert({
            where: { gateway_id: gw.gateway_id },
            update: {},
            create: {
                gateway_id: gw.gateway_id,
                status: Status.OFFLINE,
                last_seen: null,
            }
        });
    }

    console.log(`[Init] ✅ Initialized gateway_status for ${allGateways.length} gateways`);
}