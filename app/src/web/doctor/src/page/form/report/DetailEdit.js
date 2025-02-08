import React, { useEffect, useState , useRef, useCallback, useMemo } from "react";
import "../../../assets/style/page/form/DetailEdit.scss"
import { clientMo } from "../../../../../../assets/js/moduleClient";
import { DayJSX, Loading, ReportAction } from "../../../../../../assets/js/module";

const DetailEdit = ({Ref , setRef , id_report}) => {
    const [reportHistorys , setReportHistorys] = useState({
        status : "loading",
        data : new Map()
    })
    const [reportHistory , setReportHistory] = useState({})
    
    const Fetch = useCallback(async () => {
        const result = await clientMo.get(`/api/doctor/form/report/edit/gets?id_report=${id_report}`)
        if(result) {
            const Data = JSON.parse(result)
            switch(Data.status) {
                case 200 :
                    const newHistorys = new Map()
                    Data.data.forEach((report_history , idx) => {
                        if(idx === 0) {
                            setReportHistory(report_history)
                        }
                        newHistorys.set(report_history.id_record_edit , report_history)
                    })
                    setReportHistorys({
                        status : "finish",
                        data : newHistorys
                    })
                    break;
                default:
                    break;
            }
        }
    } , [id_report])

    useEffect(()=>{
        Ref.current.style.opacity = "1"
        Ref.current.style.visibility = "visible"
        Fetch()
    } , [Ref , Fetch])

    const onSelectHistory = useCallback(async (id_record_edit) => {
        setReportHistory(reportHistorys.data.get(id_record_edit))
    } , [reportHistorys])

    const close = () => {
        Ref.current.style.opacity = "0"
        Ref.current.style.visibility = "hidden"
        setTimeout(()=>{
            setRef(<></>)
        }, 500)
    }

    const HeaderSelects = useMemo(() => {
        console.log(reportHistorys.data)
        return Object.entries(reportHistorys.data).map(([ id_record_edit ] , idx) => 
            idx === 0  ?
                <a select="" onClick={()=>onSelectHistory(id_record_edit)} key={id_record_edit}>ล่าสุด</a> :
                <a onClick={()=>onSelectHistory(id_record_edit)} key={id_record_edit}>{idx + 1}</a>
        )
    }, [onSelectHistory , reportHistorys])

    return(
        reportHistorys.status === "loading" ?
            <Loading size={"83.1px"} border={"6.925px"} color="rgb(53 207 187)" animetion={true}/> :
            <section id="detail-edit-popup">
                {
                    reportHistorys.data.size ?
                    <>
                        <div className="menu-edit">
                            <div className="frame-menu">
                                <div className="menu-list">
                                    {HeaderSelects}
                                </div>
                            </div>
                            <div className="close" onClick={close}>
                                <svg viewBox="0 0 45 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M35.8125 8.98335C28.5 1.83335 16.5 1.83335 9.1875 8.98335C1.875 16.1334 1.875 27.8667 9.1875 35.0167C16.5 42.1667 28.3125 42.1667 35.625 35.0167C42.9375 27.8667 43.125 16.1334 35.8125 8.98335ZM27.75 29.7L22.5 24.5667L17.25 29.7L14.625 27.1333L19.875 22L14.625 16.8667L17.25 14.3L22.5 19.4333L27.75 14.3L30.375 16.8667L25.125 22L30.375 27.1333L27.75 29.7Z" fill="#FF0000"/>
                                </svg>
                            </div>
                        </div>
                        {
                            <div className="body-edit">
                                <div className="head-detail-edit">
                                    <div className="row-detail">
                                        <DayJSX DATE={reportHistory.edit_date} TYPE="small" TEXT="วันที่แก้ไข"/>
                                    </div>
                                </div>
                                <div className="detail">
                                    <div className="detail-body">
                                        <div className="body">
                                            <div class="section old-advice">
                                                <div>คำแนะนำ</div>
                                                <div>{reportHistory.report_text}</div>
                                                <div class="image-box">รูปภาพ</div>
                                                <img src={`/doctor/report/${reportHistory.image_path}`} width={"200px"} style={{ aspectRatio : "1/1" }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    </> :
                    <>
                        <div className="close ab" onClick={close}>
                            <svg viewBox="0 0 45 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M35.8125 8.98335C28.5 1.83335 16.5 1.83335 9.1875 8.98335C1.875 16.1334 1.875 27.8667 9.1875 35.0167C16.5 42.1667 28.3125 42.1667 35.625 35.0167C42.9375 27.8667 43.125 16.1334 35.8125 8.98335ZM27.75 29.7L22.5 24.5667L17.25 29.7L14.625 27.1333L19.875 22L14.625 16.8667L17.25 14.3L22.5 19.4333L27.75 14.3L30.375 16.8667L25.125 22L30.375 27.1333L27.75 29.7Z" fill="#FF0000"/>
                            </svg>
                        </div>
                        <div className="not-edit">
                            ไม่พบการแก้ไขข้อมูล
                        </div>
                    </>
                }
            </section>
    )
}

export default DetailEdit