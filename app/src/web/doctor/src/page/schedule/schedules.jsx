import { useCallback, useDeferredValue, useState } from "react";
import { useNavigate } from "react-router";
import SchedulesPlanManagement from "../../../../../assets/components/schedule-management/schedules";
import { MenuItem, Select, Stack, TextField } from "@mui/material";
import { useDoctor } from "../../Doctor";

export default function SchedulesPlan() {
    const navigator = useNavigate()
    const { profile } = useDoctor()

    const [search, setSearch] = useState()
    const defferredSearch = useDeferredValue(search)

    const [hasTotalSchedule, setHasTotalSchedule] = useState(true)

    const onClickSelectedPlan = useCallback((plant_id) => {
        navigator(`/doctor/schedules/${plant_id}`)
    }, [navigator])

    const onChangeSelectTypeSchedule = useCallback(({ target: { value } }) => {
        setHasTotalSchedule(value)
    }, [])

    return (
        <Stack height={"100%"} width={"100%"} spacing={2} padding={2}>
            <Stack direction={"row"} justifyContent={"space-between"}>
                <Select
                    value={hasTotalSchedule}
                    size="small"
                    onChange={onChangeSelectTypeSchedule}
                >
                    <MenuItem value={true}>กำหนดแผนการปลูกแล้ว</MenuItem>
                    <MenuItem value={false}>ยังไม่กำหนดแผนการปลูก</MenuItem>
                </Select>
                <TextField
                    placeholder="ค้นหา"
                    size="small"
                    onChange={({ target: { value } }) => setSearch(value)}
                />
            </Stack>
            <SchedulesPlanManagement
                station_id={profile?.station_doctor}
                onClickOpenSchedule={onClickSelectedPlan}
                hasTotalSchedule={hasTotalSchedule}
                searchText={defferredSearch}
            />
        </Stack>
    )
}
