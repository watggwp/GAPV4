import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { clientMo } from "../../../../../../assets/js/moduleClient";
import { useGreenhouse } from "../..";
import { CloseAccount } from "../../../method";
import { DayJSX } from "../../../../../../assets/js/module";

export default function Chemical({
    OpenManage,
    DetailFrom,
    PopupEditForm,
    HistoryEdit,
    setLoading
}) {
    const { greenhouse_id , gap_id } = useParams()
    const { setCurrentPage } = useGreenhouse()

    const [ chemicals , setChemicals ] = useState([])

    const requestChemical = useCallback( async () => {
        const result = await clientMo.post('/api/farmer/factor/select' , {
            id_farmhouse : greenhouse_id,
            type : "chemical",
            id_plant : gap_id,
            order : "date"
        })
        
        if(await CloseAccount(result , setCurrentPage)) {
            setChemicals(JSON.parse(result))
            setLoading(true)
        }
    } , [gap_id, greenhouse_id, setCurrentPage, setLoading])

    useEffect(() => {
        requestChemical()
    } , [requestChemical])

    return(
        chemicals.map((chemical , key)=>
            <section key={key} className={`list-factor-content content-${chemical.id}`}>
                <div className="row">
                    <div className="name">{chemical.name}</div>
                    <div className="nameMain">
                        <span>สูตร</span>
                        {chemical.formula_name}
                    </div>
                </div>
                <div className="row">
                    <div className="insect">
                        <span>ศัตรูพืช</span>
                        {chemical.insect}
                    </div>
                    <div className="volume">
                        {chemical.volume}
                    </div>
                </div>
                <div className="row">
                    <div className="rate">
                        <span>อัตรา</span>
                        {chemical.rate}/น้ำ20ล.
                    </div>
                </div>
                <div className="row">
                    <div className="date-safe">
                        <span>วันที่ปลอดภัย</span>
                        <DayJSX DATE={chemical.date_safe} TYPE="small"/>
                    </div>
                </div>
                <div className="row">
                    <div className="source">{chemical.source}</div>
                    <button onClick={(e)=>OpenManage(chemical.id , e)}>จัดการ</button>
                    <div className={`manage-form content-${chemical.id}`}>
                        <div onClick={()=>DetailFrom(chemical)}>รายละเอียด</div>
                        { chemical.state_status < 2 ?
                            <div onClick={()=>PopupEditForm(chemical)}>แก้ไขข้อมูล</div>
                            : <></>
                        }
                        <div onClick={()=>HistoryEdit(chemical.id)}>ประวัติแก้ไข</div>
                    </div>
                </div>
            </section>
        )
    )
}