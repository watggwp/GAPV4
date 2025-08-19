import { useCallback, useEffect, useState } from "react";
import RequestAPI from "../../../../../assets/js/requestAPI";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Stack, TextField } from "@mui/material";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { useNavigate } from "react-router";

export default function SchedulePlant() {
    const [ plants , setPlants ] = useState([])
    const [ loadingPlants , setLoadingPlants ] = useState(false)

    const requestPlantSchedules = useCallback( async () => {
        setLoadingPlants(true)
        const { status , data } = await RequestAPI.get("/api/schedules")
        setLoadingPlants(false)

        switch(status) {
            case 200 :
                setPlants(data)
                break;
            default :
                break;
        }
    } , [])

    useEffect(() => {
        requestPlantSchedules()
    } , [requestPlantSchedules])

    return(
        <Stack height={"100%"} width={"100%"} spacing={2} padding={2}>
            <Stack alignItems={"end"}>
                <TextField
                    placeholder="ค้นหา"
                    size="small"
                />
            </Stack>
            <DataGrid
                columns={[
                    {
                        field : "name",
                        headerName : "ชนิดพืช",
                        flex : 2,
                        minWidth : 200
                    },
                    {
                        field : "total_schedule",
                        headerName : "จำนวนขั้นตอน",
                        flex : 1.5,
                        minWidth : 150,
                        align : "center",
                        headerAlign : "center"
                    },
                    {
                        field : "manage",
                        headerName : "",
                        flex : 3,
                        minWidth : 300,
                        renderCell: ButtonOpenSchedule
                    }
                ]}
                rows={plants}
                loading={loadingPlants}
                hideFooterPagination
                hideFooter
            />
        </Stack>
    )
}

function ButtonOpenSchedule({ row : { id } }) {

    const navigator = useNavigate()

    const onClick = useCallback(() => {
        navigator(`/doctor/schedules/${id}`)
    } , [id, navigator])

    return(
        <Button
            fullWidth
            variant="contained"
            onClick={onClick}
        >
            จัดการแผนการปลูก
        </Button>
    )
}