import React, { useEffect, useState } from "react";
import { clientMo } from "../../../../assets/js/moduleClient";
import "./HouseList.scss";

const HouseList = () => {
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHouses();
        clientMo.unLoadingPage()
    }, []);

    const fetchHouses = async () => {
        try {
            const result = await clientMo.get('/api/farmer/farmhouse/get/HouseList');
            const parsedResult = JSON.parse(result);

            if (Array.isArray(parsedResult)) {
                const housesWithStatus = parsedResult.map(house => ({
                    ...house,
                    isOpen: house.status === 1,
                }));
                setHouses(housesWithStatus);
            } else {
                setHouses([]);  // กรณีไม่มีข้อมูลที่เป็น Array
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error.message);
            setHouses([]);  // หากเกิดข้อผิดพลาดให้แสดงข้อความ "ไม่พบโรงเรือน"
        } finally {
            setLoading(false);  // ปิดสถานะการโหลดไม่ว่าผลลัพธ์จะเป็นอย่างไร
        }
    };

    const toggleHouseStatus = async (idFarmHouse, currentStatus) => {
        try {
            const response = await clientMo.post('/api/farmer/farmhouse/updateStatus', {
                id_farm_house: idFarmHouse,
                status: currentStatus ? 0 : 1,
            });

            const data = JSON.parse(response);

            if (data.status === "success") {
                setHouses((prevHouses) =>
                    prevHouses.map((house) =>
                        house.id_farm_house === idFarmHouse
                            ? { ...house, isOpen: !currentStatus }
                            : house
                    )
                );
            } else {
                throw new Error(data.message || "ไม่สามารถอัปเดตสถานะได้");
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ:", error.message);
        }
    };

    return (
        <div className="House-List" >
            <div className="content-max-width"></div>
            <div className="title">ข้อมูลโรงเรือนทั้งหมด</div>

            {loading ? (
                <div className="loading">กำลังโหลด...</div>
            ) : (
                <div className="house-list">
                    {houses.length > 0 ? (
                        houses.map(house => (
                            <div
                                className={`house-card ${!house.isOpen ? 'closed' : ''}`}
                                key={house.id_farm_house}
                            >
                                <img src={house.img_house} alt={house.name_house} />
                                <h3>{house.name_house}</h3>
                                <p>สถานะ: {house.isOpen ? "เปิด" : "ปิด"}</p>
                                <button
                                    className={`toggle-btn ${house.isOpen ? "active" : "inactive"}`}
                                    onClick={() => toggleHouseStatus(house.id_farm_house, house.isOpen)}
                                >
                                    {house.isOpen ? "ปิดโรงเรือน" : "เปิดโรงเรือน"}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="no-houses">ไม่พบโรงเรือน</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HouseList;
