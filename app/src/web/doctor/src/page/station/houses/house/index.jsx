import { createContext, useCallback, useContext, useEffect, useState } from "react";
import WeatherManagement from "../../../../../../../assets/components/weather-management";
import RequestAPI from "../../../../../../../assets/js/requestAPI";
import { Loading } from "../../../../../../../assets/js/module";
import { Box, Chip, Button, IconButton, Modal, Paper, Stack, Typography } from "@mui/material";
import { useWeatherStation } from "../..";
import env from "../../../../../../../env";
import PumpControl from "./pumpControl";
import ManageDevices from "./manageDevices";

const statusColors = {
    online: "green",
    offline: "red"
}

const getStatusColor = (status) => {
    return statusColors[(status || "").toLowerCase()] || "gray"
};

const { icon: { close: Close } } = env

const HouseContext = createContext({
    greenhouse_id: "",
    requestDevices: () => { }
})

export default function House({
    greenhouse_id,
    setOpenHouse
}) {
    const { startTime, endTime } = useWeatherStation()
    const [loadingDevice, setLoadingDevice] = useState(true)
    const [selectedDeviceID, setSelectedDeviceID] = useState("")

    const [openPumpControl, setOpenPumpControl] = useState(false)
    const [openManageDevices, setOpenManageDevices] = useState(false)
    // const [ openManageSensorGap , setOpenManageSensorGap ] = useState(false)
    const [deviceStatus, setDeviceStatus] = useState("offline");

    const requestDevices = useCallback(async () => {
        setLoadingDevice(true)
        const { data, status } = await RequestAPI.get(`/api/sensor/weather-greenhouse/${greenhouse_id}`, {
            r: "doctor"
        })
        setLoadingDevice(false)

        switch (status) {
            case 200:
                const { devices } = data
                setSelectedDeviceID(devices.pop()?.device_id || "")
                break;
            default:
                break;
        }
    }, [greenhouse_id])

    const CheckStatus = useCallback(async () => {
        if (!selectedDeviceID) {
            setDeviceStatus("offline");
            return;
        }
        try {
            const { data } = await RequestAPI.get(`/api/sensor/weather-greenhouse/${greenhouse_id}/${selectedDeviceID}/status`);
            setDeviceStatus(data.status || "offline");
        } catch (err) {
            console.error("Failed to fetch device status:", err);
            setDeviceStatus("offline");
        }
    }, [selectedDeviceID, greenhouse_id])

    useEffect(() => {
        requestDevices()
    }, [requestDevices])

    useEffect(() => {
        if (!greenhouse_id || !selectedDeviceID) return;
        const id = setInterval(CheckStatus, 60_000);
        return () => clearInterval(id);
    }, [greenhouse_id, selectedDeviceID, CheckStatus]);
    return (
        <Stack
            justifyContent={"center"}
            alignItems={"center"}
            width={"100%"}
            height={"100%"}
        >
            <Paper
                sx={{
                    width: "90%",
                    height: "90%",
                    padding: 2,
                    borderRadius: 4
                }}
            >
                <Stack
                    alignItems={"center"}
                    justifyContent={"center"}
                    direction={"row"}
                    width={"100%"}
                    position={"relative"}
                    height={"60px"}
                >
                    <Stack direction="row" alignItems="center" gap={1}>
                        <Typography fontSize={25} fontWeight={900}>
                            สภาพอากาศในโรงเรือน
                        </Typography>
                        <Chip
                            size="small"
                            label={deviceStatus === "online" ? "ออนไลน์" : "ออฟไลน์"}
                            sx={{
                                bgcolor: "#fff",
                                border: `1px solid ${getStatusColor(deviceStatus)}`,
                            }}
                            icon={
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        bgcolor: getStatusColor(deviceStatus),
                                    }}
                                />
                            }
                        />
                    </Stack>

                    <IconButton
                        onClick={() => setOpenHouse({})}
                        sx={{
                            position: "absolute",
                            top: "8px",
                            right: "8px"
                        }}
                    >
                        <Close color="primary" />
                    </IconButton>
                </Stack>
                <Stack
                    direction={"row"}
                    justifyContent={"start"}
                >
                    <Button variant="contained" onClick={() => setOpenPumpControl(true)}>ควบคุมปั๊มน้ำ</Button>
                    <Button sx={{ marginLeft: 2 }} variant="contained" onClick={() => setOpenManageDevices(true)}>จัดการอุปกรณ์</Button>
                    {/* <Button sx={{ marginLeft : 2 }} variant="contained" onClick={() => setOpenManageSensorGap(true)}>จัดการ</Button> */}
                </Stack>
                <Stack
                    width={"100%"}
                    height={"calc(100% - 100px)"}
                    marginTop={2}
                >
                    {
                        loadingDevice ?
                            <Loading /> :
                            selectedDeviceID ?
                                <WeatherManagement
                                    endpointData={`/api/sensor/weather-greenhouse/${greenhouse_id}/${selectedDeviceID}`}
                                    query={{
                                        r: "doctor"
                                    }}
                                    startTime={startTime}
                                    endTime={endTime}
                                    columnTimestamp="timestamp"
                                    columns={[
                                        { field: 'air_temperature', name: 'อุณหภูมิ', color: "green" },
                                        { field: 'air_humidity', name: 'ความชื้น', color: "yellow" },
                                        { field: 'light', name: 'แสง', color: "orange" },
                                        { field: 'soil_temperature', name: 'อุณหภูมิดิน', color: "red" },
                                        { field: 'soil_humidity', name: 'ความชื้นดิน', color: "blue" },
                                        { field: 'pressure', name: 'ความกดอากาศ', color: "#4a4573" }
                                    ]}
                                /> :
                                <Stack
                                    width={"100%"}
                                    height={"100%"}
                                    justifyContent={"center"}
                                    alignItems={"center"}
                                >
                                    <Typography>ไม่พบเครื่องวัดสภาพอากาศในโรงเรือน</Typography>
                                </Stack>
                    }
                </Stack>
                <HouseContext.Provider
                    value={{
                        greenhouse_id,
                        requestDevices
                    }}
                >
                    <Modal
                        open={openPumpControl}
                    >
                        <PumpControl setOpen={setOpenPumpControl} />
                    </Modal>
                    <Modal
                        open={openManageDevices}
                    >
                        <ManageDevices setOpen={setOpenManageDevices} />
                    </Modal>
                </HouseContext.Provider>
            </Paper>
        </Stack>
    )
}

export function useHouse() {
    return useContext(HouseContext)
}