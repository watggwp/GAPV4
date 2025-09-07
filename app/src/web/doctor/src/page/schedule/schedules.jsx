import { useCallback } from "react";
import { useNavigate } from "react-router";
import SchedulesPlanManagement from "../../../../../assets/components/schedule-management/schedules";
import { Stack, TextField } from "@mui/material";

export default function SchedulesPlan() {
    const navigator = useNavigate()

    const onClickSelectedPlan = useCallback((plant_id) => {
        navigator(`/doctor/schedules/${plant_id}`)
    } , [navigator])

    return(
        <Stack height={"100%"} width={"100%"} spacing={2} padding={2}>
            <Stack alignItems={"end"}>
                <TextField
                    placeholder="ค้นหา"
                    size="small"
                />
            </Stack>
            <SchedulesPlanManagement
                onClickOpenSchedule={onClickSelectedPlan}
            />
        </Stack>
    )
}