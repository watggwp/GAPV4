import React, { useCallback, useEffect, useState, startTransition } from "react";
import RequestAPI from "../../../../../../assets/js/requestAPI";
import { useAdminContext } from "../../../Admin";
import { Grid } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@mui/material";
import DateRange from "../../../../../../assets/components/DateRange";
import DateGAP from "../../../../../../assets/core/DateGAP";

export default function AdminAccessLogs({ HrefPage, status }) {
    const { TabOn, titlePageNested } = useAdminContext()
    const Theme = useTheme()

    const [startDate, setStartDate] = useState(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7))
    const [endDate, setEndDate] = useState(new Date())

    const [adminLogs, setAdminLogs] = useState([])
    const [chartLogs, setChartLogs] = useState([])
    const [loading, setLoading] = useState(true)

    const requestLogs = useCallback(async () => {
        setLoading(true)
        const { data, status: httpStatus } = await RequestAPI.get("/api/admin/admin-access-logs", {
            st: startDate,
            et: endDate
        })

        startTransition(() => {
            setLoading(false)
            if (httpStatus !== 200) return

            const { admin_access_logs, chart_access_logs } = data
            setAdminLogs(admin_access_logs)

            const chartMap = {}
            chart_access_logs.forEach(({ access_date, access_date_count }) => {
                chartMap[new DateGAP(access_date).format2Str("DD-MM-YYYY")] = access_date_count
            })

            const dayMs = 24 * 60 * 60 * 1000
            const chartData = []
            for (let ts = startDate; ts <= endDate; ts += dayMs) {
                const label = new DateGAP(ts).format2Str("DD-MM-YYYY")
                chartData.push({ access_date: label, access_date_count: chartMap[label] || 0 })
            }
            setChartLogs(chartData)
        })
    }, [startDate, endDate])

    const onChangeDate = useCallback((_start, _end) => {
        setStartDate(_start)
        setEndDate(_end)
    }, [])

    useEffect(() => {
        status.changePath && window.history.pushState(
            {},
            "",
            `/admin/${HrefPage.get().split("?")[0]}?${status.status}`
        )
        titlePageNested(70, 30, ["หน้าแรก", "รายงานข้อมูล", "สถิติการเข้าใช้งานของผู้ดูแลระบบ"])
        TabOn.addTimeOut(TabOn.end())
    }, [HrefPage, status, titlePageNested, TabOn])

    useEffect(() => {
        requestLogs()
    }, [requestLogs])

    return (
        <Grid container paddingLeft={2} paddingRight={2} spacing={2} sx={{ overflowY: "auto" }}>
            <Grid size={{ xs: 12, md: 6 }}>
                <DateRange
                    startTime={startDate}
                    endTime={endDate}
                    onChangeRange={onChangeDate}
                    currentDayAgo={7}
                />
            </Grid>

            <Grid container size={{ xs: 12 }} minHeight={230} paddingBottom={1} spacing={1}>
                <Grid size={{ sm: 12, md: 6 }}>
                    <div style={{ width: "100%", height: "100%", maxHeight: 250 }}>
                        <DataGrid
                            columns={[
                                { field: "fullname", headerName: "ชื่อ - นามสกุล", flex: 3, minWidth: 200 },
                                { field: "total_access", headerName: "จำนวนเข้าใช้งาน", flex: 1.5, minWidth: 140 },
                                {
                                    field: "access_date",
                                    headerName: "วันล่าสุดที่เข้าใช้งาน",
                                    flex: 1.5,
                                    minWidth: 160,
                                    renderCell: ({ value }) => new DateGAP(value).format2Str("DD-MM-YYYY")
                                }
                            ]}
                            rows={adminLogs}
                            loading={loading}
                            hideFooterPagination
                            hideFooter
                        />
                    </div>
                </Grid>
                <Grid size={{ sm: 12, md: 6 }}>
                    <ResponsiveContainer width="100%" height="100%" maxHeight={250}>
                        <LineChart data={chartLogs}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="access_date" tick={{ fontSize: 10 }} />
                            <YAxis fontSize="12px" minTickGap={10} allowDecimals={false} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: "12px", fontFamily: "Sans-font", width: "100%", left: 0 }} />
                            <Line
                                type="monotone"
                                dataKey="access_date_count"
                                name="จำนวนผู้ดูแลระบบที่เข้าใช้งาน"
                                stroke={Theme.palette.primary.main}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Grid>
            </Grid>
        </Grid>
    )
}
