import { Button, IconButton, LinearProgress, Stack, Typography } from "@mui/material";
import env from "../../../env";
import { template, useDeviceManagement } from ".";
import { useCallback, useEffect, useState } from "react";
import RequestAPI from "../../js/requestAPI";
import RoyalGapUtil from "../../core/RoyalGapUtil";

const { icon : { replyAll : Back , plus : Add } } = env

export default function Devices({
    title ,
    icon ,
    color ,
    subColor ,
    endpointDevices = template["devices"],
    endpointAdd = template["add"],
    endpointStatus = template["status"],
    endpointDelete = template["delete"],
}) {

    const { setPage } = useDeviceManagement()
    const [ devices , setDevices ] = useState([])
    const [ loading , setLoading ] = useState(true)

    const requestDevices = useCallback( async () => {

        const { path , query , pathParams } = endpointDevices

        const pathRequest = RoyalGapUtil.mergePathParam(path , pathParams)
        setLoading(true)
        const { data , status } = await RequestAPI.get(pathRequest , query)
        setLoading(false)

        console.log(data)
    } , [endpointDevices])

    const onReturn = useCallback(() => 
        setPage("index")
    , [setPage])

    useEffect(() => {
        requestDevices()
    } , [requestDevices])

    return(
        <Stack
            width={"100%"}
            height={"100%"}
        >
            <Stack
                sx={{
                    width : "100%",
                    maxWidth : "300px",
                    borderRadius : 4,
                    height : "60px",
                    overflow : "hidden"
                }}
            >
                <Stack width={"100%"} height={"100%"} overflow={"hidden"} direction={"row"} bgcolor={subColor}>
                    <Stack width={"30%"} height={"100%"} padding={1} bgcolor={color}>
                        <img src={icon} width={"100%"} height={"100%"} />
                    </Stack>
                    <Stack width={"70%"} height={"100%"} justifyContent={"space-between"}>
                        <Stack height={"100%"} justifyContent={"center"} alignItems={"center"}>
                            <Typography padding={1.5} fontSize={"14px"}>{title}</Typography>
                        </Stack>
                    </Stack>
                </Stack>
            </Stack>
            <Stack
                width={"100%"}
                height={"calc(100% - 60px)"}
            >
                <Stack
                    height={"calc(100% - 50px)"}
                    width={"100%"}
                    paddingTop={2}
                >
                    {
                        loading ?
                            <LinearProgress color="primary" /> :
                            devices.map(device => {
                                return ""
                            })
                    }
                </Stack>
                <Stack direction={"row"} marginTop={1} marginBottom={1} justifyContent={"space-evenly"}>
                    <Button onClick={onReturn} sx={{ width : "100px" , display : "flex" , justifyContent : "center" , alignItems : "center" }} variant="contained" size="small" >
                        <Back/>
                        <Typography marginLeft={1} fontSize={"12px"}>ย้อนกลับ</Typography>
                    </Button>
                    <Button sx={{ width : "100px" , display : "flex" , justifyContent : "center" , alignItems : "center" }} variant="contained" size="small" >
                        <Add/>
                        <Typography marginLeft={1} fontSize={"12px"}>เพิ่มอุปกรณ์</Typography>
                    </Button>
                </Stack>
            </Stack>
        </Stack>
    )
}