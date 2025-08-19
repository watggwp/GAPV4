// src/main.ts
import dotenv from 'dotenv';
import expand from 'dotenv-expand';
expand.expand(dotenv.config());
// ⚡ ตัวอย่าง: start mqtt listener
import "./ttn-listener/mqtt.listener";
import "./ttn-listener/gateway.listener"
import "./log-to-sheet/google-logger"
import './utils/logdaily';
// ถ้าจะมี Express / NestJS ให้ bootstrap ที่นี่
console.log("Backend started");
// api
import express from "express";
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const frontend = process.env.FRONTEND

const app = express()
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: frontend, // หรือระบุ origin ของ frontend เช่น http://localhost:5173
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());
export { io };

import groupRouter from './api/group.controller'
import deviceRouter from './api/device.controller';
import gatewayRouter from './api/gateway.controller';
import { getColumnData } from './services/dashboard.service'; // 🔸 คุณต้องสร้างไฟล์นี้
import authRoutes from "./api/auth.controller";
io.on('connection', async (socket) => {
    console.log('[Socket] client connected:', socket.id);

    const columns = await getColumnData(); // ดึงจาก DB แล้วจัด group
    socket.emit('init:columns', columns);
});

app.use('/api/groups', groupRouter);
app.use('/api/devices', deviceRouter);
app.use('/api/gateways', gatewayRouter);
app.use("/api", authRoutes);
server.listen(process.env.PORT, () => {
    console.log('Server listening on port 3000');
});
