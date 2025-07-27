import React, { useCallback, useEffect, useState } from "react";
import RequestAPI from "../../../../../../assets/js/requestAPI";
import { useParams } from "react-router";
import { Button, Chip, IconButton, Stack, TextField, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DialogSchedule from "./dialog";
import DateGAP from "../../../../../../assets/core/DateGAP";

const CategorysMapping = {
    1 : "ปัจจัยการผลิต",
    2 : "การสังเกตโรค"
}

export default function SchedulePlants() {

    const { plant_id } = useParams()

    const [ loadingPlantSchedules , setLoadingPlantSchedules ] = useState(true)

    const [ plantProfile , setPlantProfile ] = useState({})
    const [ plantSchedules , setPlantSchedules ] = useState([
        {
            id : 1,
            age_plant : 4,
            category : 1,
            title : "ใส่ปุ๋ยให้พืช",
            details : {
                name_fertilizer : "ขี้ไก่",
                formula_fertilizer : "15-14-0",
                volume : 20,
                unit_volume : "กก.",
                is_use : "หว่านรอบโคนต้น"
            },
            last_update : new Date().getTime()
        },
        {
            id : 2,
            age_plant : 7,
            repeat : true,
            category : 1,
            title : "ใส่ปุ๋ยให้พืช",
            details : {
                name_fertilizer : "ขี้วัว",
                formula_fertilizer : "15-14-0",
                volume : 20,
                unit_volume : "กก.",
                is_use : "หว่านรอบต้น"
            },
            last_update : new Date().getTime()
        }
    ])

    const [ openDialog , setOpenDialog ] = useState({
        type : "",
        id : "",
        in : false
    })

    const requestSchedulePlants = useCallback( async () => {
        setLoadingPlantSchedules(true)
        const { status , data } = await RequestAPI.get(`/api/schedules/${plant_id}`)
        setLoadingPlantSchedules(false)

        switch(status) {
            case 200 :
                const { plant_profile , schedule_plants } = data
                setPlantProfile(plant_profile)
                // setPlantSchedules(schedule_plants)
                break;
            default :
                break;
        }
    } , [plant_id])

    const onOpenInsert = useCallback(() => {
        setOpenDialog({
            type : "insert",
            in : true
        })
    } , [])

    const onOpenDetail = useCallback((schedule_id) => {
        setOpenDialog({
            type : "insert",
            id : schedule_id,
            in : true
        })
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
        <Stack width={"100%"} height={"100%"} spacing={2} padding={2}>
            <DialogSchedule
                open={openDialog.in}
                type={openDialog.type}
                schedule_id={openDialog.id}
                onClose={onCloseDialog}
            />
            <Stack direction={"row"} justifyContent={"space-between"}>
                <Chip label={plantProfile.name} variant="outlined" color="primary" sx={{ fontSize : 20 }} />
                <Stack spacing={2} direction={"row"} alignItems={"center"}>
                    <TextField
                        placeholder="ค้นหา"
                        size="small"
                    />
                    <Stack>
                        <IconButton size="small" onClick={onOpenInsert}>
                            <AddCircleIcon color="primary" sx={{ width : 30 , height : 30 }} />
                        </IconButton>
                    </Stack>
                </Stack>
            </Stack>
            <DataGrid
                columns={[
                    {
                        field : "age_plant",
                        headerName : "อายุ",
                        flex : 1,
                        minWidth : 100,
                        renderCell : ({ row , value }) => (
                            <Stack
                                height={"100%"}
                                justifyContent={"center"}
                            >
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
                        renderCell : ({ row , value }) => (
                            <Stack direction={"row"} spacing={1} width={"100%"} height={"100%"} alignItems={"center"}>
                                {
                                    row.category === 1 ?
                                        <React.Fragment>
                                            <Chip
                                                color="primary"
                                                variant="outlined"
                                                label={`ชื่อ: ${value.name_fertilizer}`}
                                            />
                                            <Chip
                                                color="primary"
                                                variant="outlined"
                                                label={`สูตร: ${value.formula_fertilizer}`}
                                            />
                                            <Chip
                                                color="primary"
                                                variant="outlined"
                                                label={`ปริมาณ: ${value.volume} ${value.unit_volume}`}
                                            />
                                            <Chip
                                                color="primary"
                                                variant="outlined"
                                                label={`วิธีการใช้: ${value.is_use}`}
                                            />
                                        </React.Fragment> :
                                    row.category === 2 ?
                                        <React.Fragment>
                                        </React.Fragment> :
                                        <></>
                                }
                            </Stack>
                            // Object.entries(value).map(_detail => {
                            //     const [ title , value ] = _detail

                            //     const titleText = (
                            //         title === "name_fertilizer" ?
                            //             "ชื่อปัจจัยการผลิต" :
                            //         title === "formula_fertilizer" ?
                            //             "สูตรปัจจัยการผลิต" :
                            //         title === "volume" ?
                            //             "ปริมาณที่ต้องใช้"
                            //     )
                            //     return(
                            //         <Chip
                            //             label={
                            //                 ``
                            //             }
                            //         />
                            //     )
                            // })
                        )
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
                                onClick={() => onOpenDetail(row.id)}
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
        </Stack>
    )
}