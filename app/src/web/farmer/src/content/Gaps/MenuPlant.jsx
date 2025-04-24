import React, { useCallback, useEffect, useRef, useState } from "react";

import "./Menu.scss"
import { clientMo } from "../../../../../assets/js/moduleClient";
import { CloseAccount } from "../../method";
import { useNavigate, useParams } from "react-router";
import { useGreenhouse } from "..";

const MenuPlant = () => {

    const { greenhouse_id , gap_id } = useParams()
    const navigator = useNavigate()
    
    const { setCurrentPage } = useGreenhouse()
    const NavBody = useRef()
    const [ DotReport, setDotReport ] = useState([])
    const [getDotEditPlant, setDotEditPlant] = useState(false)

    const FetchCheck = useCallback(async () => {
        const result = await clientMo.get(`/api/farmer/report/check?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}`)
        await CloseAccount(result, setCurrentPage) && setDotReport(JSON.parse(result))
    } , [gap_id, greenhouse_id, setCurrentPage])

    useEffect(() => {
        // if (isClick === 1) window.history.pushState({}, null, `/farmer/form/${greenhouse_id}/p/${gap_id}`)

        // FetchFormPlant()
        FetchCheck()

        // if(document.getElementById("loading").classList[0] !== "hide") 
        // clientMo.unLoadingPage()
    }, [FetchCheck])

    // const FetchFormPlant = async () => {
    //     const result = await clientMo.post("/api/farmer/formplant/select" , {id_formplant : id_plant , id_farmhouse : id_house})
    //     if(await CloseAccount(result , setPage)) {
    //         const DataIn = JSON.parse(result)
    //         setDotEditPlant(DataIn[0].filter(val.subjectResult))
    //     }
    // }

    const selectMenu = useCallback(async (page) => {
        switch(page) {
            case "gap_data" :
                navigator(`/farmer/form/${greenhouse_id}/d/${gap_id}`)
                break;
            case "fertilizer" :
                navigator(`/farmer/form/${greenhouse_id}/z/${gap_id}`)
                break;
            case "chemical" :
                navigator(`/farmer/form/${greenhouse_id}/c/${gap_id}`)
                break;
            case "success" :
                navigator(`/farmer/form/${greenhouse_id}/s/${gap_id}/h`)
                break;
            case "ec/ph" :
                navigator(`/farmer/form/${greenhouse_id}/ec-ph/${gap_id}`)
                break;
            case "sensor" :
                navigator(`/farmer/form/${greenhouse_id}/sensor/${gap_id}`)
                break;
            case "report" :
                navigator(`/farmer/form/${greenhouse_id}/r/${gap_id}`)
                break;
            default :
                break;
        }
    } , [gap_id, greenhouse_id, navigator])

    return (
        <section ref={NavBody} className="nav-first">
            <div className="all-menu">
                <div className="head">Menu</div>
                <div className="row">
                    <div onClick={() => selectMenu("gap_data")} className="frame-menu frame-plant">
                        <div className="img">
                            <img src="/plant_glow.jpg"></img>
                        </div>
                        <span>ข้อมูลการปลูก</span>
                        {DotReport.checkEditPlant ? <div className="dot-someting"></div> : <></>}
                    </div>
                    <div onClick={() => selectMenu("fertilizer")} className="frame-menu frame-ferti">
                        <div className="img">
                            <img src="/fertilizer.jpg"></img>
                        </div>
                        <span>ปัจจัยการผลิต</span>
                        {DotReport.checkEditFertilizer ? <div className="dot-someting"></div> : <></>}
                    </div>
                </div>
                <div className="row">
                    <div onClick={() => selectMenu("chemical")} className="frame-menu frame-chemi">
                        <div className="img">
                            <img src="/chemical.jpg"></img>
                        </div>
                        <span>สารเคมีที่ใช้</span>
                        {DotReport.checkEditChemical ? <div className="dot-someting"></div> : <></>}
                    </div>
                    <div onClick={() => selectMenu("success")} className="frame-menu frame-success">
                        <div className="img">
                            <img src="/เก็บ.png"></img>
                        </div>
                        <span>การเก็บเกี่ยว</span>
                        {DotReport[0] ? DotReport[0].success || DotReport[0].form || DotReport[0].plant ? <div className="dot-someting"></div> : <></> : <></>}
                    </div>
                </div>
                <div className="row">
                    <div onClick={() => selectMenu("ec/ph")} className="frame-menu frame-ecph">
                        <div className="img">
                            <img src="/ecph.png" ></img>
                        </div>
                        <span>EC/pH</span>
                        {
                            DotReport.checkEditSoil && <div className="dot-someting"/>
                        }
                    </div>

                    <div onClick={() => selectMenu("sensor")} className="frame-menu frame-sensor">
                        <div className="img">
                            <img src="/เก็บ.png" ></img>
                        </div>
                        <span>เซนเซอร์</span>
                        {
                            DotReport.checkEditSensor && <div className="dot-someting"/>
                        }
                    </div>
                </div>
                <div className="report-farm"
                    onClick={() => selectMenu("report")}
                >
                    <img src="/report.png"></img>
                    {DotReport[0] ? DotReport[0].report ? <div className="dot-someting"></div> : <></> : <></>}
                </div>
            </div>
        </section>
    )
}

export default MenuPlant