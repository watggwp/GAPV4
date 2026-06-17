import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { IconButton, LinearProgress, Stack, Typography, Box, Button, Divider } from "@mui/material";
import env from "../../../../../env";
import { clientMo } from "../../../../../assets/js/moduleClient";
import RequestAPI from "../../../../../assets/js/requestAPI";
import TemplagePage from "../template/page";

const { icon: { history: History } } = env

// ใช้รูปภาพที่มีอยู่ใน public คล้ายหน้า MenuPlant
const imgPlant = "/plant_glow.jpg";
const imgFertilizer = "/fertilizer.jpg";
const imgChemical = "/chemical.jpg";
const imgHarvest = "/เก็บ.png";

const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

function formatThaiDate(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function addDays(dateString, days) {
    if (!dateString) return new Date();
    const d = new Date(dateString);
    d.setDate(d.getDate() + Number(days));
    return d;
}

export default function SchedulesPage() {
    const { greenhouse_id, gap_id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [plantName, setPlantName] = useState("");
    const [plantVariety, setPlantVariety] = useState("");
    const [hasVarieties, setHasVarieties] = useState(false);
    const [resolvedPlantId, setResolvedPlantId] = useState(null);
    const [datePlant, setDatePlant] = useState("");
    const [dateHarvest, setDateHarvest] = useState("");
    const [schedules, setSchedules] = useState([]);
    const [qtyHarvest, setQtyHarvest] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. ดึงข้อมูลแบบฟอร์ม GAP (วันปลูก, วันเก็บเกี่ยว, ชื่อพืช)
            const formRes = await clientMo.post("/api/farmer/formplant/select", { id_formplant: gap_id, id_farmhouse: greenhouse_id });
            const formData = typeof formRes === "string" ? JSON.parse(formRes) : formRes;
            if (!formData || !formData[0]) {
                setLoading(false);
                return;
            }

            const plant_name = formData[0].name_plant;
            const plant_variety = formData[0].name_varieties;
            setPlantName(plant_name);
            setPlantVariety(plant_variety || "");
            setDatePlant(formData[0].date_plant?.split(" ")?.[0] ?? "");
            setDateHarvest(formData[0].date_harvest ? formData[0].date_harvest.split(" ")[0] : "");

            // 2. ดึงรายการตารางงานที่ตั้งไว้ของพืชชนิดนี้ (ค้นหาจากชื่อพืชและสายพันธุ์)
            const res = await clientMo.post('/api/farmer/schedules/plant', {
                name_plant: plant_name,
                name_varieties: plant_variety,
                date_harvest: formData[0].date_harvest
            });
            const scheduleData = typeof res === "string" ? JSON.parse(res) : res;
            console.log("SCHEDULE DATA:", scheduleData);

            if (scheduleData) {
                setHasVarieties(scheduleData.has_varieties || false);
                setResolvedPlantId(scheduleData.resolved_plant_id || null);
                setQtyHarvest(scheduleData.qty_harvest ?? null);

                if (!formData[0].date_harvest && scheduleData.resolved_plant_id && scheduleData.qty_harvest != null && !scheduleData.has_varieties) {
                    const autoHarvest = addDays(formData[0].date_plant?.split(" ")?.[0] ?? null, scheduleData.qty_harvest);
                    setDateHarvest(autoHarvest.toISOString().split("T")[0]);
                }

                if (scheduleData.schedule_plants) {
                    const uniqueSchedules = [];
                    const seenKeys = new Set();

                    for (const schedule of scheduleData.schedule_plants) {
                        const key = `${schedule.id}_${schedule.category}_${schedule.age_plant}`;
                        if (!seenKeys.has(key)) {
                            seenKeys.add(key);
                            uniqueSchedules.push(schedule);
                        }
                    }

                    uniqueSchedules.sort((a, b) => {
                        if (a.category !== b.category) return a.category - b.category;
                        return (Number(a.age_plant) || 0) - (Number(b.age_plant) || 0);
                    });

                    const repeatCountByCategory = {};
                    const schedulesWithRepeat = uniqueSchedules.map((schedule) => {
                        const categoryKey = schedule.category;
                        repeatCountByCategory[categoryKey] = (repeatCountByCategory[categoryKey] || 0) + 1;
                        return {
                            ...schedule,
                            repeat_count: repeatCountByCategory[categoryKey]
                        };
                    });

                    setSchedules(schedulesWithRepeat);
                }
            }
        } catch (error) {
            console.error("Fetch Schedule Error:", error);
        }
        setLoading(false);
    }, [gap_id, greenhouse_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClose = () => {
        navigate(`/farmer/form/${greenhouse_id}/${gap_id}/p`);
    };

    // จำลองวันที่ด้านล่าง
    const now = new Date();
    const thaiShortMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    const shortMonth = thaiShortMonths[now.getMonth()];
    const formattedNow = `เวลา: ${now.getDate()} ${shortMonth} ${now.getFullYear() + 543} , ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} น.`;

    return (
        <TemplagePage
            title={
                <Stack direction="row" justifyContent="center" alignItems="center" width="100%">
                    <Typography fontSize="7vw" fontWeight="bold" color="#000000ff">แผนการปลูก</Typography>
                </Stack>
            }
            routerReturn={`/farmer/form/${greenhouse_id}/${gap_id}/p`}
        >
            <Box p={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                {loading ? (
                    <LinearProgress color="primary" sx={{ width: '100%' }} />
                ) : (
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: 400,
                            border: '3px solid #cce8d6',
                            borderRadius: '12px',
                            backgroundColor: '#fff',
                            p: 2,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                        }}
                    >
                        {/* Title */}
                        <Typography textAlign="center" fontSize="30px" fontWeight="bold" color="#2c2c2c" mb={plantVariety ? 0.5 : 2}>
                            {plantName || "ไม่พบข้อมูลพืช"}
                        </Typography>
                        {plantVariety ? (
                            <></>
                        ) : (!resolvedPlantId && hasVarieties) ? (
                            <Box
                                sx={{
                                    backgroundColor: '#fff3cd',
                                    border: '1px solid #ffeeba',
                                    borderRadius: '8px',
                                    p: 1.5,
                                    mb: 2,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography color="#856404" fontSize="22px" fontWeight="bold">
                                    ⚠️ หมอพืชยังไม่ได้ระบุสายพันธุ์พืช
                                </Typography>
                                <Typography fontSize="22px" color="#856404" mt={0.5}>
                                    กรุณารอเจ้าหน้าที่ระบุสายพันธุ์ <br /> เพื่อความถูกต้องของแผนการปลูก
                                </Typography>
                            </Box>
                        ) : null}

                        {/* 'ยังไม่มีแผนการปลูก' displayed above planting date if schedules length is 0 */}
                        {resolvedPlantId && schedules.length === 0 && (
                            <Box sx={{ my: 1, mb: 2, textAlign: 'center' }}>
                                <Typography color="#888" fontSize="22px">ยังไม่มีแผนการปลูก</Typography>
                            </Box>
                        )}

                        {/* Planting Item */}
                        {datePlant && !(!resolvedPlantId && hasVarieties) && (
                            <TimelineItem
                                img={imgPlant}
                                title="วันที่ปลูก"
                                date={formatThaiDate(datePlant)}
                                isTop={true}
                            />
                        )}

                        {/* Schedule Items */}
                        {resolvedPlantId && schedules.length > 0 && schedules.map((sch, idx) => {
                            const isFertilizer = sch.category === 1;
                            const isChemical = sch.category === 2;
                            const img = isFertilizer ? imgFertilizer : imgChemical;
                            const title = isFertilizer ? "วันที่ใส่ปุ๋ย" : "วันที่ใช้สารเคมี";
                            const repeatCount = sch.repeat_count || 1;

                            // จัดเตรียมรายละเอียด(Details)
                            let detailText = "";
                            try {
                                const details = JSON.parse(sch.details);
                                if (isFertilizer) {
                                    detailText = `${details.name_fertilizer ? `ชื่อปุ๋ย: ${details.name_fertilizer}` : ''} ${details.formula_fertilizer ? `สูตร: ${details.formula_fertilizer}` : ''} 
                                    ${details.volume ? `ปริมาณ: ${details.volume}` : ''} ${details.unit_volume || ''}
                                    ${details.how_use ? `วิธีใช้ : ${details.how_use}` : ''}`;
                                } else {
                                    detailText = `${details.pest ? `โรคพืช : ${details.pest}` : ''} ${details.chemical ? `สารเคมี : ${details.chemical}` : ''}  
                                    ${details.rate ? `อัตราส่วนผสม ${details.rate} CC/น้ำ20ลิตร` : ''} 
                                    ${details.volume ? `ปริมาณ ${details.volume}` : ''} ${details.unit_volume || ''}
                                    ${details.how_use ? `วิธีใช้ : ${details.how_use}` : ''}`;
                                }
                            } catch (e) { }

                            // คำนวณวันที่ต้องดำเนินการ
                            const targetDate = addDays(datePlant, sch.age_plant);

                            return (
                                <TimelineItem
                                    key={sch.id || idx}
                                    img={img}
                                    title={title}
                                    // repeat={`ครั้งที่ ${repeatCount}`}
                                    date={formatThaiDate(targetDate)}
                                    details={detailText}
                                />
                            );
                        })}

                        {/* Harvest Item */}
                        {dateHarvest && !(!resolvedPlantId && hasVarieties) && (
                            <TimelineItem
                                img={imgHarvest}
                                title="วันที่คาดว่าจะเก็บเกี่ยว"
                                date={formatThaiDate(dateHarvest)}
                                isTop={!datePlant && schedules.length === 0}
                            />
                        )}

                        {/* Footer */}
                        <Box mt={3} textAlign="center">
                            <Typography fontSize="18px" color="#888" mb={2}>
                                {formattedNow}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleClose}
                                sx={{
                                    bgcolor: '#5f916e',
                                    color: '#fff',
                                    borderRadius: '20px',
                                    px: 5,
                                    py: 0.5,
                                    fontSize: '22px',
                                    fontWeight: 'bold',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#4e7a5b', boxShadow: 'none' }
                                }}
                            >
                                ปิด
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
        </TemplagePage>
    );
}

function TimelineItem({ img, title, repeat, date, details, isTop }) {
    return (
        <Box>
            {!isTop && <Divider sx={{ borderStyle: 'dashed', my: 1.5, borderColor: '#d3bfae', borderWidth: '1px' }} />}
            <Stack direction="row" spacing={2} alignItems="center">
                <Box
                    component="img"
                    src={img}
                    sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '12px' }}
                />
                <Box flex={1}>
                    <Typography fontSize="22px" color="#5a9c7b" fontWeight="bold">
                        {title}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
                        {repeat && (
                            <Typography fontSize="18px" color="#e67e22" fontWeight="bold">
                                {repeat}
                            </Typography>
                        )}
                        <Typography fontSize="18px" color="#222">
                            {date}
                        </Typography>
                    </Stack>
                    {details && (
                        <Typography fontSize="18px" color="#222" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                            {details}
                        </Typography>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}
