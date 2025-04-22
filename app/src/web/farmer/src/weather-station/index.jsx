import { Stack, Typography } from "@mui/material";
import WeatherManagement from "../../../../assets/components/weather-management";

export default function WeatherStation() {
    return(
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
                <WeatherManagement
                    endpointData="/api/farmer/weather-station"
                    columnTimestamp="timestamp"
                    columns={[
                        { field: 'temperature', name: 'อุณหภูมิ' , color : "green" },
                        { field: 'humidity', name: 'ความชื้น' , color : "yellow" },
                        { field: 'light', name: 'แสง' , color : "orange" },
                        { field: 'rainfall', name: 'น้ำฝน' , color : "blue" },
                    ]}
                />
            </Stack>
        </Stack>
    )
}