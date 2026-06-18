import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Card, CardContent, Chip, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import RequestAPI from "../../js/requestAPI";
import RoyalGapFrontendUtil from "../../core/RoyalGapUtil";

const SchedulesPlanContext = createContext({
    onClickOpenSchedule : () => {}
})

const option = {
    keys : ["name"],
    threshold : 0.7
}

export default function SchedulesPlanManagement({ station_id , onClickOpenSchedule , hasTotalSchedule , searchText }) {
    const [ plants , setPlants ] = useState([])
    const [ plantFuse , setPlantFuse ] = useState(undefined)
    const [ loadingPlants , setLoadingPlants ] = useState(false)

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const requestPlantSchedules = useCallback( async () => {
        setPlants([])
        setLoadingPlants(true)
        const { status , data } = await RequestAPI.get("/api/schedules" , {
            station_id,
            has_total_schedule : hasTotalSchedule ? 1 : 0
        })
        setLoadingPlants(false)

        switch(status) {
            case 200 :
                setPlants(data)
                setPlantFuse(
                    RoyalGapFrontendUtil.GetMatchSearch(data, option)
                )
                break;
            default :
                break;
        }
    } , [hasTotalSchedule, station_id])

    useEffect(() => {
        requestPlantSchedules()
    } , [requestPlantSchedules])

    const filteredPlants = searchText
        ? plantFuse?.search(searchText)?.map(({ item }) => item) ?? []
        : plants

    if (isMobile) {
        return (
            <Stack spacing={1.5} sx={{ overflowY: 'auto', flex: 1 }}>
                {loadingPlants ? (
                    <Typography textAlign="center" color="text.secondary">กำลังโหลด...</Typography>
                ) : filteredPlants.length === 0 ? (
                    <Typography textAlign="center" color="text.secondary">ไม่มีข้อมูล</Typography>
                ) : filteredPlants.map((row) => (
                    <Card key={row.id} variant="outlined">
                        <CardContent sx={{ pb: '12px !important' }}>
                            <Stack spacing={1}>
                                <Typography fontWeight="bold">
                                    {row.name}{row.variety_name ? ` (${row.variety_name})` : ""}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={`จำนวนขั้นตอน: ${row.total_schedule}`}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ alignSelf: 'flex-start' }}
                                />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="small"
                                    onClick={() => onClickOpenSchedule(row.id)}
                                >
                                    จัดการแผนการปลูก
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        )
    }

    return(
        <SchedulesPlanContext.Provider value={{ onClickOpenSchedule }}>
            <DataGrid
                columns={[
                    {
                        field : "name",
                        headerName : "ชนิดพืช",
                        flex : 2,
                        minWidth : 200,
                        renderCell : ({ value , row : { variety_name } }) => `${value} ${variety_name ? `(${variety_name})` : ""}`
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
                rows={filteredPlants}
                loading={loadingPlants}
                hideFooterPagination
                hideFooter
            />
        </SchedulesPlanContext.Provider>
    )
}

function ButtonOpenSchedule({ row : { id } }) {
    const { onClickOpenSchedule } = useContext(SchedulesPlanContext)
    const onClick = useCallback(() => {
        onClickOpenSchedule(id)
    } , [id, onClickOpenSchedule])

    return(
        <Button fullWidth variant="contained" onClick={onClick}>
            จัดการแผนการปลูก
        </Button>
    )
}
