import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { useDoctor } from "../../Doctor";
import { Button, MenuItem, Select, Stack } from "@mui/material";
import Houses from "./houses";
import WeatherManagement from "../../../../../assets/components/weather-management";
import RequestAPI from "../../../../../assets/js/requestAPI";
import { useRef } from "react";

const WeatherStationContext = createContext({
    selectedStationData : "",
    startTime : 0,
    endTime : 0
})

export default function WeatherStation() {
    const { profile, bannerCoverRef, contentRef } = useDoctor();
    const [ stations, setStations ] = useState([]);
    const [ selectedStation, setSelectedStation ] = useState(profile.id_station)
    const [ selectedStationData , setSelectedStationData ] = useState({})

    const [ startTime , setStartTime ] = useState(0)
    const [ endTime , setEndTime ] = useState(0)

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
        clientMo.unLoadingPage()
        fetchStationList()
    }, [bannerCoverRef, contentRef, fetchStationList])

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif", width: "100%", height: "100%" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
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
                {/* <Stack justifyContent={"center"} alignItems={"center"}>
                    <Button variant="contained" color="primary" size="small">
                        Export
                    </Button>
                </Stack> */}
            </div>
            <Stack
                height={"calc(100% - 60px)"}
            >
                <WeatherManagement
                    key={selectedStation}
                    endpointData={`/api/sensor/weather-station/${selectedStation}`}
                    query={{
                        r : "doctor"
                    }}
                    onChangeRange={onUpdateRange}
                />
            </Stack>
            {/* <div style={{ display: "flex", gap: "20px", height: "calc(100% - 120px)" }}>
                <div style={{
                flex: 1, minHeight: "200px", border: "1px solid #ccc",
                borderRadius: "8px", padding: "10px", textAlign: "center"
                }}>
                <h4 style={{ marginBottom: "10px" }}>
                    {graphType === "weather" ? "กราฟสภาพอากาศภายในศูนย์" : "กราฟ EC / pH"}
                </h4>
                <Stack height={"calc(100% - 40px)"} width={"100%"}>
                    <ChartSensor data={currentData}>
                    {graphType === "weather" ? <WeatherSensor /> : <EcPhSensor />}
                    </ChartSensor>
                    <div style={{ marginTop: "10px", textAlign: "center" }}>
                    <Button variant="outlined" size="small" onClick={() => setOpenHistory(true)}>
                        ดูข้อมูลย้อนหลัง
                    </Button>
                    </div>
                </Stack>
                </div>
        
                <div style={{ flex: 1 }}>
                {!selectedStation ? (
                    <div style={{ color: "#888", textAlign: "center", marginTop: "50px" }}>
                    กรุณาเลือกศูนย์เพื่อแสดงโรงเรือน
                    </div>
                ) : (
                    <Houses selectedStation={selectedStation} />
                )}
                </div>
            </div> */}
        
            {/* Modal แสดงข้อมูลย้อนหลังเป็นตาราง */}
            {/* <Modal
                open={openHistory}
                onClose={() => setOpenHistory(false)}
                aria-labelledby="history-modal-title"
                aria-describedby="history-modal-description"
            >
                <Box sx={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 800, maxHeight: "90vh", bgcolor: "background.paper",
                border: "2px solid #ccc", boxShadow: 24, borderRadius: 2,
                p: 4, overflowY: "auto"
                }}>
                <Typography id="history-modal-title" variant="h6" component="h2" mb={2}>
                    ข้อมูลย้อนหลัง
                </Typography>
        
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                        <th style={{ padding: "8px", border: "1px solid #ccc" }}>วันที่</th>
                        <th style={{ padding: "8px", border: "1px solid #ccc" }}>เวลา</th>
                        {graphType === "weather" ? (
                        <>
                            <th style={{ padding: "8px", border: "1px solid #ccc" }}>อุณหภูมิ (°C)</th>
                            <th style={{ padding: "8px", border: "1px solid #ccc" }}>ความชื้น (%)</th>
                        </>
                        ) : (
                        <>
                            <th style={{ padding: "8px", border: "1px solid #ccc" }}>EC</th>
                            <th style={{ padding: "8px", border: "1px solid #ccc" }}>pH</th>
                        </>
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {allData.map((item, index) => (
                        <tr key={index}>
                        <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>{item.date || "-"}</td>
                        <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>{item.time}</td>
                        {graphType === "weather" ? (
                            <>
                            <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>{item.temperature}</td>
                            <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>{item.humidity}</td>
                            </>
                        ) : (
                            <>
                            <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>{item.ec}</td>
                            <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>{item.ph}</td>
                            </>
                        )}
                        </tr>
                    ))}
                    </tbody>
                </table>
        
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <Button variant="contained" onClick={() => setOpenHistory(false)}>
                    ปิด
                    </Button>
                </div>
                </Box>
            </Modal> */}
        </div>
    );
}

export function useWeatherStation() {
    return useContext(WeatherStationContext)
}