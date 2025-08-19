// src/api/gateway.controller.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
    const gateways = await prisma.gateway.findMany({
        include: {
            gateway_info: true,
            status: true,
            devices: {
                include: {
                    device: true // << เพิ่ม device ที่เชื่อมกับ gateway
                }
            },
        },
    });
    res.json(gateways);
});

router.post('/', async (req, res) => {
    const { gateway_id, name, api_key, tenant_domain, region, app_id, group_id } = req.body;

    const created = await prisma.gateway.create({
        data: {
            gateway_id,
            name,
            group: group_id ? { connect: { group_id } } : undefined, // ✅ connect group
            gateway_info: {
                create: {
                    api_key,
                    tenant_domain,
                    region,
                    app_id,
                }
            }
        }
    });

    res.status(201).json(created);
});

router.delete('/:id', async (req, res) => {
    const id = req.params.id;

    await prisma.gateway_info.delete({ where: { gateway_id: id } }).catch(() => { });
    await prisma.gateway_status.delete({ where: { gateway_id: id } }).catch(() => { });
    await prisma.gateway_device.deleteMany({ where: { gateway_id: id } }).catch(() => { });
    await prisma.gateway.delete({ where: { gateway_id: id } });

    res.sendStatus(204);
});
router.delete('/:gateway_id/devices/:device_id', async (req, res) => {
    const { gateway_id, device_id } = req.params;

    try {
        await prisma.gateway_device.delete({
            where: {
                gateway_id_device_id: {
                    gateway_id,
                    device_id
                }
            }
        });
        res.sendStatus(204);
    } catch (err) {
        console.error("❌ Failed to unlink device from gateway", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.put('/:id', async (req, res) => {
    const gateway_id = req.params.id;
    const { api_key, tenant_domain, group_id } = req.body;

    try {
        // อัปเดต gateway_info
        await prisma.gateway_info.update({
            where: { gateway_id },
            data: {
                api_key,
                tenant_domain,
            },
        });

        // อัปเดต group_id ใน table gateway (เช็คว่ามี group_id หรือไม่)
        await prisma.gateway.update({
            where: { gateway_id },
            data: {
                group: group_id ? { connect: { group_id } } : { disconnect: true }
            },
        });

        res.status(200).json({ message: "✅ Gateway updated" });
    } catch (err) {
        console.error("❌ Failed to update gateway:", err);
        res.status(500).json({ error: "Failed to update gateway" });
    }
});
export default router;
