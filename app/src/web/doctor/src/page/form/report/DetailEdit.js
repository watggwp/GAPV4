import React, { useEffect, useState , useRef } from "react";
import "../../assets/style/page/form/DetailEdit.scss"
import { clientMo } from "../../../../../assets/js/moduleClient";
import { DayJSX, Loading, ReportAction } from "../../../../../assets/js/module";

const DetailEdit = ({Ref , setRef}) => {
    const [Data , setData] = useState(null)
    const [HeadEdit , setHead] = useState([])
    const [BodyEdit , setBody] = useState(<></>)
    const [LoadingData , setLoad] = useState(false)
    const UrlFecth = "/api/doctor/form/edit/get"
    
    useEffect(()=>{
        Ref.current.style.opacity = "1"
        Ref.current.style.visibility = "visible"
        Fetch()
    } , [Ref])

    const Fetch = async () => {
        // ดึง id ของการ edit มาก่อน
        // const result = await clientMo.post(UrlFecth , DataFetch)
        // if(result) {
        //     const Data = JSON.parse(result)
        //     setData(Data)
        //     if(Data[0]) SelectHead(Data[0].id_edit)
        // } else session()
    }

    const SelectHead = async (id_table_edit , e) => {
        setLoad(false)
        // เอา id_table_edit ไปดึงข้อมูลการ edit ในครั้งนั้นๆ
        // const result = await clientMo.post(UrlFecth , {...DataFetch , id_edit : id_table_edit})
        const result = "{}"
        if(result) {
            const Data = JSON.parse(result)
            if(e) {
                document.querySelector(".menu-edit .frame-menu a[select='']").removeAttribute("select")
                e.target.setAttribute("select" , "")
            }

            if(Data.head.id_edit) {
                setHead(Data.head)
                setBody(Data.detail)
                setLoad(true)
            } else setLoad(true)
        }
    }

    const close = () => {
        Ref.current.style.opacity = "0"
        Ref.current.style.visibility = "hidden"
        setTimeout(()=>{
            setRef(<></>)
        }, 500)
    }

    return(
        Data === null ?
            <Loading size={"83.1px"} border={"6.925px"} color="rgb(53 207 187)" animetion={true}/> :
            <>
            <section id="detail-edit-popup">
                {
                    Data[0] ?
                    <>
                        <div className="menu-edit">
                            <div className="frame-menu">
                                <div className="menu-list">
                                {
                                    Data.map((val , key)=>
                                        key === 0  ?
                                            <a select="" onClick={(e)=>SelectHead(val.id_edit , e)} key={key}>ล่าสุด</a>
                                        :
                                            <a onClick={(e)=>SelectHead(val.id_edit , e)} key={key}>{key + 1}</a>
                                    )
                                }
                                </div>
                            </div>
                            <div className="close" onClick={close}>
                                <svg viewBox="0 0 45 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M35.8125 8.98335C28.5 1.83335 16.5 1.83335 9.1875 8.98335C1.875 16.1334 1.875 27.8667 9.1875 35.0167C16.5 42.1667 28.3125 42.1667 35.625 35.0167C42.9375 27.8667 43.125 16.1334 35.8125 8.98335ZM27.75 29.7L22.5 24.5667L17.25 29.7L14.625 27.1333L19.875 22L14.625 16.8667L17.25 14.3L22.5 19.4333L27.75 14.3L30.375 16.8667L25.125 22L30.375 27.1333L27.75 29.7Z" fill="#FF0000"/>
                                </svg>
                            </div>
                        </div>
                        {
                            LoadingData ?
                            <div className="body-edit">
                                <div className="head-detail-edit">
                                    <div className="row-detail">
                                        <DayJSX DATE={HeadEdit.date} TYPE="small" TEXT="วันที่แก้ไข"/>
                                    </div>
                                </div>
                                <div className="detail">
                                    <div className="detail-body">
                                        <div className="body">
                                            {/* body */}
                                        </div>
                                    </div>
                                </div>
                            </div> : 
                            <div className="loading-edit">
                                <Loading size={"41.55px"} border={"5.54px"} color="rgb(53 207 187)" animetion={true}/>
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
            </>
    )
}

export default DetailEdit