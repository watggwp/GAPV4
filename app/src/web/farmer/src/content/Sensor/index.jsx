import { useCallback, useEffect, useState } from "react"
import MenuPlant from "../Gaps/MenuPlant"
import { CardActionArea, Chip, Grid, LinearProgress, Stack, Typography, useTheme } from "@mui/material"
import "./index.scss"
import RequestAPI from "../../../../../assets/js/requestAPI"
import { useNavigate, useParams } from "react-router"
import DateGAP from "../../../../../assets/core/DateGAP"
import env from "../../../../../env"

const { path_icon : { sensor_greenhouse } } = env

export default function Sensor() {
    const { greenhouse_id , gap_id } = useParams()
    const navigator = useNavigate()

    const [ devices , setDevices ] = useState([])
    const [ loading , setLoading ] = useState(true)

    const onRequestSensor = useCallback( async () => {
        setLoading(true)
        const { data , status } = await RequestAPI.get(`/api/sensor/weather-greenhouse/${greenhouse_id}` , {
            r : "farmer"
        })
        setLoading(false)

        switch(status) {
            case 200 :
                const { devices : devicesReponse } = data
                setDevices(devicesReponse)
                break;
            default :
                break;
        }
    } , [greenhouse_id])

    const onReturn = useCallback(() =>
        navigator(`/farmer/form/${greenhouse_id}/${gap_id}/p`)
    , [gap_id, greenhouse_id, navigator])

    useEffect(() => {
        onRequestSensor()
    } , [onRequestSensor])

    const onClickDevice = useCallback((device_id) => 
        navigator(`/farmer/form/${greenhouse_id}/${gap_id}/sensor/${device_id}`)    
    , [gap_id, greenhouse_id, navigator])

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
                {
                    loading ?
                        <LinearProgress color="primary" /> :
                        <Grid 
                            container
                            width={"100%"}
                        >
                            {
                                devices.map(({ device_id , status , create_timestamp }) => 
                                    <Grid 
                                        key={device_id}
                                        size={{ xs : 12 , md : 4 }}
                                    >
                                        <Stack
                                            width={"100%"}
                                            justifyContent={"center"}
                                            alignItems={"center"}
                                            marginTop={1}
                                            marginBottom={1}
                                        >
                                            <CardActionArea
                                                onClick={() => onClickDevice(device_id)}
                                                sx={{
                                                    borderRadius : 4,
                                                    bgcolor : "secondary.main",
                                                    width : "98%",
                                                    maxWidth : "250px",
                                                    position : "relative",
                                                    boxShadow : (theme) => `0px 2px 4px ${theme.palette.primary.main}`
                                                }}
                                            >
                                                <img src={sensor_greenhouse} style={{ 
                                                    position : "absolute" , 
                                                    width : "18px" ,
                                                    right : "-4px",
                                                    bottom : "-8px",
                                                    transform : "rotate(20deg)"
                                                }}/>
                                                <Stack
                                                    padding={1}
                                                    paddingLeft={1.5}
                                                    paddingRight={1.5}
                                                    width={"100%"}
                                                >
                                                    <Stack
                                                        alignItems={"end"}
                                                    >
                                                        <Chip
                                                            sx={{
                                                                height : "25px",
                                                                bgcolor : "white"
                                                            }}
                                                            label={
                                                                <Typography fontSize={"12px"}>
                                                                    { new DateGAP(create_timestamp).format2Str("DD-MM-YYYY") }
                                                                </Typography>
                                                            }
                                                        />
                                                    </Stack>
                                                    <Stack
                                                        alignItems={"start"}
                                                    >
                                                        <Typography fontSize={"18px"}>
                                                            { device_id }
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </CardActionArea>
                                        </Stack>
                                    </Grid>
                                )
                            }
                        </Grid>
                }
            </Stack>
        </section>
    )
}