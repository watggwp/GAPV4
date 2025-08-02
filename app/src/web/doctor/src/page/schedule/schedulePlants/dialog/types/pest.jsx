import { Autocomplete, autocompleteClasses, Grid, MenuItem, Select, Stack, TextField } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import RoyalGapFrontendUtil from "../../../../../../../../assets/core/RoyalGapUtil";
import RequestAPI from "../../../../../../../../assets/js/requestAPI";

export default function Pests({
    details , onChangeDetails
}) {

    const [ pestName , setPestName ] = useState(details.pest_name || "")
    const [ chemicalName , setChemicalName ] = useState(details.chemical_name || "")
    const [ volume , setVolume ] = useState(details.volume)
    const [ unitVolume , setUnitVolume ] = useState(details.unit_volume || "")

    const [ loadingPests , setLoadingPests ] = useState(true)
    const [ pests , setPests ] = useState([])

    

    const onChangeVolume = useCallback(({ target : { value } }) => {
        setVolume(value)
    } , [])

    const onChangeUnitVolume = useCallback(({ target : { value } }) => {
        setUnitVolume(value)
    } , [])

    return(
        <Stack width={"100%"} spacing={2}>
            <Autocomplete
                disableClearable
                sx={{
                    [`& .MuiOutlinedInput-root`] : {
                        padding : "0px !important"
                    },
                    [`& .${autocompleteClasses.input}`] : {
                        padding : "7.5px 4px 7.5px 14px !important"
                    }
                }}
                // filterOptions={(options, { inputValue }) => {
                //     if (!inputValue) return options;
                //     return PrimarySearch.match.search(inputValue).map(r => r.item);
                // }}
                // value={nameFertilizer}
                options={[]}
                renderInput={(params) => 
                    <TextField {...params} placeholder={"เลือกโรคพืชที่เฝ้าระวัง"} />
                }
                // readOnly={loadingNameFertilizer}
                // onChange={(e , value) => {
                //     setNameFertilizer(value)
                //     setFormulaFertilizer("")
                // }}
                // noOptionsText="ไม่พบปัจจัยการผลิต"
            />
            <Autocomplete
                disableClearable
                sx={{
                    [`& .MuiOutlinedInput-root`] : {
                        padding : "0px !important"
                    },
                    [`& .${autocompleteClasses.input}`] : {
                        padding : "7.5px 4px 7.5px 14px !important"
                    }
                }}
                // filterOptions={(options, { inputValue }) => {
                //     if (!inputValue) return options;
                //     return PrimarySearch.match.search(inputValue).map(r => r.item);
                // }}
                // value={nameFertilizer}
                options={[]}
                renderInput={(params) => 
                    <TextField {...params} placeholder={"เลือกสารเคมีที่ใช้กำจัดโรคพืช"} />
                }
                // readOnly={loadingNameFertilizer}
                // onChange={(e , value) => {
                //     setNameFertilizer(value)
                //     setFormulaFertilizer("")
                // }}
                // noOptionsText="ไม่พบปัจจัยการผลิต"
            />
            <Grid container width={"100%"} spacing={1}>
                <Grid size={{ xs : 12 , sm : 8 }}>
                    <TextField
                        placeholder="ปริมาณที่ต้องใช้"
                        size="small"
                        value={volume}
                        onChange={onChangeVolume}
                        type="number"
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs : 12 , sm : 4 }}>
                    <Select
                        displayEmpty
                        value={unitVolume}
                        size="small"
                        onChange={onChangeUnitVolume}
                        fullWidth
                    >
                        <MenuItem value="" disabled>
                            หน่วยปริมาณ
                        </MenuItem>
                        <MenuItem value={"ลิตร"}>{"กรัม"}</MenuItem>
                        <MenuItem value={"กก."}>{"มิลลิลิตร"}</MenuItem>
                    </Select>
                </Grid>
            </Grid>
        </Stack>
    )
}