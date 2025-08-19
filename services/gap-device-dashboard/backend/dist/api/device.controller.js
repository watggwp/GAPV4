"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/device.controller.ts
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const main_1 = require("../main");
const dashboard_service_1 = require("../services/dashboard.service");
const mqtt_listener_1 = require("../ttn-listener/mqtt.listener");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/', async (req, res) => {
    const devices = await prisma.device.findMany({
        include: {
            device_info: true,
            status: true,
            gateways: true,
        },
    });
    res.json(devices);
});
router.post('/', async (req, res) => {
    const { device_id, name, mqtt_username, mqtt_password, mqtt_topic, mqtt_broker, mqtt_port, api_endpoint, fields, group_id } = req.body;
    try {
        // 🔍 เช็คว่ามี device_id นี้อยู่แล้วหรือยัง
        const existing = await prisma.device.findUnique({
            where: { device_id },
        });
        if (existing) {
            return res.status(409).json({ error: 'Device ID already exists' });
        }
        // ✅ สร้าง device ใหม่
        const created = await prisma.device.create({
            data: {
                device_id,
                name,
                group: group_id ? { connect: { group_id } } : undefined,
                device_info: {
                    create: {
                        mqtt_topic,
                        mqtt_username,
                        mqtt_password,
                        mqtt_broker,
                        mqtt_port,
                        ...(api_endpoint && fields ? { api_endpoint, fields } : {}), // 👈 ใส่แบบมีเงื่อนไข
                    },
                },
            },
        });
        const columns = await (0, dashboard_service_1.getColumnData)();
        main_1.io.emit("init:columns", columns);
        await (0, mqtt_listener_1.createMqttClientForDevice)(created.device_id);
        res.status(201).json(created);
    }
    catch (err) {
        console.error(`[POST /device] ❌ Error:`, err);
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Device already exists (duplicate key)' });
        }
        res.status(500).json({ error: 'Failed to create device' });
    }
});
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    await prisma.device_info.delete({ where: { device_id: id } }).catch(() => { });
    await prisma.device_status.delete({ where: { device_id: id } }).catch(() => { });
    await prisma.gateway_device.deleteMany({ where: { device_id: id } }).catch(() => { });
    await prisma.device.delete({ where: { device_id: id } });
    (0, mqtt_listener_1.disconnectMqttClientForDevice)(id);
    res.sendStatus(204);
});
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { name, mqtt_topic, mqtt_username, mqtt_password, mqtt_broker, mqtt_port, api_endpoint, fields, group_id } = req.body;
    try {
        const updated = await prisma.device.update({
            where: { device_id: id },
            data: {
                name,
                group: group_id ? { connect: { group_id } } : undefined,
                device_info: {
                    update: {
                        mqtt_topic,
                        mqtt_username,
                        mqtt_password,
                        mqtt_broker,
                        mqtt_port,
                        api_endpoint,
                        fields,
                    }
                }
            }
        });
        res.json(updated);
    }
    catch (err) {
        console.error("❌ Failed to update device:", err);
        res.status(500).json({ error: "Update failed" });
    }
});
exports.default = router;
