"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyDeviceOnline = notifyDeviceOnline;
exports.notifyDeviceOffline = notifyDeviceOffline;
// src/services/line-notify.service.ts
const node_fetch_1 = __importDefault(require("node-fetch"));
const LINE_API_BASE = process.env.LINE_API_BASE || `http://localhost:${process.env.GAP_PORT}`;
async function notifyDeviceOnline(device_id) {
    try {
        await (0, node_fetch_1.default)(`${LINE_API_BASE}/api/line/notify/device-online`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_id }),
        });
    }
    catch (e) {
        console.error("[LINE] notify online failed:", e);
    }
}
async function notifyDeviceOffline(device_id) {
    try {
        await (0, node_fetch_1.default)(`${LINE_API_BASE}/api/line/notify/device-offline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_id }),
        });
    }
    catch (e) {
        console.error("[LINE] notify offline failed:", e);
    }
}
