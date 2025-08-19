// src/services/line-notify.service.ts
import fetch from "node-fetch";

const LINE_API_BASE =
    process.env.LINE_API_BASE || `http://localhost:${process.env.GAP_PORT}`;

export async function notifyDeviceOnline(device_id: string) {
    try {
        await fetch(`${LINE_API_BASE}/api/line/notify/device-online`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_id }),
        });
    } catch (e) {
        console.error("[LINE] notify online failed:", e);
    }
}

export async function notifyDeviceOffline(device_id: string) {
    try {
        await fetch(`${LINE_API_BASE}/api/line/notify/device-offline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_id }),
        });
    } catch (e) {
        console.error("[LINE] notify offline failed:", e);
    }
}
