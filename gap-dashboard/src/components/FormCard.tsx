// src/components/FormCard.tsx
import { Box, Paper } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
    icon: string;
    title: string;
    children: ReactNode;
    sx?: object; // ← เพิ่มตรงนี้
}

export default function FormCard({ icon, title, children, sx }: Props) {
    return (
        <Paper
            elevation={2}
            sx={{
                borderRadius: 2,
                overflow: "hidden",
                ...sx, // ← เพื่อรับ style จาก parent
            }}
        >
            <Box
                sx={{
                    bgcolor: "#d0c19a",
                    py: 1,
                    px: 2,
                    fontWeight: "bold",
                    color: "#2a2a2a",
                }}
            >
                {icon} {title}
            </Box>

            <Box sx={{ p: 2 }}>{children}</Box>
        </Paper>
    );
}