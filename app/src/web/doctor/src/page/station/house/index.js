import React, { useCallback, useEffect, useState } from "react";
import { clientMo } from "../../../../../../assets/js/moduleClient";
import { Modal } from "react-bootstrap";
import House from "./house";

export default function Houses({
    selectedStation
}) {
    const [houseList, setHouseList] = useState([]);
    const [ loading , setLoading ] = useState(false)
    const [openstation, setOpenstation] = useState({ open: false, stationid: "" });

    const fetchHouseList = useCallback( async () => {
        setLoading(true)
        const ObjectData = await clientMo.get(`/api/doctor/station/${selectedStation}/housefarm/`);
        setLoading(false)
        try {
            const { houses } = JSON.parse(ObjectData)
            setHouseList(houses)
        } catch(err) {
            setHouseList([])
        }
    } , [selectedStation])

    useEffect(() => {
        fetchHouseList()
    } , [fetchHouseList])

    return(
        <React.Fragment>
            <Modal
                show={openstation.open}
                onHide={() => setOpenstation({ ...openstation, open: false })}
                centered
                size="lg"
            >
                <House stationid={openstation.stationid} />
            </Modal>
            {
                loading ? (
                    "กำลังดาวโหลดโรงเรือน"
                ) :
                houseList.map(({ id_farm_house , name_house } , index) => 
                    <div
                        key={id_farm_house}
                        style={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            marginBottom: "15px",
                            padding: "10px",
                        }}
                    >
                        {/* แสดงลำดับ */}
                        <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                            {index + 1}. โรงเรือน {name_house}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            {/* เพิ่ม MapsJSX หรือตำแหน่งถ้าต้องการ */}
                        </div>
                        <div style={{ marginTop: "10px", textAlign: "right" }}>
                            <button
                            onClick={() => setOpenstation({ open: true, stationid: id_farm_house })}
                            style={{
                                padding: "4px 10px",
                                backgroundColor: "#60d6cf",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            >
                                เลือก
                            </button>
                        </div>
                    </div>
                )
            }
        </React.Fragment>
    )
}