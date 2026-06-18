import React, { createContext, useCallback, useContext, useDeferredValue, useEffect, useState } from "react";
import { Button, Card, CardContent, Chip, Dialog, IconButton, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from "react-router";
import DialogSchedule from "./dialog";
import RequestAPI from "../../../js/requestAPI";
import DateGAP from "../../../core/DateGAP";

const CategorysMapping = {
    1 : "ปัจจัยการผลิต",
    2 : "การสังเกตโรค"
}

const SchedulePlantsContext = createContext({
    plant_id : "",
    station_id : ""
})

export default function SchedulePlantManagement({ plant_id , station_id }) {
    const navigator = useNavigate();

    const [ loadingPlantSchedules , setLoadingPlantSchedules ] = useState(true)
    const [ plantProfile , setPlantProfile ] = useState({})
    const [ plantSchedules , setPlantSchedules ] = useState([])
    const [ search , setSearch ] = useState("")
    const searchQuery = useDeferredValue(search)
    const [ openDialog , setOpenDialog ] = useState({ type : "", id : "", in : false })

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const onChangeSearch = useCallback(({ target : { value } }) => {
        setSearch(value)
    } , [])

    const requestSchedulePlants = useCallback( async () => {
        setLoadingPlantSchedules(true)
        const { status , data } = await RequestAPI.get(`/api/schedules/${plant_id}` , {
            station_id : station_id,
            s : searchQuery
        })
        setLoadingPlantSchedules(false)

        switch(status) {
            case 200 :
                const { plant_profile , schedule_plants } = data
                setPlantProfile(plant_profile)
                setPlantSchedules(schedule_plants)
                break;
            default :
                break;
        }
    } , [plant_id, searchQuery, station_id])

    const onOpenInsert = useCallback(() => {
        setOpenDialog({ type : "insert", in : true })
    } , [])

    const onOpenDetail = useCallback((schedule_id) => {
        setOpenDialog({ type : "edit", id : schedule_id, in : true })
    } , [])

    const onCloseDialog = useCallback(() => {
        setOpenDialog((_open) => {
            _open.in = false
            return { ..._open }
        })
    } , [])

    useEffect(() => {
        requestSchedulePlants()
    } , [requestSchedulePlants])

    return(
        <SchedulePlantsContext.Provider value={{ plant_id, station_id }}>
            <Stack width={"100%"} height={"100%"} spacing={2} padding={2}>
                <Dialog
                    open={openDialog.in}
                    slotProps={{
                        paper : {
                            sx : {
                                margin : 0,
                                width : "calc(100% - 16px)" ,
                                maxWidth : "600px"
                            }
                        }
                    }}
                >
                    <DialogSchedule
                        type={openDialog.type}
                        schedule_id={openDialog.id}
                        onClose={onCloseDialog}
                        requestSchedulePlants={requestSchedulePlants}
                    />
                </Dialog>
                {/* Header */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent={{ sm: "space-between" }}
                    alignItems={{ sm: "center" }}
                    spacing={1}
                >
                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton size="small" onClick={() => navigator(-1)} sx={{ border: '1px solid #189D85', padding: '6px' }}>
                            <ArrowBackIcon color="primary" />
                        </IconButton>
                        <Chip label={plantProfile.name} variant="outlined" color="primary" sx={{ fontSize: 18, alignSelf: 'flex-start' }} />
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                            placeholder="ค้นหา"
                            size="small"
                            onChange={onChangeSearch}
                            sx={{ flex: 1, minWidth: 0 }}
                        />
                        <IconButton size="small" onClick={onOpenInsert}>
                            <AddCircleIcon color="primary" sx={{ width: 30, height: 30 }} />
                        </IconButton>
                    </Stack>
                </Stack>

                {/* Content */}
                {isMobile ? (
                    <Stack spacing={1.5} sx={{ overflowY: 'auto', flex: 1 }}>
                        {loadingPlantSchedules ? (
                            <Typography textAlign="center" color="text.secondary">กำลังโหลด...</Typography>
                        ) : plantSchedules.length === 0 ? (
                            <Typography textAlign="center" color="text.secondary">ไม่มีข้อมูล</Typography>
                        ) : plantSchedules.map((row) => (
                            <Card key={row.uid} variant="outlined">
                                <CardContent sx={{ pb: '12px !important' }}>
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            <Chip
                                                size="small"
                                                label={`${row.repeat ? "ทุกๆ " : ""}${row.age_plant} วัน`}
                                            />
                                            <Chip
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                label={CategorysMapping[row.category]}
                                            />
                                        </Stack>
                                        <Typography variant="body2" fontWeight="bold">{row.title}</Typography>
                                        <MobileScheduleDetail row={row} />
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="small"
                                            onClick={() => onOpenDetail(row.uid)}
                                        >
                                            คลิกดูรายละเอียด
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                ) : (
                    <DataGrid
                        columns={[
                            {
                                field : "age_plant",
                                headerName : "อายุ",
                                flex : 1,
                                minWidth : 100,
                                renderCell : ({ row , value }) => (
                                    <Stack height={"100%"} justifyContent={"center"}>
                                        { row.repeat ? "ทุกๆ" : "" } {value} วัน
                                    </Stack>
                                )
                            },
                            {
                                field : "category",
                                headerName : "ประเภท",
                                flex : 1.5,
                                minWidth : 150,
                                renderCell : ({ value }) => (
                                    <Stack justifyContent={"center"}>
                                        {CategorysMapping[value]}
                                    </Stack>
                                )
                            },
                            {
                                field : "title",
                                headerName : "หัวข้อ",
                                flex : 2,
                                minWidth : 200,
                            },
                            {
                                field : "details",
                                headerName : "รายละเอียด",
                                flex : 3,
                                minWidth : 300,
                                renderCell : ({ row , value : details }) => {
                                    const value = JSON.parse(details) || {}
                                    return (
                                        <Stack direction={"row"} spacing={1} width={"100%"} height={"100%"} alignItems={"center"}>
                                            {
                                                row.category === 1 ?
                                                    <React.Fragment>
                                                        <Chip color="primary" variant="outlined" label={`ชื่อ: ${value.name_fertilizer}`} />
                                                        <Chip color="primary" variant="outlined" label={`สูตร: ${value.formula_fertilizer}`} />
                                                        <Chip color="primary" variant="outlined" label={`ปริมาณ: ${value.volume} ${value.unit_volume}`} />
                                                        <Chip color="primary" variant="outlined" label={`วิธีใช้: ${value.how_use}`} />
                                                    </React.Fragment> :
                                                row.category === 2 ?
                                                    <React.Fragment>
                                                        <Chip color="primary" variant="outlined" label={`โรคพืช: ${value.pest}`} />
                                                        <Chip color="primary" variant="outlined" label={`สารเคมี: ${value.chemical}`} />
                                                        <Chip color="primary" variant="outlined" label={`อัตราส่วน: ${value.rate}/น้ำ20ลิตร`} />
                                                        <Chip color="primary" variant="outlined" label={`ปริมาณ: ${value.volume} ${value.unit_volume}`} />
                                                        <Chip color="primary" variant="outlined" label={`วิธีใช้: ${value.how_use}`} />
                                                    </React.Fragment> :
                                                    <></>
                                            }
                                        </Stack>
                                    )
                                }
                            },
                            {
                                field : "last_update",
                                headerName : "วันที่แก้ไขล่าสุด",
                                flex : 1.5,
                                minWidth : 150,
                                renderCell : ({ value }) => new DateGAP(value).format2Str("DD-MM-YYYY HH:II:SS")
                            },
                            {
                                field : "manage",
                                headerName : "",
                                flex : 2,
                                minWidth : 200,
                                renderCell : ({ row }) => (
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => onOpenDetail(row.uid)}
                                    >
                                        คลิกดูรายละเอียด
                                    </Button>
                                )
                            },
                        ]}
                        rows={plantSchedules}
                        loading={loadingPlantSchedules}
                        hideFooterPagination
                        hideFooter
                    />
                )}
            </Stack>
        </SchedulePlantsContext.Provider>
    )
}

function MobileScheduleDetail({ row }) {
    const details = JSON.parse(row.details) || {}
    if (row.category === 1) {
        return (
            <Typography variant="caption" color="text.secondary">
                {details.name_fertilizer} | {details.formula_fertilizer} | {details.volume} {details.unit_volume}
            </Typography>
        )
    }
    if (row.category === 2) {
        return (
            <Typography variant="caption" color="text.secondary">
                {details.pest} → {details.chemical}
            </Typography>
        )
    }
    return null
}

export function useSchedulePlants() {
    return useContext(SchedulePlantsContext)
}
