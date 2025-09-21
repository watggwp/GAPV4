import { useNavigate, useParams } from "react-router";
import { MenuItem, Select, Stack, TextField } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import SchedulesPlanManagement from "../../../../../assets/components/schedule-management/schedules";
import RequestAPI from "../../../../../assets/js/requestAPI";
import { Grid } from "@mui/system";

export default function SchedulesPlanStation() {
    const { station_id } = useParams()
    const navigator = useNavigate()

    const [ stations , setStations ] = useState([])
    const [ loadingStations , setLoadingStations ] = useState(true)

    const [ stationID , setStationID ] = useState(station_id || "")

    const [ hasTotalSchedule , setHasTotalSchedule ] = useState(true)

    const requestStations = useCallback( async () => {
        setLoadingStations(true)
        const { data , status } = await RequestAPI.post("/api/admin/station/list")
        setLoadingStations(false)

        switch(status) {
            case 200 :
                try {
                    setStations(data)
                    const { id } = data[0] || {}
                    
                    if(!stationID) {
                        setStationID(id)
                        navigator(`/admin/schedules/${id}` , { replace : true })
                    }
                } catch(err) {}
                break;
            default :
                break;
        }
    } , [navigator])

    const onSelectedStation = useCallback((event) => {
        setStationID(event.target.value)
        navigator(`/admin/schedules/${event.target.value}`)
    } , [navigator])

    const onClickSelectedPlan = useCallback((plant_id) => {
        navigator(`/admin/schedules/${stationID}/${plant_id}`)
    } , [navigator, stationID])

    const onChangeSelectTypeSchedule = useCallback(({ target : { value } }) => {
        setHasTotalSchedule(value)
    } , [])

    useEffect(() => {
        requestStations()
    } , [requestStations])

    return(
        <Stack height={"100%"} width={"100%"} spacing={2} padding={2}>
            <Grid container size={{ xs : 12 }}>
                <Grid size={{ sm : 12 , md : 6 }}>
                    <Stack spacing={1}>
                        <Select
                            displayEmpty
                            value={stationID}
                            size="small"
                            disabled={loadingStations}
                            onChange={onSelectedStation}
                            fullWidth
                        >
                            {
                                loadingStations ?
                                    <MenuItem value="" disabled>
                                        กำลังโหลดศูนย์
                                    </MenuItem> :
                                    <MenuItem value="" disabled>
                                        เลือกศูนย์
                                    </MenuItem>
                            }
                            {
                                stations.map(({ id , name }) => 
                                    <MenuItem key={id} value={id}>{name}</MenuItem>
                                )
                            }
                        </Select>
                        <Select
                            value={hasTotalSchedule}
                            size="small"
                            onChange={onChangeSelectTypeSchedule}
                        >
                            <MenuItem value={true}>กำหนดแผนการปลูกแล้ว</MenuItem>
                            <MenuItem value={false}>ยังไม่กำหนดแผนการปลูกแล้ว</MenuItem>
                        </Select>
                    </Stack>
                </Grid>
                <Grid size={{ sm : 12 , md : 6 }} textAlign={"end"}>
                    <TextField
                        placeholder="ค้นหา"
                        size="small"
                    />
                </Grid>
            </Grid>
            {
                stationID && 
                    <SchedulesPlanManagement
                        station_id={stationID}
                        onClickOpenSchedule={onClickSelectedPlan}
                        hasTotalSchedule={hasTotalSchedule}
                    />
            }
        </Stack>
    )
}