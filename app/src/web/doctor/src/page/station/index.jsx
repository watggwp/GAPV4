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

      const activeStations = stationsResponse.filter(station => station.is_use === 1);
      setStations(activeStations);
      setSelectedStationData(activeStations.find(({ id_station }) => id_station === selectedStation) || {});
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

  const endpointData = useMemo(() => {
    if (greenhouseId) return `/api/sensor/weather-greenhouse/${greenhouseId}`;
    return `/api/sensor/weather-station/${selectedStation}`;
  }, [greenhouseId, selectedStation]);

  // ⬇️ ทำ props ให้คงที่ ไม่สร้างใหม่ทุก render
  const query = useMemo(() => ({ r: "doctor" }), []);
  const columns = useMemo(
    () => [
      { field: "temperature", name: "อุณหภูมิ ( ํC)", color: "green", yDomain: [0, 60] },
      { field: "humidity", name: "ความชื้น (%RH)", color: "yellow", yDomain: [0, 100] },
      { field: "light", name: "แสง (LUX)", color: "orange", yDomain: [0, 200000] },
      { field: "rainfall", name: "น้ำฝน (mm)", color: "blue", yDomain: [0, 100] },
      { field: 'pressure', name: 'ความกดอากาศ (hPa)', color: "#4a4573", yDomain: ['dataMin', 'dataMax'] },
      { field: 'batt', name: 'แบตเตอรี่ (V)', color: "red", yDomain: [8, 15] }
    ],
    []
  );

  // ⬇️ รีเฟรช WeatherManagement เฉพาะเมื่อ endpoint เปลี่ยนจริง ๆ
  const widgetKey = useMemo(() => endpointData, [endpointData]);
  const providerValue = useMemo(
    () => ({
      selectedStationData,
      startTime,
      endTime,
      greenhouseId,
      setGreenhouseId,
    }),
    [selectedStationData, startTime, endTime, greenhouseId]
  );

  return (
    <Stack sx={{ padding: { xs: "10px", md: "20px" }, width: "100%", height: "100%", overflow: "auto", fontFamily: "sans-serif" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        marginBottom={{ xs: 1.5, md: 3 }}
        width="100%"
      >
        <WeatherStationContext.Provider value={providerValue}>
          {selectedStationData?.id_station && <Houses />}
        </WeatherStationContext.Provider>

        <Button
          variant="contained"
          size="small"
          onClick={() => setOpenManageWeatherStation(true)}
          sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
        >
          จัดการเครื่องวัดสภาพแวดล้อมในศูนย์ฯ
        </Button>
      </Stack>

      <Stack flex={1} minHeight={"350px"}>
        <WeatherManagement
          key={widgetKey}
          endpointData={endpointData}
          query={query}
          columns={columns}
          onChangeRange={onUpdateRange}
        />
      </Stack>

      <Modal open={openManageWeatherStation}>
        <ManageDevicesWeatherStation
          setOpen={setOpenManageWeatherStation}
          selectedStation={selectedStation}
        />
      </Modal>
    </Stack>
  );
}

export function useWeatherStation() {
  return useContext(WeatherStationContext);
}
