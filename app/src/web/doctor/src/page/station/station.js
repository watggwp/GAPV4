import React, { useCallback, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import Houses from "./house";
import { useDoctor } from "../../Doctor";

const Station = () => {
  const { profile,bannerCoverRef , contentRef } = useDoctor()
  const [stationList, setStationList] = useState([]);
  const [selectedStation, setSelectedStation] = useState(profile.station_doctor);
  
  console.log(profile)
  // โหลดข้อมูลสถานี
  const fetchStationList = useCallback(async () => {
    try {
      const response = await clientMo.post("/api/doctor/data/list", {
        limit: 100,
        startRow: 0,
        type: "station",
        textSearch: "",
      });

      const list = JSON.parse(response);
      setStationList(list);
    } catch (error) {
      console.error("Error fetching station list:", error);
    }
  } , [])

  useEffect(() => {
    bannerCoverRef.current.style.height = "30%"
    contentRef.current.style.height = "70%"
    clientMo.unLoadingPage()
    fetchStationList();
  }, [bannerCoverRef, contentRef, fetchStationList]);

  return (
    <div style={{ 
      padding: "20px", 
      fontFamily: "sans-serif",
      width: "100%",
      height: "100%"
    }}>
      {/* Filter Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value)}
        >
          <option value="">เลือกศูนย์</option>
          {
            stationList.map((station, index) => (
              <option key={index} value={station.id}>
                {station.name}
              </option>
            ))
          }
        </select>
        <button>Export</button>
        <select><option>เลือกชนิดพืช</option></select>
        <select><option>เลือกเกษตรกร</option></select>
      </div>

      <div style={{ display: "flex", gap: "20px" , height: "calc(100% - 50px)" }}>
        {/* กราฟ */}
        <div
          style={{
            flex: 1,
            minHeight: "200px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            textAlign: "center",
          }}
        >
          กราฟสภาพอากาศภายในศูนย์
        </div>

        {/* ข้อมูลโรงเรือน */}
        <div style={{ flex: 1 }}>
          {
          !selectedStation ? (
            <div style={{ color: "#888", textAlign: "center", marginTop: "50px" }}>
              กรุณาเลือกศูนย์เพื่อแสดงโรงเรือน
            </div>
          ) : 
            <Houses selectedStation={selectedStation} />
          }
        </div>
      </div>
    </div>
  );
};

export default Station;
