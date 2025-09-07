import { Autocomplete, autocompleteClasses, Grid, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import RoyalGapFrontendUtil from "../../../../../core/RoyalGapUtil";
import RequestAPI from "../../../../../js/requestAPI";

export default function Pests({
    details , onChangeDetails
}) {

    const [ pestName , setPestName ] = useState(details.pest || "")
    const [ chemicalName , setChemicalName ] = useState(details.chemical || "")
    const [ rate , setRate ] = useState(details.rate || "")
    const [ volume , setVolume ] = useState(details.volume)
    const [ unitVolume , setUnitVolume ] = useState(details.unit_volume || "")
    const [ howUse , setHowUse ] = useState(details.how_use || "")

    const [ loadingPests , setLoadingPests ] = useState(true)
    const [ pests , setPests ] = useState([])

    const [ loadingChemicals , setLoadingChemicals ] = useState(true)
    const [ chemicals , setChemicals ] = useState([])

    const PestSelects = useMemo(() => {
        const PestNames = new Set(pests.map(({ pest_name }) => pest_name))
        return {
            PestNames : [...PestNames],
            match : RoyalGapFrontendUtil.GetMatchSearch(
                PestNames,
                {
                    threshold : 0.5
                }
            )
        }
    } , [pests])

    const ChemicalPrimarySelects = useMemo(() => {
        const ChemicalNames = new Set(chemicals.map(({ name }) => name))
        return {
            ChemicalNames : [...ChemicalNames],
            match : RoyalGapFrontendUtil.GetMatchSearch(
                ChemicalNames,
                {
                    threshold : 0.5
                }
            )
        }
    } , [chemicals])

    const onChangeIsUse = useCallback(({ target : { value } }) => {
        setHowUse(value)
        onChangeDetails("how_use" , value)
    } , [onChangeDetails])

    const onChangeRate = useCallback(({ target : { value } }) => {
        setRate(value)
        onChangeDetails("rate" , value)
    } , [onChangeDetails])

    const onChangePest = useCallback((e , value) => {
        setPestName(value)
        onChangeDetails("pest" , value)
    } , [onChangeDetails])

    const onChangeChemical = useCallback((e , value) => {
        setChemicalName(value)
        onChangeDetails("chemical" , value)

        if(!howUse) {
            const howUseFilter = chemicals.find(({ name }) => {
                if(name === value) {
                    return true
                }

                return false
            }).how_use

            onChangeIsUse({ target : { value : howUseFilter } })
        }
    } , [chemicals, howUse, onChangeDetails, onChangeIsUse])

    const onChangeVolume = useCallback(({ target : { value } }) => {
        setVolume(value)
        onChangeDetails("volume" , value)
    } , [onChangeDetails])

    const onChangeUnitVolume = useCallback(({ target : { value } }) => {
        setUnitVolume(value)
        onChangeDetails("unit_volume" , value)
    } , [onChangeDetails])

    const filterOptionPest = useCallback((options, { inputValue }) => {
        if (!inputValue) return options;
        return PestSelects.match.search(inputValue).map(r => r.item);
    } , [PestSelects.match])

    const filterOptionChemical = useCallback((options, { inputValue }) => {
        if (!inputValue) return options;
        return ChemicalPrimarySelects.match.search(inputValue).map(r => r.item);
    } , [ChemicalPrimarySelects.match])

    const onRequestPests = useCallback( async () => {
        setLoadingPests(true)
        const { status , data } = await RequestAPI.get("/api/pests")
        setLoadingPests(false)

        switch(status) {
            case 200 :
                const { pests } = data
                setPests(pests)
                break;
            default :
                break;
        }
    } , [])

    const onRequestChemical = useCallback( async () => {
        setLoadingChemicals(true)
        const { status , data } = await RequestAPI.get("/api/chemicals")
        setLoadingChemicals(false)

        switch(status) {
            case 200 :
                const { chemicals } = data
                setChemicals(chemicals)
                break;
            default :
                break;
        }
    } , [])

    useEffect(() => {
        onRequestPests()
        onRequestChemical()
    } , [onRequestPests , onRequestChemical])

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
                filterOptions={filterOptionPest}
                value={pestName}
                options={PestSelects.PestNames}
                renderInput={(params) => 
                    <TextField {...params} placeholder={"เลือกโรคพืชที่เฝ้าระวัง"} />
                }
                readOnly={loadingPests}
                onChange={onChangePest}
                noOptionsText="ไม่พบโรคพืช"
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
                filterOptions={filterOptionChemical}
                value={chemicalName}
                options={ChemicalPrimarySelects.ChemicalNames}
                renderInput={(params) => 
                    <TextField {...params} placeholder={"เลือกสารเคมีที่ใช้กำจัดโรคพืช"} />
                }
                readOnly={loadingChemicals}
                onChange={onChangeChemical}
                noOptionsText="ไม่พบสารเคมี"
            />
            <Stack direction={"row"} alignItems={"center"} spacing={1} width={"100%"}>
                <TextField
                    placeholder="อัตราส่วนผสม"
                    size="small"
                    value={rate}
                    onChange={onChangeRate}
                    type="number"
                    sx={{
                        width : "calc(100% - 95px)"
                    }}
                />
                <Typography>CC/น้ำ20ลิตร</Typography>
            </Stack>
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
                        <MenuItem value={"กรัม"}>{"กรัม"}</MenuItem>
                        <MenuItem value={"มิลลิลิตร"}>{"มิลลิลิตร"}</MenuItem>
                    </Select>
                </Grid>
            </Grid>
            <TextField
                placeholder="วิธีการใช้"
                size="small"
                value={howUse}
                onChange={onChangeIsUse}
                type="number"
                rows={3}
                multiline
                fullWidth
            />
        </Stack>
    )
}