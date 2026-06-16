import React, { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { AdminContext } from "../../Admin";
import { PageTemplateContext } from "../PageTemplate";

const InsertGraph = () => {
  const { TabOn } = useContext(AdminContext);
  const { popupDataManage, setPopupDataManage, textSearch, selectedStation } = useContext(PageTemplateContext);
  const [plantData, setPlantData] = useState([]);
  const [farmerCount, setFarmerCount] = useState(0);

  const ListGraph = useCallback(async () => {
    console.log("Start fetch group");
    try {
      const response = await clientMo.post("/api/admin/report/list", { 
        search: textSearch,
        station_id: selectedStation,
      });
      const result = JSON.parse(response);

      if (result.data) {
        const [{ plantDetails = [], totalFarmers = 0 }] =
          result.data.farmerStatistics || [{}];

        const filteredPlants = plantDetails.filter(
          (plant) => plant.state_status !== 2
        );

        const sortedPlants = filteredPlants.sort((a, b) => {
          if (b.farmersCount === a.farmersCount) {
            return a.plantName.localeCompare(b.plantName, "th");
          }
          return b.farmersCount - a.farmersCount;
        });

        setPlantData(sortedPlants);
        setFarmerCount(totalFarmers);
      } else {
        console.error("ไม่มีข้อมูลจาก API");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    }

    TabOn.addTimeOut(TabOn.end());
  }, [TabOn, textSearch, selectedStation]);

  useEffect(() => {
    ListGraph();
  }, [ListGraph]);

  return (
    <div style={{ padding: "20px", width: "90%", margin: "0 auto", fontFamily: "Sans-font" }}>
      <div>
        <table
          style={{width: "100%",borderCollapse: "collapse",marginTop: "10px",tableLayout: "fixed",textAlign: "center",}}
        >
          <thead>
            <tr>
              <th
                style={{border: "1px solid #ddd",padding: "8px",textAlign: "center",backgroundColor: "#60d6cf",color: "#fff",fontWeight: "900",width: "10%",
                }}
              >
                ลำดับ
              </th>
              <th
                style={{border: "1px solid #ddd",padding: "8px",textAlign: "center",backgroundColor: "#60d6cf",color: "#fff",fontWeight: "900",
                }}
              >
                ชื่อพืช
              </th>
              <th
                style={{border: "1px solid #ddd",padding: "8px",textAlign: "center",backgroundColor: "#60d6cf",color: "#fff",fontWeight: "900",
                }}
              >
                จำนวนพืช
              </th>
            </tr>
          </thead>
          <tbody>
            {plantData.length > 0 ? (
              plantData.map((plant, index) => (
                <tr key={index}>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: "900",
                    }}
                  >
                    {index + 1}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      fontWeight: "900",
                    }}
                  >
                    {plant.plantName}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: "900",
                    }}
                  >
                    {plant.farmersCount}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ padding: "15px", textAlign: "center", fontWeight: "900", color: "gray" }}>
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
        <h4 style={{ fontWeight: "900" }}>จำนวนเกษตรกรในพื้นที่</h4>
        <p
          style={{
            fontSize: "24px",
            fontWeight: "900",
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
