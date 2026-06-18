import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@mui/material";
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
                    RoyalGapFrontendUtil.GetMatchSearch(
                        data,
                        option
                    )
                )
                break;
            default :
                break;
        }
    } , [hasTotalSchedule, station_id])

    useEffect(() => {
        requestPlantSchedules()
    } , [requestPlantSchedules])

    return(
        <SchedulesPlanContext.Provider
            value={{
                onClickOpenSchedule
            }}
        >
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
                rows={
                    searchText ?
                        plantFuse?.search(searchText)?.map(({ item }) => item) :
                        plants
                }
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
        <Button
            fullWidth
            variant="contained"
            onClick={onClick}
        >
            จัดการแผนการปลูก
        </Button>
    )
}