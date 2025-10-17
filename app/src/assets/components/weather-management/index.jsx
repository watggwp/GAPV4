// app/src/assets/components/weather-management/index.jsx
import { useCallback, useEffect, useMemo, useState } from "react"
import { Grid, Stack, styled, Tab, Tabs, useMediaQuery } from "@mui/material"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import RequestAPI from "../../js/requestAPI"
import DateGAP from "../../core/DateGAP"
import { clientMo } from "../../js/moduleClient"
import DateRange from "../DateRange"
import DataTable from "./table"

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

export default function WeatherManagement({
  endpointData = "/api/sensor/weather-station",
  query,
  startTime,
  endTime,
  columnTimestamp = "timestamp",
  columns = [
    { field: "temperature", name: "อุณหภูมิ", color: "green" },
    { field: "humidity", name: "ความชื้น", color: "yellow" },
    { field: "light", name: "แสง", color: "orange" },
    { field: "rainfall", name: "น้ำฝน", color: "blue" },
  ],
  onChangeRange = () => {},
}) {
  const isMediaSm = useMediaQuery((theme) => theme.breakpoints.down("md"))

  const [selectedTab, setSelectedTab] = useState(0)
  const [chartDatas, setChartDatas] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyDatas, setHistoryDatas] = useState([])

  // ⬇️ state สำหรับ override ช่วงเวลา (ใช้ตอน export เท่านั้น)
  const [overrideRange, setOverrideRange] = useState(null)

  const onChangeTab = useCallback((_, v) => setSelectedTab(v), [])

  const Query = useMemo(() => ({ r: query?.r }), [query?.r])

  const PreprocessDateRange = useCallback(() => {
    setHistoryDatas([])
    setChartDatas([])
    setLoadingHistory(true)
  }, [])

  const ProcessRequestDateRange = useCallback(
    async (starttime, endtime, _isMount) => {
      const startOfDay = new Date(starttime)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(endtime)
      endOfDay.setHours(23, 59, 59, 999)

      try {
        const { data, status } = await RequestAPI.get(endpointData, {
          st: startOfDay.getTime(),
          et: endOfDay.getTime(),
          ...(Query || {}),
        })

        if (status !== 200) {
          setChartDatas([])
          setHistoryDatas([])
          return
        }

        const { details } = data
        const newChartDatas = []
        const newHistoryDatas = []

        details?.forEach((item, index) => {
          const timestamp_raw = item[columnTimestamp]
          const t = new DateGAP(timestamp_raw)
          const label = t.format2Str("DD/MM/YYYY HH:II")

          newChartDatas.push({
            ...item,
            id: index,
            timestamp: label,
            _timestamp_raw: timestamp_raw,
          })

          const lastRaw = newHistoryDatas[newHistoryDatas.length - 1]?._timestamp_raw
          if (!lastRaw) {
            newHistoryDatas.push({ ...item, id: index, timestamp: label, _timestamp_raw: timestamp_raw })
          } else {
            const diff = new Date(lastRaw).getTime() - t.getTime()
            // เฉลี่ยวันละ ~20 จุด
            if (diff >= 4320 * 1000) {
              newHistoryDatas.push({ ...item, id: index, timestamp: label, _timestamp_raw: timestamp_raw })
            }
          }
        })

        // คงพฤติกรรมเดิม: เรียงตาม id ลดหลั่น
        setChartDatas(Array.isArray(newChartDatas) ? newChartDatas.sort((a, b) => b.id - a.id) : [])
        setHistoryDatas(newHistoryDatas)
      } catch (e) {
        setChartDatas([])
        setHistoryDatas([])
      } finally {
        setLoadingHistory(false)
      }
    },
    [Query, columnTimestamp, endpointData]
  )

  const PostProcessDateRange = useCallback(async (_s, _e, isMount) => {
    isMount && clientMo.unLoadingPage()
  }, [])

  // ⬇️ Fallback: ทำให้มี “โครงกราฟ” แม้ไม่มีข้อมูลจริง
  const currentField = columns[selectedTab]?.field
  const hasDataKey =
    chartDatas.length > 0 &&
    chartDatas.some((d) => d[currentField] !== undefined && d[currentField] !== null)

  const fallbackData = useMemo(() => {
    const points = 12
    const now = Date.now()
    const arr = []
    for (let i = points - 1; i >= 0; i--) {
      const ts = now - i * 60 * 60 * 1000
      const t = new Date(ts)
      const DD = String(t.getDate()).padStart(2, "0")
      const MM = String(t.getMonth() + 1).padStart(2, "0")
      const YYYY = String(t.getFullYear())
      const HH = String(t.getHours()).padStart(2, "0")
      const II = String(t.getMinutes()).padStart(2, "0")
      arr.push({ timestamp: `${DD}/${MM}/${YYYY} ${HH}:${II}`, [currentField]: null })
    }
    return arr
  }, [currentField])

  const chartViewData = hasDataKey ? chartDatas : fallbackData
  const yDomain = hasDataKey ? ["auto", "auto"] : [0, 100]

  // ⬇️ ฟัง event จากฝั่ง Export เพื่อ “บังคับช่วงเวลา” ก่อนจับภาพ
  useEffect(() => {
    const handler = (e) => {
      const { st, et } = e.detail || {}
      if (Number.isFinite(st) && Number.isFinite(et)) {
        setOverrideRange({ st, et })
      }
    }
    window.addEventListener("weather-export:set-range", handler)
    return () => window.removeEventListener("weather-export:set-range", handler)
  }, [])

  // ⬇️ เมื่อมี overrideRange → โหลดข้อมูลช่วงนั้นทันที
  useEffect(() => {
    if (!overrideRange) return
    PreprocessDateRange()
    ProcessRequestDateRange(overrideRange.st, overrideRange.et, true)
  }, [overrideRange, PreprocessDateRange, ProcessRequestDateRange])

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
                <LineChart data={chartViewData} margin={{ top: 5, left: -30, right: 30, bottom: 5 }} width={250}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                  <YAxis fontSize={"12px"} domain={yDomain} allowDecimals={false} />
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
            <DataTable columns={columns} historyDatas={historyDatas} loadingHistory={loadingHistory} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}

function LoadWeather({ setLoadingHistory, ProcessRequestDateRange, startTime, endTime }) {
  useEffect(() => {
    setLoadingHistory(true)
    ProcessRequestDateRange(startTime, endTime, true)
  }, [ProcessRequestDateRange, endTime, setLoadingHistory, startTime])
}
