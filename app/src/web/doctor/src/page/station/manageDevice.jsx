import { IconButton, Paper, Stack, Typography } from "@mui/material";
import env from "../../../../../env";
import DeviceManagement from "../../../../../assets/components/device-management";

const { icon : { close : Close } } = env
export default function ManageDevicesWeatherStation({
    setOpen , selectedStation
}) {

    return(
        <Stack
            width={"100%"}
            height={"100%"}
            justifyContent={"center"}
            alignItems={"center"}
        >
            <Paper
                sx={{
                    display : "flex",
                    justifyContent : "center",
                    alignItems : "center",
                    padding : 3,
                    width : "90%",
                    maxWidth : 400,
                    height : "90%",
                    flexDirection : "column"
                }}
            >
                <Stack paddingBottom={3} direction={"row"} justifyContent={"center"} alignItems={"center"} width={"100%"} paddingLeft={"40px"}>
                    <Typography fontSize={25} fontWeight={900}>จัดการอุปกรณ์</Typography>
                    <IconButton size="small" sx={{ marginLeft : 2 }} onClick={() => setOpen(false)}>
                        <Close/>
                    </IconButton>
                </Stack>
                <Stack
                    overflow={"auto"}
                    width={"100%"}
                    height={"calc(100% - 70px)"}
                >
                    <DeviceManagement
                        menuDatas={[
                            {
                                id : "weather",
                                endpoints : {
                                    devices : {
                                        path : `/api/sensor/weather-station/:selectedStation/list`,
                                        query : {
                                            r : "doctor"
                                        },
                                        pathParams : {
                                            selectedStation
                                        },
                                        columnsData : {
                                            id : "id",
                                            device_id : "device_id",
                                            status : "status"
                                        }
                                    },
                                    add : {
                                        path : "/api/sensor/weather-station/:selectedStation",
                                        query : {
                                            r : "doctor"
                                        },
                                        pathParams : {
                                            selectedStation
                                        },
                                    },
                                    delete : {
                                        path : "/api/sensor/weather-station",
                                        query : {
                                            r : "doctor"
                                        },
                                        typeDelete : "unregister"
                                    }
                                }
                            }
                        ]}
                    />
                </Stack>
            </Paper>
        </Stack>
    )
}