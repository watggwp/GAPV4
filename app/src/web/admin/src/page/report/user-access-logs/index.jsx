import React, { useCallback, useEffect, useState } from "react";
import RequestAPI from "../../../../../../assets/js/requestAPI";
import { useAdminContext } from "../../../Admin";
import { Grid, MenuItem, Select, Stack, Tab, Tabs } from "@mui/material";
import UserLogs from "./logs";
import env from "../../../../../../env";

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
        <Stack paddingLeft={2} paddingRight={2} spacing={2}>
            <Grid container spacing={2}>
                <Grid size={{ sm : 12 , md : 6 }}>
                    <Select
                        displayEmpty
                        value={selectedStation}
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
            </Grid>
            <Tabs
                value={selectedTab}
                onChange={onSelectedTab}
            >
                <Tab label="หมอพืช" />
                <Tab label="เกษตรกร" />
            </Tabs>
            <UserLogs
                userType={mapping_user_type[mapping_tab[selectedTab]]}
                selectedStation={selectedStation}
            />
        </Stack>
    )
}