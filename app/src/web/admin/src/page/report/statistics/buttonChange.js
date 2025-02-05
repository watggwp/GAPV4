import { useContext, useState } from "react";
import { PageTemplateContext } from "../../PageTemplate";
import { Modal } from "react-bootstrap";

export default function ButtonChangeStatistics() {
    const { ChangeStatus } = useContext(PageTemplateContext);
    const [popupDataManage, setPopupDataManage] = useState({ open: false });
    const [stateOnBt, setStateOnBt] = useState(true);

    const handleOpenModal = () => {
        setPopupDataManage((data) => ({ ...data, open: true }));
    };

    const handleCloseModal = () => {
        setPopupDataManage((data) => ({ ...data, open: false }));
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
                style={{ marginRight: "10px", backgroundColor: "red", color: "white" }} 
                onClick={handleOpenModal}
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
                        <button type="button" className="btn-close" onClick={handleCloseModal}>
                            
                        </button>
                    </div>

                    <div className="modal-body">
                        เนื้อหาของการแจ้งเตือน 
                    </div>

                    <div className="bt-submitnoty">
                        <button className="cancel" onClick={Cancel}>
                            ยกเลิก
                        </button>
                        <button
                            className="submit"
                            onClick={ClickAdd}
                            disabled={!stateOnBt}
                        >
                            เพิ่มข้อมูล
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
