import { useCallback, useEffect, useMemo, useState } from "react"
import { Grid, Pagination, Stack, styled, Tab, Tabs, Typography, useMediaQuery } from "@mui/material"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { DataGrid } from "@mui/x-data-grid"
import RequestAPI from "../../js/requestAPI"
import DateGAP from "../../core/DateGAP"
import { clientMo } from "../../js/moduleClient"
import DateRange from "../DateRange"
import DataTable from "./table"

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
    endpointData = "/api/sensor/weather-station",
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
    const isMediaSm = useMediaQuery((theme) => theme.breakpoints.down("md"))

    const [ selectedTab , setSelectedTab ] = useState(0)

    const [ chartDatas , setChartDatas ] = useState([])

    const [ loadingHistory , setLoadingHistory ] = useState(false)
    const [ historyDatas , setHistoryDatas ] = useState([])

    const onChangeTab = useCallback((event , newValue) => {
        setSelectedTab(newValue)
    } , [])

    const Query = useMemo(() => ({
        r : query.r
    }) , [query.r])

    const PreprocessDateRange = useCallback((starttime , endtime , isMount) => {
        setHistoryDatas([])
        setChartDatas([])
        setLoadingHistory(true)
    } , [])

    const ProcessRequestDateRange = useCallback( async (starttime , endtime , isMount) => {
        const startOfDay = new Date(starttime);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(endtime);
        endOfDay.setHours(23, 59, 59, 999);

        const { data , status } = await RequestAPI.get(endpointData , {
            "st" : startOfDay.getTime(),
            "et" : endOfDay.getTime(),
            ...(Query || {})
        })
        setLoadingHistory(false)

        switch(status) {
            case 200 :
                const { details } = data
                const newChartDatas = []
                const newHistoryDatas = []

                details?.forEach((item , index) => {
                    const timestamp_raw = item[columnTimestamp]
                    const newDateTime = new DateGAP(timestamp_raw)
                    const dateTimeFormat = newDateTime.format2Str("DD/MM/YYYY HH:II")

                    newChartDatas.push({
                        ...item,
                        id : index,
                        timestamp : dateTimeFormat,
                        _timestamp_raw : timestamp_raw
                    })

                    const lastTimeHistory = newHistoryDatas[newHistoryDatas.length - 1]?._timestamp_raw
                    if(!lastTimeHistory) {
                        newHistoryDatas.push({
                            ...item,
                            id : index,
                            timestamp : dateTimeFormat,
                            _timestamp_raw : timestamp_raw
                        })
                    } else {
                        const diffDatetime = new Date(lastTimeHistory).getTime() - newDateTime.getTime()
                        // เฉลี่ยวันละ 20 ครั้ง
                        if(diffDatetime >= 4320 * 1000) {
                            newHistoryDatas.push({
                                ...item,
                                id : index,
                                timestamp : dateTimeFormat,
                                _timestamp_raw : timestamp_raw
                            })
                        }
                    }
                })

                setChartDatas(Array.isArray(newChartDatas) ? newChartDatas.sort((a , b) => b.id - a.id) : [])
                setHistoryDatas(newHistoryDatas)
                break;
            default :
                break;
        }
    } , [Query, columnTimestamp, endpointData])

    const PostProcessDateRange = useCallback( async (starttime , endtime , isMount) => {
        isMount && clientMo.unLoadingPage()
    } , [])
    
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
                        {
                            !loadingHistory &&
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
                        }
                    </Stack>
                    {
                        Boolean(!startTime && !endTime) ?
                            <DateRange
                                startTime={startTime}
                                endTime={endTime}
                                onChangeRange={onChangeRange}
                                onChangeRangeStepPreprocess={PreprocessDateRange}
                                onChangeRangeStepProcess={ProcessRequestDateRange}
                                onChangeRangeStepPostprocess={PostProcessDateRange}
                            /> : 
                            <LoadWeather
                                startTime={startTime}
                                endTime={endTime}
                                setLoadingHistory={setLoadingHistory}
                                ProcessRequestDateRange={ProcessRequestDateRange}
                            />
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
                        <DataTable
                            columns={columns}
                            historyDatas={historyDatas}
                            loadingHistory={loadingHistory}
                        />
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    )
}

function LoadWeather({
    setLoadingHistory,
    ProcessRequestDateRange , 
    startTime ,
    endTime
}) {
    useEffect(() => {
        setLoadingHistory(true)
        ProcessRequestDateRange( startTime , endTime , true )
    } , [ProcessRequestDateRange, endTime, setLoadingHistory, startTime])
}
