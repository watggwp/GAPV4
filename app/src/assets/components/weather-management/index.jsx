import { useCallback, useEffect, useMemo, useState } from "react"
import { Box, Grid, MenuItem, Select, Stack, styled, Tab, Tabs, Typography, useMediaQuery } from "@mui/material"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { DataGrid } from "@mui/x-data-grid"
import DatePickerAccept from "../DatePickerAccept"
import RequestAPI from "../../js/requestAPI"
import DateGAP from "../../core/DateGAP"
import { clientMo } from "../../js/moduleClient"

const TabsGAP = styled((props) => (
    <Tabs
        {...props}
    />
))({
    minHeight : "34px" , 
    height : "34px",
    '& .MuiTabs-indicator': {
        backgroundColor: "green"
    }
});

// api query require : 
// - st => start_time
// - et => end_time
// response json => { details }
const TabGAP = styled((props) => <Tab disableRipple {...props} />)({
    height : "34px",
    minHeight : "34px" ,
    minWidth : "50px",
    flexGrow : 1,
    '&.Mui-selected': {
        color: "green",
    }
});

export default function WeatherManagement({
    endpointData = "/api/farmer/weather-station",
    query,
    startTime,
    endTime,
    columnTimestamp = "timestamp",
    columns = [
        { field: 'temperature', name: 'อุณหภูมิ' , color : "green" },
        { field: 'humidity', name: 'ความชื้น' , color : "yellow" },
        { field: 'light', name: 'แสง' , color : "orange" },
        { field: 'rainfall', name: 'น้ำฝน' , color : "blue" },
    ],
    onChangeRange = (starttime , endtime) => {}
}) {
    const isDesktopPicker = useMediaQuery('(pointer: fine)')
    const isMediaSm = useMediaQuery((theme) => theme.breakpoints.down("md"))

    const [ dayAgo , setDayAgo ] = useState(0)
    const [ selectedTab , setSelectedTab ] = useState(0)

    const [ dateStart , setDateStart ] = useState(startTime ? new Date(startTime) : new Date())
    const [ dateEnd , setDateEnd ] = useState(endTime ? new Date(endTime) : new Date())

    const [ chartDatas , setChartDatas ] = useState([])

    const [ loadingHistory , setLoadingHistory ] = useState(false)
    const [ historyDatas , setHistoryDatas ] = useState([])

    const onChangeTab = useCallback((event , newValue) => {
        setSelectedTab(newValue)
    } , [])

    const Query = useMemo(() => ({
        r : query.r
    }) , [query.r])

    const requestWeatherManagement = useCallback( async (starttime , endtime , isMount) => {
        setLoadingHistory(true)

        setDateStart(new Date(starttime))
        setDateEnd(new Date(endtime))
        const { data , status } = await RequestAPI.get(endpointData , {
            "st" : starttime,
            "et" : endtime,
            ...(Query || {})
        })
        setLoadingHistory(false)

        switch(status) {
            case 200 :
                const { details } = data
                const newDatas = details?.map((item , index) => {
                    return {
                        ...item,
                        id : index,
                        timestamp : new DateGAP(item[columnTimestamp]).format2Str("DD/MM/YYYY HH:II"),
                    }
                }) || []

                setChartDatas(Array.isArray(newDatas) ? newDatas.sort() : [])
                setHistoryDatas(newDatas)
                break;
            default :
                break;
        }
        isMount && clientMo.unLoadingPage()
    } , [columnTimestamp, endpointData, Query])

    const onChanageDayAgo = useCallback((event) => {
        const { now , dayAgo } = new DateGAP().getDayRangeFromNow(event.target.value)
        setDayAgo(event.target.value)
        requestWeatherManagement(dayAgo.getTime() , now.getTime())
    }, [requestWeatherManagement])

    const onChangeStart = useCallback((date) => {
        setDateStart(date["$d"])
        setDateEnd(null)
    } , [])

    const onChangeEnd = useCallback((date) => {
        requestWeatherManagement(dateStart.getTime() , date["$d"].getTime())
    } , [dateStart, requestWeatherManagement])

    useEffect(() => {
        const { now , dayAgo } = new DateGAP().getDayRangeFromNow(0)
        requestWeatherManagement(dayAgo.getTime() , now.getTime() , true)
    } , [requestWeatherManagement])

    useEffect(() => {
        onChangeRange?.(dateStart.getTime() , dateEnd.getTime())
    } , [dateEnd, dateStart, onChangeRange])
    
    return(
        <Stack
            width={"100%"} 
            height={"100%"}
            alignItems={"center"}
        >
            <Grid container width={"100%"} height={"100%"} justifyContent={"center"}>
                <Grid size={{ sm : 12 , md : 6 }} height={isMediaSm ? "55%" : "100%"} minHeight={isMediaSm ? "300px" : 0}>
                    <TabsGAP 
                        value={selectedTab} 
                        onChange={onChangeTab} 
                        variant="scrollable" 
                        scrollButtons="auto"
                    >
                        {
                            columns.map((item , index) => {
                                return(
                                    <TabGAP key={index} label={item.name} value={index} />
                                )
                            })
                        }
                    </TabsGAP>
                    <Stack width={"100%"} height={`calc(100% - 35px - ${Boolean(!startTime && !endTime) ? "112px" : "10px"})`} marginTop={1} justifyContent={"center"} alignItems={"center"}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartDatas}
                                margin={{
                                    top: 5,
                                    left: -30,
                                    right: 30,
                                    bottom: 5,
                                }}
                                width={250}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                                <YAxis fontSize={"12px"} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px'  , fontFamily : "Sans-font" , width : "100%" , left : 0 }} />
                                <Line type="monotone" dataKey={columns[selectedTab].field} stroke={columns[selectedTab].color} name={columns[selectedTab].name} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Stack>
                    {
                        Boolean(!startTime && !endTime) && (
                            <Stack 
                                width={"100%"}
                                alignItems={"center"}
                            >
                                <Stack width={"95%"} direction={"row"} justifyContent={"space-between"} alignItems={"center"} marginTop={"8px"}>
                                    <Stack
                                        width={"45%"}
                                    >
                                        <DatePickerAccept
                                            label={"วันเริ่มต้น"}
                                            value={dateStart}
                                            onAcceptData={!isDesktopPicker ? onChangeStart : undefined}
                                            onChangeData={isDesktopPicker ? onChangeStart : undefined}
                                            sxTextField={{
                                                "& .MuiPickersInputBase-sectionContent" : {
                                                    fontSize : "12px"
                                                },
                                            }}
                                        />
                                    </Stack>
                                    <Box
                                        width={"5%"}
                                        height={"2px"}
                                        bgcolor={"black"}
                                    />
                                    <Stack
                                        width={"45%"}
                                    >
                                        <DatePickerAccept
                                            label={"วันสิ้นสุด"}
                                            value={dateEnd}
                                            sxTextField={{
                                                "& .MuiPickersInputBase-sectionContent" : {
                                                    fontSize : "12px"
                                                }
                                            }}
                                            minDate={dateStart}
                                            onAcceptData={!isDesktopPicker ? onChangeEnd : undefined}
                                            onChangeData={isDesktopPicker ? onChangeEnd : undefined}
                                        />
                                    </Stack>
                                </Stack>
                                <Stack width={"95%"} marginTop={"8px"}>
                                    <Select size="small"
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    maxHeight: 200,
                                                },
                                            },
                                        }}
                                        onChange={onChanageDayAgo}
                                        value={dayAgo}
                                    >
                                        <MenuItem value={0}>วันนี้</MenuItem>
                                        <MenuItem value={1}>1 วัน</MenuItem>
                                        <MenuItem value={3}>3 วัน</MenuItem>
                                        <MenuItem value={7}>1 สัปดาห์</MenuItem>
                                        <MenuItem value={21}>3 สัปดาห์</MenuItem>
                                        <MenuItem value={30}>1 เดือน</MenuItem>
                                        <MenuItem value={90}>3 เดือน</MenuItem>
                                    </Select>
                                </Stack>
                            </Stack>
                        )
                    }
                </Grid>
                <Grid
                    size={{ sm : 12 , md : 6 }}
                    height={isMediaSm ? "45%" : "100%"}
                    width={"100%"}
                >
                    <Stack
                        width={"100%"}
                        height={"100%"}
                        alignItems={"center"}
                    >
                        <Stack 
                            width={"calc(100% - 8px)"}
                            height={"100%"}
                            paddingTop={1}
                            paddingBottom={1}
                        >
                            <DataGrid
                                columns={[
                                    { field: 'timestamp', headerName: 'วันที่/เวลา', minWidth: 150 , flex: 1 , align : "center" , headerAlign : "center" },
                                    ...columns.map((item) => {
                                        return {
                                            field : item.field,
                                            headerName : item.name,
                                            minWidth : 80,
                                            flex : 1,
                                            align : "center",
                                            headerAlign : "center",
                                        }
                                    }) ,
                                ]}
                                rows={historyDatas}
                                slots={{
                                    noRowsOverlay : () => (
                                        <Stack
                                            justifyContent={"center"}
                                            alignItems={"center"}
                                            width={"100%"}
                                            height={"100%"}
                                        >
                                            <Typography fontSize={"14px"}>ไม่พบข้อมูลจากเซนเซอร์</Typography>
                                        </Stack>
                                    )
                                }}
                                hideFooter
                                disableColumnSorting
                                disableColumnMenu
                                rowHeight={36}
                                columnHeaderHeight={42}
                                loading={loadingHistory}
                            />
                        </Stack>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    )
}