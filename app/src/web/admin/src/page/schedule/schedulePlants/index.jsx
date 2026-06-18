import { useNavigate, useParams } from "react-router";
import SchedulePlantManagement from "../../../../../../assets/components/schedule-management/schedulePlants";
import { useCallback } from "react";

export default function SchedulePlants() {
    const { station_id , plant_id } = useParams()
    const navigator = useNavigate()

    const onBack = useCallback(() => navigator(`/admin/schedules/${station_id}`), [navigator, station_id])

    return(
        <SchedulePlantManagement
            plant_id={plant_id}
            station_id={station_id}
            onBack={onBack}
        />
    )
}