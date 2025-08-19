import { Button, Checkbox, Chip, DialogActions, DialogContent, DialogTitle, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import Fertilizer from "./types/fertilizer";
import Pests from "./types/pest";
import RequestAPI from "../../../../../../../assets/js/requestAPI";
import { useParams } from "react-router";
import ApproveDialogApp from "../../../../../../../assets/components/ApproveDialogApp";

const Categorys = [
    {
        id : 1,
        name : "ปัจจัยการผลิต"
    },
    {
        id : 2,
        name : "การสังเกตโรค"
    }
]

export default function DialogSchedule({
    schedule_id , type , onClose , requestSchedulePlants
}) {

    const { plant_id } = useParams()

    const [ category , setCategory ] = useState("")
    const [ title , setTitle ] = useState("")
    const [ details , setDetails ] = useState({})
    const [ age , setAge ] = useState("")
    const [ repeat , setRepeat ] = useState(false)

    const [ loadingData , setLoadingData ] = useState(type === "edit")
    const [ loadingSubmit , setLoadingSubmit ] = useState(false)

    const onChangeCategory = useCallback(({ target : { value } }) => {
        setCategory(value)
        setDetails({})
    } , [])

    const onChangeTitle = useCallback(({ target : { value } }) => {
        setTitle(value)
    } , [])

    const onChangeDetails = useCallback((title , data) => {
        startTransition(() => {
            setDetails((_details) => {
                _details[title] = data
                return { ..._details }
            })
        })
    } , [])

    const onChangeAge = useCallback(({ target : { value } }) => {
        setAge(value)
    } , [])

    const onChangeRepeat = useCallback((event, checked) => {
        setRepeat(checked)
    } , [])

    const onRequestSchedule = useCallback( async () => {
        setLoadingData(true)
        const { status , data } = await RequestAPI.get(`/api/schedules/${plant_id}/${schedule_id}`)
        setLoadingData(false)

        switch(status) {
            case 200 :
                const { schedule_plant : { category : _category , title : _title , details : _details , age_plant : _age_plant , repeat : _repeat } } = data
                setCategory(_category)
                setTitle(_title)
                setDetails(JSON.parse(_details)?.[0] || {})
                setAge(_age_plant)
                setRepeat(Boolean(_repeat))
                break;
            default :
                break;
        }
    } , [plant_id, schedule_id])

    const onSubmitDialog = useCallback( async () => {
        const insertData = {
            plant_id : Number(plant_id),
            category,
            title,
            details,
            age_plant : Number(age),
            repeat
        }

        setLoadingSubmit(true)
        const { status } = await (
            type === "insert" ?
                RequestAPI.post("/api/schedules" , insertData) :
                RequestAPI.put(`/api/schedules/${plant_id}/${schedule_id}` , insertData)
        )
        setLoadingSubmit(false)

        switch(status) {
            case 200 :
                requestSchedulePlants()
                onClose()
                break;
            case 403 :
            default :
                alert("้เพิ่มแผนการปลูกไม่สำเร็จ")
                break;
        }
    } , [age, category, details, onClose, plant_id, repeat, requestSchedulePlants, schedule_id, title, type])

    const EnabledComfirm = useMemo(() => 
        category && title &&
            (
                category === 1 ? (
                    details.name_fertilizer &&
                    details.formula_fertilizer &&
                    details.volume &&
                    details.unit_volume &&
                    details.how_use
                ) :
                category === 2 ? (
                    details.pest &&
                    details.chemical &&
                    details.volume &&
                    details.unit_volume
                ) : false
            ) &&
        age
    , [
        age, category, 
        details.chemical, details.formula_fertilizer, details.how_use, details.name_fertilizer, details.pest, details.unit_volume, details.volume, 
        title
    ])

    useEffect(() => {
        type === "edit" && onRequestSchedule()
    } , [onRequestSchedule, type])

    return(
        <>
            <DialogTitle justifyContent={"center"} display={"flex"} alignItems={"center"}>
                {
                    type === "insert" ?
                        "เพิ่มแผนการปลูก" :
                    type === "edit" ?
                        "จัดการแผนการปลูก" : 
                        ""
                }
            </DialogTitle>
            <DialogContent sx={{ paddingTop : 1 }}>
                <Stack spacing={3} marginBottom={2.5}>
                    {
                        loadingData ?
                            <Stack
                                width={"100%"}
                                justifyContent={"center"}
                                alignItems={"center"}
                            >
                                กำลังโหลดข้อมูล
                            </Stack> :
                            <>
                                <Select
                                    displayEmpty
                                    value={category}
                                    size="small"
                                    onChange={onChangeCategory}
                                    fullWidth
                                >
                                    <MenuItem value="" disabled>
                                        เลือกประเภท
                                    </MenuItem>
                                    {
                                        Categorys.map(({ id , name }) => 
                                            <MenuItem key={id} value={id}>{name}</MenuItem>
                                        )
                                    }
                                </Select>
                                <Stack
                                    spacing={1}
                                >
                                    <TextField
                                        placeholder="หัวข้อ"
                                        size="small"
                                        value={title}
                                        onChange={onChangeTitle}
                                    />
                                    <Stack
                                        direction={"row"}
                                        spacing={2}
                                    >
                                        {
                                            category === 1 ?
                                                <>
                                                    <LabelHelpInput label="ใส่ปุ๋ยให้พืช" onChange={onChangeTitle} />
                                                    <LabelHelpInput label="ปุ๋ยที่สำคัญ" onChange={onChangeTitle} />
                                                </> :
                                            category === 2 ?
                                                <>
                                                    <LabelHelpInput label="เตรียมเฝ้าระวัง !!!" onChange={onChangeTitle} />
                                                    <LabelHelpInput label="ตรวจสอบพืชผัก !!!" onChange={onChangeTitle} />
                                                </> :
                                                <></>
                                        }
                                    </Stack>
                                </Stack>
                                <Stack spacing={1}>
                                    <Typography>รายละเอียด</Typography>
                                    {
                                        category === 1 ?
                                            <Fertilizer
                                                details={details}
                                                onChangeDetails={onChangeDetails}
                                            /> :
                                        category === 2 ?
                                            <Pests
                                                details={details}
                                                onChangeDetails={onChangeDetails}
                                            /> :
                                            <Stack width={"100%"} alignItems={"center"}>
                                                <Typography>โปรดเลือกประเภท</Typography>
                                            </Stack>
                                    }
                                </Stack>
                                <Stack direction={"row"} spacing={2} alignItems={"center"}>
                                    <TextField
                                        placeholder="อายุการปลูก (จำนวนวัน)"
                                        size="small"
                                        value={age}
                                        onChange={onChangeAge}
                                        type="number"
                                        fullWidth
                                    />
                                    <Stack
                                        width={100}
                                        justifyContent={"center"}
                                    >
                                        <label
                                            style={{
                                                display : "flex",
                                                alignItems : "center",
                                                height : "100%"
                                            }}
                                        >
                                            <Checkbox
                                                checked={repeat}
                                                onChange={onChangeRepeat}
                                            />
                                            ทำซ้ำ
                                        </label>
                                    </Stack>
                                </Stack>
                            </>
                    }
                </Stack>
                <DialogActions>
                    <Stack
                        width={"100%"}
                        direction={"row"}
                        justifyContent={ type === "edit" ? "space-between" : "end"}
                    >
                        {
                            type === "edit" && 
                                <DeleteSchedule
                                    schedule_id={schedule_id}
                                    requestSchedulePlants={requestSchedulePlants}
                                    onClose={onClose}
                                />
                        }
                        <Stack spacing={4} direction={"row"}>
                            <Button onClick={onClose} variant="contained" color="error" 
                                disabled={loadingSubmit}
                            >
                                ยกเลิก
                            </Button>
                            <Button 
                                variant="contained" color="primary" disabled={!EnabledComfirm} 
                                onClick={onSubmitDialog} 
                                loading={loadingSubmit}
                            >
                                บันทึก
                            </Button>
                        </Stack>
                    </Stack>
                </DialogActions>
            </DialogContent>
        </>
    )
}

const LabelHelpInput = ({
    label,
    onChange
}) => {

    const onClick = useCallback(() => {
        onChange({
            target : {
                value : label
            } 
        })
    } , [label, onChange])

    return(
        <Chip color="primary" label={label} onClick={onClick} />
    )
}

const DeleteSchedule = ({
    schedule_id ,
    requestSchedulePlants,
    onClose
}) => {
    const { plant_id } = useParams()

    const [ open , setOpen ] = useState(false)
    const [ loadingConfirm , setLoadingConfirm ] = useState(false)
    const [ password , setPassword ] = useState("")

    const onOpenApprove = useCallback(() => {
        setOpen(true)
        setPassword("")
    } , [])

    const onChangePassword = useCallback(({ target : { value } }) =>
        setPassword(String(value))    
    , [])

    const onConfirm = useCallback( async () => {
        setLoadingConfirm(true)
        const { status } = await RequestAPI.post(`/api/schedules/${plant_id}/${schedule_id}` , {
            password
        })
        setLoadingConfirm(false)

        switch(status) {
            case 200 :
                onClose()
                requestSchedulePlants()
                break;
            case 405 :
                alert("รหัสผ่านผู้ใช้งานไม่ถูกต้อง")
                break;
            default :
                break;
        }
    } , [onClose, password, plant_id, requestSchedulePlants, schedule_id])

    return(
        <>
            <Button onClick={onOpenApprove} variant="outlined" color="error">ลบ</Button>
            <ApproveDialogApp
                open={open}
                setOpen={setOpen}
                title={"ยืนยันลบแผนการปลูก"}
                detail={
                    <TextField
                        placeholder="รหัสผ่านผู้ใช้งาน"
                        size="small"
                        value={password}
                        onChange={onChangePassword}
                        type="password"
                    />
                }
                onAgree={onConfirm}
                loadingConfirm={loadingConfirm}
                disabledConfirm={!password}
                disabledCancel={loadingConfirm}
            />
        </>
    )
}