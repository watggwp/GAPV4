import React, { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
 
const ReportListLocation = () => {
  const [locations, setLocations] = useState([]);
 
  const ListReport = useCallback(async () => {
    try {
      const listlocation = await clientMo.get("/api/doctor/report/list", {
        type: "listlocation",
        limit: 100,
        startRow: 0,
        textSearch: "",
      });
      const parsedList = JSON.parse(listlocation);
      setLocations(parsedList.data.doctors);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);
 
  useEffect(() => {
    ListReport();
  }, []);
 
  return (
    <div style={{ padding: "20px" }}>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      fontFamily: "Sans-serif",
    }}
  >
    <thead>
      <tr style={{ backgroundColor: "#60d6cf", color: "#fff" }}>
        <th style={{ padding: "10px" }}>ลำดับ</th> {}
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
  );
};
 
export default ReportListLocation;