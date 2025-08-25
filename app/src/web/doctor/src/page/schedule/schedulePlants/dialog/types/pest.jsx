import { Autocomplete, autocompleteClasses, Grid, MenuItem, Select, Stack, TextField } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import RoyalGapFrontendUtil from "../../../../../../../../assets/core/RoyalGapUtil";
import RequestAPI from "../../../../../../../../assets/js/requestAPI";

export default function Pests({
    details , onChangeDetails
}) {

<<<<<<< HEAD
    const [ pestName , setPestName ] = useState(details.pest_name || "")
    const [ chemicalName , setChemicalName ] = useState(details.chemical_name || "")
=======
    const [ pestName , setPestName ] = useState(details.pest || "")
    const [ chemicalName , setChemicalName ] = useState(details.chemical || "")
>>>>>>> b28deb0cc31480068be68f7e5053b16216c0f1b7
    const [ volume , setVolume ] = useState(details.volume)
    const [ unitVolume , setUnitVolume ] = useState(details.unit_volume || "")

    const [ loadingPests , setLoadingPests ] = useState(true)
    const [ pests , setPests ] = useState([])
<<<<<<< HEAD
=======

    const [ loadingChemicals , setLoadingChemicals ] = useState(true)
    const [ chemicals , setChemicals ] = useState([])

>>>>>>> b28deb0cc31480068be68f7e5053b16216c0f1b7
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

<<<<<<< HEAD
    const onChangePest = useCallback((e , value) => {
        setPestName(value)
    } , [])

    const onChangeVolume = useCallback(({ target : { value } }) => {
        setVolume(value)
    } , [])

    const onChangeUnitVolume = useCallback(({ target : { value } }) => {
        setUnitVolume(value)
    } , [])
=======
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

    const onChangePest = useCallback((e , value) => {
        setPestName(value)
        onChangeDetails("pest" , value)
    } , [onChangeDetails])

    const onChangeChemical = useCallback((e , value) => {
        setChemicalName(value)
        onChangeDetails("chemical" , value)
    } , [onChangeDetails])

    const onChangeVolume = useCallback(({ target : { value } }) => {
        setVolume(value)
        onChangeDetails("volume" , value)
    } , [onChangeDetails])

    const onChangeUnitVolume = useCallback(({ target : { value } }) => {
        setUnitVolume(value)
        onChangeDetails("unit_volume" , value)
    } , [onChangeDetails])
>>>>>>> b28deb0cc31480068be68f7e5053b16216c0f1b7

    const filterOptionPest = useCallback((options, { inputValue }) => {
        if (!inputValue) return options;
        return PestSelects.match.search(inputValue).map(r => r.item);
    } , [PestSelects.match])

<<<<<<< HEAD
=======
    const filterOptionChemical = useCallback((options, { inputValue }) => {
        if (!inputValue) return options;
        return ChemicalPrimarySelects.match.search(inputValue).map(r => r.item);
    } , [ChemicalPrimarySelects.match])

>>>>>>> b28deb0cc31480068be68f7e5053b16216c0f1b7
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

<<<<<<< HEAD
    useEffect(() => {
        onRequestPests()
    } , [onRequestPests])
=======
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
>>>>>>> b28deb0cc31480068be68f7e5053b16216c0f1b7

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
<<<<<<< HEAD
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
=======
                filterOptions={filterOptionChemical}
                value={chemicalName}
                options={ChemicalPrimarySelects.ChemicalNames}
                renderInput={(params) => 
                    <TextField {...params} placeholder={"เลือกสารเคมีที่ใช้กำจัดโรคพืช"} />
                }
                readOnly={loadingChemicals}
                onChange={onChangeChemical}
                noOptionsText="ไม่พบสารเคมี"
>>>>>>> b28deb0cc31480068be68f7e5053b16216c0f1b7
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