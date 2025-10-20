import React, { useEffect, useState } from "react";
import { clientMo } from "../../../../../../assets/js/moduleClient";
import WeatherStation from "../../../../../farmer/src/weather-station"; // ปรับ path ให้ถูกตามโครงสร้าง
import { Modal } from "react-bootstrap";

const House = ({ stationid }) => {
  const [house, setHouse] = useState([]);
  const [openstation, setOpenstation] = useState({ open: false, stationid: '' });

  const stationlist = async () => {
    try {
      const ObjectData = await clientMo.get(`/api/doctor/station/${stationid}/housefarm/`, {
        limit: 100,
        startRow: 1,
        type: "station",
        textSearch: "",
      });

      // ตรวจสอบ response
      console.log("🚀 API Response:", ObjectData);

      // หาก ObjectData เป็น string ต้องแปลงก่อน
      const list = typeof ObjectData === "string"
        ? JSON.parse(ObjectData)
        : ObjectData?.data || ObjectData || [];

      // ตั้งค่าข้อมูลบ้าน (ถ้าไม่ใช่ array ให้ fallback เป็น [])
      setHouse(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("❌ Error fetching house data:", error);
      setHouse([]); // fallback
    }
  };

  useEffect(() => {
    if (stationid) {
      stationlist();
    }
  }, [stationid]);

  return (
    <div style={{ padding: "1rem" }}>
      <h3>รายการบ้านของสถานี: {stationid}</h3>

      <ul>
        {Array.isArray(house) && house.length > 0 ? (
          house.map((item, index) => (
            <li key={index}>{item.name || `บ้าน ${index + 1}`}</li>
          ))
        ) : (
          <li>ไม่พบข้อมูลบ้าน</li>
        )}
      </ul>

      <hr style={{ margin: "2rem 0" }} />

      <WeatherStation />
    </div>
  );
};

export default House;
