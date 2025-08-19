"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/ttn-listener/gateway.listener.ts
const axios_1 = __importDefault(require("axios"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const client_1 = require("@prisma/client");
const gateway_service_1 = require("../services/gateway.service");
const gateway_status_service_1 = require("../services/gateway-status.service");
const main_1 = require("../main");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const prisma = new client_1.PrismaClient();
const OFFLINE_MIN = Number(process.env.GW_OFFLINE_MIN ?? 30);
const FETCH_EVERY = Number(process.env.GW_FETCH_SEC ?? 60) * 1000;
/* ------------- Fetch one gateway ------------- */
async function fetchGateway(gwId, apiKey, domain) {
    const url = `https://${domain}/api/v3/gs/gateways/${gwId}/connection/stats`;
    try {
        const { data } = await axios_1.default.get(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
            validateStatus: s => s < 500
        });
        const lastStatus = data?.last_status_received_at ? new Date(data.last_status_received_at) : null;
        const disconnectedAt = data?.disconnected_at ? new Date(data.disconnected_at) : null;
        const message = data?.message?.toLowerCase?.();
        let gwStatus;
        let lastSeenTime;
        if (message?.includes("not connected") || message?.includes("not_found")) {
            console.warn(`[GW] ${gwId} → TTN says not connected. Marking as OFFLINE.`);
            await (0, gateway_service_1.upsertGateway)(gwId, null, client_1.Status.OFFLINE);
            main_1.io.emit("status:update", {
                gwStatus: {
                    [gwId]: {
                        status: client_1.Status.OFFLINE,
                        time: null,
                    },
                },
                devStatus: {}
            });
            await (0, gateway_status_service_1.markDevicesUnknown)(gwId);
            return;
        }
        if (disconnectedAt) {
            // ✅ มี disconnected_at → OFFLINE
            gwStatus = client_1.Status.OFFLINE;
            lastSeenTime = disconnectedAt;
        }
        else {
            // ✅ ไม่มี disconnected → ONLINE
            gwStatus = client_1.Status.ONLINE;
            lastSeenTime = lastStatus;
        }
        await (0, gateway_service_1.upsertGateway)(gwId, lastSeenTime, gwStatus);
        main_1.io.emit('status:update', {
            gwStatus: {
                [gwId]: {
                    status: gwStatus,
                    time: lastSeenTime.toISOString()
                }
            },
            devStatus: {}
        });
        if (gwStatus === client_1.Status.OFFLINE) {
            await (0, gateway_status_service_1.markDevicesUnknown)(gwId);
        }
        const th = (0, dayjs_1.default)(lastSeenTime).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
        console.log(`[GW] ${gwId} → ${gwStatus} @ ${th}`);
    }
    catch (err) {
        console.error(`[GW] fetch error for ${gwId}:`, err.message);
        await (0, gateway_service_1.upsertGateway)(gwId, new Date(), client_1.Status.OFFLINE);
    }
}
/* ------------- Poll loop from DB ------------- */
async function pollAll() {
    await (0, gateway_service_1.initGatewayStatuses)();
    const gateways = await prisma.gateway_info.findMany();
    for (const gw of gateways) {
        await fetchGateway(gw.gateway_id, gw.api_key, gw.tenant_domain);
    }
}
pollAll(); // run immediately
setInterval(pollAll, FETCH_EVERY);
