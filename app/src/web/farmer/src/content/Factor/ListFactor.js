import React, { useCallback, useEffect, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
 
import PopupInsertFactor from "./InsertFactor";
import Template from "../TemplateList";
import { CloseAccount } from "../../method";
import EditFactorPopup from "./EditFactor";
import DetailEdit from "../DetailEdit";
import DetailFactor from "./DetailFactor";
import { useNavigate, useParams } from "react-router";
import { useGreenhouse } from "..";
import Fertilizer from "./card/fertilizer";
import Chemical from "./card/chemical";
 
const ListFactor = ({ type_path_factor }) => {

    const { greenhouse_id , gap_id } = useParams()
    const navigator = useNavigate()

    const { setCurrentPage } = useGreenhouse()

    const [ reloadPage , setReloadPage ] = useState(false)
    const [Loading , setLoading] = useState(false)
    const [PopupAdd , setPopupAdd] = useState(<></>)
    const [PopupHistory , setHistory] = useState(<></>)
 
    const PopupRef = useRef()
    const RefPopHistory = useRef()
 
    const [getLoadCheckSubmit , setLoadCheckSubmit] = useState(-1)
 
    // Load Data List
 
    const fetchCheck = useCallback(async () => {
        const result = await clientMo.post("/api/farmer/formplant/check" , {id_farmhouse: greenhouse_id , id_form_plant : gap_id})
        if(await CloseAccount(result , setCurrentPage)) {
            try {
                const Check = JSON.parse(result)
                setLoadCheckSubmit(Check[0].state_status)
            } catch(e) {}
        }
    } , [gap_id, greenhouse_id, setCurrentPage])

    const reload = useCallback(() => {
        setReloadPage(( reloadCurrent ) => !reloadCurrent)
    } , [])

    const OpenManage = useCallback((id_table , e) => {
        const managePop = document.querySelector(`.list-factor-content.content-${id_table} .manage-form.content-${id_table}`)
        managePop.toggleAttribute("show")
        e.target.toggleAttribute("show")
    } , [])
 
    // insert Popup
    const popupInsertFactor = useCallback(async () => {
        const result = await clientMo.post("/api/farmer/account/check")
        if(await CloseAccount(result , setCurrentPage)) {
            setPopupAdd(
                <PopupInsertFactor 
                    type_path={type_path_factor}
                    setPopup={setPopupAdd} 
                    RefPop={PopupRef} 
                    ReloadData={reload}
                />
            )
        }
    } , [reload, setCurrentPage, type_path_factor])
 
    // edit start
    const PopupEditForm = useCallback(async (DataObject) => {
        const result = await clientMo.post("/api/farmer/account/check")
        if(await CloseAccount(result , setCurrentPage)) {
            setPopupAdd(
                <EditFactorPopup 
                    type_path={type_path_factor}
                    setPopup={setPopupAdd} 
                    RefPop={PopupRef} 
                    ReloadData={reload} 
                    ObjectData={DataObject}
                />
            )
        }
    } , [reload, setCurrentPage, type_path_factor])
 
    const HistoryEdit = useCallback((id_table) => {
        const type = (type_path_factor === "z") ? "fertilizer" : "chemical";
        setHistory(
            <DetailEdit 
                Ref={RefPopHistory} setRef={setHistory}
                type={type_path_factor}
                Data_on={{
                    id_factor : id_table,
                    type_form : type,
                }}
            />
        )
    } , [type_path_factor])
    // edit end
 
    // detail form
    const DetailFrom = useCallback(async (DataObject) => {
        const result = await clientMo.post("/api/farmer/account/check")
        if(await CloseAccount(result , setCurrentPage)) {
            setPopupAdd(
                <DetailFactor 
                    type_path={type_path_factor} 
                    setPopup={setPopupAdd} 
                    RefPop={PopupRef}   
                    ReloadData={reload} 
                    ObjectData={DataObject}
                />
            )
        }
    } , [reload, setCurrentPage, type_path_factor])
 
    const CloseManage = useCallback((e) => {
        if(e.target.getAttribute("show") === null) {
            const managePop = document.querySelector(`.list-factor-content .manage-form[show=""]`)
            const Bt = document.querySelector(`.list-factor-content button[show=""]`)
            if(Bt && managePop) {
                managePop.removeAttribute("show")
                Bt.removeAttribute("show")
            }
        }
    } , [])
 
    const ReturnPage = useCallback(async () =>{
        navigator(`/farmer/form/${greenhouse_id}/${gap_id}/p`)
    } , [gap_id, greenhouse_id, navigator])
 
    useEffect(()=>{ 
        clientMo.unLoadingPage();
       
        setLoadCheckSubmit(-1);
        fetchCheck();
 
        window.addEventListener("touchstart" , CloseManage)
 
        return () => {
            window.removeEventListener("touchstart" , CloseManage)
        }
    } , [CloseManage, fetchCheck, type_path_factor])
 
    return (
        <>
            <Template 
                PopUp={{PopupRef : PopupRef , PopupBody : PopupAdd}}
                List={
                    type_path_factor === "z" ?
                        <Fertilizer
                            key={reloadPage}
                            OpenManage={OpenManage}
                            DetailFrom={DetailFrom}
                            PopupEditForm={PopupEditForm}
                            HistoryEdit={HistoryEdit}
                            setLoading={setLoading}
                        /> :
                    type_path_factor === "c" ?
                        <Chemical
                            key={reloadPage}
                            OpenManage={OpenManage}
                            DetailFrom={DetailFrom}
                            PopupEditForm={PopupEditForm}
                            HistoryEdit={HistoryEdit}
                            setLoading={setLoading}
                        /> : 
                        <></>
                } 
                Loading={Loading} 
                action={getLoadCheckSubmit != -1 ? getLoadCheckSubmit < 2 ? popupInsertFactor : null : null} 
                Option={
                    {
                        TextHead : type_path_factor === "z" ? "บันทึกปุ๋ยที่ใช้" : type_path_factor === "c" ? "บันทึกสารเคมี" : "",
                        img : type_path_factor === "z" ? "/fertilizer.jpg" : type_path_factor === "c" ? "/chemical.jpg" : ""
                    }
                } 
                actionReturn={ReturnPage}
            />
            <div className="popup-detail-edit-factor" ref={RefPopHistory}>
                {PopupHistory}
            </div>
        </>
    )
}
 
export default ListFactor