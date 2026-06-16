import React, { createContext, useEffect, useRef, useState } from "react";
import '../assets/style/page/templatePage.scss'
import "../assets/style/page/List.scss"
import ListData from "./ListData";
import { InsertStatisticsProvider } from "./report/statistics/InsertStatistics";
import { clientMo } from "../../../../assets/js/moduleClient";
import UserAccessLogs from "./report/user-access-logs";
import AdminAccessLogs from "./report/admin-access-logs";

export const PageTemplateContext = createContext({
    popupDataManage: {
        open: false,
        type: "",
        metadata: {
            id: ""
        }
    },
    setPopupDataManage: () => ({ open: false, type: "" }),
    ChangeStatus: (status) => { },
    textSearch: "",
    selectedStation: "",
})

const PageTemplate = ({ socket, addHref = false, HrefData, modify, auth, session, TabOn }) => {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState("");

    useEffect(() => {
        const fetchStations = async () => {
            try {
                const response = await clientMo.post("/api/admin/station/list");
                if (response) {
                    const parsed = JSON.parse(response);
                    setStations(parsed.filter(s => s.is_use === 1));
                }
            } catch (err) {
                console.error("Error fetching stations in PageTemplate:", err);
            }
        };
        fetchStations();
    }, []);

    const [StatusPage, setStatus] = useState({
        status: HrefData.get() === "list?default" ? "default" :
            HrefData.get() === "list?delete" ? "delete" :
                HrefData.get() === "list?admin" ? "admin" :
                    HrefData.get() === "list?deleteAdmin" ? "deleteAdmin" :
                        HrefData.get() === "data?plant" ? "plant" :
                            HrefData.get() === "data?station" ? "station" :
                                HrefData.get() === "data?chemical" ? "chemical" :
                                    HrefData.get() === "data?pest" ? "pest" :
                                        HrefData.get() === "group?default" ? "group" :
                                            HrefData.get() === "report?listlocation" ? "listlocation" :
                                                HrefData.get() === "report?graph" ? "graph" :
                                                    HrefData.get() === "report?statistics" ? "statistics" :
                                                        HrefData.get() === "report?user-access-logs" ? "user-access-logs" :
                                                            HrefData.get() === "report?admin-access-logs" ? "admin-access-logs" :
                                                                "",
        changePath: addHref
    })

    const [StateOnPage, setStateOnPage] = useState({
        status: HrefData.get() === "list?default" ? "default" :
            HrefData.get() === "list?delete" ? "delete" :
                HrefData.get() === "list?admin" ? "admin" :
                    HrefData.get() === "list?deleteAdmin" ? "deleteAdmin" :
                        HrefData.get() === "data?plant" ? "plant" :
                            HrefData.get() === "data?station" ? "station" :
                                HrefData.get() === "data?chemical" ? "chemical" :
                                    HrefData.get() === "data?pest" ? "pest" :
                                        HrefData.get() === "group?default" ? "group" :
                                            HrefData.get() === "report?listlocation" ? "listlocation" :
                                                HrefData.get() === "report?graph" ? "graph" :
                                                    HrefData.get() === "report?statistics" ? "statistics" :
                                                        HrefData.get() === "report?user-access-logs" ? "user-access-logs" :
                                                            HrefData.get() === "report?admin-access-logs" ? "admin-access-logs" :
                                                                "",
    })

    const [getTimeOut, setTimeOut] = useState(0)
    const [getTextSearchValue, setTextSearchValue] = useState("")
    const [getTextSearch, setTextSearch] = useState("")
    const [viewMode, setViewMode] = useState("card")

    const [popupDataManage, setPopupDataManage] = useState({
        open: false,
        type: "",
        metadata: {
            id: ""
        }
    })
    const TextSearchRef = useRef()

    useEffect(() => {
        // modify(70 , 30 , 
        //                 ["หน้าแรก"])

        if (HrefData.get().split("=")[1] === "pop") {
            state()
        }

    }, [HrefData.get()])

    useEffect(() => {
        return (() => {
            clearTimeout(getTimeOut)
        })
    }, [getTimeOut])

    useEffect(() => {
        setViewMode("card")
    }, [StateOnPage.status])
    useEffect(() => {
        if (StatusPage.status === "user-access-logs" || StatusPage.status === "admin-access-logs") {
            setStateOnPage({ status: StatusPage.status });
        }
    }, [StatusPage.status]);
    const state = () => {
        const status =
            HrefData.get() === "list?default=pop" ? "default" :
                HrefData.get() === "list?delete=pop" ? "delete" :
                    HrefData.get() === "list?admin=pop" ? "admin" :
                        HrefData.get() === "list?deleteAdmin=pop" ? "deleteAdmin" :
                            HrefData.get() === "data?plant=pop" ? "plant" :
                                HrefData.get() === "data?station=pop" ? "station" :
                                    HrefData.get() === "data?chemical=pop" ? "chemical" :
                                        HrefData.get() === "data?pest=pop" ? "pest" :
                                            HrefData.get() === "group?default=pop" ? "group" :
                                                HrefData.get() === "report?listlocation=pop" ? "listlocation" :
                                                    HrefData.get() === "report?graph=pop" ? "graph" :
                                                        HrefData.get() === "report?statistics=pop" ? "statistics" :
                                                            HrefData.get() === "report?user-access-logs=pop" ? "user-access-logs" :
                                                                "";

        setStatus({
            status,
            changePath: false
        });
    };

    const ChangeStatus = async (statusClick) => {
        if (statusClick !== StatusPage.status) {
            if (auth(true)) {
                setStatus({ status: statusClick, changePath: true })
                HrefData.set(`${HrefData.get().split("?")[0]}?${statusClick}=c`)
                if (TextSearchRef.current) TextSearchRef.current.value = ""
            }
        }
    }



    return (
        <PageTemplateContext.Provider
            value={{
                popupDataManage, setPopupDataManage,
                ChangeStatus: ChangeStatus,
                textSearch: getTextSearch,
                selectedStation,
            }}
        >
            <section className="page-manage">
                <InsertStatisticsProvider>
                    <div className="menu-page">
                        {/* แสดงปุ่มเพิ่มข้อมูล */}
                        {StateOnPage.status !== "env-station" &&
                            ["default", "admin", "plant", "station", "group", "chemical", "pest", "report"].includes(StateOnPage.status) && (
                                <div className="bt-add">
                                    <svg
                                        onClick={() => setPopupDataManage({ open: true, type: "insert" })}
                                        xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32">
                                        <path fill="currentColor" d="M16 2A14.172 14.172 0 0 0 2 16a14.172 14.172 0 0 0 14 14a14.172 14.172 0 0 0 14-14A14.172 14.172 0 0 0 16 2Zm8 15h-7v7h-2v-7H8v-2h7V8h2v7h7Z" />
                                    </svg>
                                </div>
                            )}

                        {/* ปุ่มสลับ card / table */}
                        {["plant", "chemical", "pest", "station"].includes(StateOnPage.status) && (
                            <div className="bt-view-toggle">
                                <a
                                    title={viewMode === "card" ? "แสดงแบบตาราง" : "แสดงแบบการ์ด"}
                                    onClick={() => setViewMode(prev => prev === "card" ? "table" : "card")}
                                >
                                    {viewMode === "card" ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                                        </svg>
                                    )}
                                </a>
                            </div>
                        )}

                        {StatusPage.status !== "group" && StatusPage.status !== "env-station" && (
                            <select
                                className={`dropdown-status ${["default", "delete", "admin", "deleteAdmin"].includes(StatusPage.status)
                                    ? "dropdown-status-default"
                                    : ["plant", "chemical", "pest", "station"].includes(StatusPage.status)
                                        ? "dropdown-status-plant"
                                        : ["listlocation", "graph", "statistics", "user-access-logs", "admin-access-logs"].includes(StatusPage.status)
                                            ? "dropdown-status-location"
                                            : ""
                                    }`}
                                onChange={(e) => ChangeStatus(e.target.value)}
                                value={StatusPage.status}
                            >
                                {["default", "delete", "admin", "deleteAdmin"].includes(StatusPage.status) && (
                                    <>
                                        <option value="default">แสดงบัญชีผู้ส่งเสริมที่ยังไม่ถูกลบ</option>
                                        <option value="delete">แสดงบัญชีผู้ส่งเสริมที่ถูกลบ</option>
                                        <option value="admin">แสดงบัญชีผู้ดูแลระบบที่ยังไม่ถูกลบ</option>
                                        <option value="deleteAdmin">แสดงบัญชีผู้ดูแลระบบที่ถูกลบ</option>
                                    </>
                                )}

                                {["plant", "chemical", "pest", "station"].includes(StatusPage.status) && (
                                    <>
                                        <option value="plant">แสดงรายการชนิดพืช</option>
                                        <option value="chemical">แสดงรายการสารเคมี</option>
                                        <option value="pest">แสดงรายการโรคพืช / ศัตรูพืช</option>
                                        <option value="station">แสดงรายการศูนย์</option>
                                    </>
                                )}

                                {["listlocation", "graph", "statistics", "user-access-logs", "admin-access-logs"].includes(StatusPage.status) && (
                                    <>
                                        <option value="listlocation">แสดงรายชื่อหมอพืชและที่ปรึกษาเกษตรกร</option>
                                        <option value="graph">แสดงจำนวนเกษตรกรและพืชที่เพาะปลูกในพื้นที่</option>
                                        <option value="statistics">แสดงสถิติโรคพืช / ศัตรูพืช</option>
                                        <option value="user-access-logs">แสดงสถิติการเข้าใช้งานระบบ</option>
                                        <option value="admin-access-logs">แสดงสถิติการเข้าใช้งานของผู้ดูแลระบบ</option>
                                    </>
                                )}
                            </select>
                        )
                        }

                        {/* ปุ่มเฉพาะ group */}
                        {StateOnPage.status === "group" && (
                            <button className="bt-group" onClick={() => ChangeStatus("group")}>แสดงรายการจัดกลุ่มข้อมูล</button>
                        )}

                        {/* เลือกศูนย์สำหรับรายงานข้อมูล */}
                        {["listlocation", "graph", "statistics", "user-access-logs", "admin-access-logs"].includes(StateOnPage.status) && (
                            <select
                                className="dropdown-status dropdown-status-location"
                                onChange={(e) => setSelectedStation(e.target.value)}
                                value={selectedStation}
                                style={{ marginLeft: "10px", width: "auto" }}
                            >
                                <option value="">ศูนย์ทั้งหมด</option>
                                {stations.map((station) => (
                                    <option key={station.id} value={station.id}>
                                        {station.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* ค้นหา */}
                        {
                            StatusPage.status !== "env-station" && (
                                <div className="search">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
                                        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                                            <path d="m11.25 11.25l3 3" />
                                            <circle cx="7.5" cy="7.5" r="4.75" />
                                        </g>
                                    </svg>
                                    <input
                                        value={getTextSearchValue}
                                        autoComplete="none"
                                        ref={TextSearchRef}
                                        onChange={(e) => setTextSearchValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                setTextSearch(e.target.value);
                                            }
                                        }}
                                        type="text"
                                        placeholder="Search"
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" onClick={() => {
                                        setTextSearch("");
                                        setTextSearchValue("");
                                        if (TextSearchRef.current) TextSearchRef.current.value = "";
                                    }} width="1em" height="1em" viewBox="0 0 32 32">
                                        <path fill="currentColor" d="M16 2C8.2 2 2 8.2 2 16s6.2 14 14 14s14-6.2 14-14S23.8 2 16 2zm5.4 21L16 17.6L10.6 23L9 21.4l5.4-5.4L9 10.6L10.6 9l5.4 5.4L21.4 9l1.6 1.6l-5.4 5.4l5.4 5.4l-1.6 1.6z" />
                                    </svg>
                                </div>
                            )
                        }
                    </div>

                    {/* รายการแสดงผล */}
                    {
                        StatusPage.status === "user-access-logs" ? (
                            <UserAccessLogs
                                HrefPage={HrefData}
                                status={StatusPage}
                                selectedStation={selectedStation}
                            />
                        ) : StatusPage.status === "admin-access-logs" ? (
                            <AdminAccessLogs
                                HrefPage={HrefData}
                                status={StatusPage}
                            />
                        ) : (
                            <div className="list-manage">
                                <ListData
                                    socket={socket}
                                    status={StatusPage}
                                    auth={auth}
                                    session={session}
                                    TabOn={TabOn}
                                    HrefPage={HrefData}
                                    setStateOnPage={setStateOnPage}
                                    modify={modify}
                                    textSearch={getTextSearch}
                                    viewMode={viewMode}
                                />
                            </div>
                        )
                    }
                </InsertStatisticsProvider>
            </section>
        </PageTemplateContext.Provider>
    )
}

export default PageTemplate