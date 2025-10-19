import React, { useCallback, useEffect, useState } from "react";
import { clientMo } from "../../../../../../assets/js/moduleClient";
import { Modal } from "react-bootstrap";
import House from "./house";
import { Stack, Autocomplete, TextField, CircularProgress } from "@mui/material";

export default function Houses({ selectedStation }) {
    const [houseList, setHouseList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openstation, setOpenstation] = useState({ open: false, stationid: "" });

    const fetchHouseList = useCallback(async () => {
        setLoading(true);
        const ObjectData = await clientMo.get(`/api/doctor/station/${selectedStation}/housefarm/`);
        setLoading(false);
        try {
            const { houses } = JSON.parse(ObjectData);
            setHouseList(houses);
        } catch (err) {
            setHouseList([]);
        }
    }, [selectedStation]);

    useEffect(() => {
        fetchHouseList();
    }, [fetchHouseList]);

    const handleSelectHouse = (event, value) => {
        if (value) {
            setOpenstation({ open: true, stationid: value.id_farm_house });
        }
    };

    return (
        <Stack style={{ width: "100%", height: "100%", overflowY: "auto", paddingRight: "8px" }}>
            {/* Modal แสดงข้อมูลโรงเรือน */}
            <Modal
                show={openstation.open}
                onHide={() => setOpenstation({ ...openstation, open: false })}
                centered
                size="lg"
            >
                <House stationid={openstation.stationid} />
            </Modal>

            {/* Content หลัก */}
            {loading ? (
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <CircularProgress />
                    <div>กำลังดาวน์โหลดโรงเรือน...</div>
                </div>
            ) : (
                <Autocomplete
                    options={houseList}
                    getOptionLabel={(option) => option.name_house || ""}
                    onChange={handleSelectHouse}
                    renderInput={(params) => (
                        <TextField {...params} label="เลือกโรงเรือน" variant="outlined" />
                    )}
                    fullWidth
                    style={{ marginTop: "20px", marginBottom: "20px" }}
                />
            )}
        </Stack>
    );
}
