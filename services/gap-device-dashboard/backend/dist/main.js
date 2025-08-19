"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
// src/main.ts
const dotenv_1 = __importDefault(require("dotenv"));
const dotenv_expand_1 = __importDefault(require("dotenv-expand"));
dotenv_expand_1.default.expand(dotenv_1.default.config());
// ⚡ ตัวอย่าง: start mqtt listener
require("./ttn-listener/mqtt.listener");
require("./ttn-listener/gateway.listener");
require("./log-to-sheet/google-logger");
require("./utils/logdaily");
// ถ้าจะมี Express / NestJS ให้ bootstrap ที่นี่
console.log("Backend started");
// api
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const frontend = process.env.FRONTEND;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: frontend, // หรือระบุ origin ของ frontend เช่น http://localhost:5173
        methods: ['GET', 'POST']
    }
});
exports.io = io;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const group_controller_1 = __importDefault(require("./api/group.controller"));
const device_controller_1 = __importDefault(require("./api/device.controller"));
const gateway_controller_1 = __importDefault(require("./api/gateway.controller"));
const dashboard_service_1 = require("./services/dashboard.service"); // 🔸 คุณต้องสร้างไฟล์นี้
const auth_controller_1 = __importDefault(require("./api/auth.controller"));
io.on('connection', async (socket) => {
    console.log('[Socket] client connected:', socket.id);
    const columns = await (0, dashboard_service_1.getColumnData)(); // ดึงจาก DB แล้วจัด group
    socket.emit('init:columns', columns);
});
app.use('/api/groups', group_controller_1.default);
app.use('/api/devices', device_controller_1.default);
app.use('/api/gateways', gateway_controller_1.default);
app.use("/api", auth_controller_1.default);
server.listen(process.env.PORT, () => {
    console.log('Server listening on port 3000');
});
