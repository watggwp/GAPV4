import React, { useEffect, useState } from "react";
import { clientMo } from "../../../../assets/js/moduleClient";
import "./HouseList.scss";

const HouseList = () => {
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);

    // ดึงข้อมูลโรงเรือนเมื่อ component โหลด
    useEffect(() => {
        fetchHouses();
    }, []);

    const fetchHouses = async () => {
        try {
            const result = await clientMo.get('/api/farmer/farmhouse/get/HouseList');
            const parsedResult = JSON.parse(result);

            // เพิ่มสถานะ `isOpen` เพื่อช่วยจัดการสถานะใน UI
            const housesWithStatus = parsedResult.map(house => ({
                ...house,
                isOpen: house.status === 1,
            }));
            setHouses(housesWithStatus);
        } catch (error) {
            console.error("Error fetching houses:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleHouseStatus = async (idFarmHouse, currentStatus) => {
        try {
            const response = await clientMo.post('/api/farmer/farmhouse/updateStatus', {
                id_farm_house: idFarmHouse,
                status: currentStatus ? 0 : 1,
            });
    
            if (!response) {
                throw new Error("No response from server");
            }
    
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
                throw new Error(data.message || "Update failed");
            }
        } catch (error) {
            console.error("Error updating house status:", error.message);
        }
    };
    
    

    return (
        <div className="House-List" onLoad={clientMo.unLoadingPage}>
            <div class="header">ข้อมูลโรงเรือนทั้งหมด</div>
            {/* <h1>Header Content Below</h1> */}
            {loading ? (
                <div className="loading">กำลังโหลด...</div>
            ) : houses.length > 0 ? (
                <div className="house-list">
                    {houses.map(house => (
                        <div
                        className={`house-card ${!house.isOpen ? 'closed' : ''}`}
                        key={house.id_farm_house}
                    >                    
                            
                            <img src={house.img_house} alt={house.name_house} />
                            <h3>{house.name_house}</h3>
                            {/* <p>
                                ตำแหน่ง:{" "}
                                {house.location
                                    ? `(${house.location.x}, ${house.location.y})`
                                    : "ไม่มีข้อมูล"}
                            </p> */}
                            <p>สถานะ: {house.isOpen ? "เปิด" : "ปิด"}</p>
                            <button
                                className={`toggle-btn ${house.isOpen ? "active" : "inactive"}`}
                                onClick={() => toggleHouseStatus(house.id_farm_house, house.isOpen)}
                            >
                                {house.isOpen ? "ปิดโรงเรือน" : "เปิดโรงเรือน"}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-houses">ไม่พบโรงเรือน</div>
            )}
        </div>
    );
};

export default HouseList;
