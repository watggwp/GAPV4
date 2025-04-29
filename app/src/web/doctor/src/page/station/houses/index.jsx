import { Autocomplete, MenuItem, Modal, Select, Stack, TextField } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDoctor } from "../../../Doctor";
import RequestAPI from "../../../../../../assets/js/requestAPI";
import { useWeatherStation } from "..";
import House from "./house";

export default function Houses() {

    const { onSession } = useDoctor()
    const { selectedStationData } = useWeatherStation()
    const [ farmers , setFarmers ] = useState([])
    const [ loadingFarmers , setLoadingFarmers ] = useState(true)

    const [ houses , setHouses ] = useState([])
    const tempHouses = useRef([])
    const [ loadingHouses , setLoadingHouse ] = useState(true)

    const [ selectedFarmer , setSelectedFarmer ] = useState("")
    const [ openHouse , setOpenHouse ] = useState({})

    const requestFarmers = useCallback( async () => {
        setLoadingFarmers(true)
        const { data , status } = await RequestAPI.post('/api/doctor/farmer/list' , {
            approve: 1,
            station_id : selectedStationData.id
        })
        setLoadingFarmers(false)

        try {
            setFarmers(data.map(({ uid_line , fullname }) => ({
                id : uid_line,
                label : fullname
            })))
        } catch(err) {
            onSession()
        }
    } , [onSession, selectedStationData.id])

    const requestGreenhouses = useCallback( async () => {
        setLoadingHouse(true)
        const { data , status } = await RequestAPI.get(`/api/doctor/station/${selectedStationData.id}/greenhouse`)
        setLoadingHouse(false)

        try {
            const { houses } = data
            tempHouses.current = houses.map(({ id_farm_house , name_house , ...houseData }) => ({
                id : id_farm_house,
                label : name_house,
                ...houseData
            }))
            setHouses(tempHouses.current)
        } catch(err) {
            onSession()
        }
    } , [onSession, selectedStationData.id])

    const onSelectedFarmer = useCallback((e , value) => {
        const { id : uid_line_selected } = value || {}

        setSelectedFarmer(value || null)
        setHouses(uid_line_selected ? tempHouses.current.filter(({ uid_line }) => uid_line === uid_line_selected) : tempHouses.current)
    }, []) 

    const onSelectedHouse = useCallback((e , value) => {
        setOpenHouse(value)
    }, []) 

    useEffect(() => {
        requestFarmers()
    } , [requestFarmers])

    useEffect(() => {
        requestGreenhouses()
    } , [requestGreenhouses])

    const openHouseData = useMemo(() => openHouse.id , [openHouse.id])

    console.log(openHouseData)
    return(
        <React.Fragment>
            {/* <Select value={""} size="small" displayEmpty>
                <MenuItem disabled value={""}>เลือกชนิดพืช</MenuItem>
            </Select> */}
            {/* <Select value={""} size="small" displayEmpty>
                <MenuItem disabled value={""}>เลือกเกษตรกร</MenuItem>
            </Select> */}
            <Stack
                maxWidth={200}
                width={"100%"}
            >
                <Autocomplete
                    disablePortal
                    onChange={onSelectedFarmer}
                    value={selectedFarmer}
                    isOptionEqualToValue={(option, value) => option?.id === value.id}
                    options={farmers}
                    renderInput={(params) => (
                        <TextField
                            {...params} size="small" placeholder="ค้นหาเกษตรกร"  fullWidth slotProps={{ htmlInput: { ...params.inputProps, sx: { fontFamily: (theme) => theme.typography.fontFamily , fontWeight : 900 } } }}
                        />
                    )}
                    fullWidth
                    loading={loadingFarmers}
                />
            </Stack>
            <Stack
                maxWidth={200}
                width={"100%"}
            >
                <Autocomplete
                    disablePortal
                    onChange={onSelectedHouse}
                    value={null}
                    isOptionEqualToValue={(option, value) => option?.id === value.id}
                    options={houses}
                    renderInput={(params) => (
                        <TextField
                            {...params} size="small" placeholder="เลือกโรงเรือน"  fullWidth slotProps={{ htmlInput: { ...params.inputProps, sx: { fontFamily: (theme) => theme.typography.fontFamily , fontWeight : 900 } } }}
                        />
                    )}
                    fullWidth
                    loading={loadingHouses}
                />
            </Stack>
            <Modal
                open={Boolean(openHouseData)}
            >
                <House greenhouse_id={openHouseData} setOpenHouse={setOpenHouse} />
            </Modal>
        </React.Fragment>
    )
}