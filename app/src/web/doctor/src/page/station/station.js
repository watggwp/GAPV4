import React, { useCallback, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import Houses from "./house";
import { useDoctor } from "../../Doctor";
import RequestAPI, { responseStatus } from "../../../../../assets/js/requestAPI";
import ChartSensor from "../../../../../assets/components/sensor/chart";
import EcPhSensor from "../../../../../assets/components/sensor/EcPh";
import WeatherSensor from "../../../../../assets/components/sensor/Weather";
import { Stack } from "@mui/material";

// Mock weather data
const mockWeatherData = [
    { time: "08:00", temperature: 25, humidity: 80 },
    { time: "10:00", temperature: 27, humidity: 75 },
    { time: "12:00", temperature: 30, humidity: 70 },
    { time: "14:00", temperature: 32, humidity: 65 },
    { time: "16:00", temperature: 31, humidity: 68 },
    { time: "18:00", temperature: 28, humidity: 72 },
    { time: "20:00", temperature: 26, humidity: 78 },
];

const Station = () => {
  const { profile, bannerCoverRef, contentRef } = useDoctor();
  const [stationList, setStationList] = useState([]);
  const [selectedStation, setSelectedStation] = useState(profile.station_doctor);
  const [graphType, setGraphType] = useState("weather"); // new

  const [ loadingGraph , setLoadingGraph ] = useState(false)
  const [ weatherData, setWeatherData ] = useState([]);
  const [ ecPhData, setEcPhData ] = useState([]);

  // โหลดข้อมูลสถานี
  const fetchStationList = useCallback(async () => {
    try {
      const response = await clientMo.post("/api/doctor/data/list", {
        limit: 100,
        startRow: 0,
        type: "station",
        textSearch: "",
      });
      const list = JSON.parse(response);
      setStationList(list);
    } catch (error) {
      console.error("Error fetching station list:", error);
    }
  }, []);

  // โหลดข้อมูล EC/pH จาก API
  const requestEcPhData = useCallback(async () => {
    if (!selectedStation) return;

    setLoadingGraph(true)
    const response = await RequestAPI.get(`/api/doctor/station/${selectedStation}/ecph/`)

    const { status , data } = response

    switch(status) {
        case responseStatus.SUCCESS :
            const { ecph } = data
            setEcPhData(ecph.map(({ ec_value , ph_value , timestamp }) => {
                const date = new Date(timestamp);
                const hh = date.getHours().toString().padStart(2, '0');
                const mm = date.getMinutes().toString().padStart(2, '0');
                return {
                    time : `${hh}:${mm}`,
                    ec : ec_value,
                    ph : ph_value,
                }
            }))
            break;
        default:
            break;
    }
    setLoadingGraph(false)
  }, [selectedStation]);

  const onSelectGraphType = useCallback((event) => {
    setGraphType(event.target.value)
  } , [])

  useEffect(() => {
    bannerCoverRef.current.style.height = "30%";
    contentRef.current.style.height = "70%";
    clientMo.unLoadingPage();
    fetchStationList();
    setWeatherData(mockWeatherData); // mock ข้อมูลอากาศครั้งแรก
  }, [bannerCoverRef, contentRef, fetchStationList]);

  useEffect(() => {
    if (graphType === "ec_ph") {
      requestEcPhData();
    }
  }, [graphType, selectedStation, requestEcPhData]);

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Filter Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value)}
        >
          <option value="">เลือกศูนย์</option>
          {stationList.map((station, index) => (
            <option key={index} value={station.id}>
              {station.name}
            </option>
          ))}
        </select>
        <button>Export</button>
        <select>
          <option>เลือกชนิดพืช</option>
        </select>
        <select>
          <option>เลือกเกษตรกร</option>
        </select>
      </div>

      {/* ชนิดกราฟ */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>เลือกข้อมูลกราฟ: </label>
        <select value={graphType} onChange={onSelectGraphType}>
          <option value="weather">อุณหภูมิ / ความชื้น</option>
          <option value="ec_ph">EC / pH</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "20px", height: "calc(100% - 100px)" }}>
        {/* กราฟ */}
        <div
          style={{
            flex: 1,
            minHeight: "200px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            textAlign: "center",
          }}
        >
            <h4 style={{ marginBottom: "10px" }}>
                {graphType === "weather" ? "กราฟสภาพอากาศภายในศูนย์" : "กราฟ EC / pH"}
            </h4>
            <Stack height={"calc(100% - 40px)"} width={"100%"}>
                <ChartSensor 
                    data={
                        graphType === "weather" ? 
                            weatherData : 
                        graphType === "ec_ph" ?
                            ecPhData : []
                    }
                >
                    {
                        graphType === "weather" ? 
                            <WeatherSensor/> :
                        graphType === "ec_ph" ?
                            <EcPhSensor/> :
                            undefined
                    }
                </ChartSensor>
            </Stack>
        </div>

        {/* ข้อมูลโรงเรือน */}
        <div style={{ flex: 1 }}>
          {
            !selectedStation ? (
                <div style={{ color: "#888", textAlign: "center", marginTop: "50px" }}>
                    กรุณาเลือกศูนย์เพื่อแสดงโรงเรือน
                </div>
            ) : (
                <Houses selectedStation={selectedStation} />
            )
          }
        </div>
      </div>
    </div>
  );
};

export default Station;
