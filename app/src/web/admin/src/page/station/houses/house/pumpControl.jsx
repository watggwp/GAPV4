import { IconButton, LinearProgress, Paper, Stack, Typography } from "@mui/material"
import { useCallback, useEffect, useState } from "react"
import { useHouse } from "."
import RequestAPI from "../../../../../../../assets/js/requestAPI"
import env from "../../../../../../../env"
import PumpManagement from "../../../../../../../assets/components/pump-management"

const { icon: { history: History, close: Close } } = env

export default function PumpControl({
    setOpen
}) {

    const { greenhouse_id } = useHouse()
    const [openHistory, setOpenHistory] = useState(false)

    const [devices, setDevices] = useState([])
    const [loading, setLoading] = useState(true)

    const onOpenHistory = useCallback(() => {
        setOpenHistory(true)
    }, [])

    const requestPumps = useCallback(async () => {
        setLoading(true)
        const { data, status } = await RequestAPI.get(`/api/pump/${greenhouse_id}`, {
            r: "doctor"
        })
        setLoading(false)

        switch (status) {
            case 200:
                const { devices } = data

                setDevices(devices)
                break;
            default:
                break;
        }
    }, [greenhouse_id])

    useEffect(() => {
        requestPumps()
    }, [requestPumps])

    return (
        <Stack
            width={"100%"}
            height={"100%"}
            justifyContent={"center"}
            alignItems={"center"}
        >
            <Paper
                sx={{
                    width: "90%",
                    height: "80%",
                    maxWidth: 400,
                    borderRadius: 4
                }}
            >
                <Stack
                    height={"100%"}
                >
                    <Stack position={"relative"} paddingTop={2} paddingBottom={2} direction={"row"} justifyContent={"center"} alignItems={"center"} width={"100%"} paddingRight={2}>
                        {
                            Boolean(devices.length) &&
                            (
                                <IconButton size="small" sx={{ position: "absolute", left: 18 }} onClick={onOpenHistory}>
                                    <History />
                                </IconButton>
                            )
                        }
                        <Typography fontSize={25} fontWeight={900}> ควบคุมปั๊ม</Typography>
                        <IconButton size="small" sx={{ position: "absolute", right: 18 }} onClick={() => setOpen(false)}>
                            <Close />
                        </IconButton>
                    </Stack>
                    {
                        loading ?
                            <LinearProgress color="primary" /> :
                            (
                                devices.length ?
                                    <Stack
                                        overflow={"auto"}
                                        height={"calc(100% - 70px)"}
                                    >
                                        <PumpManagement
                                            device_id={devices[0].device_id}
                                            role={"doctor"}
                                            showHistory={openHistory}
                                            setShowHistory={setOpenHistory}
                                        />
                                    </Stack> :
                                    <Stack
                                        justifyContent={"center"}
                                        alignItems={"center"}
                                        marginTop={2}
                                    >
                                        <Typography>
                                            ไม่พบปั๊มน้ำ
                                        </Typography>
                                    </Stack>
                            )
                    }
                </Stack>
            </Paper>
        </Stack>
    )
}