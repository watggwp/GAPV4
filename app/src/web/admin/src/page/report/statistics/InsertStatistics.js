import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../../assets/js/moduleClient";

export const InsertStatisticsContext = createContext({
  minCount : 0, 
  setMinCount : () => {}
})

export function InsertStatisticsProvider({ children }) {
  const [minCount, setMinCount] = useState(0)

  return(
    <InsertStatisticsContext.Provider
      value={{
        minCount, setMinCount
      }}
    >
      {children}
    </InsertStatisticsContext.Provider>
  )
}

const InsertStatistics = () => {
  const { minCount , setMinCount } = useContext(InsertStatisticsContext)
  const [plantDiseaseStats, setPlantDiseaseStats] = useState([]);
  const [pestStats, setPestStats] = useState([]);
  const [showPlantDiseases, setShowPlantDiseases] = useState(null);
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
      const month = String(date.getMonth() + 1).padStart(2, "0"); // เดือนเริ่มจาก 0
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    setDateRange({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    });
  };

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await clientMo.post("/api/admin/statistic/get", { duration });
      const data = JSON.parse(response);

      if (data.length === 0) {
        console.error("No data received from API");
        return;
      }

      const plantDiseases = data
        .filter((item) => item.type_pest === "โรคพืช")
        .map((item, index) => ({
          rank: index + 1,
          name: item.pest_name,
          count: item[`total_${duration}`] || 0,
        }));

      const pests = data
        .filter((item) => item.type_pest === "ศัตรูพืช")
        .map((item, index) => ({
          rank: index + 1,
          insect: item.pest_name,
          count: item[`total_${duration}`] || 0,
        }));

      setPlantDiseaseStats(plantDiseases);
      setPestStats(pests);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [duration]);

  useEffect(() => {
    calculateDateRange(duration);  // คำนวณช่วงวันที่เมื่อมีการเปลี่ยนแปลงระยะเวลา
    fetchStatistics();
  }, [duration, fetchStatistics]);

  // ฟังก์ชันสำหรับกรองข้อมูลตามจำนวนขั้นต่ำ
  const filterByMinCount = (stats) => {
    return stats.filter((item) => item.count >= minCount);
  };

  return (
    <div style={{ padding: "10px" }}>
      <div style={{ marginBottom: "1rem", textAlign: "center" }}>
        <label style={{ marginRight: "10px", fontFamily: "Sans-font", fontWeight: "900" }}>
          เลือกระยะเวลา:
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
            marginLeft: "20px",
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
            marginLeft: "30px",
            fontFamily: "Sans-font",
            fontWeight: "900",
          }}
        >
          เลือกจำนวนขั้นต่ำ:
          <input
            type="number"
            min="0"
            value={minCount}
            onChange={(e) => {
              console.log(e.target.value)
              console.log(minCount)
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
            backgroundColor: showPlantDiseases === true ? "#22C7A9" : "#ddd",
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
            <p style={{ textAlign: "center", color: "gray", fontFamily: "Sans-font", fontWeight: "900" }}>
              ไม่มีข้อมูลที่จะแสดง
            </p>
          ) : (
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
                    {showPlantDiseases ? "ชื่อโรคพืช" : "ชื่อศัตรูพืช"}
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
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                        fontFamily: "Sans-font",
                        fontWeight: "900",
                      }}
                    >
                      {stat.rank}
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
                      {stat.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default InsertStatistics;
