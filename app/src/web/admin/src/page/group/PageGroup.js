import { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { PageTemplateContext } from "../PageTemplate";

const PageGroup = () => {

    const { openInsert, setOpenInsert } = useContext(PageTemplateContext);
    const [locations, setLocations] = useState([]);

    const ListPagegroup = useCallback(async () => {
        const group = await clientMo.post("/api/admin/data/list", {
            type: "group", limit: 100, startRow: 0, textSearch: ""
        });
        
        const ListPagegroup = JSON.parse(group);
         (
            ListPagegroup 
        )

    }, [])

    useEffect(() => {
        ListPagegroup()

    }, []);

    return (
        <div className="data-table">
        <table border="1" style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
            <thead>
                <tr style={{ backgroundColor: "#60d6cf", color: "#fff" }}>
                    <th style={{ padding: "10px" }}>ลำดับ</th>
                    <th style={{ padding: "10px" }}>โรคพืช / ศัตรูพืช</th>
                    <th style={{ padding: "10px" }}>สารเคมี</th>
                    <th style={{ padding: "10px" }}>พืช</th>
                </tr>
            </thead>
            <tbody>
                {dataList.length > 0 ? (
                    dataList.map((item, index) => (
                        <tr key={index}>
                            <td style={{ padding: "10px", textAlign: "center" }}>{item.id}</td>
                            <td style={{ padding: "10px" }}>{item.pest}</td>
                            <td style={{ padding: "10px" }}>{item.chemical}</td>
                            <td style={{ padding: "10px" }}>{item.plant}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" style={{ padding: "10px", textAlign: "center" }}>
                            ไม่มีข้อมูล
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
    )
}
export default PageGroup;