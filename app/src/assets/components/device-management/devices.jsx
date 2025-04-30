import { Box, Button, Grid, IconButton, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import env from "../../../env";
import { template, useDeviceManagement } from ".";
import { useCallback, useEffect, useState } from "react";
import RequestAPI from "../../js/requestAPI";
import RoyalGapUtil from "../../core/RoyalGapUtil";
import PopupApp from "../PopupApp";
import AddDevice from "./addDevice";
import DeleteDevice from "./deleteDevice";

const { icon : { replyAll : Back , plus : Add , delete : Delete } } = env

export default function Devices({
    title ,
    icon ,
    color ,
    subColor ,
    dataDevices = template["devices"],
    dataAdd = template["add"],
    dataStatus = template["status"],
    dataDelete = template["delete"],
}) {

    const { setPage } = useDeviceManagement()
    const [ devices , setDevices ] = useState([])
    const [ loading , setLoading ] = useState(true)

    const [ openAdd , setOpenAdd ] = useState(false)
    const [ idConfirmDelete , setIdConfirmDelete ] = useState(0)

    const requestDevices = useCallback( async () => {
        const { path , query , pathParams } = dataDevices

        const pathRequest = RoyalGapUtil.mergePathParam(path , pathParams)
        setLoading(true)
        const { data , status } = await RequestAPI.get(pathRequest , query)
        setLoading(false)

        switch(status) {
            case 200 :
                const { devices : devicesData } = data
                setDevices(devicesData)
                break;
            default :
                break;
        }
    } , [dataDevices])

    const onOpenAdd = useCallback(() => {
        setOpenAdd(true)
    } , [])

    const onOpenDelete = useCallback((id) => {
        setIdConfirmDelete(id)
    } , [])
    
    const onCloseAdd = useCallback(() => {
        setOpenAdd(false)
    } , [])

    const onCloseDelete = useCallback(() => {
        setIdConfirmDelete(0)
    } , [])

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
            <PopupApp
                open={openAdd}
            >
                <AddDevice
                    title={title}
                    color={subColor}
                    dataAdd={dataAdd}
                    onClose={onCloseAdd}
                    requestDevices={requestDevices}
                />
            </PopupApp>
            <PopupApp
                open={Boolean(idConfirmDelete)}
            >
                <DeleteDevice
                    id={idConfirmDelete}
                    title={title}
                    color={subColor}
                    dataDelete={dataDelete}
                    onClose={onCloseDelete}
                    requestDevices={requestDevices}
                />
            </PopupApp>
            <Stack
                sx={{
                    width : "100%",
                    height : "60px",
                }}
                alignItems={"center"}
            >
                <Stack borderRadius={4} maxWidth={"300px"} width={"100%"} height={"100%"} overflow={"hidden"} direction={"row"} bgcolor={subColor}>
                    <Stack width={"30%"} height={"100%"} padding={1} bgcolor={color}>
                        <img src={icon} width={"100%"} height={"100%"} />
                    </Stack>
                    <Stack width={"70%"} height={"100%"} justifyContent={"space-between"}>
                        <Stack height={"100%"} justifyContent={"center"} alignItems={"center"}>
                            <Typography padding={1.5} fontSize={"18px"}>{title}</Typography>
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
                            <Grid container spacing={2}>
                                {
                                    devices.map((devices) => {
                                        return (
                                            <Grid key={devices[dataDevices?.columnsData?.id]} size={{ xs : 12 , md : 6 }} display={"flex"} justifyContent={"center"}>
                                                <Stack
                                                    width={"100%"}
                                                    maxWidth={"300px"}
                                                    height={"50px"}
                                                    borderRadius={4}
                                                    bgcolor={`${subColor}90`}
                                                    direction={"row"}
                                                    alignItems={"center"}
                                                    paddingLeft={2}
                                                    paddingRight={2}
                                                    justifyContent={"space-between"}
                                                >
                                                    <Box
                                                        width={"15px"}
                                                        height={"15px"}
                                                        borderRadius={"50%"}
                                                        border={3}
                                                        borderColor={"white"}
                                                        bgcolor={
                                                            devices[dataDevices?.columnsData?.status] === "on" ?
                                                                "#3bc64e" :
                                                                "red"
                                                        }
                                                    />
                                                    <Tooltip
                                                        title={devices[dataDevices?.columnsData?.device_id]}
                                                        leaveTouchDelay={3000}
                                                    >
                                                        <Stack
                                                            marginLeft={1}
                                                            marginRight={1}
                                                        >
                                                            <Typography  
                                                                fontSize={"14px"} 
                                                            >{devices[dataDevices?.columnsData?.device_id]}</Typography>
                                                        </Stack>
                                                    </Tooltip>
                                                    <IconButton size="small" onClick={() => onOpenDelete(devices[dataDevices?.columnsData?.id])}>
                                                        <Delete/>
                                                    </IconButton>
                                                </Stack>
                                            </Grid>
                                        ) 
                                    })
                                }
                            </Grid>
                    }
                </Stack>
                <Stack direction={"row"} marginTop={1} marginBottom={1} justifyContent={"space-evenly"}>
                    <Button onClick={onReturn} sx={{ width : "100px" , display : "flex" , justifyContent : "center" , alignItems : "center" }} variant="contained" size="small" >
                        <Back/>
                        <Typography marginLeft={1} fontSize={"12px"}>ย้อนกลับ</Typography>
                    </Button>
                    <Button onClick={onOpenAdd} sx={{ width : "100px" , display : "flex" , justifyContent : "center" , alignItems : "center" }} variant="contained" size="small" >
                        <Add/>
                        <Typography marginLeft={1} fontSize={"12px"}>เพิ่มอุปกรณ์</Typography>
                    </Button>
                </Stack>
            </Stack>
        </Stack>
    )
}