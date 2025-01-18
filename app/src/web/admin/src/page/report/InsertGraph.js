import React, { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import { AdminContext } from "../../Admin";

const InsertGraph = () => {
  const { TabOn } = useContext(AdminContext)
  const [plantData, setPlantData] = useState([]);
  const [farmerCount, setFarmerCount] = useState(0);

  // ฟังก์ชันดึงข้อมูลจาก API
  const ListGraph = useCallback(async () => {
    console.log("Start fetch group")
    try {
      const response = await clientMo.get("/api/admin/report/list");
      const result = JSON.parse(response);

      if (result.data) {
        const [ { plantDetails , totalFarmers } ] = result.data.farmerStatistics || [ { plantDetails : [] , totalFarmers : 0 } ]
        setPlantData(plantDetails); // ดึงข้อมูลพืช
        setFarmerCount(totalFarmers); // ดึงจำนวนเกษตรกร
        TabOn.addTimeOut(TabOn.end())
      } else {
        console.error("ไม่มีข้อมูลจาก API");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    }
  }, []);

  useEffect(() => {
    ListGraph();
  }, [ListGraph]);

  // ข้อมูลสำหรับกราฟวงกลม
  const chartData = {
    labels: plantData.map((plant) => plant.plantName), // ชื่อพืช
    datasets: [
      {
        data: plantData.map((plant) => plant.farmersCount), // จำนวนพืชแต่ละชนิด
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"], // สีในกราฟ
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* แสดงกราฟวงกลม */}
      <div style={{ width: "50%", margin: "auto" }}>
        <h3 style={{ textAlign: "center" }}>กราฟแสดงพืชที่เพาะปลูกในพื้นที่</h3>
        {
          plantData.length ? (
            <Pie data={chartData} />
          ) : (
            <p style={{ textAlign: "center" }}>ไม่พบข้อมูลสำหรับกราฟวงกลม</p>
          )
        }
      </div>

      {/* แสดงกล่องเพิ่มเติมสำหรับรายชื่อพืช */}
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h4 style={{ textAlign: "center" }}>รายชื่อพืชและจำนวนพืช</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {
            plantData.map((plant, index) => (
              <div
                key={index}
                style={{
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  width: "calc(50% - 10px)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  textAlign: "center",
                }}
              >
                <h5>{plant.plantName}</h5>
                <p>จำนวนพืช: {plant.farmersCount}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* แสดงจำนวนเกษตรกร */}
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f4f4f4",
          border: "1px solid #ddd",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <h4>จำนวนเกษตรกรในพื้นที่</h4>
        <p style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>
          {farmerCount} คน
        </p>
      </div>
    </div>
  );
};

export default InsertGraph;
