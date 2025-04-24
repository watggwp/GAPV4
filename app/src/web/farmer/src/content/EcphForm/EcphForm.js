import React, { useCallback, useEffect, useState } from "react";
import "./EcphForm.scss";
import RequestAPI from "../../../../../assets/js/requestAPI";
import MenuPlant from "../PlantList/MenuPlant";

const EcphForm = ({ setBody, setPage, houseID, formplantID, liff }) => {
  const [ecValue, setEcValue] = useState("");
  const [phValue, setPhValue] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); // 🆕 เพิ่ม state สำหรับแก้ไข
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // เก็บรายการที่เลือก
  const [editEcValue, setEditEcValue] = useState("");
  const [editPhValue, setEditPhValue] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await RequestAPI.post("/api/farmer/ecph/history", {
        id_formplant: formplantID,
      });
      setHistory(data);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  }, [formplantID]);

  const handleSubmit = useCallback(async () => {
    const ec = editingId ? editEcValue : ecValue;
    const ph = editingId ? editPhValue : phValue;

    if (!ec || !ph) {
      alert("กรุณากรอกค่า EC และ pH ให้ครบ");
      return;
    }

    try {
      setLoading(true);
      let response;

      if (editingId) {
        response = await RequestAPI.post("/api/farmer/ecph/update", {
          id: editingId,
          ec_value: ec,
          ph_value: ph,
        });
      } else {
        response = await RequestAPI.post("/api/farmer/ecph/save", {
          id_formplant: formplantID,
          ec_value: ec,
          ph_value: ph,
        });
      }

      const { data } = response;

      if (data.success) {
        alert(editingId ? "อัปเดตเรียบร้อยแล้ว" : "บันทึกเรียบร้อยแล้ว");
        setEcValue("");
        setPhValue("");
        setEditEcValue("");
        setEditPhValue("");
        setEditingId(null);
        fetchHistory();
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [ecValue, phValue, editEcValue, editPhValue, editingId, formplantID, fetchHistory]);


  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    setPage("EcphForm");
  }, [setPage]);

  const formatDateTimeTH = (timestamp) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear() + 543; // แปลง ค.ศ. → พ.ศ.
    const time = date.toLocaleTimeString("th-TH", { hour12: false });

    return `${day}-${month}-${year} ${time}`;
  };

  return (
    <section id="ecph-form-page">
      <div className="head">
        <div
          className="return"
          onClick={() =>
            setBody(
              <MenuPlant
                setBody={setBody}
                setPage={setPage}
                id_house={houseID}
                id_plant={formplantID}
                isClick={1}
              />
            )
          }


        >
          <svg fill="#000000" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
            <g fillRule="evenodd">
              <path d="M1052 92.168L959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z" />
              <path d="M1920 92.168L1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z" />
            </g>
          </svg>
        </div>
        <span>บันทึกค่า EC / pH</span>
      </div>

      <div className="form">
        <div className="data-content">
          <div className="frame-content">
            <div className="step">
              <div className="body">
                <div className="row">
                  <label className="frame-textbox colume">
                    <span>ค่า EC</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editEcValue}
                      onChange={(e) => setEditEcValue(e.target.value)}
                      placeholder="เช่น 1.00"
                    />
                  </label>
                </div>

                <div className="row">
                  <label className="frame-textbox colume">
                    <span>ค่า pH</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editPhValue}
                      onChange={(e) => setEditPhValue(e.target.value)}
                      placeholder="เช่น 1.00"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="body">
                <div className="row">
                  <label className="frame-textbox colume">
                    <span>ข้อมูลที่บันทึกไว้</span>
                    <div className="full" style={{ width: "100%", marginTop: "0.5em" }}>
                      {history.length === 0 ? (
                        <p style={{ color: "#777" }}>ยังไม่มีข้อมูล</p>
                      ) : (
                        <ul style={{ width: "100%" }}>
                          <table className="history-table"
                          >
                            <colgroup>
                              <col style={{ width: "25%" }} />
                              <col style={{ width: "15%" }} />
                              <col style={{ width: "15%" }} />
                              <col style={{ width: "20%" }} />
                            </colgroup>
                            <thead>
                              <tr>
                                <th>วันที่/เวลา</th>
                                <th>EC</th>
                                <th>pH</th>
                                <th>จัดการ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{formatDateTimeTH(item.timestamp)}</td>
                                  <td>{parseFloat(item.ec_value).toFixed(2)}</td>
                                  <td>{parseFloat(item.ph_value).toFixed(2)}</td>
                                  <td className="td-actions">
                                    <button
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setShowEditModal(true);
                                        setEcValue(item.ec_value);
                                        setPhValue(item.ph_value);
                                        setEditingId(item.id);
                                      }}
                                    >
                                      แก้ไข
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setShowDeleteModal(true);
                                      }}
                                    >
                                      ลบ
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                        </ul>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bt">
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>

        </div>
      </div>

      {/* ✅ Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>แก้ไขค่า EC / pH</h3>
            <input
              type="number"
              step="0.01"
              value={ecValue}
              onChange={(e) => setEcValue(e.target.value)}
              placeholder="ค่า EC"
            />
            <input
              type="number"
              step="0.01"
              value={phValue}
              onChange={(e) => setPhValue(e.target.value)}
              placeholder="ค่า pH"
            />
            <div className="modal-buttons">
              <button
                onClick={async () => {
                  await handleSubmit();
                  setShowEditModal(false); // ปิด modal หลังอัปเดต
                  setSelectedItem(null);
                }}
              >
                อัปเดต
              </button>
              <button onClick={() => setShowEditModal(false)}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}


      {/* ✅ Delete Modal */}
      {
        showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>คุณต้องการลบรายการนี้หรือไม่?</h3>
              <p>
                EC: {selectedItem?.ec_value}, pH: {selectedItem?.ph_value}
              </p>
              <div className="modal-buttons">
                <button
                  onClick={async () => {
                    try {
                      const res = await RequestAPI.post("/api/farmer/ecph/delete", {
                        id: selectedItem.id,
                      });
                      if (res.data.success) {
                        alert("ลบเรียบร้อยแล้ว");
                        fetchHistory();
                      } else {
                        alert("เกิดข้อผิดพลาด");
                      }
                    } catch (err) {
                      alert("เชื่อมต่อเซิร์ฟเวอร์ผิดพลาด");
                    } finally {
                      setShowDeleteModal(false);
                      setSelectedItem(null);
                    }
                  }}
                >
                  ใช่
                </button>
                <button onClick={() => setShowDeleteModal(false)}>ยกเลิก</button>
              </div>
            </div>
          </div>
        )
      }
    </section>
  );


};

export default EcphForm;
