import { useCallback, useEffect } from "react"
import RequestAPI from "../../../../assets/js/requestAPI"

export default function WeatherStation() {
    const requestWeatherStation = useCallback( async (starttime , endtime) => {
        const {} = await RequestAPI.get("/api/farmer/weather-station" , {
            "st" : starttime,
            "et" : endtime
        })
    } , [])

    useEffect(() => {
        const now = new Date().getTime()
        requestWeatherStation(now - (1000 * 60 * 60 * 24 * 7) , now)
    } , [requestWeatherStation])
    
    return(
        <></>
    )
}