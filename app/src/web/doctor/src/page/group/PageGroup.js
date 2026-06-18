import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import ManageGroup from "./ManageGroup";
import GroupHistoryModal from "./GroupHistoryModal";
import { Modal } from "react-bootstrap";
import { PageDataContext } from "../data/PageData";
import "../../assets/style/page/PopupManage.scss";
import "../../assets/style/page/PageGroup.scss";

const PageGroup = () => {
  const { popupDataManage, setPopupDataManage, textSearch } = useContext(PageDataContext);
  const [groupData, setGroupData] = useState([]);
  const [groupMapping, setGroupMapping] = useState(new Map());

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedToggleId, setSelectedToggleId] = useState(null);
  const [status, setStatus] = useState(null);
  const PasswordRef = useRef(null);
  const [stateOnBt, setStateOnBt] = useState(true);

  const [Open, setOpen] = useState(false);
  const [Text, setText] = useState("");
  const [Status, setStatusReport] = useState(null);

  const [historyModal, setHistoryModal] = useState({ open: false, groupId: null, groupLabel: "" });

  const handleHistoryClick = (item) => {
    setHistoryModal({
      open: true,
      groupId: item.id,
      groupLabel: `${item.pest_name} / ${item.chemical_name} / ${item.plant_name}`
    });
  };

  const fetchGroupData = useCallback(async () => {
    try {
      const response = await clientMo.post("/api/doctor/group/gets", { search: textSearch });
      const result = JSON.parse(response);

      if (Array.isArray(result)) {
        setGroupData(result);

        const initialMapping = new Map();
        result.forEach((item, idx) => {
          initialMapping.set(item.id, { ...item, index: idx })
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

    // รีเซ็ตค่า popup ทุกครั้งก่อนกด Submit
    setOpen(0);
    setText("");
    setStatusReport(0);

    try {
      const response = await clientMo.post("/api/doctor/manage/group", {
        id: selectedToggleId,
        status: status,
        password: password,
      });

      const result = JSON.parse(response);

      switch (result.status) {
        case 200:
          fetchGroupData()
          // setGroupData((group) => {
          //   const { index } = groupMapping.get(selectedToggleId);
          //   if (group[index]) {
          //     group[index]["status"] = status;
          //   }
          //   return [...group];
          // });
          // setGroupMapping(group => {
          //   group.set(selectedToggleId , {
          //     ...group.get(selectedToggleId),
          //     status : status
          //   })

          //   return new Map([...group])
          // })
          setText(`${status ? "เปิด" : "ปิด"}สถานะการจัดกลุ่มสำเร็จ`);
          setStatusReport(1);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("ไม่สามารถอัปเดตสถานะได้");
    }
    setOpen(1);
    setShowConfirmModal(false);
  };

  return (
    <div className="group-page">
      <div className="group-table-wrapper">
        <table className="group-table">
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>โรคพืช / ศัตรูพืช</th>
              <th>พืช</th>
              <th>สารเคมี</th>
              <th>วันที่ปลอดภัย</th>
              <th>จัดการข้อมูล</th>
            </tr>
          </thead>
          <tbody>
            {groupData.length > 0 ? (
              groupData.map((item, index) => (
                <tr key={item.id}>
                  <td className="td-center" data-label="ลำดับ">{index + 1}</td>
                  <td data-label="โรคพืช / ศัตรูพืช">{item.pest_name}</td>
                  <td data-label="พืช">{item.plant_name}</td>
                  <td data-label="สารเคมี">{item.chemical_name}</td>
                  <td className="td-center" data-label="วันที่ปลอดภัย">{item.safe_days}</td>
                  <td className="td-actions">
                    {/* แก้ไข */}
                    <button className="btn-edit" title="แก้ไขข้อมูล" onClick={() => handleEditClick(item)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                      <span>แก้ไข</span>
                    </button>

                    {/* เปิด / ปิด */}
                    <button className={`btn-toggle ${item.status ? "enable" : "disable"}`} title={item.status ? "ปิดการใช้งาน" : "เปิดการใช้งาน"} onClick={() => handleToggleClick(item.id)}>
                      {item.status ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                          </svg>
                          <span>เปิดใช้</span>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                          </svg>
                          <span>ปิดใช้</span>
                        </>
                      )}
                    </button>



                    {/* ประวัติ */}
                    <button className="btn-history" title="ดูประวัติ" onClick={() => handleHistoryClick(item)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="btn-history-label">ประวัติ</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="td-no-data" colSpan="6">ไม่มีข้อมูล</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showConfirmModal && (
        <div className="manage-overlay">
          <div className="manage-page">
            <div className="head-page">{`ยืนยันการ${status === 1 ? "เปิด" : "ปิด"}`}</div>
            <div className="form-manage">
              <label className="column">
                <span>รหัสผ่านผู้ดูแล</span>
                <input placeholder="กรอกรหัสผ่าน" ref={PasswordRef} type="password" autoComplete="new-password" className="input-text input-pw" />
              </label>
              <div className="bt-manage">
                <button onClick={() => setShowConfirmModal(false)} className="close">ยกเลิก</button>
                <button onClick={handleToggleConfirm} className="submit">ยืนยัน</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal show={popupDataManage.open} onHide={() => setPopupDataManage((data) => ({ ...data, open: false }))} centered size="lg" scrollable>
        <ManageGroup fetchGroups={fetchGroupData} />
      </Modal>

      <Modal
        show={historyModal.open}
        onHide={() => setHistoryModal((h) => ({ ...h, open: false }))}
        centered
        size="xl"
      >
        {historyModal.open && (
          <GroupHistoryModal
            groupId={historyModal.groupId}
            groupLabel={historyModal.groupLabel}
            onClose={() => setHistoryModal((h) => ({ ...h, open: false }))}
          />
        )}
      </Modal>
    </div>
  );
};

export default PageGroup;
