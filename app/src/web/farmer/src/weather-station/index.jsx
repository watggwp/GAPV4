import { createContext, useCallback, useEffect, useState } from "react"
import RequestAPI from "../../../../assets/js/requestAPI"
import DateGAP from "../../../../assets/core/DateGAP"
import { clientMo } from "../../../../assets/js/moduleClient"
import { Box, MenuItem, Select, Stack, styled, Tab, Tabs, Typography } from "@mui/material"
import TemperatureChart from "./charts/temperature"
import { CartesianGrid, Legend, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import DatePickerApp from "../../../../assets/components/DatePicker"
import { set } from "date-fns"
import { DataGrid } from "@mui/x-data-grid"
import HumidityChart from "./charts/humidity"
import LightChart from "./charts/light"
import RainfallChart from "./charts/rainfall"
import { useRef } from "react"

const displayNameMap = {
    temperature: 'อุณหภูมิ',
    humidity: 'ความชื้น',
    light: 'แสงสว่าง',
    rainfall: 'น้ำฝน'
}

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

const TabGAP = styled((props) => <Tab disableRipple {...props} />)({
    height : "34px",
    minHeight : "34px" ,
    minWidth : "70px",
    flexGrow : 1,
    '&.Mui-selected': {
        color: "green",
    }
});

const WeatherStationContext = createContext({
    chartDatas : [],
    setChartDatas : () => {}
})

export default function WeatherStation() {
    const [ dayAgo , setDayAgo ] = useState(0)
    const [ selectedTab , setSelectedTab ] = useState(0)

    const [ dateStart , setDateStart ] = useState(new Date())
    const [ dateEnd , setDateEnd ] = useState(new Date())

    const [ chartDatas , setChartDatas ] = useState([])

    const [ loadingHistory , setLoadingHistory ] = useState(false)
    const [ historyDatas , setHistoryDatas ] = useState([])

    const onChangeTab = useCallback((event , newValue) => {
        setSelectedTab(newValue)
    } , [])

    const requestWeatherStation = useCallback( async (starttime , endtime , isMount) => {
        setLoadingHistory(true)

        setDateStart(new Date(starttime))
        setDateEnd(new Date(endtime))
        const { data , status } = await RequestAPI.get("/api/farmer/weather-station" , {
            "st" : starttime,
            "et" : endtime
        })
        setLoadingHistory(false)

        switch(status) {
            case 200 :
                const { details } = data
                const newDatas = details.map((item , index) => {
                    return {
                        ...item,
                        id : index,
                        timestamp : new DateGAP(item.timestamp).format2Str("DD/MM/YYYY HH:II"),
                    }
                })

                isMount && setChartDatas(newDatas)
                setHistoryDatas(newDatas)
                break;
            default :
                break;
        }
        isMount && clientMo.unLoadingPage()
    } , [])

    const onChanageDayAgo = useCallback((event) => {
        const { now , dayAgo } = new DateGAP().getDayRangeFromNow(event.target.value)
        setDayAgo(event.target.value)
        requestWeatherStation(dayAgo.getTime() , now.getTime())
    }, [requestWeatherStation])

    const newStartSelect = useRef(null)
    const onChangeStartDate = useCallback((date) => {
        newStartSelect.current = date
    }, [])

    const onAcceptStartDate = useCallback(() => {
        if(newStartSelect.current) {
            newStartSelect.current["$L"] = "th"
            setDateStart(newStartSelect.current)
            setDateEnd("")
        }
    }, [])

    useEffect(() => {
        const { now , dayAgo } = new DateGAP().getDayRangeFromNow(0)
        requestWeatherStation(dayAgo.getTime() , now.getTime() , true)
    } , [requestWeatherStation])
    
    return(
        <Stack
            width={"100%"} 
            height={"100%"}
            alignItems={"center"}
        >
            <Stack
                justifyContent={"center"}
                alignItems={"center"}
                height={"51px"}
                width={"100%"}
                bgcolor={"bgSoft.main"}
            >
                <Typography fontSize={"24px"} fontWeight={900}>สภาพอากาศภายในศูนย์ฯ</Typography>
            </Stack>
            <Stack
                height={"calc(100% - 51px)"}
                width={"100%"}
                alignItems={"center"}
            >
                <TabsGAP 
                    value={selectedTab} 
                    onChange={onChangeTab} 
                    variant="scrollable" 
                    scrollButtons="auto"
                >
                    <TabGAP label="อุณหภูมิ" value={0} />
                    <TabGAP label="ความชื้น" value={1} />
                    <TabGAP label="แสง" value={2} />
                    <TabGAP label="น้ำฝน" value={3} />
                </TabsGAP>
                <Stack width={"100%"} height={"170px"} marginTop={"16px"}>
                    <ResponsiveContainer width="93%" height="100%">
                        <LineChart
                            data={chartDatas}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px'  , fontFamily : "Sans-font" }} formatter={(value) => displayNameMap[value] || value} />
                            {
                                selectedTab === 0 ? 
                                    <TemperatureChart/> : 
                                selectedTab === 1 ?
                                    <HumidityChart/> :
                                selectedTab === 2 ?
                                    <LightChart/> :
                                    <RainfallChart/>
                            }
                        </LineChart>
                    </ResponsiveContainer>
                </Stack>
                <Stack width={"95%"} direction={"row"} justifyContent={"space-between"} alignItems={"center"} marginTop={"8px"}>
                    <Stack
                        width={"45%"}
                    >
                        <DatePickerApp
                            label={"วันเริ่มต้น"}
                            value={dateStart}
                            onChange={onChangeStartDate}
                            onAccept={onAcceptStartDate}
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
                        <DatePickerApp
                            label={"วันสิ้นสุด"}
                            value={dateEnd}
                            sxTextField={{
                                "& .MuiPickersInputBase-sectionContent" : {
                                    fontSize : "12px"
                                }
                            }}
                            minDate={dateStart}
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
                <Stack width={"95%"}
                    height={"calc(100% - 34px - 186px - 48px - 48px - 16px)"}
                    marginTop={"8px"}>
                    <DataGrid
                        columns={[
                            { field: 'timestamp', headerName: 'วันที่/เวลา', minWidth: 150 , flex: 1 , align : "center" , headerAlign : "center" },
                            { field: 'temperature', headerName: 'อุณหภูมิ', minWidth: 80 , flex: 1 , align : "center" , headerAlign : "center" },
                            { field: 'humidity', headerName: 'ความชื้น', minWidth: 80 , flex: 1 , align : "center" , headerAlign : "center" },
                            { field: 'light', headerName: 'แสง', minWidth: 80 , flex: 1 , align : "center" , headerAlign : "center" },
                            { field: 'rainfall', headerName: 'น้ำฝน', minWidth: 80 , flex: 1 , align : "center" , headerAlign : "center" },
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
        </Stack>
    )
}