import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import ManageGroup from "./ManageGroup";
import { Modal } from "react-bootstrap";
import { PageDataContext } from "../data/PageData";
import "../../assets/style/page/PopupManage.scss";
 
const PageGroup = () => {
  const { popupDataManage, setPopupDataManage, textSearch } = useContext(PageDataContext);
  const [groupData, setGroupData] = useState([]);
  const [groupMapping, setGroupMapping] = useState(new Map());
 
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedToggleId, setSelectedToggleId] = useState(null);
  const [status, setStatus] = useState(null);
  const PasswordRef = useRef(null);
 
  const fetchGroupData = useCallback(async () => {
    try {
      const response = await clientMo.post("/api/doctor/group/gets", { search: textSearch });
      const result = JSON.parse(response);
 
      if (Array.isArray(result)) {
        setGroupData(result);
 
        const initialMapping = new Map();
        result.forEach((item , idx) => {
          initialMapping.set(item.id , {...item , index : idx})
        });
        setGroupMapping(initialMapping);
      } else {
        console.error("Invalid data format from API");
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    }
  }, [textSearch]);
 
  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);
 
  const handleEditClick = (item) => {
    setPopupDataManage({
      open: true,
      type: "edit",
      metadata: { id: item.id },
    });
  };
 
  const handleToggleClick = (id) => {
    setSelectedToggleId(id);
    setStatus(groupMapping.get(id)?.status ? 0 : 1);
    setShowConfirmModal(true);
  };
 
  const handleToggleConfirm = async () => {
    const password = PasswordRef.current.value;
    if (!password) {
      alert("กรุณากรอกรหัสผ่าน");
      return;
    }
 
    try {
      const response = await clientMo.post("/api/doctor/manage/group", {
        id: selectedToggleId,
        status: status,
        password: password,
      });
 
      const result = JSON.parse(response);
 
      switch(result.status) {
        case 200 :
          setGroupData((group => {
            const { index } = groupMapping.get(selectedToggleId)
            if(group[index]) {
              group[index]["status"] = status
            }
            return group
          }))
          // alert("อัปเดตสถานะสำเร็จ");
          break;
        default :
          alert("เกิดข้อผิดพลาด: " + result.message);
          break;
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("ไม่สามารถอัปเดตสถานะได้");
    }
 
    setShowConfirmModal(false);
  };
 
  return (
    <div className="data-table">
      <table
        border="1"
        style={{
          width: "80rem",
          marginTop: "20px",
          borderCollapse: "collapse",
          fontFamily: "sans-font",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#60d6cf", color: "#fff" }}>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>ลำดับ</th>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>โรคพืช / ศัตรูพืช</th>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>สารเคมี</th>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>พืช</th>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>วันที่ปลอดภัย</th>
            <th style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>จัดการข้อมูล</th>
          </tr>
        </thead>
        <tbody>
          {groupData.length > 0 ? (
            groupData.map((item, index) => (
              <tr key={item.id}>
                <td style={{ padding: "10px", textAlign: "center", fontWeight: "900", border: "1px solid #ddd" }}>{index + 1}</td>
                <td style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>{item.pest_name}</td>
                <td style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>{item.chemical_name}</td>
                <td style={{ padding: "10px", fontWeight: "900", border: "1px solid #ddd" }}>{item.plant_name}</td>
                <td style={{ padding: "10px", textAlign: "center", fontWeight: "900", border: "1px solid #ddd" }}>{item.safe_days}</td>
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
                      marginRight: "10px",
                    }}
                  >
                    แก้ไข
                  </button>
 
                  <button
                    onClick={() => handleToggleClick(item.id)}
                    style={{
                      padding: "5px 15px",
                      fontWeight: "900",
                      color: "#fff",
                      border: "none",
                      borderRadius: "30px",
                      cursor: "pointer",
                      backgroundColor: item.status ? "#28a745" : "#dc3545",
                      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {item.status ? "ENABLE" : "DISABLE "}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ padding: "10px", textAlign: "center", fontWeight: "900", border: "1px solid #ddd" }}>ไม่มีข้อมูล</td>
            </tr>
          )}
        </tbody>
      </table>
 
      {showConfirmModal && (
        <div className="manage-overlay">
          <div className="manage-page">
            <div className="head-page">{`ยืนยันการ${status === 1 ? "เปิด" : "ปิด"}`}</div>
            <div className="form-manage">
              <label className="column">
                <span>รหัสผ่านผู้ดูแล</span>
                <input placeholder="กรอกรหัสผ่าน" ref={PasswordRef} type="password" className="input-text input-pw" />
              </label>
              <div className="bt-manage">
                <button onClick={() => setShowConfirmModal(false)} className="close">ยกเลิก</button>
                <button onClick={handleToggleConfirm} className="submit">ยืนยัน</button>
              </div>
            </div>
          </div>
        </div>
      )}
 
      <Modal show={popupDataManage.open} onHide={() => setPopupDataManage((data) => ({ ...data, open: false }))} centered size="lg">
        <ManageGroup fetchGroups={fetchGroupData} />
      </Modal>
    </div>
  );
};
 
export default PageGroup;
 