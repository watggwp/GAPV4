import React, { useCallback, useEffect, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { CloseAccount } from "../../method";

import "./Success.scss"
import { Loading } from "../../../../../assets/js/module";
import List from "./ListSuccess";
import { useNavigate, useParams } from "react-router";
import { useGreenhouse } from "..";

const Success = ({ type_page }) => {

    const { greenhouse_id , gap_id } = useParams()
    const navigator = useNavigate()

    const { setCurrentPage } = useGreenhouse()

    const Popup = useRef()
    // const [List , setList] = useState(<></>)
    const [PopupState , setPopup] = useState(<></>)

    const [DotSome , setDotSome] = useState([])
    const [listData, setListData] = useState([])

    const ChangeMenu = useCallback((type) => {
        navigator(`/farmer/form/${greenhouse_id}/${gap_id}/s/${type}`)
    } , [gap_id, greenhouse_id, navigator])

    const requestAlertReport = useCallback(async () => {
        const result = await clientMo.get(`/api/farmer/report/check?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`);
        if (await CloseAccount(result, setCurrentPage)) {
            setDotSome(JSON.parse(result)); // อัปเดต DotSome
        }
    } , [gap_id, greenhouse_id, setCurrentPage])
    
    useEffect(() => {
        requestAlertReport()
        const interval = setInterval(requestAlertReport, 5000)
    
        clientMo.unLoadingPage()
        return () => clearInterval(interval)
    }, [requestAlertReport]);
    

    const OpenPopup = async (id_table_success , type , name_station , Dom) => {
        const result = await clientMo.post("/api/farmer/success/get" , {
            id_farmhouse : greenhouse_id , id_plant : gap_id , id_table : id_table_success
        })
        if(await CloseAccount(result , setCurrentPage)) {
            const ob = JSON.parse(result)
            if(ob[0]) setPopup(
                <PopupSuccess 
                    Ref={Popup} setPopup={setPopup}
                    Data={{
                        id_success : ob[0].id_success,
                        name_station : name_station
                    }} setListData={setListData}
                />
            )
            else setPopup(
                    <PopupSuccess 
                        Ref={Popup} 
                        setPopup={setPopup} 
                        Dom={Dom}
                        Data={{
                            id_table : id_table_success,
                            type : type,
                            name_station : name_station
                        }}
                        setListData={setListData}
                    />
                )
        }
    }

    const ReturnPage = useCallback(async () => {
        navigator(`/farmer/form/${greenhouse_id}/${gap_id}/p`)
    } , [gap_id, greenhouse_id, navigator])

    return (
        <>
        <div className="body-success">
            <div className="head">
                <div className="return" onClick={ReturnPage}>
                    <svg fill="#000000" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                        <g fillRule="evenodd">
                            <path d="M1052 92.168 959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z"/>
                            <path d="M1920 92.168 1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z"/>
                        </g>
                    </svg>
                </div>
                <span>{type_page === "h" ? "การเก็บเกี่ยว" : type_page === "cf" ? "ตรวจสอบแบบฟอร์ม" : type_page === "cp" ? "ตรวจสอบผลผลิต" : ""}</span>
            </div>
            <div className="menu-container">
                <button 
                    className={`menu-button harvest ${type_page === "h" ? "active" : ""}`} 
                    onClick={() => ChangeMenu("h")}
                >
                    การเก็บเกี่ยว
                    {DotSome[0]?.success > 0 && <div className="dot-someting"></div>}
                </button>

                <button 
                    className={`menu-button form-check ${type_page === "cf" ? "active" : ""}`} 
                    onClick={() => ChangeMenu("cf")}
                >
                    ผลตรวจแบบฟอร์ม
                    {DotSome[0]?.form > 0 && <div className="dot-someting"></div>} 
                </button>

                <button 
                    className={`menu-button product-check ${type_page === "cp" ? "active" : ""}`} 
                    onClick={() => ChangeMenu("cp")}
                >
                    ผลตรวจผลผลิต
                    {DotSome[0]?.plant > 0 && <div className="dot-someting"></div>} 
                </button>
            </div>

            <div className="content-success">
                <div className="list-success">
                    <List type_page={type_page} OpenPopup={OpenPopup}/>
                </div>
            </div>
            <div ref={Popup} className="popup">
                {PopupState}
            </div>
        </div>
        </>
    )
}

const PopupSuccess = ({
    Ref , 
    setPopup, 
    Dom ,
    setListData,
    Data = { type : "" , id_table : "" , id_success : "" , name_station : "" } , 
}) => {
    const { greenhouse_id , gap_id } = useParams()
        
    const { setCurrentPage } = useGreenhouse()
    const [Load , setLoad] = useState(false)
    
    useEffect(()=>{
        Ref.current.setAttribute("show" , "")
    } , [Ref])

    const cancel = () => {
        Ref.current.removeAttribute("show")
        setTimeout(()=>{
            setPopup(<></>)
        } , 500)
    }

    const Confirm = async () => {
        const data = {
            id_farmhouse : greenhouse_id,
            id_plant : gap_id,
            id_table_success : Data.id_table,
        }

        setLoad(true)
        const result = await clientMo.post("/api/farmer/success/update" , data)
        if(await CloseAccount(result , setCurrentPage)){
            Dom.target.innerHTML = "แสดงรหัส"
            setListData(prevData =>
                prevData.map(item =>
                    item.id === Data.id_table ? { ...item, date_of_farmer: new Date().toISOString() } : item
                )
            );
            cancel()
        }
    }

    return(
        <section className="detail-popup">
            <div className="head-content">
                <div className="head-popup">{Data.id_success ? Data.id_success : Data.type ? "เก็บผลผลิต" : "เก็บผลตัวอย่าง"}</div>
                { Data.id_success ? <></> :
                    <div className="content-load">
                        {Load ? <Loading size={"1.5em"} border={"2vw"} color="green" animetion={true}/> : <></>}
                    </div>
                }
            </div>
            <div className="report-alert">
                {Data.id_success ? `* รหัสนี้สำหรับแนบกับผลผลิตเพื่อนำส่งศูนย์${Data.name_station}` : `* เมื่อกดยืนยัน จะแสดงปุ่มเพื่อแสดงรหัสสำหรับแนบกับผลผลิตส่งให้ทางศูนย์${Data.name_station}`}
            </div>
            <div className="bt">
                <button style={{backgroundColor : Data.id_success ? "green" : "red" , color : "white"}} onClick={cancel}>{Data.id_success ? "ตกลง" : "ยกเลิก"}</button>
                { Data.id_success ? <></>
                    : <button style={{backgroundColor : "green" , color : "white"}} onClick={Confirm}>ยืนยัน</button>
                }
            </div>
        </section>
    )
}

export default Success