import { useParams } from "react-router";
import SchedulePlantManagement from "../../../../../../assets/components/schedule-management/schedulePlants";
import { useDoctor } from "../../../Doctor";

export default function SchedulePlants() {
    const { plant_id } = useParams()
    const { profile } = useDoctor()

    return (
        <SchedulePlantManagement
            plant_id={plant_id}
            station_id={profile?.station_doctor}
        />
    )
}
