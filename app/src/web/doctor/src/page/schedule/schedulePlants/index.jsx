import React, { useCallback, useDeferredValue, useEffect, useState } from "react";
import RequestAPI from "../../../../../../assets/js/requestAPI";
import { useParams } from "react-router";
import { Button, Chip, Dialog, IconButton, Stack, TextField } from "@mui/material";
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
    const [ plantSchedules , setPlantSchedules ] = useState([])

    const [ search , setSearch ] = useState("")
    const searchQuery = useDeferredValue(search)

    const [ openDialog , setOpenDialog ] = useState({
        type : "",
        id : "",
        in : false
    })

    const onChangeSearch = useCallback(({ target : { value } }) => {
        setSearch(value)
    } , [])

    const requestSchedulePlants = useCallback( async () => {
        setLoadingPlantSchedules(true)
        const { status , data } = await RequestAPI.get(`/api/schedules/${plant_id}` , {
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
    } , [plant_id, searchQuery])

    const onOpenInsert = useCallback(() => {
        setOpenDialog({
            type : "insert",
            in : true
        })
    } , [])

    const onOpenDetail = useCallback((schedule_id) => {
        setOpenDialog({
            type : "edit",
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
            <Dialog 
                open={openDialog.in}
                slotProps={{
                    paper : {
                        sx : {
                            width : "98%",
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
            <Stack direction={"row"} justifyContent={"space-between"}>
                <Chip label={plantProfile.name} variant="outlined" color="primary" sx={{ fontSize : 20 }} />
                <Stack spacing={2} direction={"row"} alignItems={"center"}>
                    <TextField
                        placeholder="ค้นหา"
                        size="small"
                        onChange={onChangeSearch}
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
                        renderCell : ({ row , value : details }) => {
<<<<<<< HEAD
                            const value = JSON.parse(details)?.[0] || {}
=======
                            const value = JSON.parse(details) || {}
>>>>>>> b28deb0cc31480068be68f7e5053b16216c0f1b7
                            return (
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
                                                    label={`วิธีการใช้: ${value.how_use}`}
                                                />
                                            </React.Fragment> :
                                        row.category === 2 ?
                                            <React.Fragment>
<<<<<<< HEAD
=======
                                                <Chip
                                                    color="primary"
                                                    variant="outlined"
                                                    label={`โรคพืช: ${value.pest}`}
                                                />
                                                <Chip
                                                    color="primary"
                                                    variant="outlined"
                                                    label={`สารเคมี: ${value.chemical}`}
                                                />
                                                <Chip
                                                    color="primary"
                                                    variant="outlined"
                                                    label={`ปริมาณ: ${value.volume} ${value.unit_volume}`}
                                                />
>>>>>>> b28deb0cc31480068be68f7e5053b16216c0f1b7
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
        </Stack>
    )
}