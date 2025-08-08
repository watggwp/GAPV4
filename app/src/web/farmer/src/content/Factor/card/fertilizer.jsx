import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { clientMo } from "../../../../../../assets/js/moduleClient";
import { useGreenhouse } from "../..";
import { CloseAccount } from "../../../method";
import { DayJSX } from "../../../../../../assets/js/module";

export default function Fertilizer({
    OpenManage,
    DetailFrom,
    PopupEditForm,
    HistoryEdit,
    setLoading
}) {
    const { greenhouse_id , gap_id } = useParams()
    const { setCurrentPage } = useGreenhouse()

    const [ fertilizers , setFertilizer ] = useState([])

    const requestFertilizer = useCallback( async () => {
        const result = await clientMo.post('/api/farmer/factor/select' , {
            id_farmhouse : greenhouse_id,
            type : "fertilizer",
            id_plant : gap_id,
            order : "date"
        })
        
        if(await CloseAccount(result , setCurrentPage)) {
            setFertilizer(JSON.parse(result))
            setLoading(true)
        }
    } , [gap_id, greenhouse_id, setCurrentPage, setLoading])

    useEffect(() => {
        requestFertilizer()
    } , [requestFertilizer])

    return(
        fertilizers.map((fertilizer , key)=>
            <section key={key} className={`list-factor-content content-${fertilizer.id}`}>
                { 
                    Boolean(Object.entries(fertilizer.subjectResult).filter( val =>val[1] == 2).length) && <div className="dot-someting"></div>
                }
                <div className="row">
                    <div className="name">{fertilizer.name}</div>
                    <div className="date">
                        <span>วันที่บันทึก</span>
                        <DayJSX DATE={fertilizer.date} TYPE="normal"/>
                    </div>
                </div>
                <div className="row">
                    <div className="nameMain">
                        <span>สูตร</span>
                        {fertilizer.formula_name ? fertilizer.formula_name : "ไม่ระบุ"}
                    </div>
                    <div className="volume">
                        {fertilizer.volume}
                    </div>
                </div>
                <div className="row">
                    <div className="source">{fertilizer.source}</div>
                    <button onClick={(e)=>OpenManage(fertilizer.id , e)}>จัดการ</button>
                    <div className={`manage-form content-${fertilizer.id}`}>
                        <div onClick={()=>DetailFrom(fertilizer)}>รายละเอียด</div>
                        { 
                            fertilizer.state_status < 2 &&
                                <div onClick={()=>PopupEditForm(fertilizer)}>แก้ไขข้อมูล</div>
                        }
                        <div onClick={()=>HistoryEdit(fertilizer.id)}>ประวัติแก้ไข</div>
                    </div>
                </div>
            </section>
        )
    )
}