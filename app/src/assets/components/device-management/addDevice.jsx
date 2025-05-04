import { Button, Stack, TextField, Typography } from "@mui/material";
import { template } from ".";
import { useCallback, useMemo, useState } from "react";
import RequestAPI from "../../js/requestAPI";
import RoyalGapUtil from "../../core/RoyalGapUtil";

export default function AddDevice({
    dataAdd = template["add"],
    title = "",
    color = "",
    onClose = () => {},
    requestDevices = () => {}
}) {

    const [ deviceID , setDeviceID ] = useState("")
    const [ loading , setLoading ] = useState(false)

    const onRegisterDevice = useCallback( async () => {

        const { path , query , pathParams } = dataAdd

        const pathRequest = RoyalGapUtil.mergePathParam(path , pathParams)

        setLoading(true)
        const { data , status } = await RequestAPI.put(pathRequest , {
            device_id : deviceID
        } , {
            params : query
        })
        setLoading(false)

        switch(status) {
            case 200 :
                onClose()
                dataAdd?.onAddComplete?.()
                requestDevices()
                break;
            default :
                const { message } = data
                alert(message)
                break;
        }

    } , [dataAdd, deviceID, onClose, requestDevices])

    const onChangeDeviceID = useCallback((event) => 
        setDeviceID(event.target.value)
    , [])

    const addDisabled = useMemo(() => 
        !deviceID || loading
    , [deviceID, loading])

    return(
        <Stack
            width={"98%"}
            maxWidth={"350px"}
            bgcolor={"white"}
            padding={2}
            borderRadius={4}
        >
            <Stack
                justifyContent={"center"}
                alignItems={"center"}
                bgcolor={color}
                paddingTop={1}
                paddingBottom={1}
                borderRadius={4}
            >
                <Typography fontWeight={900}>เพิ่มอุปกรณ์</Typography>
                <Typography fontWeight={900}>{title}</Typography>
            </Stack>
            <Stack
                marginTop={3}
            >
                <label>
                    <Typography>ชื่ออุปกรณ์</Typography>
                    <TextField
                        hiddenLabel
                        placeholder="เลขบนเครื่องอุปกรณ์"
                        size="small"
                        sx={{
                            marginTop : 1,
                            "& .MuiInputBase-root" : {
                                borderRadius : "12px",
                                backgroundColor : "white"
                            }
                        }}
                        fullWidth
                        onChange={onChangeDeviceID}
                    />
                </label>
                <Stack
                    direction={"row"}
                    justifyContent={"space-between"}
                    marginTop={3}
                >
                    <Button size="small" color="error" onClick={onClose} variant="contained">ยกเลิก</Button>
                    <Button size="small" variant="contained" onClick={onRegisterDevice} disabled={addDisabled} >ยืนยัน</Button>
                </Stack>
            </Stack>
        </Stack>
    )
}