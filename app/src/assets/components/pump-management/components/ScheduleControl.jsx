import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ScheduleList from './ScheduleList';
import { Box, Button, Stack } from '@mui/material';
import { DebounceTime, usePumpManagement } from '..';
import RequestAPI from '../../../js/requestAPI';
import { useRef } from 'react';
import ApproveDialogApp from '../../ApproveDialogApp';

import TimePickerApp from "../../TimePickerApp"
import { useDebounce } from '../../useRoyalGAP';

export default function ScheduleControl() {
    const { device_id , role } = usePumpManagement()
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('');
    
    const [ schedules , setSchedules ] = useState([])
    const [ loading , setLoading ] = useState(false)
    const [ loadingAdd , setLoadingAdd ] = useState(false)

    const [ openApprove , setOpenApprove ] = useState(false)
    const deleteID = useRef(0)

    const requestSchedule = useCallback( async () => {
        setLoading(true)
        const { data , status } = await RequestAPI.get(`/api/pump/${device_id}/schedule` , {
            r : role
        })
        setLoading(false)

        switch(status) {
            case 200 :
                const { schedules : schedulesRequest } = data
                setSchedules(schedulesRequest)
                break;    
            default :
                break;
        }
    } , [device_id, role])

    const handleAdd = useCallback( async () => {
        if (time && duration) {
            setLoadingAdd(true)
            const { data , status } = await RequestAPI.post(`/api/pump/${device_id}/schedule` , {
                start_time : time,
                duration : duration
            } , {
                params : {
                    r : role
                }
            })
            setLoadingAdd(false)

            switch(status) {
                case 200 :
                    const { data : lastSchedules } = data
                    setSchedules((crrSchedule) => [
                        ...lastSchedules,
                        ...crrSchedule
                    ])
                    break;
                default :
                    break;
            }

            setTime('');
            setDuration('');
        }
    } , [device_id, duration, role, time])

    const handleDelete = useCallback((id) => {
        deleteID.current = id

        setOpenApprove(true)
    } , [])

    const onConfirmDelete = useCallback( async () => {
        const { status } = await RequestAPI.delete(`/api/pump/${device_id}/schedule/${deleteID.current}`, {
            r : role
        })

        switch(status) {
            case 200 :
                setSchedules((currSchedules) => {
                    const indexSchedule = currSchedules.findIndex(sc => sc.id === deleteID.current)
                    currSchedules.splice(indexSchedule , 1)
                    return [...currSchedules]
                })
                break;
            default :
                break;
        }

        setOpenApprove(false)
    } , [device_id, role])

    useEffect(() => {
        requestSchedule()
    }, [requestSchedule])

    const timestamp = useMemo(() =>
        schedules[schedules.length - 1]?.created_at || 0
    , [schedules])

    const debounce = useDebounce(timestamp , DebounceTime)

    return (
        <Box className="section control-box" bgcolor={"secondary.main"}>
            <h2>ตั้งเวลา เปิด-ปิด ปั๊ม</h2>
            <div className="input-group">
                <label style={{ width : "100%" }}>
                    เวลา
                    <Stack>
                        <TimePickerApp
                            value={time}
                            onChange={(date) => setTime(date)}
                            sxTextField={{
                                "& .MuiPickersInputBase-root" : {
                                    borderRadius : "12px",
                                    backgroundColor : "white"
                                }
                            }}
                        />
                    </Stack>
                    {/* <input type="time" value={time} onChange={e => setTime(e.target.value)} /> */}
                </label>
                <label style={{ width : "100%" }}>
                    จำนวน (นาที)
                    <input type="number" style={{ textAlign : "center" }} value={duration} onChange={e => setDuration(e.target.value)} />
                </label>
                <Button 
                    disabled={loadingAdd || debounce > 0} 
                    sx={{ 
                        marginTop : 1 , textTransform : "none", 
                        color : debounce > 0 ? "black !important" : undefined
                    }} 
                    variant="contained" 
                    size="small" 
                    onClick={handleAdd}
                >
                    {
                        debounce > 0 ? `${debounce}s` : "เพิ่ม"
                    }
                </Button>
            </div>
            {
                !loading && (
                    <React.Fragment>
                        <ScheduleList schedules={schedules} onDelete={handleDelete} />
                        <ApproveDialogApp
                            open={openApprove}
                            setOpen={setOpenApprove}
                            title={"ยืนยันลบตั้งเวลา"}
                            detail={
                                "ลบรายการตั้งเวลาที่เลือก, ยืนยันหรือไม่"
                            }
                            onAgree={onConfirmDelete}
                        />
                    </React.Fragment>
                )
            }
        </Box>
    );
};
