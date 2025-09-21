import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import SchedulesPlanManagement from "../../../../../assets/components/schedule-management/schedules";
import { MenuItem, Select, Stack, TextField } from "@mui/material";

export default function SchedulesPlan() {
    const navigator = useNavigate()

    const [ hasTotalSchedule , setHasTotalSchedule ] = useState(true)

    const onClickSelectedPlan = useCallback((plant_id) => {
        navigator(`/doctor/schedules/${plant_id}`)
    } , [navigator])

    const onChangeSelectTypeSchedule = useCallback(({ target : { value } }) => {
        setHasTotalSchedule(value)
    } , [])

    return(
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
                />
            </Stack>
            <SchedulesPlanManagement
                onClickOpenSchedule={onClickSelectedPlan}
                hasTotalSchedule={hasTotalSchedule}
            />
        </Stack>
    )
}