import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { useDoctor } from "../../Doctor";
import { Button, MenuItem, Modal, Select, Stack, Typography } from "@mui/material";
import Houses from "./houses";
import WeatherManagement from "../../../../../assets/components/weather-management";
import RequestAPI from "../../../../../assets/js/requestAPI";
import { Grid } from "@mui/system";
import ManageDevicesWeatherStation from "./manageDevice";

const WeatherStationContext = createContext({
    selectedStationData : "",
    startTime : 0,
    endTime : 0
})

export default function WeatherStation() {
    const { profile, bannerCoverRef, contentRef , setTextPage } = useDoctor();
    const [ stations, setStations ] = useState([]);
    const [ selectedStation, setSelectedStation ] = useState(profile.id_station)
    const [ selectedStationData , setSelectedStationData ] = useState({})

    const [ startTime , setStartTime ] = useState(0)
    const [ endTime , setEndTime ] = useState(0)

    const [ openManageWeatherStation , setOpenManageWeatherStation ] = useState(false)

    const fetchStationList = useCallback(async () => {
        try {
            const { data : stationsResponse , status } = await RequestAPI.post("/api/doctor/data/list", {
                limit: 100,
                startRow: 0,
                type: "station",
                textSearch: "",
            });
            
            setStations(stationsResponse)
            setSelectedStationData(stationsResponse.find(({ id_station }) => id_station === selectedStation) || {})
        } catch (error) {
            console.error("Error fetching station list:", error);
        }
    }, [selectedStation])

    const onUpdateRange = useCallback((startTimestamp , endTimestamp) => {
        setStartTime(startTimestamp)
        setEndTime(endTimestamp)
    } , [])

    useEffect(() => {
        bannerCoverRef.current.style.height = "30%"
        contentRef.current.style.height = "70%"
        setTextPage(["หน้าหลัก" , "ข้อมูลสภาพแวดล้อม"])
        clientMo.unLoadingPage()
        fetchStationList()
    }, [bannerCoverRef, contentRef, fetchStationList, setTextPage])

    return (
        <div style={{ 
            padding: "20px", fontFamily: "sans-serif", width: "100%", height: "100%" ,
            overflow : "auto"
        }}>
            <Stack
                marginBottom={3}
                direction={"row"}
                width={"100%"}
            >
                <Grid container width={"100%"}>
                    <Grid size={{ xs : 8 , xl : 6 }}>
                        {/* <Grid container> */}
                            {/* <Grid size={{ xs : 12 , xl : 7 }}>
                                
                            </Grid> */}
                        <Stack direction={"row"}>
                            <Select
                                value={selectedStation}
                                onChange={(e) => {
                                    setSelectedStation(e.target.value)
                                    setSelectedStationData(stations.find(({ id_station }) => id_station === e.target.value) || {})
                                }}
                                size="small"
                            >
                                <MenuItem disabled value={""}>เลือกศูนย์</MenuItem>
                                {
                                    stations.map((station, index) => (
                                        <MenuItem key={index} value={station.id_station}>
                                            {station.name}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                            <WeatherStationContext.Provider
                                value={{
                                    selectedStationData,
                                    startTime,
                                    endTime
                                }}
                            >
                                {
                                    selectedStationData.id && <Houses/>
                                }
                            </WeatherStationContext.Provider>
                        </Stack>
                            {/* <Stack justifyContent={"center"} alignItems={"center"}>
                                <Button variant="contained" color="primary" size="small">
                                    Export
                                </Button>
                            </Stack> */}
                        {/* </Grid> */}
                    </Grid>
                    <Grid size={{ xs : 4 , xl : 6 }}>
                        <Stack
                            direction={"row"}
                            justifyContent={"end"}
                        >
                            <Button variant="contained" onClick={() => setOpenManageWeatherStation(true)}>
                                <Typography>จัดการเครื่องวัดสภาพแวดล้อมในศูนย์ฯ</Typography>
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Stack>
            <Stack
                height={"calc(100% - 65px)"}
                minHeight={"350px"}
            >
                <WeatherManagement
                    key={selectedStation}
                    endpointData={`/api/sensor/weather-station/${selectedStation}`}
                    query={{
                        r : "doctor"
                    }}
                    columns={
                        [
                            { field: 'temperature', name: 'อุณหภูมิ' , color : "green" },
                            { field: 'humidity', name: 'ความชื้น' , color : "yellow" },
                            { field: 'light', name: 'แสง' , color : "orange" },
                            { field: 'rainfall', name: 'น้ำฝน' , color : "blue" },
                            { field: 'pressure', name: 'ความกดอากาศ' , color : "#4a4573" }
                        ]
                    }
                    onChangeRange={onUpdateRange}
                />
            </Stack>
            <Modal
                open={openManageWeatherStation}
            >
                <ManageDevicesWeatherStation
                    setOpen={setOpenManageWeatherStation}
                    selectedStation={selectedStation}
                />
            </Modal>
        </div>
    );
}

export function useWeatherStation() {
    return useContext(WeatherStationContext)
}