import { Stack, Typography } from "@mui/material";
import WeatherManagement from "../../../../assets/components/weather-management";
import { useEffect, useState } from "react";
import { useCallback } from "react";
import RequestAPI from "../../../../assets/js/requestAPI";
import { Loading } from "../../../../assets/js/module";

export default function WeatherStation() {

    const [stationSignature, setStationSignature] = useState("")
    const [loadingProfile, setLoadingProfile] = useState(true)

    const requestStationSignature = useCallback(async () => {
        setLoadingProfile(true)
        const { data, status } = await RequestAPI.get("/api/farmer/profile")
        setLoadingProfile(false)

        switch (status) {
            case 200:
                const { profile: { id_station } } = data
                setStationSignature(id_station)
                return
            default:
                return
        }
    }, [])

    useEffect(() => {
        requestStationSignature()
    }, [requestStationSignature])

    return (
        <Stack
            width={"100%"}
            height={"100%"}
            alignItems={"center"}
        >
            <Stack
                justifyContent={"center"}
                alignItems={"center"}
                height={"51px"}
                width={"100%"}
                bgcolor={"bgSoft.main"}
            >
                <Typography fontSize={"20px"} fontWeight={900}>สภาพอากาศภายในศูนย์ฯ</Typography>
            </Stack>
            <Stack height={"calc(100% - 51px)"} width={"100%"} >
                {
                    !loadingProfile ?
                        <WeatherManagement
                            endpointData={`/api/sensor/weather-station/${stationSignature}`}
                            columnTimestamp="timestamp"
                            columns={[
                                { field: 'temperature', name: 'อุณหภูมิ', color: "green" },
                                { field: 'humidity', name: 'ความชื้น', color: "yellow" },
                                { field: 'light', name: 'แสง', color: "orange" },
                                { field: 'rainfall', name: 'น้ำฝน', color: "blue" },
                                { field: 'pressure', name: 'ความกดอากาศ', color: "#4a4573" },
                                { field: 'batt', name: 'แบตเตอรี่', color: "red" }
                            ]}
                            query={{
                                r: "farmer"
                            }}
                        /> :
                        <Loading />
                }
            </Stack>
        </Stack>
    )
}