import { DataGrid } from "@mui/x-data-grid";
import { startTransition, useCallback, useEffect, useState } from "react";
import RequestAPI from "../../../../../../assets/js/requestAPI";
import DateGAP from "../../../../../../assets/core/DateGAP";
import { Grid, Stack, Typography } from "@mui/material";

export default function UserLogs({
    userType,
    selectedStation
}) {

    const [ userAccessLogs , setUserAccessLogs ] = useState([])
    const [ processDate , setProcessDate ] = useState({})

    const [ loadingUserAccessLogs , setLoadingUserAccessLogs ] = useState(true)

    const requestLogs = useCallback(async (query) => {
        setLoadingUserAccessLogs(true)
        const { data , status } = await RequestAPI.get("/api/admin/user-access-logs", {
            user_type : userType,
            station_id : selectedStation
        })
        
        startTransition(() => {
            setLoadingUserAccessLogs(false)

            switch (status) {
                case 200:
                    const { user_access_logs , process_date } = data

                    setUserAccessLogs(user_access_logs)
                    setProcessDate(process_date)
                    break;
                default:
                    break;
            }
        })
    } , [selectedStation, userType]);

    useEffect(() => {
        requestLogs()
    } , [requestLogs])

    return(
        <Stack spacing={1}>
            <Grid container justifyContent={"center"}>
                {/* <Grid size={{ sm : 12 , md : 5 }} alignItems={"center"} justifyContent={"center"} >
                    <Typography align="center" >{new DateGAP(processDate.start_date).format2Str("DD-MM-YYYY")}</Typography>
                </Grid>
                <Grid size={{ sm : 12 , md : 2 }} alignItems={"center"} justifyContent={"center"} >
                    <Typography align="center">ถึง</Typography>
                </Grid>
                <Grid size={{ sm : 12 , md : 5 }} alignItems={"center"} justifyContent={"center"}>
                    <Typography align="center">{new DateGAP(processDate.now_date).format2Str("DD-MM-YYYY")}</Typography>
                </Grid> */}
                <Typography align="center" >
                    {`${new DateGAP(processDate.start_date).format2Str("DD-MM-YYYY")} ถึง ${new DateGAP(processDate.now_date).format2Str("DD-MM-YYYY")}`}
                </Typography>
            </Grid>
            <DataGrid
                columns={[
                    {
                        field : "fullname",
                        headerName : "ชื่อ - นามสกุล",
                        flex : 3,
                        minWidth : 300
                    },
                    {
                        field : "total_access",
                        headerName : "จำนวนเข้าใช้งาน",
                        flex : 1.5,
                        minWidth : 150
                    },
                    {
                        field : "access_date",
                        headerName : "วันล่าสุดที่เข้าใช้งาน",
                        flex : 1.5,
                        minWidth : 150,
                        renderCell: ({ value }) => new DateGAP(value).format2Str("DD-MM-YYYY")
                    }
                ]}
                rows={userAccessLogs}
                loading={loadingUserAccessLogs}
                hideFooterPagination
                hideFooter
            />
        </Stack>
    )
}