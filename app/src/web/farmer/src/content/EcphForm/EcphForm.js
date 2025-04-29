import React, { useCallback, useEffect, useState } from "react";
import "./EcphForm.scss";
import RequestAPI from "../../../../../assets/js/requestAPI";
import { useNavigate, useParams } from "react-router";
import { DataGrid } from "@mui/x-data-grid";
import { Stack, Typography } from "@mui/material";

const EcphForm = () => {
  const { greenhouse_id , gap_id } = useParams()
  const navigator = useNavigate()

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
        id_formplant: gap_id,
      });
      if(Array.isArray(data)) setHistory(data);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  }, [gap_id]);

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
          id_formplant: gap_id,
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
  }, [ecValue, phValue, editEcValue, editPhValue, editingId, gap_id, fetchHistory]);


  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDateTimeTH = (timestamp) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear() + 543; // แปลง ค.ศ. → พ.ศ.
    const time = date.toLocaleTimeString("th-TH", { hour12: false });

    return `${day}-${month}-${year} ${time}`;
  };

  const onReturnMenu = useCallback(() => 
    navigator(`/farmer/form/${greenhouse_id}/${gap_id}/p`)
  , [gap_id, greenhouse_id, navigator])

  return (
    <section id="ecph-form-page">
      <div className="head">
        <div
          className="return"
          onClick={onReturnMenu}
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
                <div className="row-data">
                  <label className="frame-textbox colume">
                    <span>ค่า EC</span>
                    <input
                      type="number"
                      step="0.01"
                      value={ecValue}
                      onChange={(e) => setEcValue(e.target.value)}
                      placeholder="เช่น 1.00"
                    />
                  </label>
                </div>

                <div className="row-data">
                  <label className="frame-textbox colume">
                    <span>ค่า pH</span>
                    <input
                      type="number"
                      step="0.01"
                      value={phValue}
                      onChange={(e) => setPhValue(e.target.value)}
                      placeholder="เช่น 1.00"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="body">
                <div className="row-data">
                  <label className="frame-textbox colume">
                    <span>ข้อมูลที่บันทึกไว้</span>
                    <div className="full" style={{ width: "100%", marginTop: "0.5em" }}>
                        <DataGrid
                            className="history-table"
                            columns={[
                                {
                                    field : "timestamp",
                                    headerName : "วันที่/เวลา",
                                    flex : 1,
                                    align : "center",
                                    headerAlign : "center",
                                    minWidth : 200,
                                    renderCell : ({ value }) => (
                                        formatDateTimeTH(value)
                                    )
                                },
                                {
                                    field : "ec_value",
                                    headerName : "EC",
                                    flex : 1,
                                    align : "center",
                                    headerAlign : "center",
                                    minWidth : 100,
                                    renderCell : ({ value }) => (
                                        parseFloat(value).toFixed(2)
                                    )
                                },
                                {
                                    field : "ph_value",
                                    headerName : "PH",
                                    flex : 1,
                                    align : "center",
                                    headerAlign : "center",
                                    minWidth : 100,
                                    renderCell : ({ value }) => (
                                        parseFloat(value).toFixed(2)
                                    )
                                },
                                {
                                    field : "",
                                    headerName : "จัดการ",
                                    flex : 1,
                                    align : "center",
                                    headerAlign : "center",
                                    minWidth : 250,
                                    renderCell : ({ row }) => (
                                        <Stack className="td-actions">
                                            <button
                                                onClick={() => {
                                                    setSelectedItem(row);
                                                    setShowEditModal(true);
                                                    setEditEcValue(row.ec_value);
                                                    setEditPhValue(row.ph_value);
                                                    setEditingId(row.id);
                                                }}
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedItem(row);
                                                    setShowDeleteModal(true);
                                                }}
                                            >
                                                ลบ
                                            </button>
                                        </Stack>
                                    )
                                },
                            ]}
                            rows={history}
                            slots={{
                                noRowsOverlay : () => (
                                    <Stack
                                        justifyContent={"center"}
                                        alignItems={"center"}
                                        width={"100%"}
                                        height={"100%"}
                                    >
                                        <Typography fontSize={"14px"}>ไม่พบข้อมูลการบันทึก</Typography>
                                    </Stack>
                                )
                            }}
                            hideFooter
                            disableColumnSorting
                            disableColumnMenu
                            rowHeight={36}
                            columnHeaderHeight={42}
                        />
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
      {
        showEditModal && (
            <div className="modal-overlay">
            <div className="modal">
                <h3>แก้ไขค่า EC / pH</h3>
                <input
                    type="number"
                    step="0.01"
                    value={editEcValue}
                    onChange={(e) => setEditEcValue(e.target.value)}
                    placeholder="ค่า EC"
                />
                <input
                    type="number"
                    step="0.01"
                    value={editPhValue}
                    onChange={(e) => setEditPhValue(e.target.value)}
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
        )
      }


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
