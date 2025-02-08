import { useContext, useState } from "react";
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

    // ฟังก์ชันโหลดข้อมูลจาก API ทั้ง 1 สัปดาห์ และ 1 เดือน
    const fetchStatistics = async () => {
        try {
            console.log(Object.entries(selectedRows).map(([ , selectedRow]) => selectedRow))
            setSelectedData(Object.entries(selectedRows).map(([ , selectedRow]) => selectedRow))
            // ดึงข้อมูลทั้ง 1 สัปดาห์ และ 1 เดือน
            // const [weekResponse, monthResponse] = await Promise.all([
            //     clientMo.post("/api/admin/statistic/get", { duration: "1_week" }),
            //     clientMo.post("/api/admin/statistic/get", { duration: "1_month" })
            // ]);

            // const weekData = JSON.parse(weekResponse);
            // const monthData = JSON.parse(monthResponse);

            // // รวมข้อมูลและกรองเฉพาะที่เลือก
            // const combinedData = [...weekData, ...monthData]
            //     .filter((item, index, self) => 
            //         selectedRows.includes(item.rank) &&
            //         self.findIndex(i => i.pest_name === item.pest_name) === index // ลบค่าซ้ำ
            //     )
            //     .map(item => ({
            //         name: item.pest_name,
            //         name_plants: item.name_plants,
            //         count: (item.total_1_week || 0) + (item.total_1_month || 0) // รวมค่าทั้งสองช่วง
            //     }))
            //     .sort((a, b) => b.count - a.count); // เรียงจากมากไปน้อย

            // setSelectedData(combinedData);
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

                    <div className="modal-body">
                        {selectedData.length > 0 ? (
                            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: "10px", backgroundColor: "#60d6cf", color: "white" }}>ชื่อโรค/ศัตรูพืช</th>
                                        <th style={{ padding: "10px", backgroundColor: "#60d6cf", color: "white" }}>พืชที่เกี่ยวข้อง</th>
                                        <th style={{ padding: "10px", backgroundColor: "#60d6cf", color: "white" }}>จำนวน</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedData.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ padding: "8px", textAlign: "center" }}>{item.name}</td>
                                            <td style={{ padding: "8px", textAlign: "center" }}>{item.name_plants}</td>
                                            <td style={{ padding: "8px", textAlign: "center" }}>{item.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: "center", color: "gray" }}>ไม่มีข้อมูลที่จะแสดง</p>
                        )}
                    </div>

                    <div className="bt-submitnoty">
                        <button className="cancel" onClick={Cancel}>
                            ยกเลิก
                        </button>
                        <button className="submit" onClick={ClickAdd} disabled={!stateOnBt}>
                            เพิ่มข้อมูล
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
