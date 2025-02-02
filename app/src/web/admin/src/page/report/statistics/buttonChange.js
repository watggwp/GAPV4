import { useContext, useEffect, useState } from "react";
import { PageTemplateContext } from "../../PageTemplate";
import { clientMo } from "../../../../../../assets/js/moduleClient";

export default function ButtonChangeStatistics() {
    const { ChangeStatus } = useContext(PageTemplateContext);
    const [hasSignificantPestData, setHasSignificantPestData] = useState(false);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const response = await clientMo.post('/api/admin/statistic/get');
                const data = JSON.parse(response);

                console.log("Data from API:", data);  // ตรวจสอบข้อมูลที่ส่งกลับมา

                // ตรวจสอบว่ามีข้อมูลที่จำนวนเท่ากับหรือมากกว่า 3 
                const significantDataExists = data.some(item => 
                    item.total_1_week >= 3 || item.total_1_month >= 3
                );

                console.log("Has significant pest data:", significantDataExists);  
                
                setHasSignificantPestData(significantDataExists);
            } catch (error) {
                console.error("Error fetching statistics:", error);
            }
        };

        fetchStatistics();
    }, []);

    return (
        <div style={{ display: "flex" }}>
            <button 
                style={{ 
                    marginRight: "10px", 
                    backgroundColor: hasSignificantPestData ? "red" : "initial",
                    color: hasSignificantPestData ? "white" : "black",
                    animation: "redBorderBlink 1s infinite"
                }}
            >
                แจ้งเตือน
            </button>
            <button 
                className="bt-listlocation" 
                onClick={() => ChangeStatus("listlocation")}
            >
                แสดงรายชื่อหมอพืชและที่ปรึกษาเกษตรกร
            </button>
        </div>
    );
}