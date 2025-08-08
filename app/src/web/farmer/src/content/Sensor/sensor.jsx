import { Stack } from "@mui/material";
import WeatherManagement from "../../../../../assets/components/weather-management";
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";


export default function SensorGreenhouse() {

    const { greenhouse_id , gap_id , device_id } = useParams()
    const navigator = useNavigate()

    const onReturn = useCallback(() =>
        navigator(`/farmer/form/${greenhouse_id}/${gap_id}/sensor`)
    , [gap_id, greenhouse_id, navigator])

    return(
        <section id="weather-sensor-farmer">
            <div className="head">
                <div
                    className="return"
                    onClick={onReturn}
                >
                    <svg fill="#000000" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                    <g fillRule="evenodd">
                        <path d="M1052 92.168L959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z" />
                        <path d="M1920 92.168L1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z" />
                    </g>
                    </svg>
                </div>
                <span>สภาพอากาศในโรงเรือน</span>
            </div>
            <Stack height={"calc(100% - 55px)"} width={"100%"} overflow={"scroll"}>
                <WeatherManagement
                    endpointData={`/api/sensor/weather-greenhouse/${greenhouse_id}/${device_id}`}
                    query={{
                        r : "farmer"
                    }}
                    columnTimestamp="timestamp"
                    columns={[
                        { field: 'air_temperature', name: 'อุณหภูมิ' , color : "green" },
                        { field: 'air_humidity', name: 'ความชื้น' , color : "yellow" },
                        { field: 'light', name: 'แสง' , color : "orange" },
                        { field: 'soil_temperature', name: 'อุณหภูมิดิน' , color : "red" },
                        { field: 'soil_humidity', name: 'ความชื้นดิน' , color : "blue" },
                        { field: 'pressure', name: 'ความกดอากาศ' , color : "#4a4573" }
                    ]}
                />
            </Stack>
        </section>
    )
}