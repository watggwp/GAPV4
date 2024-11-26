import React, { useEffect, useState } from "react";
import "./HouseList.scss";

const HouseList = () => {
  const [houses, setHouses] = useState([]); // ข้อมูลโรงเรือน
  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล

  // ดึงข้อมูลจาก API
  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const response = await fetch("/api/farmer/farmhouse/get/all"); // ใช้ fetch แทน clientMo
        const data = await response.json(); // แปลงข้อมูล JSON
        setHouses(data); // เซ็ตข้อมูลโรงเรือน
      } catch (error) {
        console.error("Error fetching houses:", error);
      } finally {
        setLoading(false); // ปิดสถานะโหลดเมื่อทำงานเสร็จ
      }
    };
    fetchHouses();
  }, []);

  if (loading) {
    return <div className="loading">กำลังโหลดข้อมูล...</div>; // แสดงข้อความขณะกำลังโหลด
  }

  return (
    <div className="house-list">
      <h1>รายการโรงเรือน</h1>
      {houses.length > 0 ? ( // ตรวจสอบว่ามีข้อมูลหรือไม่
        <table className="house-table">
          <thead>
            <tr>
              <th>ชื่อโรงเรือน</th>
              <th>ตำแหน่ง (Lat, Lng)</th>
              <th>รูปภาพ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {houses.map((house, index) => (
              <tr key={index}>
                <td>{house.name_house}</td>
                <td>
                  {house.location
                    ? `${house.location.x}, ${house.location.y}`
                    : "ไม่มีข้อมูล"}
                </td>
                <td>
                  {house.img_house ? (
                    <img
                      src={house.img_house}
                      alt={house.name_house}
                      className="house-image"
                    />
                  ) : (
                    "ไม่มีรูปภาพ"
                  )}
                </td>
                <td>
                  <button onClick={() => alert(`ดูข้อมูล ${house.name_house}`)}>
                    ดู
                  </button>
                  <button
                    onClick={() => alert(`แก้ไขข้อมูล ${house.name_house}`)}
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => alert(`ลบโรงเรือน ${house.name_house}?`)}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>ไม่มีข้อมูลโรงเรือน</div> // แสดงข้อความเมื่อไม่มีข้อมูล
      )}
    </div>
  );
};

export default HouseList;
