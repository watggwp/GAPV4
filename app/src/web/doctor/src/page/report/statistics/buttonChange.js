import { useContext } from "react"
import { PageTemplateContext } from "../../PageTemplate"
 
export default function ButtonChangeStatistics() {
    const { ChangeStatus } = useContext(PageTemplateContext)
 
    return(
        <div style={{
            display : "flex"
        }}>
            <button style={{ marginRight : "10px" }} >แจ้งเตือน</button>
            <button className="bt-listlocation" onClick={() => ChangeStatus("listlocation")}>แสดงรายชื่อหมอพืชและที่ปรึกษาเกษตรกร</button>
        </div>
    )
}