// src/components/Column.tsx
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import PushPinIcon from "@mui/icons-material/PushPin";   // ไอคอนหมุด
import Card from "./Card";
import type { Column as ColumnType } from "../type/type";

interface ColumnProps {
    column: ColumnType;
}

export default function Column({ column }: ColumnProps) {
    return (
        <Box px={10} pb={10}>
            {/* ===== หัวคอลัมน์ ===== */}
            < Box
                sx={{
                    bgcolor: "#507d2a",         // สีเขียวเข้ม
                    color: "common.white",
                    py: 1,
                    borderRadius: 2,
                    display: "inline-flex",
                    alignItems: "center",
                    mb: 2,
                    width: '100%'
                }}
            >
                <PushPinIcon fontSize="small" sx={{ mr: 1, ml: 3 }} />
                <Typography variant="h6" fontWeight={700}>
                    {column.title}
                </Typography>
            </Box >

            {/* ===== การ์ดอุปกรณ์ ===== */}
            < Grid
                container
                rowSpacing={3}        // ระยะ “บน-ล่าง”
                columnSpacing={3}    // ระยะ “ซ้าย-ขวา”
            >
                {
                    column.cards.map((c) => (
                        <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            {/* ให้การ์ดกว้างเต็มช่อง จะไม่ล้น / ทับเงาอีก */}
                            <Card card={c} />
                        </Grid>
                    ))
                }
            </Grid >
        </Box >
    );
}
