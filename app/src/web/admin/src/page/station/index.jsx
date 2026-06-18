import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"; // NEW: useMemo
import { clientMo } from "../../../../../assets/js/moduleClient";
import { useAdminContext } from "../../Admin";
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
  const { profile, titlePageNested } = useAdminContext();

  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedStationData, setSelectedStationData] = useState({});

  // NEW: state สำหรับ greenhouse ที่ถูกเลือก
  const [greenhouseId, setGreenhouseId] = useState("");

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const [openManageWeatherStation, setOpenManageWeatherStation] = useState(false);

  const fetchStationList = useCallback(async () => {
    try {
      const { data: stationsResponse } = await RequestAPI.post("/api/admin/data/list", {
        limit: 100,
        startRow: 0,
        type: "station",
        textSearch: "",
      });

      setStations(stationsResponse.filter(station => station.is_use === 1));
      // ไม่ auto-select ศูนย์ใด รอให้ผู้ใช้เลือกเอง
    } catch (error) {
      console.error("Error fetching station list:", error);
    }
  }, []);

  const onUpdateRange = useCallback((startTimestamp, endTimestamp) => {
    setStartTime(startTimestamp);
    setEndTime(endTimestamp);
  }, []);

  useEffect(() => {
    titlePageNested(70, 30, ["หน้าหลัก", "ข้อมูลสภาพแวดล้อม"]);
    clientMo.unLoadingPage();
    fetchStationList();
  }, [titlePageNested, fetchStationList]);


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
    <div style={{ padding: "20px", fontFamily: "sans-serif", width: "100%", height: "100%", overflow: "auto" }}>
      <Stack marginBottom={3} direction={"row"} width={"100%"}>
        <Grid container width={"100%"}>
          <Grid size={{ xs: 8, xl: 6 }}>
            <Stack direction={"row"}>
              <Select
                displayEmpty
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
              <Button variant="contained" size="small" onClick={() => setOpenManageWeatherStation(true)}>
                จัดการเครื่องวัดสภาพแวดล้อมในศูนย์ฯ
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Stack height={"calc(100% - 65px)"} minHeight={"350px"}>
        {selectedStation ? (
          <WeatherManagement
            key={widgetKey}
            endpointData={endpointData}
            query={query}
            columns={columns}
            onChangeRange={onUpdateRange}
          />
        ) : (
          <Stack height={"100%"} alignItems={"center"} justifyContent={"space-between"} spacing={1}>
            <Typography variant="h6" color="text.secondary">กรุณาเลือกศูนย์เพื่อดูข้อมูลสภาพแวดล้อม</Typography>
          </Stack>
        )}
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
