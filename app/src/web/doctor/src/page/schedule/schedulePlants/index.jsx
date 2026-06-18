import { useNavigate, useParams } from "react-router";
import SchedulePlantManagement from "../../../../../../assets/components/schedule-management/schedulePlants";
import { useDoctor } from "../../../Doctor";
import { useCallback } from "react";

export default function SchedulePlants() {
    const { plant_id } = useParams()
    const { profile } = useDoctor()
    const navigator = useNavigate()

    const onBack = useCallback(() => navigator("/doctor/schedules"), [navigator])

    return (
        <SchedulePlantManagement
            plant_id={plant_id}
            station_id={profile?.station_doctor}
            onBack={onBack}
        />
    )
}
