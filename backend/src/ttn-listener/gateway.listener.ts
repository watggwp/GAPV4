// src/ttn-listener/gateway.listener.ts
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
import { PrismaClient, Status } from '@prisma/client';
import { upsertGateway, initGatewayStatuses } from '../services/gateway.service';
import { markDevicesUnknown } from '../services/gateway-status.service';
import { io } from '../main';
dayjs.extend(utc);
dayjs.extend(tz);

const prisma = new PrismaClient();

const OFFLINE_MIN = Number(process.env.GW_OFFLINE_MIN ?? 30);
const FETCH_EVERY = Number(process.env.GW_FETCH_SEC ?? 60) * 1_000;

/* ------------- Fetch one gateway ------------- */
async function fetchGateway(gwId: string, apiKey: string, domain: string) {
    const url = `https://${domain}/api/v3/gs/gateways/${gwId}/connection/stats`;

    try {
        const { data } = await axios.get(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10_000,
            validateStatus: s => s < 500
        });

        const lastStatus = data?.last_status_received_at ? new Date(data.last_status_received_at) : null;
        const disconnectedAt = data?.disconnected_at ? new Date(data.disconnected_at) : null;
        const message = data?.message?.toLowerCase?.();
        let gwStatus: Status;
        let lastSeenTime: Date;

        if (message?.includes("not connected") || message?.includes("not_found")) {
            console.warn(`[GW] ${gwId} → TTN says not connected. Marking as OFFLINE.`);
            await upsertGateway(gwId, null, Status.OFFLINE);

            io.emit("status:update", {
                gwStatus: {
                    [gwId]: {
                        status: Status.OFFLINE,
                        time: null,
                    },
                },
                devStatus: {}
            });

            await markDevicesUnknown(gwId);
            return;
        }
        if (disconnectedAt) {
            // ✅ มี disconnected_at → OFFLINE
            gwStatus = Status.OFFLINE;
            lastSeenTime = disconnectedAt;
        } else {
            // ✅ ไม่มี disconnected → ONLINE
            gwStatus = Status.ONLINE;
            lastSeenTime = lastStatus!;
        }

        await upsertGateway(gwId, lastSeenTime, gwStatus);

        io.emit('status:update', {
            gwStatus: {
                [gwId]: {
                    status: gwStatus,
                    time: lastSeenTime.toISOString()
                }
            },
            devStatus: {}
        });

        if (gwStatus === Status.OFFLINE) {
            await markDevicesUnknown(gwId);
        }

        const th = dayjs(lastSeenTime).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
        console.log(`[GW] ${gwId} → ${gwStatus} @ ${th}`);

    } catch (err: any) {
        console.error(`[GW] fetch error for ${gwId}:`, err.message);
        await upsertGateway(gwId, new Date(), Status.OFFLINE);
    }
}
/* ------------- Poll loop from DB ------------- */
async function pollAll() {
    await initGatewayStatuses();

    const gateways = await prisma.gateway_info.findMany();

    for (const gw of gateways) {
        await fetchGateway(gw.gateway_id, gw.api_key, gw.tenant_domain);
    }
}

pollAll(); // run immediately
setInterval(pollAll, FETCH_EVERY);
