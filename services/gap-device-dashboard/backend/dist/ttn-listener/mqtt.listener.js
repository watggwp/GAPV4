"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMqttClientForDevice = createMqttClientForDevice;
exports.disconnectMqttClientForDevice = disconnectMqttClientForDevice;
// src/ttn-listener/mqtt.listener.ts
const mqtt_1 = __importDefault(require("mqtt"));
const client_1 = require("@prisma/client");
const time_1 = require("../utils/time");
const device_service_1 = require("../services/device.service");
const main_1 = require("../main");
const node_fetch_1 = __importDefault(require("node-fetch"));
const file_logger_1 = require("../services/file-logger");
const LOGNAME = "ttn"; // ชื่อกลุ่ม log ของ TTN
const prisma = new client_1.PrismaClient();
const clients = [];
async function initAllDevices() {
    await (0, device_service_1.initDeviceStatuses)();
    const devices = await prisma.device_info.findMany();
    for (const d of devices) {
        const client = mqtt_1.default.connect({
            host: d.mqtt_broker,
            port: d.mqtt_port,
            protocol: 'mqtt',
            username: d.mqtt_username,
            password: d.mqtt_password,
            reconnectPeriod: 5000, // retry every 5s
            connectTimeout: 10000, // timeout on first connect
            will: {
                topic: `status/${d.device_id}`,
                payload: 'disconnected',
                qos: 0,
                retain: false,
            }
        });
        client.on('connect', () => {
            console.log(`[MQTT] ✅ connected → ${d.device_id}`);
            file_logger_1.FileLogger.info(LOGNAME, "mqtt_connected", { device_id: d.device_id, topic: d.mqtt_topic });
            client.subscribe(d.mqtt_topic, () => {
                console.log(`[MQTT] 📡 subscribed → ${d.mqtt_topic}`);
                file_logger_1.FileLogger.info(LOGNAME, "mqtt_subscribed", { device_id: d.device_id, topic: d.mqtt_topic });
            });
        });
        client.on('reconnect', () => {
            console.warn(`[MQTT] 🔁 reconnecting → ${d.device_id}`);
            file_logger_1.FileLogger.warn(LOGNAME, "mqtt_reconnecting", { device_id: d.device_id });
        });
        client.on('offline', () => {
            console.warn(`[MQTT] ⚠️ offline → ${d.device_id}`);
            file_logger_1.FileLogger.warn(LOGNAME, "mqtt_offline", { device_id: d.device_id });
        });
        client.on('close', () => {
            console.warn(`[MQTT] 🔌 connection closed → ${d.device_id}`);
            file_logger_1.FileLogger.warn(LOGNAME, "mqtt_closed", { device_id: d.device_id });
        });
        client.on('error', (err) => {
            console.error(`[MQTT] ❌ error on ${d.device_id}:`, err.message);
            file_logger_1.FileLogger.errorE(LOGNAME, "mqtt_error", err, { device_id: d.device_id });
        });
        client.on('message', async (topic, payload) => {
            let msg;
            try {
                msg = JSON.parse(payload.toString());
            }
            catch (e) {
                console.log("[MQTT] ❗ JSON parse error", e);
                file_logger_1.FileLogger.errorE(LOGNAME, "json_parse_error", e, { topic, raw: payload.toString() });
                return;
            }
            const device_id = msg.end_device_ids?.device_id || d.device_id;
            const received_at = msg.received_at;
            const utcDate = (0, time_1.parseUtc)(received_at);
            file_logger_1.FileLogger.info(LOGNAME, "uplink_received", { device_id, topic, received_at, iso: utcDate.toISOString() });
            console.log(`[MQTT] ⏱ ${device_id} @ ${utcDate.toISOString()}`);
            // ✅ อัปเดตสถานะก่อน
            (0, device_service_1.upsertDeviceLastSeen)(device_id, utcDate, client_1.Status.ONLINE).then(() => {
                main_1.io.emit('status:update', {
                    gwStatus: {},
                    devStatus: {
                        [device_id]: {
                            status: client_1.Status.ONLINE,
                            time: utcDate.toISOString()
                        }
                    }
                });
            });
            // ✅ เพิ่มการส่งข้อมูลไปยัง API
            try {
                const deviceInfo = await prisma.device_info.findUnique({ where: { device_id } });
                if (!deviceInfo?.api_endpoint || !deviceInfo?.fields) {
                    const warnMsg = `[MQTT] ⚠️ device ${device_id} ไม่มี api_endpoint หรือ fields`;
                    console.warn(warnMsg);
                    file_logger_1.FileLogger.warn(LOGNAME, "missing_endpoint_or_fields", { device_id });
                    return;
                }
                const decoded = msg.uplink_message?.decoded_payload || {};
                const fieldList = deviceInfo.fields;
                const dataToSend = {
                    device_id,
                    timestamp: utcDate.toISOString()
                };
                file_logger_1.FileLogger.info(LOGNAME, "api_post", { device_id, endpoint: deviceInfo.api_endpoint, data: dataToSend });
                for (const field of fieldList) {
                    if (decoded[field] !== undefined) {
                        dataToSend[field] = decoded[field];
                    }
                }
                console.log(`[MQTT] 🔍 decoded_payload:`, decoded);
                console.log(`[MQTT] ➡ fields expected:`, fieldList);
                console.log(`[MQTT] 📦 dataToSend:`, dataToSend);
                console.log(`[API] 📤 POST → ${deviceInfo.api_endpoint}`, dataToSend);
                await (0, node_fetch_1.default)(deviceInfo.api_endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend)
                });
            }
            catch (err) {
                console.error(`[API] ❗ Error sending to API for ${device_id}:`, err);
                file_logger_1.FileLogger.errorE(LOGNAME, "api_post_error", err, { device_id });
            }
        });
        clients.push({ device_id: d.device_id, client });
    }
}
async function createMqttClientForDevice(device_id) {
    const d = await prisma.device_info.findUnique({ where: { device_id } });
    if (!d)
        return;
    const client = mqtt_1.default.connect({
        host: d.mqtt_broker,
        port: d.mqtt_port,
        protocol: 'mqtt',
        username: d.mqtt_username,
        password: d.mqtt_password,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
        will: {
            topic: `status/${d.device_id}`,
            payload: 'disconnected',
            qos: 0,
            retain: false,
        }
    });
    client.on('connect', () => {
        console.log(`[MQTT] ✅ connected → ${d.device_id}`);
        client.subscribe(d.mqtt_topic, () => {
            console.log(`[MQTT] 📡 subscribed → ${d.mqtt_topic}`);
        });
    });
    client.on('message', (topic, payload) => {
        let msg;
        try {
            msg = JSON.parse(payload.toString());
        }
        catch (e) {
            console.log("[MQTT] ❗ JSON parse error", e);
            return;
        }
        const received_at = msg.received_at;
        const utcDate = (0, time_1.parseUtc)(received_at);
        console.log(`[MQTT] ⏱ ${device_id} @ ${utcDate.toISOString()}`);
        (0, device_service_1.upsertDeviceLastSeen)(device_id, utcDate, client_1.Status.ONLINE).then(() => {
            main_1.io.emit('status:update', {
                gwStatus: {},
                devStatus: {
                    [device_id]: {
                        status: client_1.Status.ONLINE,
                        time: utcDate.toISOString()
                    }
                }
            });
        });
    });
    clients.push({ device_id, client });
}
function disconnectMqttClientForDevice(device_id) {
    const idx = clients.findIndex(e => e.device_id === device_id);
    if (idx !== -1) {
        console.log(`[MQTT] 🔻 disconnecting → ${device_id}`);
        clients[idx].client.end(true, () => {
            console.log(`[MQTT] 🚫 disconnected → ${device_id}`);
        });
        clients.splice(idx, 1);
    }
}
initAllDevices();
