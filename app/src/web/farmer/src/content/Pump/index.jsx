import React, { useCallback, useEffect, useState } from "react";
import PumpManagement from "../../../../../assets/components/pump-management";
import TemplagePage from "../template/page";
import { IconButton, LinearProgress, Stack, Typography } from "@mui/material";
import env from "../../../../../env";
import { useParams } from "react-router";
import RequestAPI from "../../../../../assets/js/requestAPI";

const { icon : { history : History } } = env

export default function PumpControlPage() {

    const { greenhouse_id , gap_id } = useParams()
    const [ openHistory , setOpenHistory ] = useState(false)

    const [ devices , setDevices ] = useState([])
    const [ loading , setLoading ] = useState(true)

    const onOpenHistory = useCallback(() => {
        setOpenHistory(true)
    } , [])

    const requestPumps = useCallback( async () => {
        setLoading(true)
        const { data , status } = await RequestAPI.get("/api/pump" , {
            greenhouse_id
        })
        setLoading(false)

        switch(status) {
            case 200 :
                const { devices } = data

                setDevices(devices)
                break;
            default :
                break;
        }
    } , [greenhouse_id])

    useEffect(() => {
        requestPumps()
    } , [requestPumps])

    return(
        <TemplagePage
            title={
                <Stack direction={"row"} justifyContent={"center"} alignItems={"center"} width={"100%"} paddingLeft={"40px"}>
                    {"ควบคุมปั้ม"}
                    <IconButton size="small" sx={{ marginLeft : 2 }} onClick={onOpenHistory}>
                        <History/>
                    </IconButton>
                </Stack>
            }
            routerReturn={`/farmer/form/${greenhouse_id}/${gap_id}/p`}
        >
            {
                loading ?
                    <LinearProgress color="primary" /> :
                    (
                        devices.length ?
                            <PumpManagement
                                device_id={devices[0].device_id}
                                role={"farmer"}
                                showHistory={openHistory}
                                setShowHistory={setOpenHistory}
                            /> :
                            <Stack
                                justifyContent={"center"}
                                alignItems={"center"}
                                marginTop={2}
                            >
                                <Typography>
                                    ไม่พบปั้มน้ำ
                                </Typography>
                            </Stack>
                    )
            }
        </TemplagePage>
    )
}
