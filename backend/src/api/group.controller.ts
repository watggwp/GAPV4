// src/api/group.controller.ts
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
    const groups = await prisma.device_group.findMany({
        include: {
            devices: true,       // ไม่ต้อง include gateways
            gateways: true       // <<--- เพิ่ม gateways
        }
    });

    // ส่ง count device + gateway ให้ frontend
    const result = groups.map(group => ({
        group_id: group.group_id,
        name: group.name,
        devices: group.devices,               // ส่ง array device ทั้งหมด (ไม่ filter)
        gateways: group.gateways,             // ส่ง array gateway ทั้งหมด
        deviceCount: group.devices.length,
        gatewayCount: group.gateways.length
    }));

    res.json(result);
});
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const group = await prisma.device_group.findUnique({
            where: { group_id: id },
            include: {
                devices: {
                    include: {
                        status: true,
                        device_info: true, // ✅ include device_info
                    }
                },
                gateways: {
                    include: {
                        status: true,
                        gateway_info: true,
                        devices: {
                            include: {
                                device: true
                            }
                        }
                    }
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const result = {
            id: group.group_id,
            name: group.name,
            devices: group.devices.map(device => ({
                id: device.device_id,
                name: device.name ?? `Device ${device.device_id}`,
                status: device.status?.status ?? "UNKNOWN",
                last_seen: device.status?.last_seen ?? null,
                group_id: device.group_id,
                mqtt_topic: device.device_info?.mqtt_topic || "",
                mqtt_username: device.device_info?.mqtt_username || "",
                mqtt_password: device.device_info?.mqtt_password || "",
                mqtt_broker: device.device_info?.mqtt_broker || "",
                mqtt_port: device.device_info?.mqtt_port || 1883,
                api_endpoint: device.device_info?.api_endpoint || "",
                fields: device.device_info?.fields || {}
            })),
            gateways: group.gateways.map(gateway => ({
                id: gateway.gateway_id,
                name: gateway.name ?? `Gateway ${gateway.gateway_id}`,
                status: gateway.status?.status ?? "UNKNOWN",
                last_seen: gateway.status?.last_seen ?? null,
                api_key: gateway.gateway_info?.api_key || "",
                tenant_domain: gateway.gateway_info?.tenant_domain || "",
                region: gateway.gateway_info?.region || "",
                app_id: gateway.gateway_info?.app_id || "",
                devices: gateway.devices.map(gd => ({
                    id: gd.device.device_id,
                    name: gd.device.name ?? `Device ${gd.device.device_id}`,
                }))
            }))
        };

        res.json(result);
    } catch (err) {
        console.error("❌ Failed to fetch group detail:", err);
        res.status(500).json({ error: "Failed to fetch group detail" });
    }
});
router.post('/', async (req, res) => {
    const { group_id, name } = req.body;

    try {
        const newGroup = await prisma.device_group.create({
            data: { group_id, name }
        });
        res.status(201).json(newGroup);
    } catch (err) {
        console.error("❌ Failed to create group:", err);
        res.status(500).json({ error: "Failed to create group" });
    }
});
router.post('/map-gateway-device', async (req, res) => {
    const { gateway_id, device_id } = req.body;

    if (!gateway_id || !device_id) {
        return res.status(400).json({ error: "Missing gateway_id or device_id" });
    }

    try {
        const result = await prisma.gateway_device.create({
            data: {
                gateway_id,
                device_id,
            }
        });
        res.status(201).json(result);
    } catch (err) {
        console.error("❌ Failed to map device to gateway:", err);
        res.status(500).json({ error: "Mapping failed" });
    }
});
router.delete('/:id', async (req, res) => {
    const id = req.params.id;

    try {
        // ลบ group → ลิงก์ device → ลิงก์ gateway จะถูกจัดการ cascade ใน Prisma (หากตั้งไว้)
        await prisma.device_group.delete({
            where: { group_id: id }
        });

        res.sendStatus(204);
    } catch (err) {
        console.error("❌ Failed to delete group:", err);
        res.status(500).json({ error: "Failed to delete group" });
    }
});
export default router