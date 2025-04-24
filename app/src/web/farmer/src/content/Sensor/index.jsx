import { useCallback, useEffect } from "react"
import MenuPlant from "../Gaps/MenuPlant"
import { Stack } from "@mui/material"
import "./index.scss"
import RequestAPI from "../../../../../assets/js/requestAPI"
import { useNavigate, useParams } from "react-router"

export default function Sensor() {

    const { greenhouse_id , gap_id } = useParams()
    const navigator = useNavigate()

    const onRequestSensor = useCallback( async () => {
        const { data , status } = await RequestAPI.get(`/api/sensor/weather-greenhouse/${greenhouse_id}` , {
            r : "farmer"
        })
    } , [greenhouse_id])

    const onReturn = useCallback(() =>
        navigator(`/farmer/form/${greenhouse_id}`)
    , [greenhouse_id, navigator])

    useEffect(() => {
        onRequestSensor()
    } , [onRequestSensor])

    return(
        <section id="weather-sensor-farmer">
            <div className="head">
                <div
                    className="return"
                    onClick={onReturn}
                >
                    <svg fill="#000000" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                    <g fillRule="evenodd">
                        <path d="M1052 92.168L959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z" />
                        <path d="M1920 92.168L1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z" />
                    </g>
                    </svg>
                </div>
                <span>เซ็นเซอร์ในโรงเรือน</span>
            </div>
            <Stack height={"calc(100% - 55px)"} width={"100%"} overflow={"scroll"}>
                
            </Stack>
        </section>
    )
}