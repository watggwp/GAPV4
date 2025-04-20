import React, { useCallback, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import Houses from "./house";
import { useDoctor } from "../../Doctor";
import RequestAPI, { responseStatus } from "../../../../../assets/js/requestAPI";
import ChartSensor from "../../../../../assets/components/sensor/chart";
import EcPhSensor from "../../../../../assets/components/sensor/EcPh";
import WeatherSensor from "../../../../../assets/components/sensor/Weather";
import { Button, MenuItem, Select, Stack, Modal, Box, Typography } from "@mui/material";

const Station = () => {
  const { profile, bannerCoverRef, contentRef } = useDoctor();
  const [stationList, setStationList] = useState([]);
  const [selectedStation, setSelectedStation] = useState(profile.station_doctor);
  const [graphType, setGraphType] = useState("weather");

  const [weatherData, setWeatherData] = useState([]);
  const [ecPhData, setEcPhData] = useState([]);
  const [showCount, setShowCount] = useState(10);
  const [openHistory, setOpenHistory] = useState(false);

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

  const requestEcPhData = useCallback(async () => {
    if (!selectedStation) return;
    const response = await RequestAPI.get(`/api/doctor/station/${selectedStation}/ecph/`);
    const { status, data } = response;
    if (status === responseStatus.SUCCESS && Array.isArray(data.ecph)) {
      setEcPhData(data.ecph.map(({ ec_value, ph_value, timestamp }) => {
        const dateObj = new Date(timestamp);
        const yyyy = dateObj.getFullYear();
        const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const dd = dateObj.getDate().toString().padStart(2, '0');
        const hh = dateObj.getHours().toString().padStart(2, '0');
        const min = dateObj.getMinutes().toString().padStart(2, '0');
        return {
          date: `${yyyy}-${mm}-${dd}`,
          time: `${hh}:${min}`,
          ec: ec_value,
          ph: ph_value,
        };
      }));
    }
  }, [selectedStation]);

  const requestWeatherData = useCallback(async () => {
    if (!selectedStation) return;
    const response = await RequestAPI.get(`/api/template`);
    const { status, data } = response;

    if (status === responseStatus.SUCCESS) {
      // ลองตรวจสอบหลายโครงสร้าง
      const weatherArray = data.weather || data.readings || data.data || [];

      if (Array.isArray(weatherArray)) {
        setWeatherData(weatherArray.map(({ temperature, humidity, timestamp }) => {
          const dateObj = new Date(timestamp);
          const yyyy = dateObj.getFullYear();
          const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const dd = dateObj.getDate().toString().padStart(2, '0');
          const hh = dateObj.getHours().toString().padStart(2, '0');
          const min = dateObj.getMinutes().toString().padStart(2, '0');

          return {
            date: `${yyyy}-${mm}-${dd}`,
            time: `${hh}:${min}`,
            temperature,
            humidity,
          };
        }));
      } else {
        console.warn("weather data is not an array:", weatherArray);
      }
    }
  }, [selectedStation]);

  const onSelectGraphType = useCallback((event) => {
    setGraphType(event.target.value);
  }, []);

  useEffect(() => {
    bannerCoverRef.current.style.height = "30%";
    contentRef.current.style.height = "70%";
    clientMo.unLoadingPage();
    fetchStationList();
  }, [bannerCoverRef, contentRef, fetchStationList]);

  useEffect(() => {
    if (graphType === "ec_ph") {
      requestEcPhData();
    } else if (graphType === "weather") {
      requestWeatherData();
    }
    setShowCount(10);
  }, [graphType, selectedStation, requestEcPhData, requestWeatherData]);

  const currentData = graphType === "weather"
    ? weatherData.slice(-showCount)
    : ecPhData.slice(-showCount);

  const allData = graphType === "weather"
    ? weatherData
    : ecPhData;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", width: "100%", height: "100%" }}>
      {/* Filter Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Select
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value)}
          size="small"
        >
          <MenuItem disabled value={""}>เลือกศูนย์</MenuItem>
          {stationList.map((station, index) => (
            <MenuItem key={index} value={station.id}>
              {station.name}
            </MenuItem>
          ))}
        </Select>
        <Select value={""} size="small" displayEmpty>
          <MenuItem disabled value={""}>เลือกชนิดพืช</MenuItem>
        </Select>
        <Select value={""} size="small" displayEmpty>
          <MenuItem disabled value={""}>เลือกเกษตรกร</MenuItem>
        </Select>
        <Stack justifyContent={"center"} alignItems={"center"}>
          <Button variant="contained" color="primary" size="small">
            Export
          </Button>
        </Stack>
      </div>

      {/* เลือกชนิดกราฟ */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>
          เลือกข้อมูลกราฟ:
          <Select value={graphType} onChange={onSelectGraphType} size="small" style={{ marginLeft: "10px" }}>
            <MenuItem value="weather">อุณหภูมิ / ความชื้น</MenuItem>
            <MenuItem value="ec_ph">EC / pH</MenuItem>
          </Select>
        </label>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", gap: "20px", height: "calc(100% - 120px)" }}>
        {/* กราฟ */}
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

        {/* Houses */}
        <div style={{ flex: 1 }}>
          {!selectedStation ? (
            <div style={{ color: "#888", textAlign: "center", marginTop: "50px" }}>
              กรุณาเลือกศูนย์เพื่อแสดงโรงเรือน
            </div>
          ) : (
            <Houses selectedStation={selectedStation} />
          )}
        </div>
      </div>

      {/* Modal แสดงข้อมูลย้อนหลังเป็นตาราง */}
      <Modal
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
      </Modal>
    </div>
  );
};

export default Station;
