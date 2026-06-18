// app/src/assets/components/weather-management/index.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Grid, Stack, styled, Tab, Tabs, useMediaQuery } from "@mui/material";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Text } from "recharts";
import RequestAPI from "../../js/requestAPI";
import DateGAP from "../../core/DateGAP";
import { clientMo } from "../../js/moduleClient";
import DateRange from "../DateRange";
import DataTable from "./table";

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

const toNum = (v) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? null : Number(v));
// sec → ms ถ้าน้อยกว่า 1e12
const toMs = (v) => {
  if (v === undefined || v === null || isNaN(Number(v))) return NaN;
  const n = Number(v);
  return n < 1e12 ? n * 1000 : n;
};

export default function WeatherManagement({
  endpointData = "/api/sensor/weather-station",
  query,
  startTime,
  endTime,
  columnTimestamp = "timestamp",
  columns = [
    { field: "temperature", name: "อุณหภูมิ ( ํC)", color: "green", yDomain: [0, 60] },
    { field: "humidity", name: "ความชื้น (%RH)", color: "yellow", yDomain: [0, 100] },
    { field: "light", name: "แสง (LUX)", color: "orange", yDomain: [0, 200000] },
    { field: "rainfall", name: "น้ำฝน (mm)", color: "blue", yDomain: [0, 100] },
  ],
  onChangeRange = () => { },
  showTable = true,
  debug = false,
}) {
  const isMediaSm = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [selectedTab, setSelectedTab] = useState(0);
  const [chartDatas, setChartDatas] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyDatas, setHistoryDatas] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const effectiveField = selectedField || columns[selectedTab].field;
  const effectiveColor = selectedColor || columns[selectedTab].color;
  const effectiveName = columns.find(c => c.field === effectiveField)?.name || columns[selectedTab].name;

  // ใช้เพื่อสั่งโหลดช่วงเวลาใหม่จากภายนอก (export)
  const [overrideRange, setOverrideRange] = useState(null);

  const [lastRequest, setLastRequest] = useState(null);

  const onChangeTab = useCallback((_, v) => {
    setSelectedTab(v);
    // กลับมาใช้ค่าตามแท็บ ถ้ามี override อยู่
    setSelectedField(null);
    setSelectedColor(null);
  }, []);
  const Query = useMemo(() => ({ r: query?.r }), [query?.r]);
  const emitMeta = (part) => {
    const prev = (typeof window !== "undefined" && window.__weatherMeta) || {};
    const meta = { ...prev, ...part, ts: Date.now() };
    window.__weatherMeta = meta;
    try { console.log("[weather-export] set meta:", meta); } catch { }
    window.dispatchEvent(new CustomEvent("weather-export:meta", { detail: meta }));
    window.__weatherMeta = meta;
  };
  useEffect(() => {
    emitMeta({ deviceId: Query?.r ?? null, hasDevice: Boolean(Query?.r) });
  }, [Query?.r]);
  useEffect(() => {
    const onGetMeta = () => {
      const meta = (typeof window !== "undefined" && window.__weatherMeta) || {};
      window.dispatchEvent(new CustomEvent("weather-export:meta", { detail: meta }));
      window.__weatherMeta = meta;
    };
    window.addEventListener("weather-export:get-meta", onGetMeta);
    return () => window.removeEventListener("weather-export:get-meta", onGetMeta);
  }, []);
  const PreprocessDateRange = useCallback(() => {
    setHistoryDatas([]);
    setChartDatas([]);
    setLoadingHistory(true);
  }, []);

  const ProcessRequestDateRange = useCallback(
    async (starttime, endtime, _isMount) => {
      const stMs = toMs(starttime);
      const etMs = toMs(endtime);

      const startOfDay = new Date(stMs);
      const endOfDay = new Date(etMs);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay.setHours(23, 59, 59, 999);

      try {
        console.log("[WeatherManagement] 🌦 Fetching data:", {
          starttime,
          endtime,
          start_ISO: new Date(stMs).toISOString(),
          end_ISO: new Date(etMs).toISOString(),
          start_local: new Date(stMs).toLocaleString("th-TH"),
          end_local: new Date(etMs).toLocaleString("th-TH"),
        });

        const params = { st: startOfDay.getTime(), et: endOfDay.getTime(), ...(Query || {}) };
        setLastRequest({ endpoint: endpointData, params });

        const { data, status } = await RequestAPI.get(endpointData, params);
        console.log("[WeatherManagement] Response:", { status, data });
        if (status !== 200) {
          setChartDatas([]);
          setHistoryDatas([]);
          return;
        }

        const details = Array.isArray(data)
          ? data
          : Array.isArray(data?.details)
            ? data.details
            : Array.isArray(data?.data?.details)
              ? data.data.details
              : Array.isArray(data?.rows)
                ? data.rows
                : [];
        try {
          emitMeta({
            deviceId: Query?.r ?? null,
            hasDevice: Boolean(Query?.r),
            rows: Array.isArray(details) ? details.length : 0,
            field: columns[selectedTab]?.field,
            range: { st: startOfDay.getTime(), et: endOfDay.getTime() }
          });
        } catch { }
        const newChartDatas = [];
        const newHistoryDatas = [];

        console.groupCollapsed("[WM] Chart input preview", {
          endpoint: endpointData,
          params,
          rows: details.length,
        });
        try {
          const cols = ["timestamp", columnTimestamp, ...columns.map((c) => c.field)];
          console.table(
            details.slice(0, 10).map((r, i) => {
              const row = { _row: i };
              cols.forEach((k) => (row[k] = r?.[k] ?? null));
              return row;
            })
          );
        } finally {
          console.groupEnd();
        }

        details?.forEach((item, index) => {
          const timestamp_raw = item[columnTimestamp];
          const t = new DateGAP(timestamp_raw);
          const label = t.format2Str("DD/MM/YYYY HH:II");

          const numericFields = {};
          columns.forEach((c) => {
            numericFields[c.field] = toNum(item[c.field]);
          });

          newChartDatas.push({
            ...item,
            ...numericFields,
            id: index,
            timestamp: label,
            _timestamp_raw: timestamp_raw,
          });

          const lastRaw = newHistoryDatas[newHistoryDatas.length - 1]?._timestamp_raw;
          if (!lastRaw) {
            newHistoryDatas.push({ ...item, id: index, timestamp: label, _timestamp_raw: timestamp_raw });
          } else {
            const diff = new Date(lastRaw).getTime() - t.getTime();
            if (diff >= 4320 * 1000) {
              newHistoryDatas.push({ ...item, id: index, timestamp: label, _timestamp_raw: timestamp_raw });
            }
          }
        });

        setChartDatas(Array.isArray(newChartDatas) ? newChartDatas.sort((a, b) => b.id - a.id) : []);
        setHistoryDatas(newHistoryDatas);
      } catch (e) {
        console.warn("[WeatherManagement] fetch error:", e);
        setChartDatas([]);
        setHistoryDatas([]);
      } finally {
        setLoadingHistory(false);
      }
    },
    [Query, columnTimestamp, endpointData, columns]
  );

  const PostProcessDateRange = useCallback(async (_s, _e, isMount) => {
    isMount && clientMo.unLoadingPage();
  }, []);

  const currentField = columns[selectedTab]?.field;
  const hasAnyRow = chartDatas.length > 0;
  const showDot = chartDatas.length <= 2;

  // คอลัมน์ที่กำลังแสดงอยู่ (ใช้หา yDomain/หน่วย ฯลฯ)
  const activeCol = useMemo(() => {
    // ถ้าคุณอยากล็อกตาม field ที่ถูก override ก็ใช้ effectiveField
    const byField = columns.find(c => c.field === (selectedField || columns[selectedTab]?.field));
    return byField || columns[selectedTab] || {};
  }, [columns, selectedField, selectedTab]);

  const fallbackData = useMemo(() => {
    const points = 12;
    const now = Date.now();
    const arr = [];
    for (let i = points - 1; i >= 0; i--) {
      const ts = now - i * 60 * 60 * 1000;
      const t = new Date(ts);
      const DD = String(t.getDate()).padStart(2, "0");
      const MM = String(t.getMonth() + 1).padStart(2, "0");
      const YYYY = String(t.getFullYear());
      const HH = String(t.getHours()).padStart(2, "0");
      const II = String(t.getMinutes()).padStart(2, "0");
      arr.push({ timestamp: `${DD}/${MM}/${YYYY} ${HH}:${II}`, [currentField]: null });
    }
    return arr;
  }, [currentField]);

  const chartViewData = hasAnyRow ? chartDatas : fallbackData;
  const yDomain = useMemo(() => {
    if (activeCol.yDomain) return activeCol.yDomain;              // per-field override
    return hasAnyRow ? ['dataMin', 'dataMax'] : [0, 100];         // fallback
  }, [activeCol, hasAnyRow]);
  // 🔧 FIX: ให้ selector ตรงกับ id จริง
  useEffect(() => {
    const ready =
      !loadingHistory && chartViewData.length > 0 && document.querySelector("#weather-chart-export .recharts-wrapper");
    if (ready) {
      window.dispatchEvent(
        new CustomEvent("weather-export:chart-ready", {
          detail: { count: chartViewData.length, tab: selectedTab },
        })
      );
    }
  }, [loadingHistory, chartViewData.length, selectedTab]);

  useEffect(() => {
    try {
      const payload = { data: chartDatas, tsKey: "timestamp", rawTsKey: "_timestamp_raw", columns };
      window.__weatherJSON = payload;          // ⬅️ เก็บล่าสุดไว้
      window.dispatchEvent(new CustomEvent("weather-export:chart-json", { detail: payload }));
    } catch { }
  }, [chartDatas, columns]);

  // 🔧 FIX: แทนที่จะเรียก setSt/setEt (ซึ่งไม่มี) ให้สั่ง overrideRange
  useEffect(() => {
    const onRange = (e) => {
      const { st, et } = e.detail || {};
      if (Number.isFinite(st) && Number.isFinite(et)) {
        setOverrideRange({ st, et });
      }
    };
    window.addEventListener("weather-export:set-range", onRange);
    window.addEventListener("weather:set-range", onRange);
    return () => {
      window.removeEventListener("weather-export:set-range", onRange);
      window.removeEventListener("weather:set-range", onRange);
    };
  }, []);

  // ถ้าฝั่ง Export ส่ง metric มา → เลือกแท็บให้ตรง field
  useEffect(() => {
    const onMetric = (e) => {
      const { field, color } = e.detail || {};
      if (!field) return;
      const idx = columns.findIndex((c) => c.field === field);
      if (idx >= 0) {
        setSelectedTab(idx);
        // ตั้ง override ให้ Line ใช้ฟิลด์/สีที่สั่งมาแน่ ๆ
        setSelectedField(field);
        setSelectedColor(color ?? columns[idx].color);
      }
    };
    window.addEventListener("weather-export:set-metric", onMetric);
    return () => window.removeEventListener("weather-export:set-metric", onMetric);
  }, [columns]);

  useEffect(() => {
    if (!overrideRange) return;
    const { st, et } = overrideRange;
    console.log("[WeatherManagement] 🕒 overrideRange triggered", {
      st,
      et,
      startDate_local: new Date(st).toLocaleString("th-TH"),
      endDate_local: new Date(et).toLocaleString("th-TH"),
    });

    PreprocessDateRange();
    ProcessRequestDateRange(st, et, true);
  }, [overrideRange, PreprocessDateRange, ProcessRequestDateRange]);

  return (
    <Stack width={"100%"} height={"100%"} alignItems={"center"}>
      <Grid container width={"100%"} height={"100%"} justifyContent={"center"}>
        <Grid size={{ sm: 12, md: 6 }} height={isMediaSm ? "55%" : "100%"} minHeight={isMediaSm ? "300px" : 0}>
          <TabsGAP value={selectedTab} onChange={onChangeTab} variant="scrollable" scrollButtons="auto">
            {columns.map((item, index) => (
              <TabGAP key={index} label={item.name} value={index} />
            ))}
          </TabsGAP>

          {/* ⬇️ ให้ export จับภาพกราฟด้วย id นี้ */}
          <Stack
            id="weather-chart-export"
            width={"100%"}
            height={`calc(100% - 35px - ${Boolean(!startTime && !endTime) ? "112px" : "10px"})`}
            marginTop={1}
            justifyContent={"center"}
            alignItems={"center"}
          >
            {!loadingHistory && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartViewData} margin={{ top: 8, left: 15, right: 10, bottom: 8 }} width={250}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                  <YAxis fontSize={"12px"} domain={yDomain} allowDecimals={false} allowDataOverflow={true} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px", fontFamily: "Sans-font", width: "100%", left: 0 }} />
                  <Line
                    type="monotone"
                    dataKey={columns[selectedTab].field}
                    stroke={columns[selectedTab].color}
                    name={columns[selectedTab].name}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Stack>

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

        <Grid size={{ sm: 12, md: 6 }} height={isMediaSm ? "45%" : "100%"} width={"100%"}>
          {/* ⬇️ ให้ export จับภาพตารางด้วย id นี้ */}
          <Stack id="weather-table-export" width={"100%"} height={"100%"} alignItems={"center"}>
            <DataTable columns={columns} historyDatas={historyDatas} loadingHistory={loadingHistory} activeField={effectiveField} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}

function LoadWeather({ setLoadingHistory, ProcessRequestDateRange, startTime, endTime }) {
  useEffect(() => {
    setLoadingHistory(true);
    ProcessRequestDateRange(startTime, endTime, true);
  }, [ProcessRequestDateRange, endTime, setLoadingHistory, startTime]);

  return null;
}