// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Box, Typography } from "@mui/material";
import Column from "../components/Column";
import type { Column as ColumnType, Status } from "../type/type";

const socket = io("http://localhost:3000"); // เปลี่ยนเป็น endpoint ที่คุณใช้งานจริง

export default function Dashboard() {
    const [columns, setColumns] = useState<ColumnType[]>([]);

    useEffect(() => {
        // ฟังข้อมูล initial column (กลุ่ม + device)
        socket.on("init:columns", (data: ColumnType[]) => {
            console.log("📦 Column data from backend", data);
            setColumns(data);
        });

        // ฟังเมื่อมีการเปลี่ยนสถานะ
        socket.on("status:update", (data) => {
            console.log("🛰️ Received status:update", JSON.stringify(data, null, 2));

            setColumns(prev => {
                const updated = prev.map(col => ({
                    ...col,
                    cards: col.cards.map(card => {
                        const dev = data.devStatus[card.id];
                        const gw = data.gwStatus[card.id];

                        if (dev || gw) {
                            const { status, time } = dev ?? gw!;
                            console.log(`🔄 Updating card: ${card.id} → status: ${status}, time: ${time}`);
                            return {
                                ...card,
                                status: status as Status,
                                time: time ?? null,
                            };
                        }

                        return card;
                    })
                }));
                console.log("✅ Updated columns state:", updated);
                return updated;
            });
        });


        return () => {
            socket.off("init:columns");
            socket.off("status:update");
        };
    }, []);
    return (
        <Box sx={{ bgcolor: "#fefef8", minHeight: "100vh", width: "100vw" }}>
            <Box sx={{ display: "flex", justifyContent: "center", p: "40px", textAlign: "center" }}>
                <Typography color="#507d2a" fontSize={"clamp(20px,5vw,32px)"} fontWeight={600}>
                    Real-time Device Status Dashboard
                </Typography>
            </Box>
            {
                columns.map((col) => (
                    <Column key={col.id} column={col} />
                ))
            }
        </Box >
    );
}
