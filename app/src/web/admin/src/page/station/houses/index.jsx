import { Autocomplete, Grid, MenuItem, Modal, Select, Stack, TextField } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDoctor } from "../../../../../doctor/src/Doctor";
import RequestAPI from "../../../../../../assets/js/requestAPI";
import { useWeatherStation } from "..";
import House from "./house";

export default function Houses() {

    const { onSession } = useDoctor()
    const { selectedStationData } = useWeatherStation()
    const [farmers, setFarmers] = useState([])
    const [loadingFarmers, setLoadingFarmers] = useState(true)

    const [houses, setHouses] = useState([])
    const tempHouses = useRef([])
    const [loadingHouses, setLoadingHouse] = useState(true)

    const [selectedFarmer, setSelectedFarmer] = useState("")
    const [openHouse, setOpenHouse] = useState({})

    const abortRequestFarmer = useRef(new AbortController())
    const requestFarmers = useCallback(async () => {
        setFarmers([])
        setSelectedFarmer("")
        setLoadingFarmers(true)
        const { data, status } = await RequestAPI.post('/api/doctor/farmer/list', {
            approve: 1,
            station_id: selectedStationData.id
        },
            {
                signal: abortRequestFarmer.current.signal
            }
        )
        setLoadingFarmers(false)

        switch (status) {
            case 200:
                try {
                    setFarmers(data.map(({ uid_line, fullname }) => ({
                        id: uid_line,
                        label: fullname
                    })))
                } catch (err) {
                    onSession()
                }
                break;
            default:
                break;
        }
    }, [onSession, selectedStationData.id])

    const abortRequestGreenhouse = useRef(new AbortController())
    const requestGreenhouses = useCallback(async () => {
        setHouses([])
        setLoadingHouse(true)
        const { data, status } = await RequestAPI.get(`/api/doctor/station/${selectedStationData.id}/greenhouse`, {}, {
            signal: abortRequestGreenhouse.current.signal
        })
        setLoadingHouse(false)

        switch (status) {
            case 200:
                try {
                    const { houses } = data
                    tempHouses.current = houses.map(({ id_farm_house, name_house, ...houseData }) => ({
                        id: id_farm_house,
                        label: name_house,
                        ...houseData
                    }))
                    setHouses(tempHouses.current)
                } catch (err) {
                    onSession()
                }
                break;
            default:
                break;
        }
    }, [onSession, selectedStationData.id])

    const onSelectedFarmer = useCallback((e, value) => {
        const { id: uid_line_selected } = value || {}

        setSelectedFarmer(value || null)
        setHouses(uid_line_selected ? tempHouses.current.filter(({ uid_line, link_user }) => ({ [uid_line]: true, [link_user]: true }[uid_line_selected])) : tempHouses.current)
    }, [])

    const onSelectedHouse = useCallback((e, value) => {
        setOpenHouse(value)
    }, [])

    useEffect(() => {
        abortRequestFarmer.current.abort()
        abortRequestFarmer.current = new AbortController()
        requestFarmers()
    }, [requestFarmers])

    useEffect(() => {
        abortRequestGreenhouse.current.abort()
        abortRequestGreenhouse.current = new AbortController()
        requestGreenhouses()
    }, [requestGreenhouses])

    const openHouseData = useMemo(() => openHouse.id, [openHouse.id])

    console.log(openHouseData)
    return (
        // <Grid size={{ xs : 12 , md : 5 }}>
        <React.Fragment>
            <Grid container width={500} marginLeft={2}>
                <Grid size={6} justifyContent={"center"} display={"flex"}>
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
                                    {...params} size="small" placeholder="ค้นหาเกษตรกร" fullWidth slotProps={{ htmlInput: { ...params.inputProps, sx: { fontFamily: (theme) => theme.typography.fontFamily, fontWeight: 900 } } }}
                                />
                            )}
                            fullWidth
                            loading={loadingFarmers}
                        />
                    </Stack>
                </Grid>
                <Grid size={6} justifyContent={"center"} display={"flex"}>
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
                                    {...params} size="small" placeholder="เลือกโรงเรือน" fullWidth slotProps={{ htmlInput: { ...params.inputProps, sx: { fontFamily: (theme) => theme.typography.fontFamily, fontWeight: 900 } } }}
                                />
                            )}
                            fullWidth
                            loading={loadingHouses}
                        />
                    </Stack>
                </Grid>
            </Grid>
            <Modal
                open={Boolean(openHouseData)}
            >
                <House greenhouse_id={openHouseData} setOpenHouse={setOpenHouse} />
            </Modal>
        </React.Fragment>
        // </Grid>
    )
}