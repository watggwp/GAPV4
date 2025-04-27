import { Button, Stack, Typography } from "@mui/material";
import { template } from ".";
import { useCallback } from "react";
import RequestAPI from "../../js/requestAPI";
import RoyalGapUtil from "../../core/RoyalGapUtil";

export default function DeleteDevice({
    id = "",
    dataDelete = template["delete"],
    title = "",
    color = "",
    onClose = () => {},
    requestDevices = () => {}
}) {

    const requestDeviceUnregister = useCallback( async () => {
        const { path , query , pathParams , typeDelete } = dataDelete

        const pathRequest = RoyalGapUtil.mergePathParam(path , pathParams)
        const { data , status } = await RequestAPI.put(pathRequest , {
            id : id,
            type : typeDelete
        } , {
            params : query
        })

        switch(status) {
            case 200 :
                onClose()
                requestDevices()
                break;
            default :
                const { message } = data
                alert(message)
                break;
        }
    } , [dataDelete, id, onClose, requestDevices])

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
                <Typography fontWeight={900}>ลบอุปกรณ์</Typography>
                <Typography fontWeight={900}>{title}</Typography>
            </Stack>
            <Stack
                marginTop={3}
                alignItems={"center"}
            >
                <Typography>ยีนยันที่จะลบอุปกรณ์หรือไม่ ?</Typography>
                <Stack
                    direction={"row"}
                    justifyContent={"space-between"}
                    marginTop={3}
                    width={"100%"}
                >
                    <Button size="small" color="error" onClick={onClose} variant="contained">ยกเลิก</Button>
                    <Button size="small" variant="contained" onClick={requestDeviceUnregister}>ยืนยัน</Button>
                </Stack>
            </Stack>
        </Stack>
    )
}