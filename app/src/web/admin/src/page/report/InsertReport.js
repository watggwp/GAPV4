import React, { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { AdminContext } from "../../Admin";
import { PageTemplateContext } from "../PageTemplate";

const InsertReport = () => {
  const { TabOn } = useContext(AdminContext);
  const { popupDataManage, setPopupDataManage, textSearch, selectedStation } = useContext(PageTemplateContext);
  const [locations, setLocations] = useState([]);

  const ListReport = useCallback(async () => {
    try {
      const response = await clientMo.post("/api/admin/report/list", { 
        search: textSearch,
        station_id: selectedStation,
      });
      const parsedList = JSON.parse(response);

      // ดึงข้อมูล doctors และ consultants
      const doctors = parsedList.data.doctors || [];
      const consultants = parsedList.data.consultants || [];

      const mergedLocations = [];
      const idSet = new Set();

      // เพิ่ม doctors ลงใน list
      doctors.forEach((doc) => {
        idSet.add(doc.id_doctor);
        mergedLocations.push({
          id: doc.id_doctor,
          fullname: doc.fullname_doctor,
          role: "หมอพืช",
        });
      });

      consultants.forEach((con) => {
        if (idSet.has(con.id_doctor)) {
          // ถ้าเจอใน doctors อยู่แล้ว ให้เปลี่ยน role เป็น "หมอพืชและที่ปรึกษา"
          const existingIndex = mergedLocations.findIndex((item) => item.id === con.id_doctor);
          mergedLocations[existingIndex].role = "หมอพืช,ที่ปรึกษาเกษตรกร";
        } else {
          // ถ้ายังไม่มีใน doctors ให้เพิ่มเป็น "ที่ปรึกษา"
          idSet.add(con.id_doctor);
          mergedLocations.push({
            id: con.id_doctor,
            fullname: con.fullname_doctor,
            role: "ที่ปรึกษาเกษตรกร",
          });
        }
      });

      setLocations(mergedLocations);
      TabOn.addTimeOut(TabOn.end());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [TabOn, textSearch, selectedStation]);

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
            fontFamily: "Sans-font",
            textAlign: "center",
            backgroundColor: "white",
          }}
        >
       <thead>
        <tr style={{ backgroundColor: "#60d6cf", color: "#fff" }}>
          <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd", width: "10%" }}>
            ลำดับ
          </th>
          <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
            ชื่อ - นามสกุล
          </th>
          <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
            เจ้าหน้าที่
          </th>
        </tr>
      </thead>
        <tbody>
          {locations.length > 0 ? (
            locations.map((location, index) => (
              <tr key={location.id}>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                    fontWeight: "900",
                  }}
                >
                  {index + 1}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd", fontWeight: "900" }}>
                  {location.fullname}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd", fontWeight: "900" }}>
                  {location.role}
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
    </div>
  );
};

export default InsertReport;
