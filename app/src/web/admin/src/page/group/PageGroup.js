import React, { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { AdminContext } from "../../Admin";
import { PageTemplateContext } from "../PageTemplate";
import ManageGroup from "./ManageGroup";
import { Modal } from "react-bootstrap";

const PageGroup = () => {
  const { popupDataManage , setPopupDataManage } = useContext(PageTemplateContext)
  const [groupData, setGroupData] = useState([]); // เก็บข้อมูลจาก API
  const { TabOn } = useContext(AdminContext);

  // ฟังก์ชันสำหรับดึงข้อมูลจาก API
  const fetchGroupData = useCallback(async () => {
    console.log("Start fetching group data...");
    try {
      const response = await clientMo.post("/api/admin/group/gets");
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

  // ฟังก์ชันเมื่อคลิกปุ่ม "แก้ไข"
  const handleEditClick = (item) => {
    console.log(item)
    setPopupDataManage({
      open : true,
      type : "edit",
      metadata : {
        id : item.id
      }
    })
  };

  return (
    <div className="data-table">
      <table
        border="1"
        style={{
          width: "100%",
          marginTop: "20px",
          borderCollapse: "collapse",
          fontFamily: "sans-font",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#60d6cf", color: "#fff" }}>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
              ลำดับ
            </th>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
              โรคพืช / ศัตรูพืช
            </th>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
              สารเคมี
            </th>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
              พืช
            </th>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
              วันที่ปลอดภัย
            </th>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
              จัดการข้อมูล
            </th>
          </tr>
        </thead>
        <tbody>
          {groupData.length > 0 ? (
            groupData.map((item, index) => (
              <tr key={item.id}>
                <td
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    fontWeight: "900",
                    border: "1px solid #ddd",
                  }}
                >
                  {index + 1}
                </td>
                <td style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
                  {item.pest_name}
                </td>
                <td style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
                  {item.chemical_name}
                </td>
                <td style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>
                  {item.plant_name}
                </td>
                <td
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    fontWeight: "900",
                    border: "1px solid #ddd",
                  }}
                >
                  {item.safe_days}
                </td>
                <td style={{ padding: "10px", textAlign: "center", border: "1px solid #ddd" }}>
                <button
                  onClick={() => handleEditClick(item)}
                  style={{
                    padding: "5px 10px",
                    width: "75px", 
                    background: "linear-gradient(160deg,rgb(245, 146, 33),rgb(255, 170, 42))",
                    fontWeight: "900",
                    color: "#fff",
                    border: "none",
                    borderRadius: "60px",
                    cursor: "pointer",
                    boxShadow: "0px 2px 4px rgba(216, 140, 140, 0.94)", 
                  }}
                >
                  แก้ไข
                </button>
              </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ padding: "10px", textAlign: "center", fontWeight: "900", border: "1px solid #ddd" }}>
                ไม่มีข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      <Modal
        show={popupDataManage.open}
        onHide={() => setPopupDataManage((data) => ({ ...data , open : false }))}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        centered
        size="lg"
      >
        <ManageGroup fetchGroups={fetchGroupData} />
      </Modal>
    </div>
  );
};

export default PageGroup;
