import React, { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { PageDataContext } from "../data/PageData";
 
const ReportListLocation = () => {
  const { textSearch } = useContext(PageDataContext);
  const [locations, setLocations] = useState([]);
 
  const ListReport = useCallback(async () => {
    try {
      const listlocation = await clientMo.post("/api/doctor/report/list", {
        type: "listlocation",
        limit: 100,
        startRow: 0,
        search: textSearch,
      });
      const parsedList = JSON.parse(listlocation);
      setLocations(parsedList.data.doctors);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [textSearch]);
 
  useEffect(() => {
    ListReport();
  }, [ListReport]);
 
  return (
    <div style={{ padding: "10px", width: "100%", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ width: "100%", overflowX: "auto", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
        <table
          style={{
            width: "100%",
            minWidth: "600px",
            borderCollapse: "collapse",
            fontFamily: "Sans-serif",
            textAlign: "center",
            backgroundColor: "white",
          }}
        >
    <thead>
      <tr style={{ backgroundColor: "#60d6cf", color: "#fff" }}>
        <th style={{ padding: "10px", width: "10%" }}>ลำดับ</th> {}
        <th style={{ padding: "10px" }}>ชื่อ - นามสกุล</th> {}
        <th style={{ padding: "10px" }}>เจ้าหน้าที่</th> {}
      </tr>
    </thead>
    <tbody>
      {locations.map((location, index) => (
        <tr key={location.id_doctor}>
          <td
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              textAlign: "center",
            }}
          >
            {index + 1}
          </td>
          <td style={{ padding: "10px", border: "1px solid #ddd" }}>{location.fullname_doctor}</td>
          <td style={{ padding: "10px", border: "1px solid #ddd" }}>หมอพืช</td>
        </tr>
      ))}
    </tbody>
  </table>
  </div>
</div>
  );
};
 
export default ReportListLocation;