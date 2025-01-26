import React, { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { AdminContext } from "../../Admin";

const InsertGraph = () => {
  const { TabOn } = useContext(AdminContext);
  const [plantData, setPlantData] = useState([]);
  const [farmerCount, setFarmerCount] = useState(0);

  // ฟังก์ชันดึงข้อมูลจาก API
  const ListGraph = useCallback(async () => {
    console.log("Start fetch group");
    try {
      const response = await clientMo.get("/api/admin/report/list");
      const result = JSON.parse(response);

      if (result.data) {
        const [{ plantDetails, totalFarmers }] =
          result.data.farmerStatistics || [{ plantDetails: [], totalFarmers: 0 }];

        // เรียงข้อมูลพืชตามจำนวนจากมากไปน้อย และเรียงตามชื่อพืชหากจำนวนเท่ากัน
        const sortedPlants = plantDetails.sort((a, b) => {
          if (b.farmersCount === a.farmersCount) {
            return a.plantName.localeCompare(b.plantName, "th");
          }
          return b.farmersCount - a.farmersCount;
        });

        setPlantData(sortedPlants);
        setFarmerCount(totalFarmers);
        TabOn.addTimeOut(TabOn.end());
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

  return (
    <div style={{ padding: "20px" }}>
      {/* แสดงตารางแรงค์กิ้ง */}
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h4 style={{ textAlign: "center" }}>ตารางแสดงจำนวนพืชในพื้นที่</h4>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "center",
                  backgroundColor: "#f4f4f4",
                }}
              >
                ลำดับ
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "center",
                  backgroundColor: "#f4f4f4",
                }}
              >
                ชื่อพืช
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "center",
                  backgroundColor: "#f4f4f4",
                }}
              >
                จำนวนพืช
              </th>
            </tr>
          </thead>
          <tbody>
            {plantData.map((plant, index) => (
              <tr key={index}>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                  }}
                >
                  {plant.plantName}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  {plant.farmersCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <p
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#333",
          }}
        >
          {farmerCount} คน
        </p>
      </div>
    </div>
  );
};

export default InsertGraph;
