// app/src/assets/components/weather-management/index.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Grid, Stack, styled, Tab, Tabs, Typography, useMediaQuery, CircularProgress } from "@mui/material";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DateRange from "../DateRange";
import DataTable from "./table";
import RequestAPI from "../../js/requestAPI";
import DateGAP from "../../core/DateGAP";
import { clientMo } from "../../js/moduleClient";
import { ExportPDF, ExportExcel } from "../../js/Export";

// ---------------- UI ----------------
const TabsGAP = styled((props) => <Tabs {...props} />)({
  minHeight: "34px",
  height: "34px",
  "& .MuiTabs-indicator": { backgroundColor: "green" },
});
const TabGAP = styled((props) => <Tab disableRipple {...props} />)({
  height: "34px",
  minHeight: "34px",
  minWidth: "50px",
  flexGrow: 1,
  "&.Mui-selected": { color: "green" },
});

// ---------- helpers: field normalize ----------
const FIELD_ALIASES = {
  temperature: ["temperature", "temp", "tmp", "t"],
  humidity: ["humidity", "humid", "hum", "h"],
  light: ["light", "lux", "illum", "l"],
  rainfall: ["rainfall", "rain", "rf"],
};

function pickFirstExisting(obj, names = []) {
  for (const n of names) if (obj[n] !== undefined && obj[n] !== null) return n;
  return null;
}

function normalizeRow(raw, columns, columnTimestamp) {
  const out = { ...raw };

  // timestamp robust fallback
  const tsKey = pickFirstExisting(raw, [columnTimestamp, "timestamp", "time", "createdAt"]);
  out._timestamp_raw = raw?.[tsKey];

  // map each column canonical field from aliases
  for (const col of columns) {
    const aliases = FIELD_ALIASES[col.field] || [col.field];
    const k = pickFirstExisting(raw, aliases);
    if (k && k !== col.field) {
      out[col.field] = raw[k]; // copy as canonical key the chart uses
    }
  }
  return out;
}

// ===============================================
export default function WeatherManagement({
  endpointData = "/api/sensor/weather-station",
  query,
  startTime,
  endTime,
  columnTimestamp = "timestamp",
  columns = [
    { field: "temperature", name: "อุณหภูมิ", color: "#2e7d32" },
    { field: "humidity", name: "ความชื้น", color: "#1976d2" },
    { field: "light", name: "แสง", color: "#f57c00" },
    { field: "rainfall", name: "น้ำฝน", color: "#6d4c41" },
  ],
  onChangeRange = () => {},
}) {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const CHART_HEIGHT = isSm ? 260 : 360;

  const [selectedTab, setSelectedTab] = useState(0);
  const [chartDatas, setChartDatas] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyDatas, setHistoryDatas] = useState([]);

  const Query = useMemo(() => ({ r: query?.r }), [query?.r]);

  const onChangeTab = useCallback((_, v) => setSelectedTab(v), []);

  const PreprocessDateRange = useCallback(() => {
    setHistoryDatas([]);
    setChartDatas([]);
    setLoadingHistory(true);
  }, []);

  const ProcessRequestDateRange = useCallback(
    async (starttime, endtime, isMount) => {
      const startOfDay = new Date(starttime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(endtime);
      endOfDay.setHours(23, 59, 59, 999);

      try {
        const { data, status } = await RequestAPI.get(endpointData, {
          st: startOfDay.getTime(),
          et: endOfDay.getTime(),
          ...(Query || {}),
        });

        if (status !== 200) {
          setChartDatas([]);
          setHistoryDatas([]);
          return;
        }

        const details = Array.isArray(data?.details) ? data.details : [];
        const newChart = [];
        const newHistory = [];

        details.forEach((item, idx) => {
          const norm = normalizeRow(item, columns, columnTimestamp);
          const tsRaw = norm._timestamp_raw;
          if (!tsRaw) return;

          const t = new DateGAP(tsRaw);
          const tsLabel = t.format2Str("DD/MM/YYYY HH:II");

          const row = {
            ...norm,
            id: idx,
            timestamp: tsLabel,
          };
          newChart.push(row);

          // history sampling ~ ทุก 72 นาที (4320 วินาที)
          const lastRaw = newHistory[newHistory.length - 1]?._timestamp_raw;
          if (!lastRaw) {
            newHistory.push({ ...row, _timestamp_raw: tsRaw });
          } else {
            const lastMs = new Date(lastRaw).getTime();
            const currMs = new Date(tsRaw).getTime();
            if (currMs - lastMs >= 4320 * 1000) {
              newHistory.push({ ...row, _timestamp_raw: tsRaw });
            }
          }
        });

        // เรียงตามเวลาโดยใช้ค่า raw (ไม่แปลงสตริง DD/MM/YYYY)
        newChart.sort(
          (a, b) => new Date(a._timestamp_raw).getTime() - new Date(b._timestamp_raw).getTime()
        );

        setChartDatas(newChart);
        setHistoryDatas(newHistory);
      } catch (e) {
        console.warn("load weather failed:", e);
        setChartDatas([]);
        setHistoryDatas([]);
      } finally {
        setLoadingHistory(false);
      }
    },
    [Query, columnTimestamp, columns, endpointData]
  );

  const PostProcessDateRange = useCallback(async (_s, _e, isMount) => {
    isMount && clientMo.unLoadingPage();
  }, []);

  const currentField = columns[selectedTab]?.field;
  const hasDataKey =
    chartDatas.length > 0 &&
    chartDatas.some((d) => d[currentField] !== undefined && d[currentField] !== null);

  return (
    <Stack width="100%" height="100%" alignItems="center">
      <Grid container width="100%" height="100%" justifyContent="center">
        {/* LEFT: Chart */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            height: { xs: "55%", md: "100%" },
            minHeight: { xs: 300, md: 0 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TabsGAP value={selectedTab} onChange={onChangeTab} variant="scrollable" scrollButtons="auto">
            {columns.map((c, i) => (
              <TabGAP key={i} label={c.name} value={i} />
            ))}
          </TabsGAP>

          {/* กำหนดความสูง container ชัดเจน + ใส่ id สำหรับ Export PDF */}
          <Stack
            id="weather-chart-export"
            sx={{
              mt: 1,
              width: "100%",
              height: CHART_HEIGHT,
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 1,
            }}
          >
            {loadingHistory ? (
              <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
                <CircularProgress size={26} />
              </Stack>
            ) : chartDatas.length === 0 || !hasDataKey ? (
              <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
                <Typography color="text.secondary" fontSize={14}>
                  ไม่มีข้อมูลในช่วงวันที่เลือก หรือคีย์ <b>{currentField}</b> ไม่ตรงกับข้อมูลที่ได้จาก API
                </Typography>
              </Stack>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDatas} margin={{ top: 8, left: 0, right: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px", fontFamily: "Sans-serif" }} />
                  <Line
                    type="monotone"
                    dataKey={currentField}
                    stroke={columns[selectedTab]?.color || "#2e7d32"}
                    name={columns[selectedTab]?.name}
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Stack>

          {/* เลือกช่วงวัน */}
          {Boolean(!startTime && !endTime) ? (
            <DateRange
              startTime={startTime}
              endTime={endTime}
              onChangeRange={onChangeRange}
              onChangeRangeStepPreprocess={PreprocessDateRange}
              onChangeRangeStepProcess={ProcessRequestDateRange}
              onChangeRangeStepPostprocess={PostProcessDateRange}
            />
          ) : (
            <LoadWeather
              startTime={startTime}
              endTime={endTime}
              setLoadingHistory={setLoadingHistory}
              ProcessRequestDateRange={ProcessRequestDateRange}
            />
          )}
        </Grid>

        {/* RIGHT: Table */}
        <Grid item xs={12} md={6} sx={{ height: { xs: "45%", md: "100%" }, width: "100%" }}>
          <Stack id="weather-table-export" width="100%" height="100%" alignItems="center">
            <DataTable columns={columns} historyDatas={historyDatas} loadingHistory={loadingHistory} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

function LoadWeather({ setLoadingHistory, ProcessRequestDateRange, startTime, endTime }) {
  useEffect(() => {
    setLoadingHistory(true);
    ProcessRequestDateRange(startTime, endTime, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime]);
}
