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
    status,
    selectedStation,
}) {
    const { TabOn , titlePageNested } = useAdminContext()

    const [ selectedTab , setSelectedTab ] = useState(0)

    const [ startDate , setStartDate ] = useState(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7))
    const [ endDate , setEndDate ] = useState(new Date())

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

        titlePageNested(70, 30, [
            "หน้าแรก",
            "รายงานข้อมูล",
            "สถิติการเข้าใช้งานระบบ",
        ])
        TabOn.addTimeOut(TabOn.end());
    }, [HrefPage, status, titlePageNested, TabOn])

    return(
        <Grid container paddingLeft={2} paddingRight={2} spacing={2} sx={{ overflowY : "auto" }}>
            <Grid container size={{ xs : 12 }}>
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