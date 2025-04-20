import { createContext, useCallback, useEffect, useState } from "react"
import RequestAPI from "../../../../assets/js/requestAPI"
import DateGAP from "../../../../assets/core/DateGAP"
import { clientMo } from "../../../../assets/js/moduleClient"
import { Stack, styled, Tab, Tabs, Typography } from "@mui/material"
import TemperatureChart from "./charts/temperature"
import { CartesianGrid, Legend, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import DatePickerApp from "../../../../assets/components/DatePicker"

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
    const [ selectedTab , setSelectedTab ] = useState(0)
    const [ chartDatas , setChartDatas ] = useState([])

    const onChangeTab = useCallback((event , newValue) => {
        setSelectedTab(newValue)
    } , [])

    const requestWeatherStation = useCallback( async (starttime , endtime , isMount) => {
        const { data , status } = await RequestAPI.get("/api/farmer/weather-station" , {
            "st" : starttime,
            "et" : endtime
        })

        switch(status) {
            case 200 :
                const { details } = data
                const newDatas = details.map((item) => {
                    return {
                        ...item,
                        timestamp : new DateGAP(item.timestamp).format2Str("DD/MM/YYYY HH:II"),
                    }
                })

                isMount && setChartDatas(newDatas)
                break;
            default :
                break;
        }
        isMount && clientMo.unLoadingPage()
    } , [])

    useEffect(() => {
        const { now , dayAgo } = new DateGAP().getDayRangeFromNow(3)
        requestWeatherStation(dayAgo.getTime() , now.getTime() , true)
    } , [requestWeatherStation])
    
    return(
        <Stack
            width={"100%"} 
            height={"100%"}
        >
            <Stack
                justifyContent={"center"}
                alignItems={"center"}
                height={"51px"}
                bgcolor={"bgSoft.main"}
            >
                <Typography fontSize={"24px"} fontWeight={900}>สภาพอากาศภายในศูนย์ฯ</Typography>
            </Stack>
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
                        {/* <Legend /> */}
                        {
                            selectedTab === 0 ? 
                                <TemperatureChart/> : 
                                null
                        }
                    </LineChart>
                </ResponsiveContainer>
            </Stack>
            <Stack direction={"row"}>
                <DatePickerApp
                    label={"วันเริ่มต้น"}
                />
                -
                <DatePickerApp
                    label={"วันสิ้นสุด"}
                />
            </Stack>
        </Stack>
    )
}