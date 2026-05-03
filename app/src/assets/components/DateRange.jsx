import DatePickerAccept from "./DatePickerAccept";
import { Box, MenuItem, Select, Stack, useMediaQuery } from "@mui/material";
import { startTransition, useCallback, useEffect, useState } from "react";
import DateGAP from "../core/DateGAP";

export default function DateRange({
    startTime,
    endTime,
    onChangeRangeStepPreprocess, 
    onChangeRangeStepProcess, 
    onChangeRangeStepPostprocess, 
    onChangeRange = (starttime , endtime) => {},
    currentDayAgo = 0
}) {
    const isDesktopPicker = useMediaQuery('(pointer: fine)')

    const [ dayAgo , setDayAgo ] = useState(currentDayAgo)
    const [ dateStart , setDateStart ] = useState(startTime ? new Date(startTime) : startTime)
    const [ dateEnd , setDateEnd ] = useState(endTime ? new Date(endTime) : endTime)

    const onChangeDateRange = useCallback((starttime , endtime , isMount) => {
        onChangeRangeStepPreprocess?.(starttime , endtime , isMount)

        startTransition( async () => {
            setDateStart(new Date(starttime))
            setDateEnd(new Date(endtime))

            onChangeRangeStepProcess?.(starttime , endtime , isMount)
        })
        onChangeRangeStepPostprocess?.(starttime , endtime , isMount)
    } , [onChangeRangeStepPostprocess, onChangeRangeStepPreprocess, onChangeRangeStepProcess])

    const onChanageDayAgo = useCallback((event) => {
        const { now , dayAgo } = new DateGAP().getDayRangeFromNow(event.target.value)
        setDayAgo(event.target.value)
        onChangeDateRange(dayAgo.getTime() , now.getTime())
    }, [onChangeDateRange])

    const onChangeStart = useCallback((date) => {
        setDateStart(date["$d"])
        setDateEnd(null)
    } , [])

    const onChangeEnd = useCallback((date) => {
        onChangeDateRange(dateStart.getTime() , date["$d"].getTime())
    } , [dateStart, onChangeDateRange])

    useEffect(() => {
        if(startTime || endTime) {
            onChangeDateRange(startTime , endTime , true)
            return
        } 

        const { now , dayAgo } = new DateGAP().getDayRangeFromNow(0)
        onChangeDateRange(dayAgo.getTime() , now.getTime() , true)
    } , [endTime, onChangeDateRange, startTime])

    useEffect(() => {
        onChangeRange?.(dateStart?.getTime() , dateEnd?.getTime())
    } , [dateEnd, dateStart, onChangeRange])

    return(
        <Stack 
            width={"100%"}
            alignItems={"center"}
        >
            <Stack width={"95%"} direction={"row"} justifyContent={"space-between"} alignItems={"center"} marginTop={"8px"}>
                <Stack
                    width={"45%"}
                >
                    <DatePickerAccept
                        label={"วันเริ่มต้น"}
                        value={dateStart}
                        onAcceptData={!isDesktopPicker ? onChangeStart : undefined}
                        onChangeData={isDesktopPicker ? onChangeStart : undefined}
                        sxTextField={{
                            "& .MuiPickersInputBase-sectionContent" : {
                                fontSize : "12px"
                            },
                        }}
                    />
                </Stack>
                <Box
                    width={"5%"}
                    height={"2px"}
                    bgcolor={"black"}
                />
                <Stack
                    width={"45%"}
                >
                    <DatePickerAccept
                        label={"วันสิ้นสุด"}
                        value={dateEnd}
                        sxTextField={{
                            "& .MuiPickersInputBase-sectionContent" : {
                                fontSize : "12px"
                            }
                        }}
                        minDate={dateStart}
                        onAcceptData={!isDesktopPicker ? onChangeEnd : undefined}
                        onChangeData={isDesktopPicker ? onChangeEnd : undefined}
                    />
                </Stack>
            </Stack>
            <Stack width={"95%"} marginTop={"8px"}>
                <Select size="small"
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                maxHeight: 200,
                            },
                        },
                    }}
                    onChange={onChanageDayAgo}
                    value={dayAgo}
                >
                    <MenuItem value={0}>วันนี้</MenuItem>
                    <MenuItem value={1}>1 วัน</MenuItem>
                    <MenuItem value={3}>3 วัน</MenuItem>
                    <MenuItem value={7}>1 สัปดาห์</MenuItem>
                    <MenuItem value={21}>3 สัปดาห์</MenuItem>
                    <MenuItem value={30}>1 เดือน</MenuItem>
                    <MenuItem value={90}>3 เดือน</MenuItem>
                </Select>
            </Stack>
        </Stack>
    )
}