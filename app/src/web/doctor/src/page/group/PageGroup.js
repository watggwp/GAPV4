import React, { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { AdminContext } from "../../Admin";
import { PageTemplateContext } from "../PageTemplate";
 
const PageGroup = () => {
  const [groupData, setGroupData] = useState([]); // เก็บข้อมูลจาก API
  const { TabOn } = useContext(AdminContext);
  const { openInsert, setOpenInsert } = useContext(PageTemplateContext);
 
  // ฟังก์ชันสำหรับดึงข้อมูลจาก API
  const fetchGroupData = useCallback(async () => {
    console.log("Start fetching group data...");
    try {
      const response = await clientMo.post("/api/admin/group/get");
      const result = JSON.parse(response);
 
      if (Array.isArray(result)) {
        setGroupData(result); // เก็บข้อมูลใน state
        TabOn.addTimeOut(TabOn.end());
        console.log("Group data set successfully:", result);
      } else {
        console.error("Invalid data format from API");
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    }
  }, [TabOn]);
 
  // เรียกใช้ API เมื่อ component ถูก mount
  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);
 
  return (
    <div className="data-table">
      <table
        border="1"
        style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#60d6cf", color: "#fff" }}>
            <th style={{ padding: "10px" }}>ลำดับ</th>
            <th style={{ padding: "10px" }}>โรคพืช / ศัตรูพืช</th>
            <th style={{ padding: "10px" }}>สารเคมี</th>
            <th style={{ padding: "10px" }}>พืช</th>
            <th style={{ padding: "10px" }}>วันที่ปลอดภัย</th>
          </tr>
        </thead>
        <tbody>
          {groupData.length > 0 ? (
            groupData.map((item, index) => (
              <tr key={item.id}>
                <td style={{ padding: "10px", textAlign: "center" }}>{index + 1}</td>
                <td style={{ padding: "10px" }}>{item.pest_name}</td>
                <td style={{ padding: "10px" }}>{item.chemical_name}</td>
                <td style={{ padding: "10px" }}>{item.plant_name}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{item.safe_days}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ padding: "10px", textAlign: "center" }}>
                ไม่มีข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
 
export default PageGroup;