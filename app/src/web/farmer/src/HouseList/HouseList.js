import React, { useEffect, useState } from "react";
import { clientMo } from "../../../../assets/js/moduleClient";
import "./HouseList.scss";

const HouseList = () => {
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ show: false, house: null });

    useEffect(() => {
        fetchHouses();
        clientMo.unLoadingPage();
    }, []);

    const fetchHouses = async () => {
        try {
            const result = await clientMo.get("/api/farmer/farmhouse/get/HouseList");
            const parsedResult = JSON.parse(result);

            if (Array.isArray(parsedResult)) {
                const housesWithStatus = parsedResult.map((house) => ({
                    ...house,
                    isOpen: house.status === 1,
                }));
                setHouses(housesWithStatus);
            } else {
                setHouses([]);
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error.message);
            setHouses([]);
        } finally {
            setLoading(false);
        }
    };

    const confirmToggle = (house) => {
        setModal({ show: true, house });
    };

    const toggleHouseStatus = async () => {
        if (!modal.house) return;

        try {
            const { id_farm_house, isOpen } = modal.house;
            const response = await clientMo.post("/api/farmer/farmhouse/updateStatus", {
                id_farm_house,
                status: isOpen ? 0 : 1,
            });

            const data = JSON.parse(response);
            if (data.status === "success") {
                setHouses((prevHouses) =>
                    prevHouses.map((house) =>
                        house.id_farm_house === id_farm_house ? { ...house, isOpen: !isOpen } : house
                    )
                );
            } else {
                throw new Error(data.message || "ไม่สามารถอัปเดตสถานะได้");
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ:", error.message);
        } finally {
            setModal({ show: false, house: null });
        }
    };

    return (
        <div className="House-List">
            <div className="title">แก้ไขโรงเรือน</div>
            <div className="sub-title">เปิด / ปิด</div>

            {loading ? (
                <div className="loading">กำลังโหลด...</div>
            ) : (
                <div className="house-list">
                    {houses.length > 0 ? (
                        houses.map((house) => (
                            <div className="house-card" key={house.id_farm_house}>
                                <div className="house-image">
                                    <img src={house.img_house} alt={house.name_house} />
                                    <div className="house-name">{house.name_house}</div>
                                    <div className={`toggle-switch ${house.isOpen ? "on" : "off"}`} onClick={() => confirmToggle(house)}>
    <span className="toggle-text">{house.isOpen ? "ON" : "OFF"}</span>
    <div className="toggle-circle"></div>
</div>



                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-houses">ไม่พบโรงเรือน</div>
                    )}
                </div>
            )}

            {modal.show && (
                <div className="modal">
                    <h3>ปิดโรงเรือน</h3>
                    <p>ต้องการปิดโรงเรือน {modal.house.name_house} หรือไม่?</p>
                    <div className="modal-buttons">
                        <button className="cancel" onClick={() => setModal({ show: false, house: null })}>
                            ยกเลิก
                        </button>
                        <button className="confirm" onClick={toggleHouseStatus}>
                            ยืนยัน
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HouseList;
