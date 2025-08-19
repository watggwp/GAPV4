// src/ttn-listener/mqtt.listener.ts
import mqtt, { MqttClient } from 'mqtt';
import { PrismaClient, Status } from '@prisma/client';
import { parseUtc } from '../utils/time';
import { initDeviceStatuses, upsertDeviceLastSeen } from '../services/device.service';
import { io } from '../main';
import fetch from 'node-fetch';
import { FileLogger } from "../services/file-logger";
const LOGNAME = "ttn"; // ชื่อกลุ่ม log ของ TTN
const prisma = new PrismaClient();
interface ClientEntry {
    device_id: string;
    client: MqttClient;
}

const clients: ClientEntry[] = [];

async function initAllDevices() {
    await initDeviceStatuses();

    const devices = await prisma.device_info.findMany();

    for (const d of devices) {
        const client = mqtt.connect({
            host: d.mqtt_broker,
            port: d.mqtt_port,
            protocol: 'mqtt',
            username: d.mqtt_username,
            password: d.mqtt_password,
            reconnectPeriod: 5_000, // retry every 5s
            connectTimeout: 10_000, // timeout on first connect
            will: {
                topic: `status/${d.device_id}`,
                payload: 'disconnected',
                qos: 0,
                retain: false,
            }
        });

        client.on('connect', () => {
            console.log(`[MQTT] ✅ connected → ${d.device_id}`);
            FileLogger.info(LOGNAME, "mqtt_connected", { device_id: d.device_id, topic: d.mqtt_topic });
            client.subscribe(d.mqtt_topic, () => {
                console.log(`[MQTT] 📡 subscribed → ${d.mqtt_topic}`);
                FileLogger.info(LOGNAME, "mqtt_subscribed", { device_id: d.device_id, topic: d.mqtt_topic });
            });
        });

        client.on('reconnect', () => {
            console.warn(`[MQTT] 🔁 reconnecting → ${d.device_id}`);
            FileLogger.warn(LOGNAME, "mqtt_reconnecting", { device_id: d.device_id });
        });

        client.on('offline', () => {
            console.warn(`[MQTT] ⚠️ offline → ${d.device_id}`);
            FileLogger.warn(LOGNAME, "mqtt_offline", { device_id: d.device_id });
        });

        client.on('close', () => {
            console.warn(`[MQTT] 🔌 connection closed → ${d.device_id}`);
            FileLogger.warn(LOGNAME, "mqtt_closed", { device_id: d.device_id });
        });

        client.on('error', (err) => {
            console.error(`[MQTT] ❌ error on ${d.device_id}:`, err.message);
            FileLogger.errorE(LOGNAME, "mqtt_error", err, { device_id: d.device_id });
        });

        client.on('message', async (topic, payload) => {
            let msg: any;
            try {
                msg = JSON.parse(payload.toString());
            } catch (e) {
                console.log("[MQTT] ❗ JSON parse error", e);
                FileLogger.errorE(LOGNAME, "json_parse_error", e, { topic, raw: payload.toString() });
                return;
            }

            const device_id: string = msg.end_device_ids?.device_id || d.device_id;
            const received_at = msg.received_at;
            const utcDate = parseUtc(received_at);

            FileLogger.info(LOGNAME, "uplink_received", { device_id, topic, received_at, iso: utcDate.toISOString() });
            console.log(`[MQTT] ⏱ ${device_id} @ ${utcDate.toISOString()}`);

            // ✅ อัปเดตสถานะก่อน
            upsertDeviceLastSeen(device_id, utcDate, Status.ONLINE).then(() => {
                io.emit('status:update', {
                    gwStatus: {},
                    devStatus: {
                        [device_id]: {
                            status: Status.ONLINE,
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
                    FileLogger.warn(LOGNAME, "missing_endpoint_or_fields", { device_id });
                    return;
                }

                const decoded = msg.uplink_message?.decoded_payload || {};
                const fieldList: string[] = deviceInfo.fields as unknown as string[];

                const dataToSend: Record<string, any> = {
                    device_id,
                    timestamp: utcDate.toISOString()
                };
                FileLogger.info(LOGNAME, "api_post", { device_id, endpoint: deviceInfo.api_endpoint, data: dataToSend });

                for (const field of fieldList) {
                    if (decoded[field] !== undefined) {
                        dataToSend[field] = decoded[field];
                    }
                }
                console.log(`[MQTT] 🔍 decoded_payload:`, decoded);
                console.log(`[MQTT] ➡ fields expected:`, fieldList);
                console.log(`[MQTT] 📦 dataToSend:`, dataToSend);
                console.log(`[API] 📤 POST → ${deviceInfo.api_endpoint}`, dataToSend);

                await fetch(deviceInfo.api_endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend)
                });
            } catch (err) {
                console.error(`[API] ❗ Error sending to API for ${device_id}:`, err);
                FileLogger.errorE(LOGNAME, "api_post_error", err, { device_id });
            }
        });
        clients.push({ device_id: d.device_id, client });
    }
}
export async function createMqttClientForDevice(device_id: string) {
    const d = await prisma.device_info.findUnique({ where: { device_id } });
    if (!d) return;

    const client = mqtt.connect({
        host: d.mqtt_broker,
        port: d.mqtt_port,
        protocol: 'mqtt',
        username: d.mqtt_username,
        password: d.mqtt_password,
        reconnectPeriod: 5_000,
        connectTimeout: 10_000,
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
        let msg: any;
        try {
            msg = JSON.parse(payload.toString());
        } catch (e) {
            console.log("[MQTT] ❗ JSON parse error", e);
            return;
        }

        const received_at = msg.received_at;
        const utcDate = parseUtc(received_at);

        console.log(`[MQTT] ⏱ ${device_id} @ ${utcDate.toISOString()}`);
        upsertDeviceLastSeen(device_id, utcDate, Status.ONLINE).then(() => {
            io.emit('status:update', {
                gwStatus: {},
                devStatus: {
                    [device_id]: {
                        status: Status.ONLINE,
                        time: utcDate.toISOString()
                    }
                }
            });
        });
    });

    clients.push({ device_id, client });
}
export function disconnectMqttClientForDevice(device_id: string) {
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

