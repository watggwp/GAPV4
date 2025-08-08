import React, { useCallback, useEffect, useRef, useState } from "react";
import RequestAPI from "../../../../../../assets/js/requestAPI";
import { useAdminContext } from "../../../Admin";
import { Grid, MenuItem, Select, Stack, Tab, Tabs } from "@mui/material";
import UserLogs from "./logs";
import env from "../../../../../../env";
import DateRange from "../../../../../../assets/components/DateRange";

const { mapping_user_type } = env

const mapping_tab = {
    0 : "doctor",
    1 : "farmer"
}

export default function UserAccessLogs({
    HrefPage,
    status ,
}) {
    const { TabOn , titlePageNested } = useAdminContext()

    const [ stations , setStations ] = useState([])
    const [ selectedStation , setSelectedStation ] = useState("")
    const [ loadingStations , setLoadingStations ] = useState(true)

    const [ selectedTab , setSelectedTab ] = useState(0)

    const [ startDate , setStartDate ] = useState(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7))
    const [ endDate , setEndDate ] = useState(new Date())

    const requestStations = useCallback( async () => {
        setLoadingStations(true)
        const { data , status } = await RequestAPI.post("/api/admin/station/list")
        setLoadingStations(false)

        TabOn.addTimeOut(TabOn.end());
        switch(status) {
            case 200 :
                try {
                    setStations(data)
                } catch(err) {}
                break;
            default :
                break;
        }
    } , [TabOn])

    const onSelectedStation = useCallback((event) => 
        setSelectedStation(event.target.value)    
    , [])

    const onSelectedTab = useCallback((ev , value) => {
        setSelectedTab(value)
    } , [])

    const onChangeDate = useCallback((_startDate , _endDate) => {
        setStartDate(_startDate)
        setEndDate(_endDate)
    } , [])

    useEffect(() => {
        status.changePath && window.history.pushState(
            {},
            "",
            `/admin/${HrefPage.get().split("?")[0]}?${status.status}`
        )

        requestStations()

        titlePageNested(70, 30, [
            "หน้าแรก",
            "รายงานข้อมูล",
            "สถิติการเข้าใช้งานระบบ",
        ])
    }, [HrefPage, requestStations, status, titlePageNested])

    return(
        <Grid container paddingLeft={2} paddingRight={2} spacing={2} sx={{ overflowY : "auto" }}>
            <Grid container size={{ xs : 12 }}>
                <Grid size={{ sm : 12 , md : 6 }}>
                    <Select
                        displayEmpty
                        value={selectedStation}
                        size="small"
                        disabled={loadingStations}
                        onChange={onSelectedStation}
                        fullWidth
                        sx={{
                            marginTop : 1
                        }}
                    >
                        {
                            loadingStations ?
                                <MenuItem value="" disabled>
                                    กำลังโหลดศูนย์
                                </MenuItem> :
                                 <MenuItem value="">
                                    ศูนย์ทั้งหมด
                                </MenuItem>
                        }
                        {
                            stations.map(({ id , name }) => 
                                <MenuItem key={id} value={id}>{name}</MenuItem>
                            )
                        }
                    </Select>
                </Grid>
                <Grid size={{ sm : 12 , md : 6 }}>
                        <DateRange
                            startTime={startDate}
                            endTime={endDate}
                            onChangeRange={onChangeDate}
                            currentDayAgo={7}
                        />
                </Grid>
            </Grid>
            <Grid size={{ xs : 12 }}>
                <Tabs
                    value={selectedTab}
                    onChange={onSelectedTab}
                >
                    <Tab label="หมอพืช" />
                    <Tab label="เกษตรกร" />
                </Tabs>
            </Grid>
            <UserLogs
                userType={mapping_user_type[mapping_tab[selectedTab]]}
                selectedStation={selectedStation}
                startDate={startDate}
                endDate={endDate}
            />
        </Grid>
    )
}