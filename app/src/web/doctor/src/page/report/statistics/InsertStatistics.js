import React, { useCallback, useEffect, useState } from "react";
import { clientMo } from "../../../../../../assets/js/moduleClient";

const InsertStatistics = () => {
  const [plantDiseaseStats, setPlantDiseaseStats] = useState([]);
  const [pestStats, setPestStats] = useState([]);
  const [showPlantDiseases, setShowPlantDiseases] = useState(null);
  const [duration, setDuration] = useState("1_week"); // ค่าเริ่มต้น

  const fetchStatistics = useCallback(
    async () => {
      console.log(duration);
      try {
        const response = await clientMo.post("/api/doctor/data/statistic/get", {
          duration // ส่งช่วงเวลาไปกับคำขอ
        });
        const data = JSON.parse(response);
        if (data.length === 0) {
          console.log(data);
          console.error("No data received from API");
          return;
        }

        // แยกข้อมูลตาม type_pest
        const plantDiseases = data
          .filter(item => item.type_pest === "โรคพืช")
          .map((item, index) => ({
            rank: index + 1,
            name: item.pest_name,
            count: item[`total_${duration}`] || 0
          }));

        const pests = data
          .filter(item => item.type_pest === "ศัตรูพืช")
          .map((item, index) => ({
            rank: index + 1,
            insect: item.pest_name,
            count: item[`total_${duration}`] || 0
          }));

        setPlantDiseaseStats(plantDiseases);
        setPestStats(pests);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },
    [duration]
  );

  useEffect(
    () => {
      fetchStatistics();
    },
    [fetchStatistics]
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>สถิติโรคพืช / ศัตรูพืช</h1>
      <div style={{ marginBottom: "1rem", textAlign: "center" }}>
        <label style={{ marginRight: "10px" }}>
          เลือกระยะเวลา:
          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="1_week">1 สัปดาห์</option>
            <option value="1_month">1 เดือน</option>
            <option value="3_months">3 เดือน</option>
            <option value="6_months">6 เดือน</option>
            <option value="1_year">1 ปี</option>
          </select>
        </label>
      </div>
      <div style={{ marginBottom: "1rem", textAlign: "center" }}>
        <button
          onClick={() => setShowPlantDiseases(true)}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: showPlantDiseases === true ? "#4CAF50" : "#ddd",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          โรคพืช
        </button>
        <button
          onClick={() => setShowPlantDiseases(false)}
          style={{
            padding: "10px 20px",
            backgroundColor: showPlantDiseases === false ? "#4CAF50" : "#ddd",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          ศัตรูพืช
        </button>
      </div>
      {showPlantDiseases !== null &&
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            backgroundColor: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: "8px"
          }}
        >
          <h4 style={{ textAlign: "center" }}>
            {showPlantDiseases
              ? "ตารางแสดงจำนวนโรคพืช"
              : "ตารางแสดงจำนวนศัตรูพืช"}
          </h4>
          {(showPlantDiseases ? plantDiseaseStats : pestStats).length === 0
            ? <p style={{ textAlign: "center", color: "gray" }}>
                ไม่มีข้อมูลที่จะแสดง
              </p>
            : <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "10px"
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                        backgroundColor: "#f4f4f4"
                      }}
                    >
                      ลำดับ
                    </th>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                        backgroundColor: "#f4f4f4"
                      }}
                    >
                      {showPlantDiseases ? "ชื่อโรคพืช" : "ชื่อศัตรูพืช"}
                    </th>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                        backgroundColor: "#f4f4f4"
                      }}
                    >
                      จำนวน
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(showPlantDiseases
                    ? plantDiseaseStats
                    : pestStats).map((stat, index) =>
                    <tr key={index}>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px",
                          textAlign: "center"
                        }}
                      >
                        {stat.rank}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px"
                        }}
                      >
                        {stat.name || stat.insect}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px",
                          textAlign: "center"
                        }}
                      >
                        {stat.count}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>}
        </div>}
    </div>
  );
};

export default InsertStatistics;
