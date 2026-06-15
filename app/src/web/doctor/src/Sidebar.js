import React, { useContext, useCallback } from "react";
import "./assets/style/Sidebar.scss";
import env from "../../../env";
import { DoctorContext } from "./Doctor";

// Image Assets
import iconDashboard from "../../../assets/img/iconBt/icon-bt-doctor.png";
import iconFarmer from "../../../assets/img/iconBt/icon-bt-farmer.png";
import iconForm from "../../../assets/img/iconBt/icon-bt-form.png";
import iconData from "../../../assets/img/iconBt/icon-bt-data.png";
import iconGroup from "../../../assets/img/iconBt/icon-bt-group.png";
import iconPlan from "../../../assets/img/iconBt/icon-bt-plan.png";
import iconReport from "../../../assets/img/iconBt/icon-bt-report.png";
import iconStation from "../../../assets/img/iconBt/icon-bt-sensor.png";

// Pages
import PageFarmer from "./page/farmer/PageFarmer";
import PageFormPlant from "./page/form/PageFormPlant";
import PageData from "./page/data/PageData";
import WeatherStation from "./page/station";
import { useNavigate } from "react-router";
import { clientMo } from "../../../assets/js/moduleClient";
import DashboardLayout from "./DashboardLayout";

const Sidebar = ({ setMain, socket, setSession, setdoctor, eleImageCover, eleBody, setTextStatus, isCollapsed, toggleSidebar, setTitle }) => {
    const { profile } = useContext(DoctorContext);
    const navigator = useNavigate();

    // Helper to check roles
    const hasRole = (roles) => {
        let allow = false;
        if (roles.includes('doctor') && profile?.doctor_role) allow = true;
        if (roles.includes('consultant') && profile?.consultant_role) allow = true;
        if (roles.includes('analyzer') && (profile?.analyzer_role || profile?.analyst_role)) allow = true;
        if (roles.includes('protection') && profile?.protection_role) allow = true;
        return allow;
    };

    const logout = () => {
        clientMo.LoadingPage();
        setTimeout(() => {
            clientMo.get('/api/logout')
                .then(() => {
                    setSession(true);
                    clientMo.unLoadingPage();
                })
                .catch(() => {
                    setSession(true);
                    clientMo.unLoadingPage();
                });
        }, 2000);
    };

    // --- Navigation Functions (from NavFirst.js) ---

    const dashboard = () => {
        setTitle("Dashboard");
        navigator("/doctor");
        setdoctor(
            <DashboardLayout
                setMain={setMain}
                socket={socket}
                setSession={setSession}
            />
        );
    };

    const farmer = async () => {
        const context = await clientMo.post('/api/doctor/check');
        if (context) {
            setTitle("ทะเบียนเกษตรกร");
            navigator("/doctor");
            setdoctor(<PageFarmer setMain={setMain}
                socket={socket} LoadType={"ap"} session={setSession} type={1}
                eleImageCover={eleImageCover} eleBody={eleBody} setTextStatus={setTextStatus} />);
        } else setSession();
    }

    const form = async () => {
        const context = await clientMo.post('/api/doctor/check');
        if (context) {
            setTitle("แบบบันทึกการปลูก");
            navigator("/doctor");
            setdoctor(<PageFormPlant setMain={setMain}
                socket={socket} LoadType={"ap"} session={setSession} type={true}
                eleImageCover={eleImageCover} eleBody={eleBody} setTextStatus={setTextStatus} />);
        } else setSession();
    }

    const data = async () => {
        const context = await clientMo.post('/api/doctor/check');
        if (context) {
            setTitle("เพิ่มเติมข้อมูล");
            navigator("/doctor");
            setdoctor(<PageData setMain={setMain}
                socket={socket} LoadType={"plant"} session={setSession} type={true}
                eleImageCover={eleImageCover} eleBody={eleBody} setTextStatus={setTextStatus} />);
        } else setSession();
    }

    const group = async () => {
        const context = await clientMo.post('/api/doctor/check');
        if (context) {
            setTitle("จัดกลุ่มข้อมูล");
            navigator("/doctor");
            setdoctor(<PageData setMain={setMain}
                socket={socket} LoadType={"group"} session={setSession} type={true}
                eleImageCover={eleImageCover} eleBody={eleBody} setTextStatus={setTextStatus} />);
        } else setSession();
    }

    const schedules = useCallback(async () => {
        const context = await clientMo.post('/api/doctor/check');
        if (context) {
            setTitle("แผนการปลูก");
            navigator("/doctor/schedules");
        } else setSession();
    }, [navigator, setSession, setTitle]);

    const report = async () => {
        const context = await clientMo.post('/api/doctor/check');
        if (context) {
            setTitle("รายงานข้อมูล");
            navigator("/doctor");
            setdoctor(<PageData setMain={setMain}
                socket={socket} LoadType={"report"} session={setSession} type={true}
                eleImageCover={eleImageCover} eleBody={eleBody} setTextStatus={setTextStatus} />);
        } else setSession();
    }

    const station = useCallback(async () => {
        const context = await clientMo.post('/api/doctor/check');
        if (context) {
            setTitle("ข้อมูลสภาพแวดล้อม");
            navigator("/doctor");
            setdoctor(<WeatherStation />);
        } else setSession();
    }, [setSession, setdoctor, setTitle, navigator]);

    const getBrandName = () => {
        if (profile?.doctor_role) return "หมอพืช";
        if (profile?.protection_role) return "อารักขาพืช";
        if (profile?.consultant_role) return "ที่ปรึกษา";
        if (profile?.analyzer_role || profile?.analyst_role) return "นักวิเคราะห์";
        return "หมอพืช";
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={`${env.subpath_server}/logo2.png`} alt="Logo" className="logo" />
                    <span className="brand-name">{getBrandName()}</span>
                </div>
                <button className="toggle-btn" onClick={toggleSidebar}>
                    {isCollapsed ? '☰' : '✖'}
                </button>
            </div>

            <ul className="sidebar-menu">
                <li className="menu-item" onClick={dashboard}>
                    <a onClick={(e) => e.preventDefault()}>
                        <div className="icon-container-img">
                            <img src={iconDashboard} alt="Dashboard" />
                        </div>
                        <span>Dashboard</span>
                    </a>
                </li>

                {hasRole(['doctor', 'consultant', 'analyzer']) && (
                    <li className="menu-item" onClick={farmer}>
                        <a onClick={(e) => e.preventDefault()}>
                            <div className="icon-container-img">
                                <img src={iconFarmer} alt="Farmer" />
                            </div>
                            <span>ทะเบียนเกษตรกร</span>
                        </a>
                    </li>
                )}

                {hasRole(['doctor', 'consultant', 'analyzer']) && (
                    <li className="menu-item" onClick={form}>
                        <a onClick={(e) => e.preventDefault()}>
                            <div className="icon-container-img">
                                <img src={iconForm} alt="Form" />
                            </div>
                            <span>แบบบันทึกการปลูก</span>
                        </a>
                    </li>
                )}

                {/* Additional Info */}
                {hasRole(['doctor', 'protection']) && (
                    <li className="menu-item" onClick={data}>
                        <a onClick={(e) => e.preventDefault()}>
                            <div className="icon-container-img">
                                <img src={iconData} alt="Data" />
                            </div>
                            <span>เพิ่มเติมข้อมูล</span>
                        </a>
                    </li>
                )}

                {/* Grouping */}
                {hasRole(['doctor', 'protection']) && (
                    <li className="menu-item" onClick={group}>
                        <a onClick={(e) => e.preventDefault()}>
                            <div className="icon-container-img">
                                <img src={iconGroup} alt="Group" />
                            </div>
                            <span>จัดกลุ่มข้อมูล</span>
                        </a>
                    </li>
                )}

                {/* Plan */}
                {hasRole(['doctor']) && (
                    <li className="menu-item" onClick={schedules}>
                        <a onClick={(e) => e.preventDefault()}>
                            <div className="icon-container-img">
                                <img src={iconPlan} alt="Plan" />
                            </div>
                            <span>แผนการปลูก</span>
                        </a>
                    </li>
                )}

                {/* Report */}
                {hasRole(['doctor', 'consultant', 'protection']) && (
                    <li className="menu-item" onClick={report}>
                        <a onClick={(e) => e.preventDefault()}>
                            <div className="icon-container-img">
                                <img src={iconReport} alt="Report" />
                            </div>
                            <span>รายงานข้อมูล</span>
                        </a>
                    </li>
                )}

                {/* Environment */}
                {hasRole(['doctor', 'consultant', 'protection']) && (
                    <li className="menu-item" onClick={station}>
                        <a onClick={(e) => e.preventDefault()}>
                            <div className="icon-container-img">
                                <img src={iconStation} alt="Station" />
                            </div>
                            <span>ข้อมูลสภาพแวดล้อม</span>
                        </a>
                    </li>
                )}

            </ul>


        </div>
    );
};

export default Sidebar;
