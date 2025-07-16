import { DataGrid } from "@mui/x-data-grid";
import { startTransition, useCallback, useEffect, useState } from "react";
import RequestAPI from "../../../../../../assets/js/requestAPI";
import DateGAP from "../../../../../../assets/core/DateGAP";
import { Grid, Stack, useTheme } from "@mui/material";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function UserLogs({
    userType,
    selectedStation,
    startDate,
    endDate
}) {
    const Theme = useTheme()

    const [ userAccessLogs , setUserAccessLogs ] = useState([])
    const [ userAccessChartLogs , setUserAccessChartLogs ] = useState([])

    const [ loadingUserAccessLogs , setLoadingUserAccessLogs ] = useState(true)

    const requestLogs = useCallback(async (query) => {
        setLoadingUserAccessLogs(true)
        const { data , status } = await RequestAPI.get("/api/admin/user-access-logs", {
            user_type : userType,
            station_id : selectedStation,
            st : startDate,
            et : endDate
        })
        
        startTransition(() => {
            setLoadingUserAccessLogs(false)

            switch (status) {
                case 200:
                    const { user_access_logs , chart_access_logs } = data

                    setUserAccessLogs(user_access_logs)
                    setUserAccessChartLogs(chart_access_logs)
                    break;
                default:
                    break;
            }
        })
    } , [endDate, selectedStation, startDate, userType]);

    useEffect(() => {
        requestLogs()
    } , [requestLogs])

    return(
        <Grid container size={{ xs : 12 }} minHeight={230} paddingBottom={1} spacing={1}>
            <Grid size={{ sm : 12 , md : 6 }}>
                <Stack
                    width={"100%"}
                    height={"100%"}
                    maxHeight={"250px"}
                >
                    <DataGrid
                        columns={[
                            {
                                field : "fullname",
                                headerName : "ชื่อ - นามสกุล",
                                flex : 3,
                                minWidth : 300
                            },
                            {
                                field : "total_access",
                                headerName : "จำนวนเข้าใช้งาน",
                                flex : 1.5,
                                minWidth : 150
                            },
                            {
                                field : "access_date",
                                headerName : "วันล่าสุดที่เข้าใช้งาน",
                                flex : 1.5,
                                minWidth : 150,
                                renderCell: ({ value }) => new DateGAP(value).format2Str("DD-MM-YYYY")
                            }
                        ]}
                        rows={userAccessLogs}
                        loading={loadingUserAccessLogs}
                        hideFooterPagination
                        hideFooter
                    />
                </Stack>
            </Grid>
            <Grid size={{ sm : 12 , md : 6 }}>
                <ResponsiveContainer width="100%" height="100%" maxHeight={250}>
                    <LineChart
                        data={userAccessChartLogs}
                        width={250}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="access_date" tick={{ fontSize: 10 }} tickFormatter={(value) => new DateGAP(value).format2Str("DD-MM-YYYY")} />
                        <YAxis fontSize={"12px"} minTickGap={10} allowDecimals={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px'  , fontFamily : "Sans-font" , width : "100%" , left : 0 }} />
                        <Line type="monotone" dataKey="access_date_count" name="จำนวนผู้เข้าใช้งาน" stroke={Theme.palette.primary.main} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </Grid>
        </Grid>
    )
}