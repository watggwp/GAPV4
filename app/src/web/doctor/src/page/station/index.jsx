import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"; // NEW: useMemo
import { clientMo } from "../../../../../assets/js/moduleClient";
import { useDoctor } from "../../Doctor";
import { Button, MenuItem, Modal, Select, Stack, Typography } from "@mui/material";
import Houses from "./houses";
import WeatherManagement from "../../../../../assets/components/weather-management";
import RequestAPI from "../../../../../assets/js/requestAPI";
import { Grid } from "@mui/system";
import ManageDevicesWeatherStation from "./manageDevice";

const WeatherStationContext = createContext({
  selectedStationData: {},
  startTime: 0,
  endTime: 0,
  greenhouseId: "",                 // NEW
  setGreenhouseId: () => { },        // NEW (ให้ Houses เรียกตอนเลือกเรือน)
});

export default function WeatherStation() {
  const { profile, bannerCoverRef, contentRef, setTextPage } = useDoctor();

  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(profile.id_station);
  const [selectedStationData, setSelectedStationData] = useState({});

  // NEW: state สำหรับ greenhouse ที่ถูกเลือก
  const [greenhouseId, setGreenhouseId] = useState("");

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const [openManageWeatherStation, setOpenManageWeatherStation] = useState(false);

  const fetchStationList = useCallback(async () => {
    try {
      const { data: stationsResponse } = await RequestAPI.post("/api/doctor/data/list", {
        limit: 100,
        startRow: 0,
        type: "station",
        textSearch: "",
      });

      setStations(stationsResponse);
      setSelectedStationData(stationsResponse.find(({ id_station }) => id_station === selectedStation) || {});
    } catch (error) {
      console.error("Error fetching station list:", error);
    }
  }, [selectedStation]);

  const onUpdateRange = useCallback((startTimestamp, endTimestamp) => {
    setStartTime(startTimestamp);
    setEndTime(endTimestamp);
  }, []);

  useEffect(() => {
    bannerCoverRef.current.style.height = "30%";
    contentRef.current.style.height = "70%";
    setTextPage(["หน้าหลัก", "ข้อมูลสภาพแวดล้อม"]);
    clientMo.unLoadingPage();
    fetchStationList();
  }, [bannerCoverRef, contentRef, fetchStationList, setTextPage]);

  // NEW: เมื่อเปลี่ยนศูนย์ ให้ล้าง greenhouse ที่เลือก เพื่อกลับไปโหมด station
  useEffect(() => {
    setGreenhouseId("");
  }, [selectedStation]);

  // NEW: คำนวณ endpoint ตามโหมดที่เลือก (station หรือ greenhouse)
  const endpointData = useMemo(() => {
    if (greenhouseId) {
      // ปรับ path ให้ตรง backend ถ้าชื่อไม่ตรง
      return `/api/sensor/weather-greenhouse/${greenhouseId}`;
    }
    return `/api/sensor/weather-station/${selectedStation}`;
  }, [greenhouseId, selectedStation]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", width: "100%", height: "100%", overflow: "auto" }}>
      <Stack marginBottom={3} direction={"row"} width={"100%"}>
        <Grid container width={"100%"}>
          <Grid size={{ xs: 8, xl: 6 }}>
            <Stack direction={"row"}>
              <Select
                value={selectedStation}
                onChange={(e) => {
                  setSelectedStation(e.target.value);
                  setSelectedStationData(stations.find(({ id_station }) => id_station === e.target.value) || {});
                }}
                size="small"
              >
                <MenuItem disabled value={""}>เลือกศูนย์</MenuItem>
                {stations.map((station, index) => (
                  <MenuItem key={index} value={station.id_station}>
                    {station.name}
                  </MenuItem>
                ))}
              </Select>

              {/* คง UI เดิม: Houses ยังแสดงเหมือนเดิม
                 แต่ตอนนี้ Houses จะเรียก setGreenhouseId ผ่าน Context เมื่อผู้ใช้เลือกเรือน */}
              <WeatherStationContext.Provider
                value={{
                  selectedStationData,
                  startTime,
                  endTime,
                  greenhouseId,       // NEW: กระจายค่าให้ Houses ใช้ถ้าต้อง highlight
                  setGreenhouseId,    // NEW: ให้ Houses เรียกเมื่อเลือกเรือน
                }}
              >
                {selectedStationData?.id_station && <Houses />}
              </WeatherStationContext.Provider>
            </Stack>
          </Grid>

          <Grid size={{ xs: 4, xl: 6 }}>
            <Stack direction={"row"} justifyContent={"end"}>
              <Button variant="contained" onClick={() => setOpenManageWeatherStation(true)}>
                <Typography>จัดการเครื่องวัดสภาพแวดล้อมในศูนย์ฯ</Typography>
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Stack height={"calc(100% - 65px)"} minHeight={"350px"}>
        <WeatherManagement
          key={`${selectedStation}-${greenhouseId || "station"}`}   // NEW: ให้รีเฟรชเมื่อสลับโหมด/เรือน
          endpointData={endpointData}
          query={{ r: "doctor" }}
          columns={[
            { field: 'temperature', name: 'อุณหภูมิ', color: "green" },
            { field: 'humidity', name: 'ความชื้น', color: "yellow" },
            { field: 'light', name: 'แสง', color: "orange" },
            { field: 'rainfall', name: 'น้ำฝน', color: "blue" },
            { field: 'pressure', name: 'ความกดอากาศ', color: "#4a4573" },
            { field: 'batt', name: 'แบตเตอรี่', color: "red" }
          ]}
          onChangeRange={onUpdateRange}
        />
      </Stack>

      <Modal open={openManageWeatherStation}>
        <ManageDevicesWeatherStation
          setOpen={setOpenManageWeatherStation}
          selectedStation={selectedStation}
        />
      </Modal>
    </div>
  );
}

export function useWeatherStation() {
  return useContext(WeatherStationContext);
}
