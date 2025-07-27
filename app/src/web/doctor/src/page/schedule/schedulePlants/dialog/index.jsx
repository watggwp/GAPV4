import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import Fertilizer from "./types/fertilizer";
import Pests from "./types/pest";

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
    open , schedule_id , type , onClose
}) {

    const [ category , setCategory ] = useState("")
    const [ title , setTitle ] = useState("")
    const [ details , setDetails ] = useState({})
    const [ age , setAge ] = useState()
    const [ repeat , setRepeat ] = useState(false)

    const onChangeCategory = useCallback(({ target : { value } }) => {
        setCategory(value)
        setDetails({})
    } , [])

    const onChangeTitle = useCallback(({ target : { value } }) => {
        setTitle(value)
    } , [])

    const onChangeAge = useCallback(({ target : { value } }) => {
        setAge(value)
    } , [])

    return(
        <Dialog 
            open={open}
            slotProps={{
                paper : {
                    sx : {
                        width : "98%",
                        maxWidth : "600px"
                    }
                }
            }}    
        >
            <DialogTitle justifyContent={"center"} display={"flex"} alignItems={"center"}>
                {
                    type === "insert" ?
                        "เพิ่มแผนการปลูก" :
                    type === "edit" ?
                        "แก้ไขแผนการปลูก" : 
                        ""
                }
            </DialogTitle>
            <DialogContent sx={{ paddingTop : 1 }}>
                <Stack spacing={3} marginBottom={2.5}>
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
                                <MenuItem value={id}>{name}</MenuItem>
                            )
                        }
                    </Select>
                    <Stack>
                        <TextField
                            placeholder="หัวข้อ"
                            size="small"
                            value={title}
                            onChange={onChangeTitle}
                        />
                    </Stack>
                    <Stack spacing={1}>
                        <Typography>รายละเอียด</Typography>
                        {
                            category === 1 ?
                                <Fertilizer
                                    details={details}
                                    setDetails={setDetails}
                                /> :
                            category === 2 ?
                                <Pests
                                    details={details}
                                    setDetails={setDetails}
                                /> :
                                <Stack width={"100%"} alignItems={"center"}>
                                    <Typography>โปรดเลือกประเภท</Typography>
                                </Stack>
                        }
                    </Stack>
                    <Stack direction={"row"} spacing={2}>
                        <TextField
                            placeholder="อายุการปลูก (จำนวนวัน)"
                            size="small"
                            value={age}
                            onChange={onChangeAge}
                            type="number"
                            fullWidth
                        />
                        <Checkbox/>
                    </Stack>
                </Stack>
                <DialogActions>
                    <Stack spacing={4} direction={"row"}>
                        <Button onClick={onClose} variant="contained" color="error" >ยกเลิก</Button>
                        <Button variant="contained" color="primary" >บันทึก</Button>
                    </Stack>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )
}