import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../../assets/js/moduleClient";
import ButtonChangeStatistics from "./buttonChange";
import { PageTemplateContext } from "../../PageTemplate";
import { AdminContext } from "../../../Admin";

export const InsertStatisticsContext = createContext({
  minCount: 0, 
  setMinCount: () => {},
  selectedRows: new Map(), 
  setSelectedRows: () => {}
});

export function InsertStatisticsProvider({ children }) {
  const [minCount, setMinCount] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Map());

  return (
    <InsertStatisticsContext.Provider
      value={{
        minCount, setMinCount,
        selectedRows, setSelectedRows
      }}
    >
      {children}
    </InsertStatisticsContext.Provider>
  )
}

const InsertStatistics = () => {
  const { TabOn } = useContext(AdminContext)
  const { textSearch, selectedStation } = useContext(PageTemplateContext)
  const { minCount , selectedRows , setMinCount , setSelectedRows } = useContext(InsertStatisticsContext)

  const [ pestsMapping , setPestsMapping ] = useState(new Map())
  const [plantDiseaseStats, setPlantDiseaseStats] = useState([]);
  const [pestStats, setPestStats] = useState([]);
  const [showPlantDiseases, setShowPlantDiseases] = useState(true);

  useEffect(() => {
    setSelectedRows(new Map());
  }, [selectedStation, setSelectedRows]);
  const [duration, setDuration] = useState("1_week");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  const calculateDateRange = (duration) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (duration) {
      case "1_week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "1_month":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "3_months":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6_months":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "1_year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate = endDate;
    }

    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear() + 543; 
      return `${day}/${month}/${year}`;
    };

    setDateRange({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    });
  };

  const handleCheckboxChange = (checked , id) => {
    setSelectedRows(selected => {
      if(checked) selected.set(id , pestsMapping.get(id))
      else selected.delete(id)
      return new Map([...selected])
    })
    
  };

  const fetchStatistics = useCallback(async (search) => {
    try {
      const response = await clientMo.post("/api/admin/statistic/get", { 
        duration, 
        search,
        station_id: selectedStation,
      });
      const data = JSON.parse(response);

      if (data.length === 0) {
        console.error("No data received from API");
        setPlantDiseaseStats([]);
        setPestStats([]);
        return;
      }

      const pests_mapping = new Map()
      const plantDiseases = []
      const pests = []

      data.forEach((item , index) => {
        switch(item.type_pest) {
          case "โรคพืช" : 
            plantDiseases.push({
              rank: index + 1,
              id : item.pest_id,
              name: item.pest_name,
              name_plants : item.name_plants,
              count: item[`total_${duration}`] || 0,
            })
            break;
          case "ศัตรูพืช" :
            pests.push({
              rank: index + 1,
              id : item.pest_id,
              insect: item.pest_name,
              name_plants : item.name_plants,
              count: item[`total_${duration}`] || 0,
            })
            break;
          default :
            break
        }

        pests_mapping.set(item.pest_id , {
          id : item.pest_id,
          insect: item.pest_name,
          name_plants : item.name_plants,
          count: item[`total_${duration}`] || 0,
        })
      })


      setPestsMapping(pests_mapping)
      setPlantDiseaseStats(plantDiseases);
      setPestStats(pests);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    TabOn.addTimeOut(TabOn.end());
  }, [TabOn, duration, selectedStation]);

  useEffect(() => {
    console.log(textSearch)
    calculateDateRange(duration);  // คำนวณช่วงวันที่เมื่อมีการเปลี่ยนแปลงระยะเวลา
    fetchStatistics(textSearch);
  }, [duration , textSearch, fetchStatistics]);

  // ฟังก์ชันสำหรับกรองข้อมูลตามจำนวนขั้นต่ำ
  const filterByMinCount = (stats) => {
    return stats.filter((item) => item.count >= minCount);
  };

  return (
    <div style={{ padding: "10px", width: "100%", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ marginBottom: "1rem", textAlign: "center", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "15px", padding: "10px" }}>
        <ButtonChangeStatistics />
        <label style={{ fontFamily: "Sans-font", fontWeight: "900", display: "flex", alignItems: "center", margin: 0 }}>
          ระยะเวลา:
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{
              marginLeft: "10px",
              padding: "8px",
              fontFamily: "Sans-font",
              fontWeight: "900",
              borderRadius: "8px",
              border: "2px solid #22C7A9",
              backgroundColor: "white",
              outline: "none",
            }}
          >
            <option value="1_week">1 สัปดาห์</option>
            <option value="1_month">1 เดือน</option>
            <option value="3_months">3 เดือน</option>
            <option value="6_months">6 เดือน</option>
            <option value="1_year">1 ปี</option>
          </select>
        </label>

        {/* กล่องแสดงช่วงวันที่ */}
        <div
          style={{
            display: "inline-block",
            padding: "8px",
            fontFamily: "Sans-font",
            fontWeight: "900",
            borderRadius: "8px",
            border: "2px solid #22C7A9",
            backgroundColor: "white",
          }}
        >
          {`ตั้งแต่ ${dateRange.startDate} ถึง ${dateRange.endDate}`}
        </div>

        {/* กล่องเลือกจำนวนขั้นต่ำ */}
        <label
          style={{
            display: "inline-block",
            fontFamily: "Sans-font",
            fontWeight: "900",
            margin: 0
          }}
        >
          ความถี่ที่พบ:
          <input
            type="number"
            min="1"
            value={minCount}
            onChange={(e) => {
              console.log(e.target.value)
              setMinCount(parseInt(e.target.value))
            }}
            style={{
              marginLeft: "10px",
              padding: "8px",
              fontFamily: "Sans-font",
              fontWeight: "900",
              borderRadius: "8px",
              border: "2px solid #22C7A9",
              backgroundColor: "white",
              outline: "none",
              width: "80px",
            }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "1rem", textAlign: "center" }}>
      <button
        onClick={() => setShowPlantDiseases(true)}
        style={{
          padding: "10px 20px",
          marginRight: "10px",
          backgroundColor: showPlantDiseases === null || showPlantDiseases === true ? "#22C7A9" : "#ddd",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontFamily: "Sans-font",
          fontWeight: "900",
        }}
      >
        โรคพืช
      </button>
      <button
        onClick={() => setShowPlantDiseases(false)}
        style={{
          padding: "10px 20px",
          backgroundColor: showPlantDiseases === false ? "#22C7A9" : "#ddd",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontFamily: "Sans-font",
          fontWeight: "900",
        }}
      >
        ศัตรูพืช
      </button>

      </div>

      {showPlantDiseases !== null && (
        <div>
          {filterByMinCount(showPlantDiseases ? plantDiseaseStats : pestStats).length === 0 ? (
            <p style={{ textAlign: "center", color: "gray", fontFamily: "Sans-font", fontWeight: "900", padding: "20px" }}>
              ไม่พบข้อมูล
            </p>
          ) : (
            <div style={{ width: "100%", overflowX: "auto", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", marginTop: "10px" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "650px",
                  borderCollapse: "collapse",
                  backgroundColor: "white",
                }}
              >
              <thead>
                <tr>
                <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                      backgroundColor: "#60d6cf",
                      fontFamily: "Sans-font",
                      fontWeight: "900",
                      color: "#fff",
                    }}
                  >
                    เลือก
                  </th>
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                      backgroundColor: "#60d6cf",
                      fontFamily: "Sans-font",
                      fontWeight: "900",
                      color: "#fff",
                    }}
                  >
                    ลำดับ
                  </th>
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                      backgroundColor: "#60d6cf",
                      fontFamily: "Sans-font",
                      fontWeight: "900",
                      color: "#fff",
                    }}
                  >
                    {showPlantDiseases ? "โรคพืช" : "ศัตรูพืช"}
                  </th>
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                      backgroundColor: "#60d6cf",
                      fontFamily: "Sans-font",
                      fontWeight: "900",
                      color: "#fff",
                    }}
                  >
                    พืชที่เกี่ยวข้อง
                  </th>
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                      backgroundColor: "#60d6cf",
                      fontFamily: "Sans-font",
                      fontWeight: "900",
                      color: "#fff",
                    }}
                  >
                    จำนวน
                  </th>
                </tr>
              </thead>
              <tbody>
                {filterByMinCount(showPlantDiseases ? plantDiseaseStats : pestStats).map((stat, index) => (
                  <tr key={index}>
                    <td 
                      style={{border: "1px solid #ddd",padding: "8px",textAlign: "center",fontFamily: "Sans-font",fontWeight: "900",display: "flex", justifyContent: "center", alignItems: "center", }}
                    >
                      <label 
                        style={{
                          display: "flex",
                          width: "22px",
                          height: "22px",
                          borderRadius: "5px",
                          border: "2px solid #22C7A9",
                          backgroundColor: selectedRows.has(stat.id) ? "#22C7A9" : "white",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <input 
                          type="checkbox"
                          checked={selectedRows.has(stat.id)}
                          onChange={(e) => handleCheckboxChange(e.target.checked , stat.id)}
                          style={{
                            display: "none", // ซ่อน checkbox ดั้งเดิม
                          }}
                        />
                        {selectedRows.has(stat.id) && (
                          <span 
                            style={{ color: "white",fontSize: "16px",fontWeight: "bold",}}
                          >
                            ✓
                          </span>
                        )}
                      </label>
                    </td>

                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                        fontFamily: "Sans-font",
                        fontWeight: "900",
                      }}
                    >
                      {index + 1} {/* กำหนดลำดับใหม่แทนค่าที่มากับ API */}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        fontFamily: "Sans-font",
                        fontWeight: "900",
                      }}
                    >
                      {stat.name || stat.insect}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                        fontFamily: "Sans-font",
                        fontWeight: "900",
                      }}
                    >
                      {stat.name_plants}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                        fontFamily: "Sans-font",
                        fontWeight: "900",
                      }}
                    >
                      {stat.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InsertStatistics;
