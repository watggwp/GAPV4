import React, { useEffect, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";

import { DayJSX } from "../../../../../assets/js/module";
import PopupInsertPlant from "./InsertPlant";
import Template from "../TemplateList";
import { CloseAccount } from "../../method";
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useGreenhouse } from "..";

export default function Gaps() {
    const { greenhouse_id } = useParams()
    const navigator = useNavigate()

    const { setCurrentPage } = useGreenhouse()
    const [ formsGAP , setFormsGAP ] = useState([])
    const [ disabledAdd , setDisabledAdd ] = useState(false)

    const [Loading, setLoading] = useState(false);
    const [PopupAdd, setPopupAdd] = useState(<></>);

    const PopupRef = useRef();

    const ListPlantForm = useCallback(async () => {
        setLoading(false);
        const auth = await clientMo.post('/api/farmer/formplant/select', { id_farmhouse: greenhouse_id });
        if (await CloseAccount(auth)) {
            const formsGAPData = JSON.parse(auth)
            setFormsGAP(formsGAPData)
        }

        setLoading(true);
        clientMo.unLoadingPage();
    } , [greenhouse_id])

    // insert Popup
    const popupPlant = useCallback(async () => {
        const result = await clientMo.post("/api/farmer/account/check");
        if (await CloseAccount(result, setCurrentPage)) {
            setPopupAdd(
                <PopupInsertPlant 
                    setLoading={setLoading} setPopup={setPopupAdd} RefPop={PopupRef} ReloadData={ListPlantForm} 
                />
            );
        }
    } , [ListPlantForm, setCurrentPage])

    // open menu
    const OpenMenuPlant = useCallback(async (gap_id) => {
        navigator(`/farmer/form/${greenhouse_id}/p/${gap_id}`)
    } , [greenhouse_id, navigator])

    useEffect(() => {
        setDisabledAdd(formsGAP.some(formGap => formGap.state_status === 0))
    } , [formsGAP])

    useEffect(() => {
        ListPlantForm();
    }, [ListPlantForm])

    return (
        <Template 
            PopUp={{ PopupRef: PopupRef, PopupBody: PopupAdd }}
            List={
                formsGAP.map((formGAP) =>
                    <div key={formGAP.id} className={`plant-content ${formGAP.state_status === 2 ? "submit" : ""}`} style={
                        (formGAP.report || formGAP.form || formGAP.plant || formGAP.success) && formGAP.state_status < 2 ? {
                            marginTop: "25px",
                            position: "relative"
                        } : {}}>
                        {(formGAP.report || formGAP.form || formGAP.plant || formGAP.success) && formGAP.state_status < 2 ?
                            <div className="report-of-doctor" style={{
                                position: "absolute",
                                bottom: "100%",
                                right: "0.5em"
                            }}>
                                <span style={{
                                    backgroundColor: "red",
                                    padding: "1px 4px",
                                    borderRadius: "5px",
                                    fontWeight: "900",
                                    color: "white"
                                }}>มีข้อความจากเจ้าหน้าที่</span>
                            </div> : <></>
                        }
                        <div className="top">
                            <div className="type-main">
                                <input readOnly value={formGAP.type_plant ? formGAP.type_plant : "ไม่ระบุ"}></input>
                            </div>
                            <div className="date">
                                <span>วันที่ปลูก</span>
                                <DayJSX DATE={formGAP.date_plant} TYPE="short" />
                            </div>
                        </div>
                            
                        <div className="body">
                        <div className="content">
                                <span>ชนิดพืช :</span>
                                <div>{formGAP.name_plant}</div>
                            </div>
                            
                        </div>
                        <div className="bottom">          
                            <div className="content" style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap",marginRight: "5px" }}>
                                <span>จำนวน :</span>
                                <div>{`${formGAP.qty} ต้น`}</div>
                            </div>
                            <div className="content" style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                                <span>รุ่นที่ :</span>
                                <div>{formGAP.generation}</div>
                            </div>
                            <div className="bt">
                                <button onClick={() => OpenMenuPlant(formGAP.id)}>{formGAP.state_status < 2 ? "บันทึกข้อมูล" : "ดูข้อมูล"}</button>
                            </div>
                        </div>
                    </div>
                )
            } 
            Loading={Loading} 
            action={popupPlant} 
            Option={{ TextHead: "แบบบันทึกเกษตรกร", img: "/plant_glow.jpg" }}
            disabledAdd={disabledAdd}
        />
    );
}