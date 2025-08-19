import { Card as MUICard, CardContent, Box, Typography } from "@mui/material";
import type { Card as CardType, Status } from "../type/type";
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc)
dayjs.extend(tz)

interface CardProps {
    card: CardType
}
const getStatusColor: Record<Status, string> = {
    ONLINE: "success.main",
    OFFLINE: "error.main",
    UNKNOWN: "grey.500"
}

export default function Card({ card }: CardProps) {
    return (
        <MUICard sx={{ maxWidth: "350px", borderRadius: 5, overflow: "hidden" }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between", // ← คุมซ้าย-ขวาชัวร์
                    px: 2,                            // padding ซ้าย-ขวาเท่ากันทุกใบ
                    py: 1,
                    bgcolor: "#d0c19a",
                }}
            >
                {/* ชื่ออุปกรณ์ (ยึดซ้าย) */}
                <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{
                        maxWidth: "65%",                // กันชื่อยาวดันสถานะ
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {card.id}
                </Typography>

                {/* จุด-สี + สถานะ (ยึดขวา) */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: getStatusColor[card.status as Status],
                        }}
                    />
                    <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ color: getStatusColor[card.status as Status] }}
                    >
                        {card.status}
                    </Typography>
                </Box>
            </Box>
            <CardContent>
                <Typography sx={{ color: 'text.secondary', mb: 0.5 }}>เวลาล่าสุด</Typography>

                {card.time !== null ? (
                    <Typography sx={{ fontSize: "16px" }}>
                        {dayjs(card.time).utc().tz('Asia/Bangkok').locale('th').format('D MMM YYYY เวลา HH:mm')}
                    </Typography>
                ) : (
                    <Typography sx={{ fontSize: "16px", fontWeight: 600 }}>
                        ยังไม่เคยเชื่อมต่อ
                    </Typography>
                )}
            </CardContent>
        </MUICard >
    )
}