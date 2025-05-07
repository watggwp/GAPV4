import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./index.scss";
import { DataGrid } from "@mui/x-data-grid";
import { Modal, Stack, Typography } from "@mui/material";
import RequestAPI from "../../js/requestAPI";

export default function EcPhManagement({
    gap_id ,
    role
}) {

    const [ecValue, setEcValue] = useState("");
    const [phValue, setPhValue] = useState("");
    const [loading, setLoading] = useState(false);

    const [ loadingHistory , setLoadingHistory ] = useState()
    const [ history, setHistory ] = useState([]);
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editEcValue, setEditEcValue] = useState("");
    const [editPhValue, setEditPhValue] = useState("");
    
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const QueryAPI = useMemo(() => ({
        r: role,
    }) , [role])

    const fetchHistory = useCallback(async () => {
        try {
            setLoadingHistory(true)
            const { data , status } = await RequestAPI.get(`/api/ecph/${gap_id}`, QueryAPI)
            switch(status) {
                case 200 :
                    const { history } = data
                    setHistory(history)
                    break;
                default :
                    break;
            }
        } catch (err) {
            
        }
        setLoadingHistory(false)
    }, [gap_id , QueryAPI])

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
                response = await RequestAPI.put(`/api/ecph/${editingId}`, {
                    ec_value: ec,
                    ph_value: ph,
                } , {
                    params : QueryAPI
                })
            } else {
                response = await RequestAPI.post(`/api/ecph/${gap_id}`, {
                    ec_value: ec,
                    ph_value: ph,
                } , {
                    params : QueryAPI
                })
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
    }, [editingId, editEcValue, ecValue, editPhValue, phValue, QueryAPI, gap_id, fetchHistory]);

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    const formatDateTimeTH = useCallback((timestamp) => {
        const date = new Date(timestamp);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear() + 543; // แปลง ค.ศ. → พ.ศ.
        const time = date.toLocaleTimeString("th-TH", { hour12: false });

        return `${day}-${month}-${year} ${time}`;
    } , [])

    return(
        <section id="ecph-management">
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
                                    <div className="full" style={{ overflow : "auto" , width: "100%", marginTop: "0.5em" , maxHeight : "300px" }}>
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
                                            rowHeight={40}
                                            columnHeaderHeight={42}
                                            loading={loadingHistory}
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
            <Modal
                open={showEditModal}
            >
                <Stack
                    width={"100%"}
                    height={"100%"}
                    justifyContent={"center"}
                    alignItems={"center"}
                >
                    <div className="ecph-modal">
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
                </Stack>
            </Modal>

            {/* ✅ Delete Modal */}
            <Modal
                open={showDeleteModal}
            >
                <Stack
                    width={"100%"}
                    height={"100%"}
                    justifyContent={"center"}
                    alignItems={"center"}
                >
                    <div className="ecph-modal">
                        <h3>คุณต้องการลบรายการนี้หรือไม่?</h3>
                        <p>
                            EC: {selectedItem?.ec_value}, pH: {selectedItem?.ph_value}
                        </p>
                        <div className="modal-buttons">
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await RequestAPI.delete(`/api/ecph/${selectedItem.id}`, QueryAPI);
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
                </Stack>
            </Modal>
            </section>
    )
}
