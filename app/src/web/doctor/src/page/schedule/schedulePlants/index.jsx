import { useParams } from "react-router";
import SchedulePlantManagement from "../../../../../../assets/components/schedule-management/schedulePlants";

export default function SchedulePlants() {
    const { plant_id } = useParams()
    
    return(
        <SchedulePlantManagement
            plant_id={plant_id}
        />
    )
}