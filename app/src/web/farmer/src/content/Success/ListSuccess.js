import React, { useState, useEffect, useCallback } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { CloseAccount } from "../../method";
import { DayJSX } from "../../../../../assets/js/module";
import { useGreenhouse } from "..";
import { useParams } from "react-router";

const List = ({ type_page , OpenPopup }) => {
    const { greenhouse_id , gap_id } = useParams()

    const { setCurrentPage } = useGreenhouse()
    const [listData, setListData] = useState([]);
    const [DotSome , setDotSome] = useState([]);

    const FetchData = useCallback(async () => {
        try {
            const result = await clientMo.get(
                `/api/farmer/report/list?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}&type=${type_page}`
            );

            if (await CloseAccount(result, setCurrentPage)) {
                const data = JSON.parse(result);
                console.log("Raw Data:", data);
                data.sort((a, b) => {
                    if (a.date_of_farmer || a.date_of_doctor) {
                        //ใช้ date_of_farmer หรือ date_of_doctor ถ้ามี
                        return new Date(b.date_of_farmer || b.date_of_doctor) - new Date(a.date_of_farmer || a.date_of_doctor);
                    } else {
                        //ถ้าไม่มีให้ใช้ id แทน
                        return b.id - a.id;
                    }
                });
                console.log("Parsed Data:", data);
                setListData(data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    } , [gap_id, greenhouse_id, setCurrentPage, type_page])

    const AcknowledgeData = async (id, type) => {
        console.log("Sending acknowledge request for ID:", id, "Type:", type);
        
        const result = await clientMo.post("/api/farmer/report/acknowledge", {
            id: id,
            type: type
        });
    
        if (await CloseAccount(result, setCurrentPage)) {
            console.log("Acknowledged successfully:", result);
    
            setListData(prevData =>
                prevData.map(item =>
                    item.id === id ? { ...item, acknowledged: 1 } : item
                )
            );
    
            setDotSome(prevDot => {
                if (!prevDot[0]) return prevDot;
    
                let newDot = { ...prevDot[0] };
    
                if (type === "cf" && newDot.form > 0) newDot.form -= 1;
                if (type === "cp" && newDot.plant > 0) newDot.plant -= 1;
    
                return [newDot];
            });
        }
    };
    
    useEffect(() => {
        FetchData();
    }, [FetchData]);

    return (
        <>
            {listData.map((val, key) => (
               <div
               className={`list-in-${type_page} ${
                   (type_page === "h" && val.date_of_farmer) || 
                   (type_page !== "h" && val.acknowledged) 
                       ? "acknowledged-card" 
                       : ""
               }`}
               key={val.id}
           >           
                    {type_page === "h" ? (
                        <>
                            <div className="row first">
                                <div className="type-head">{val.type_success ? "เก็บผลผลิต" : "เก็บผลตัวอย่าง"}</div>
                                <div className="date">
                                    <DayJSX DATE={String(val.date_of_doctor)} TYPE="normal" />
                                </div>
                            </div>
                            <div className="row">
                                <div className="station">
                                    <div className="name-station">{val.name_station}</div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="bt">
                                    <button onClick={(e) => OpenPopup(val.id, val.type_success, val.name_station, e)}>
                                        {val.date_of_farmer ? "แสดงรหัส" : "ยืนยัน"}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : type_page === "cf" ? (
                        <>
                            <div className="row">
                                <div className="in-row column">
                                    <span>ผลตรวจสอบ</span>
                                    <div>{val.status_check ? "ผ่าน" : "ไม่ผ่าน"}</div>
                                </div>
                                <div className="in-row column end frame">
                                    <span>วันที่</span>
                                    <DayJSX DATE={String(val.date_check)} TYPE="small" />
                                </div>
                            </div>
                            {!val.status_check && (
                                <div className="row">
                                    <div className="in-row column">
                                        <span>การแก้ไข</span>
                                        <div>{val.note_text ? val.note_text : "ไม่ระบุ"}</div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : type_page === "cp" ? (
                        <>
                            <div className="row">
                                <div className="in-row column">
                                    <span>ผลวิเคราะห์</span>
                                    <div>
                                        <span>{val.state_check ? "หลัง : " : "ก่อน : "}</span>
                                        {val.status_check}
                                    </div>
                                </div>
                                <div className="in-row column end frame">
                                    <span>วันที่</span>
                                    {val.date_check ? (
                                        <DayJSX DATE={String(val.date_check)} TYPE="small" />
                                    ) : (
                                        <span>ไม่ระบุ</span>
                                    )}
                                </div>
                            </div>
                            <div className="row">
                                <div className="in-row column">
                                    <span>หมายเหตุ</span>
                                    <div>{val.note_text ? val.note_text : "ไม่ระบุ"}</div>
                                </div>
                            </div>
                        </>
                    ) : null}
    
                    {/*Show 'ผู้ตรวจสอบ' ONLY for cf and cp types */}
                    {type_page !== "h" && (
                        <div className="row">
                            <div className="in-row">
                                <span>ผู้ตรวจสอบ</span>
                                <div>{val.name_doctor}</div>
                            </div>
                        </div>
                    )}
    
                    {type_page !== "h" && !val.acknowledged && (
                        <button onClick={() => AcknowledgeData(val.id, type_page)} className="ack-button">
                            รับทราบ
                        </button>
                    )}
                </div>
            ))}
        </>
    );
}    

export default List;
