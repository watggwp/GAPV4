import { useParams } from "react-router";
import SchedulePlantManagement from "../../../../../../assets/components/schedule-management/schedulePlants";

export default function SchedulePlants() {
    const { station_id , plant_id } = useParams()
    
    return(
        <SchedulePlantManagement
            plant_id={plant_id}
            station_id={station_id}
        />
    )
}