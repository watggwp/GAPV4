import { useContext, useState, useEffect } from "react";
import { PageTemplateContext } from "../../PageTemplate";
import { Modal } from "react-bootstrap";
import { InsertStatisticsContext } from "./InsertStatistics";
import { clientMo } from "../../../../../../assets/js/moduleClient";

export default function ButtonChangeStatistics() { 
    const { minCount, selectedRows } = useContext(InsertStatisticsContext);
    const { ChangeStatus } = useContext(PageTemplateContext);
    
    const [popupDataManage, setPopupDataManage] = useState({ open: false });
    const [stateOnBt, setStateOnBt] = useState(true);
    const [selectedData, setSelectedData] = useState([]);
    const [chemicals, setChemicals] = useState({}); // เก็บข้อมูลสารเคมีที่ใช้

    // ดึงข้อมูลสารเคมีที่ใช้จาก API
    useEffect(() => {
        if (selectedRows.size) {
            selectedRows.forEach(row => {
                clientMo.post("/api/admin/chemical_pest/get", { pest_id: row.id }) 
                    .then(response => {
                        // console.log(response)
                        const data = JSON.parse(response)
                        if (data.chemical_used) {
                            setChemicals(prevChemicals => ({
                                ...prevChemicals,
                                [row.id]: response.data.chemical_used // เก็บชื่อสารเคมีตาม pest_name
                            }));
                        }
                    })
                    .catch(error => console.error("Error fetching data:", error));
            });
        }
    }, [selectedRows]);

    const fetchStatistics = async () => {
        try {
            setSelectedData(() => {
                const newSelectsData = [];
                selectedRows.forEach(selectedRow => {
                    newSelectsData.push(selectedRow);
                });
                console.log(newSelectsData);
                return newSelectsData;
            });

            setPopupDataManage({ open: true });

        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
        }
    };

    const handleOpenModal = () => {
        if (minCount >= 1) {
            fetchStatistics();
        }
    };

    const handleCloseModal = () => {
        setPopupDataManage({ open: false });
    };

    const Cancel = () => {
        handleCloseModal();
    };

    const ClickAdd = () => {
        console.log("เพิ่มข้อมูลเรียบร้อยแล้ว!");
        handleCloseModal(); 
    };

    return (
        <div style={{ display: "flex" }}>
            <button 
                style={{ 
                    marginRight: "10px", 
                    backgroundColor: minCount >= 1 ? "red" : "gray", 
                    color: "white", 
                    cursor: minCount >= 1 ? "pointer" : "not-allowed"
                }} 
                onClick={handleOpenModal}
                disabled={minCount < 1} 
            >
                แจ้งเตือน
            </button>

            <button 
                className="bt-listlocation" 
                onClick={() => ChangeStatus("listlocation")}
            >
                แสดงรายชื่อหมอพืชและที่ปรึกษาเกษตรกร
            </button>

            <Modal
                show={popupDataManage.open}
                onHide={handleCloseModal}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
                centered
                size="lg"
            >
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 id="modal-title">แจ้งเตือนการระบาด</h2>
                        <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                    </div>

                    <div className="modal-body" style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                        {selectedData.length > 0 ? (
                            <table style={{ 
                                width: "90%", 
                                borderCollapse: "collapse", 
                                marginTop: "10px", 
                                border: "2px solid #60d6cf", 
                                textAlign: "center"
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#60d6cf", color: "white" }}>
                                        <th style={{ padding: "10px", border: "1px solid white" }}>ชื่อโรค/ศัตรูพืช</th>
                                        <th style={{ padding: "10px", border: "1px solid white" }}>พืชที่เกี่ยวข้อง</th>
                                        <th style={{ padding: "10px", border: "1px solid white" }}>จำนวน</th>
                                        <th style={{ padding: "10px", border: "1px solid white" }}>สารเคมีที่ใช้</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...selectedData]
                                        .sort((a, b) => b.count - a.count) 
                                        .map((item, index) => (
                                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#f8f8f8" : "#fff" }}>
                                                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                                                    {item.name || item.insect}
                                                </td>
                                                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{item.name_plants}</td>
                                                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{item.count}</td>
                                                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                                                    {chemicals[item.id] || "-"}
                                                </td>
                                            </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: "center", color: "gray", fontWeight: "bold", padding: "10px" }}>ไม่มีข้อมูลที่จะแสดง</p>
                        )}
                    </div>
                    <div className="bt-submitnoty">
                        <button className="cancel" onClick={Cancel}>
                            ยกเลิก
                        </button>
                        <button className="submit" onClick={ClickAdd} disabled={!stateOnBt}>
                            แจ้งข้อมูล
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
