"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/auth.controller.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user)
        return res.status(401).json({ error: "user not found" });
    const isValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isValid)
        return res.status(401).json({ error: "wrong password" });
    res.json({ id: user.id, username: user.username });
});
exports.default = router;
