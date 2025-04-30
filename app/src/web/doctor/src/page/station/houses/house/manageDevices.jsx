import { IconButton, Paper, Stack, Typography } from "@mui/material";
import DeviceManagement from "../../../../../../../assets/components/device-management";
import { useHouse } from ".";
import env from "../../../../../../../env";

const { icon : { history : History , close : Close } } = env
export default function ManageDevices({
    setOpen
}) {

    const { greenhouse_id } = useHouse()

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
                    height={"calc(100% - 70px)"}
                >
                    <DeviceManagement
                        menuDatas={[
                            {
                                id : "greenhouse",
                                endpoints : {
                                    devices : {
                                        path : `/api/sensor/weather-greenhouse/:greenhouse_id`,
                                        query : {
                                            r : "doctor"
                                        },
                                        pathParams : {
                                            greenhouse_id
                                        },
                                        columnsData : {
                                            id : "id",
                                            device_id : "device_id",
                                            status : "status"
                                        }
                                    },
                                    add : {
                                        path : "/api/sensor/weather-greenhouse/:greenhouse_id",
                                        query : {
                                            r : "doctor"
                                        },
                                        pathParams : {
                                            greenhouse_id
                                        },
                                    },
                                    delete : {
                                        path : "/api/sensor/weather-greenhouse",
                                        query : {
                                            r : "doctor"
                                        },
                                        typeDelete : "unregister"
                                    }
                                }
                            },
                            {
                                id : "pump",
                                endpoints : {
                                    devices : {
                                        path : `/api/pump/:greenhouse_id`,
                                        query : {
                                            r : "doctor"
                                        },
                                        pathParams : {
                                            greenhouse_id
                                        },
                                        columnsData : {
                                            id : "id",
                                            device_id : "device_id",
                                            status : "status"
                                        }
                                    },
                                    add : {
                                        path : "/api/pump/:greenhouse_id",
                                        query : {
                                            r : "doctor"
                                        },
                                        pathParams : {
                                            greenhouse_id
                                        },
                                    },
                                    delete : {
                                        path : "/api/pump/",
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