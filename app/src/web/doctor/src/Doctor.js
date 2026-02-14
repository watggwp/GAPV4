import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { clientMo } from "../../../assets/js/moduleClient";
import Login from "./Login";

import "./assets/style/doctorMain.scss"

import SessionOut from "./sesionOut";
import PageFormPlant from "./page/form/PageFormPlant";
import PageFarmer from "./page/farmer/PageFarmer";
import PageData from "./page/data/PageData";
import { BrowserRouter, Route, Routes } from "react-router";
import ScheduleIndex from "./page/schedule";
import SchedulesPlan from "./page/schedule/schedules";
import SchedulePlants from "./page/schedule/schedulePlants";
import env from "../../../env";

// New Component Imports
import Sidebar from "./Sidebar";
import DashboardLayout from "./DashboardLayout";
import DoctorHeader from "./DoctorHeader";
import WeatherStation from "./page/station"; // Assume this is needed as it was used in Sidebar

export const DoctorContext = createContext({
    profile: {},
    bannerCoverRef: { current: "" },
    contentRef: { current: "" },
    onSession: () => { },
    setTextPage: () => { }
})

export function useDoctor() {
    return useContext(DoctorContext)
}

const Doctor = ({ setMain, socket, isClick = 0, username, password }) => {
    const [body, setBody] = useState(<div></div>)
    const [session, setSession] = useState(<div></div>)
    const [TextPage, setTextPage] = useState([])

    const [getProfile, setProfile] = useState([])

    // Sidebar Collapse State - Default state depends on screen size
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);

    // Page Title State
    const [pageTitle, setPageTitle] = useState("Dashboard");

    const ImageCover = useRef()
    const frameImage = useRef()
    const BodyRef = useRef()

    const [Responsive, setResponsive] = useState(window.innerWidth)
    const [SizeProfileImg, setSizeProfileImg] = useState(0)

    useEffect(() => {
        if (isClick === 1) window.history.replaceState({}, "", "/doctor")

        // Listener to handle auto-collapse on resize
        const handleResize = () => {
            setResponsive(window.innerWidth);
            if (window.innerWidth <= 768) {
                setSidebarCollapsed(true);
            }
        };

        FetchProfile()
        ChkPath(null, "web")
        window.addEventListener("popstate", ChkPath)
        window.addEventListener("resize", handleResize)
        socket.emit("connect-account", username, password)

        return () => {
            socket.emit("disconnect-account", username, password)
            window.removeEventListener("popstate", ChkPath)
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    const FetchProfile = async () => {
        const result = await clientMo.get("/api/doctor/profile/get")
        if (result) {
            console.log(result)
            setProfile(JSON.parse(result))
        }
        else setSession()
    }

    const ChkPath = async (e, type = "pop") => {
        const context = await clientMo.post('/api/doctor/check')
        if (context) {
            const path = window.location.pathname.replace("/uat", "").split("/").filter(val => val)
            console.log(path)
            if (path.length === 1 && path[0] === "doctor") {
                setBody(<DashboardLayout setMain={setMain} setdoctor={setBody} setSession={sessionoff} socket={socket} />);
                setPageTitle("Dashboard");
            }
            else if (path.length >= 2 && path[0] === "doctor") {
                if (path[1] === "form") {
                    setBody(<PageFormPlant setMain={setMain} socket={socket} setBodyDoctor={setBody} session={sessionoff} LoadType={`ap:${type}`} eleImageCover={ImageCover} eleBody={BodyRef} setTextStatus={setTextPage} />);
                    setPageTitle("แบบบันทึกการปลูก");
                } else if (path[1] === "farmer") {
                    setPageTitle("ทะเบียนเกษตรกร");
                    if (path[2] === "ap") {
                        setBody(<PageFarmer setMain={setMain} socket={socket} session={sessionoff} LoadType={`ap:${type}`} eleImageCover={ImageCover} eleBody={BodyRef} setTextStatus={setTextPage} />)
                    }
                    else if (path[2] === "wt") {
                        setBody(<PageFarmer setMain={setMain} socket={socket} session={sessionoff} LoadType={`wt:${type}`} eleImageCover={ImageCover} eleBody={BodyRef} setTextStatus={setTextPage} />)
                    }
                    else if (path[2] === "not") {
                        setBody(<PageFarmer setMain={setMain} socket={socket} session={sessionoff} LoadType={`not:${type}`} eleImageCover={ImageCover} eleBody={BodyRef} setTextStatus={setTextPage} />)
                    }

                } else if (path[1] === "data") {
                    // Logic to set title for 'data' routes if needed
                    setPageTitle("ข้อมูล");

                    const search = window.location.search.replaceAll("?", "").split("&").map(val => {
                        const Split = val.split("=")
                        return (Split[0] === "type") ? Split[1] : ""
                    })
                    setBody(<PageData setMain={setMain} socket={socket} setBodyDoctor={setBody} session={sessionoff} LoadType={`${search[0]}:${type}:${new Date().getTime()}`} eleImageCover={ImageCover} eleBody={BodyRef} setTextStatus={setTextPage} />)
                } else if (path[1] === "schedules") {
                    setPageTitle("แผนการปลูก");
                }
            } else {
                setBody(<div>เกิดปัญหา</div>)
            }
        }
        else sessionoff()
    }

    const sessionoff = useCallback((type = false) => {
        if (type) {
            setMain(<Login setMain={setMain} socket={socket} isClick={1} />)
        } else {
            setSession(<SessionOut />)
            document.getElementById('session').setAttribute('show', '')
        }
    }, [setMain, socket])

    const Resize = () => {
        const size = window.innerWidth
        setResponsive(size)
        // if(size <= 800 && frameImage.current) setSizeProfileImg(frameImage.current.clientWidth * 43 / 100)
    }

    return (
        <DoctorContext.Provider
            value={{
                profile: getProfile,
                bannerCoverRef: ImageCover,
                contentRef: BodyRef,
                onSession: sessionoff,
                setTextPage
            }}
        >
            <BrowserRouter basename={env.subpath_server}>
                <div className="doctor" style={{ flexDirection: 'row', overflow: 'hidden' }}>
                    <Sidebar
                        setMain={setMain}
                        socket={socket}
                        setSession={sessionoff}
                        setdoctor={setBody}
                        eleImageCover={ImageCover}
                        eleBody={BodyRef}
                        setTextStatus={setTextPage}
                        isCollapsed={isSidebarCollapsed}
                        toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        setTitle={setPageTitle}
                    />

                    <div className="main-content-wrapper" style={{
                        flexGrow: 1,
                        height: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'margin-left 0.3s ease'
                    }}>

                        <DoctorHeader
                            setMain={setMain}
                            socket={socket}
                            setSession={sessionoff}
                            isSidebarCollapsed={isSidebarCollapsed}
                            pageTitle={pageTitle}
                            toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        />

                        <section ref={BodyRef} className="container-body-doctor" style={{
                            flexGrow: 1,
                            padding: '20px', // Add some padding around the content
                            overflowY: 'auto'
                        }}>
                            <Routes>
                                <Route path="/doctor/schedules" element={<ScheduleIndex />}>
                                    <Route index element={<SchedulesPlan />} />
                                    <Route path=":plant_id" element={<SchedulePlants />} />
                                </Route>
                                <Route path="*" element={body} />
                            </Routes>
                        </section>
                    </div>

                    {/* feedBack */}
                    <section id="session">
                        {session}
                    </section>

                    {/* Dummy element for legacy ImageCover ref compatibility */}
                    <div ref={ImageCover} style={{ display: 'none' }}></div>
                </div>
            </BrowserRouter>
        </DoctorContext.Provider>
    )
}

export default Doctor