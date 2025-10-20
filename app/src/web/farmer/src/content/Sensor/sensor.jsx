import { Stack, Box } from "@mui/material";
import WeatherManagement from "../../../../../assets/components/weather-management";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import RequestAPI from "../../../../../assets/js/requestAPI";

const statusColors = {
    online: "green",
    offline: "red"
}

const getStatusColor = (status) => {
    return statusColors[(status || "").toLowerCase()] || "gray"
};

export default function SensorGreenhouse() {

    const { greenhouse_id, gap_id, device_id } = useParams()
    const navigator = useNavigate()

    const [deviceStatus, setDeviceStatus] = useState("loading");

    const StatusColor = useMemo(() =>
        getStatusColor(deviceStatus)
        , [deviceStatus])

    const onReturn = useCallback(() =>
        navigator(`/farmer/form/${greenhouse_id}/${gap_id}/sensor`)
        , [gap_id, greenhouse_id, navigator])

    const CheckStatus = useCallback(async () => {
        try {
            const { data } = await RequestAPI.get(`/api/sensor/weather-greenhouse/${greenhouse_id}/${device_id}/status`, {
                r: "farmer"
            });

            setDeviceStatus(data.status || "offline");
        } catch (err) {
            console.error("Failed to fetch device status:", err);
            setDeviceStatus("offline");
        }
    }, [device_id, greenhouse_id])

    useEffect(() => {
        CheckStatus();
        const interval = setInterval(CheckStatus, 60000);
        return (() => clearInterval(interval));
    }, [greenhouse_id, device_id, CheckStatus]);

    return (
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
                <Box
                    sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: StatusColor,
                    }}
                />
            </div>
            <Stack height={"calc(100% - 55px)"} width={"100%"} overflow={"scroll"}>
                <WeatherManagement
                    endpointData={`/api/sensor/weather-greenhouse/${greenhouse_id}/${device_id}`}
                    query={{
                        r: "farmer"
                    }}
                    columnTimestamp="timestamp"
                    columns={[
                        { field: "air_temperature", name: "อุณหภูมิ ( ํC)", color: "#F28E2B", yDomain: [0, 60] },
                        { field: "air_humidity", name: "ความชื้น (%RH)", color: "#76B7B2", yDomain: [0, 100] },
                        { field: "light", name: "แสง (LUX)", color: "#ccad3fff", yDomain: [0, 200000] },
                        { field: "soil_temperature", name: "อุณหภูมิดิน ( ํC)", color: "#E15759", yDomain: [0, 60] },
                        { field: "soil_humidity", name: "ความชื้นดิน (%RH)", color: "#4E79A7", yDomain: [0, 100] },
                        { field: "pressure", name: "ความกดอากาศ (hPa)", color: "#B07AA1", yDomain: ['dataMin', 'dataMax'] },
                        { field: "batt", name: "แบตเตอรี่ (V)", color: "#59A14F", yDomain: [8, 15] },
                    ]}
                />
            </Stack>
        </section>
    )
}