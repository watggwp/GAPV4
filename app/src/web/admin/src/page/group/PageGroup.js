import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { AdminContext } from "../../Admin";
import { PageTemplateContext } from "../PageTemplate";
import { Loading, MapsJSX, ReportAction } from "../../../../../assets/js/module";
import ManageGroup from "./ManageGroup";
import { Modal } from "react-bootstrap";
import "../../assets/style/page/PopupManage.scss"
 
 
const PageGroup = () => {
  const { popupDataManage, setPopupDataManage, textSearch } = useContext(PageTemplateContext);
  const [groupData, setGroupData] = useState([]);
  const [groupMapping, setGroupMapping] = useState(new Map());
  const { TabOn } = useContext(AdminContext);
 
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedToggleId, setSelectedToggleId] = useState(null);
  const [status, setStatus] = useState(null);
  const PasswordRef = useRef(null);
  const [ stateOnBt, setStateOnBt ] = useState(true);
 
  const [Open, setOpen] = useState(false);
  const [Text, setText] = useState("");
  const [Status, setStatusReport] = useState(null);
 
  const fetchGroupData = useCallback(async () => {
    try {
      const response = await clientMo.post("/api/admin/group/gets", { search: textSearch });
      const result = JSON.parse(response);
 
      if (Array.isArray(result)) {
        setGroupData(result);
        TabOn.addTimeOut(TabOn.end());
 
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
  }, [TabOn, textSearch]);
 
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
      return; // ไม่ต้องแสดง popup หากไม่มีการกรอกรหัสผ่าน
    }
 
    try {
      const response = await clientMo.post("/api/admin/manage/group", {
        id: selectedToggleId,
        status: status,
        password: password,
      });
 
      const result = JSON.parse(response);
 
      if (result.status === 200) {
        setGroupData((group) => {
          const { index } = groupMapping.get(selectedToggleId);
          if (group[index]) {
            group[index]["status"] = status;
          }
          return [...group];
        });
 
        setText("อัปเดตสถานะสำเร็จ!");
        setStatus(1);
        setOpen(true);
        setTimeout(() => setOpen(false), 3000);
      } else if (result === "password") {
        setText("รหัสผ่านไม่ถูกต้อง"); // แจ้งเตือนเมื่อรหัสผ่านผิด
        setStatus(3);
        PasswordRef.current.value = ""; // เคลียร์ช่องใส่รหัสผ่าน
        setOpen(true);
        setTimeout(() => setOpen(false), 3000);
      } else {
        setText(`เกิดข้อผิดพลาด: ${result.message}`);
        setStatus(2);
        setOpen(true);
        setTimeout(() => setOpen(false), 3000);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setText("ไม่สามารถอัปเดตสถานะได้");
      setStatus(2);
      setOpen(true);
      setTimeout(() => setOpen(false), 3000);
    }
 
    setShowConfirmModal(false);
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
      <div className="page-because-popup">
        <ReportAction
          Open={Open}
          Text={Text}
          Status={Status}
          setOpen={setOpen}
          setStatus={setStatusReport}
          setText={setText}
          sizeLoad={73}
          BorderLoad={8}
          color={"white"}
        />
      </div>
 
      {showConfirmModal && (
        <div className="manage-overlay">
          <div className="manage-page">
            <div className="head-page">{`ยืนยันการ${status === 1 ? "เปิด" : "ปิด"}`}</div>
            <div className="form-manage">
              <label className="column">
                <span>รหัสผ่านผู้ดูแลระบบ</span>
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