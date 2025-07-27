import { Autocomplete, Grid, MenuItem, Select, Stack, TextField } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import RoyalGapFrontendUtil from "../../../../../../../../assets/core/RoyalGapUtil";
import RequestAPI from "../../../../../../../../assets/js/requestAPI";

export default function Fertilizer({
    details , setDetails
}) {

    const [ nameFertilizer , setNameFertilizer ] = useState(details.name_fertilizer)
    const [ formulaFertilizer , setFormulaFertilizer ] = useState(details.formula_fertilizer)

    const [ volume , setVolume ] = useState(details.volume)
    const [ unitVolume , setUnitVolume ] = useState(details.unit_volume || "")
    
    const [ isUse , setIsUse ] = useState(details.is_use || "")

    const [ loadingNameFertilizer, setLoadingNameFertilizer ] = useState(false);
    const [ loadingFormulaFertilizer, setLoadingFormulaFertilizer ] = useState(false);

    const [ fertilizers, setFertilizers ] = useState([]);

    const PrimarySearch = useMemo(() => {
        const FertilizersName = fertilizers.map(({ name }) => name)
        return {
            FertilizersName : FertilizersName,
            match : RoyalGapFrontendUtil.GetMatchSearch(
                FertilizersName,
                {
                    threshold : 0.5
                }
            )
        }
    } , [fertilizers])

    const SecondarySearch = useMemo(() => {
        const factorsName = fertilizers
            .filter(({ name }) => name === nameFertilizer)
            .map(({ name_formula }) => name_formula)
        return {
            factorsName : factorsName,
            match : RoyalGapFrontendUtil.GetMatchSearch(
                factorsName,
                {
                    threshold : 0.5
                }
            )
        }
    } , [fertilizers, nameFertilizer])

    const fetchFertilizers = useCallback( async () => {
        setLoadingNameFertilizer(true);
        setLoadingFormulaFertilizer(true);
        const { status , data } = await RequestAPI.get("/api/fertilizers");

        setLoadingNameFertilizer(false);
        setLoadingFormulaFertilizer(false);

        switch(status) {
            case 200 :
                data.sort((a, b) => a.name.localeCompare(b.name, 'th'));
                data.sort((a, b) => a.name_formula.localeCompare(b.name_formula, 'th'));
                setFertilizers(data)
                break;
            default :
                break;
        }
    } , [])

    const onChangeVolume = useCallback(({ target : { value } }) => {
        setVolume(value)
    } , [])

    const onChangeUnitVolume = useCallback(({ target : { value } }) => {
        setUnitVolume(value)
    } , [])

    const onChangeIsUse = useCallback(({ target : { value } }) => {
        setIsUse(value)
    } , [])

    useEffect(() => {
        fetchFertilizers()
    } , [fetchFertilizers])

    return(
        <Stack width={"100%"} spacing={2}>
            <Grid container width={"100%"} spacing={1}>
                <Grid size={{ xs : 12 , sm : 6 }}>
                    <Autocomplete
                        disableClearable
                        sx={{
                            [`& .MuiOutlinedInput-root`] : {
                                padding : "0px !important"
                            }
                        }}
                        filterOptions={(options, { inputValue }) => {
                            if (!inputValue) return options;
                            return PrimarySearch.match.search(inputValue).map(r => r.item);
                        }}
                        value={nameFertilizer}
                        options={PrimarySearch.FertilizersName}
                        renderInput={(params) => 
                            <TextField {...params} placeholder={loadingNameFertilizer ? "กำลังโหลด" : "เลือกชื่อปัจจัยการผลิต"} />
                        }
                        readOnly={loadingNameFertilizer}
                        onChange={(e , value) => {
                            setNameFertilizer(value)
                            setFormulaFertilizer("")
                        }}
                        noOptionsText="ไม่พบปัจจัยการผลิต"
                    />
                </Grid>
                <Grid size={{ xs : 12 , sm : 6 }}>
                    <Autocomplete
                        disableClearable
                        sx={{
                            [`& .MuiOutlinedInput-root`] : {
                                padding : "0px !important"
                            }
                        }}
                        filterOptions={(options, { inputValue }) => {
                            if (!inputValue) return options;
                            return SecondarySearch.match.search(inputValue).map(r => r.item);
                        }}
                        value={formulaFertilizer}
                        options={SecondarySearch.factorsName}
                        renderInput={(params) => 
                            <TextField {...params} placeholder={loadingFormulaFertilizer ? "กำลังโหลด" : (nameFertilizer ? "เลือกสูตรปัจจัยการผลิต" : "ต้องเลือกชื่อก่อน")} />
                        }
                        readOnly={loadingFormulaFertilizer || !nameFertilizer}
                        onChange={(e , value) => setFormulaFertilizer(value)}
                        noOptionsText="ไม่พบสูตรปัจจัยการผลิต"
                    />
                </Grid>
            </Grid>
            <Grid container width={"100%"} spacing={1}>
                <Grid size={{ xs : 12 , sm : 8 }}>
                    <TextField
                        placeholder="ปริมาณ"
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
                        <MenuItem value={"ลิตร"}>{"ลิตร"}</MenuItem>
                        <MenuItem value={"กก."}>{"กก."}</MenuItem>
                    </Select>
                </Grid>
            </Grid>
            <TextField
                placeholder="วิธีการใช้"
                size="small"
                value={isUse}
                onChange={onChangeIsUse}
                type="number"
                rows={3}
                multiline
                fullWidth
            />
        </Stack>
    )
}