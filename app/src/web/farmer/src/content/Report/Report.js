import React, { useCallback, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { CloseAccount } from "../../method";
import "./Report.scss";
import { DayJSX } from "../../../../../assets/js/module";
import { useNavigate, useParams } from "react-router";
import { useGreenhouse } from "..";

const Report = () => {

    const { greenhouse_id , gap_id } = useParams()
    const navigator = useNavigate()
    
    //สร้าง DotSome ที่นี่
    const [DotSome, setDotSome] = useState([]);

    useEffect(() => {
        clientMo.unLoadingPage();
    }, []);

    const ReturnPage = useCallback(async () => {
        navigator(`/farmer/form/${greenhouse_id}/${gap_id}/p`)
    } , [gap_id, greenhouse_id, navigator])

    return (
        <>
            <div className="body-report">
                <div className="head">
                    <div className="return" onClick={ReturnPage}>
                        <svg fill="#000000" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                            <g fillRule="evenodd">
                                <path d="M1052 92.168 959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z" />
                                <path d="M1920 92.168 1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z" />
                            </g>
                        </svg>
                    </div>
                    <span>ข้อแนะนำ</span>
                </div>
                <div className="content-report">
                    <div className="list-report">
                        {/*ส่ง `setDotSome` ให้ `List` */}
                        <List setDotSome={setDotSome} />
                    </div>
                </div>
            </div>
        </>
    );
};

const List = ({ setDotSome }) => {

    const { greenhouse_id , gap_id } = useParams()
    const { setCurrentPage } = useGreenhouse()

    const [listData, setListData] = useState([]);

    const FetchData = useCallback(async () => {
        try {
            const timestamp = new Date().getTime(); // ป้องกันแคช
            const result = await clientMo.get(
                `/api/farmer/report/list?id_farmhouse=${greenhouse_id}&id_plant=${gap_id}&type=r&_=${timestamp}`
            );

            if (await CloseAccount(result, setCurrentPage)) {
                const data = JSON.parse(result);
                data.sort((a, b) => new Date(b.date_report) - new Date(a.date_report));
                console.log("Updated Data After Fetch:", data); // ตรวจสอบข้อมูลใหม่
                setListData(data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    } , [greenhouse_id, gap_id, setCurrentPage])

    const AcknowledgeData = async (id) => {
        try {
            const result = await clientMo.post("/api/farmer/report/acknowledge", { id, type: "report" });

            if (await CloseAccount(result, setCurrentPage)) {
                console.log("Acknowledged successfully, fetching new data...");

                //ดึงข้อมูลใหม่จาก API
                await FetchData();

                //อัปเดต `DotSome` หลังจากรับทราบ
                setDotSome(prevDot => {
                    if (!prevDot || prevDot.length === 0) return prevDot; // ป้องกัน undefined
                    let newDot = { ...prevDot[0] };
                    if (newDot.report > 0) newDot.report -= 1;
                    return [newDot];
                });
            }
        } catch (error) {
            console.error("Error acknowledging report:", error);
        }
    };

    useEffect(() => {
        FetchData();
    }, [FetchData]);

    return (
        <>
            {listData.map((val, key) => (
                <div className={`list-in-report ${val.is_read ? "acknowledged-card" : ""}`} key={val.id}>
                    <div className="row">
                        <div className="in-row">
                            <span>ครั้งที่</span>
                            <div>{key + 1}</div>
                        </div>
                        <div className="in-row column end frame">
                            <span>วันที่</span>
                            <DayJSX DATE={val.date_report} TYPE="small" />
                        </div>
                    </div>
                    <div className="row">
                        <div className="in-row column">
                            <span>ข้อแนะนำ</span>
                            <div>{val.report_text}</div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="in-row">
                            <span>
                                {val.doctor_role === 1 ? "หมอพืช" : val.consultant_role === 1 ? "ที่ปรึกษาเกษตรกร" : "ผู้ส่งเสริม"}
                            </span>
                            <div>{val.name_doctor}</div>
                        </div>
                    </div>
                    {val.image_path ? (
                        <div className="row">
                            <div className="frame-image">
                                <img className="image-report" src={`/doctor/report/${val.image_path}`} alt="Report" />
                            </div>
                        </div>
                    ) : null}
                    {/* ปุ่มรับทราบ */}
                    {!val.is_read && (
                        <button onClick={() => AcknowledgeData(val.id)} className="ack-button">
                            รับทราบ
                        </button>
                    )}
                </div>
            ))}
        </>
    );
};

export default Report;
