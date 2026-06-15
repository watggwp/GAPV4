import React, { useContext, useCallback } from "react";
import "./assets/style/AdminSidebar.scss"; // We will create this or use Doctor's style
import env from "../../../env";
import { AdminContext } from "./Admin";

// Image Assets
import iconDashboard from "../../../assets/img/iconBt/icon-bt-doctor.png";
import iconFarmer from "../../../assets/img/iconBt/icon-bt-farmer.png"; // For ทะเบียนเจ้าหน้าที่
import iconData from "../../../assets/img/iconBt/icon-bt-data.png"; // For เพิ่มเติมข้อมูล
import iconGroup from "../../../assets/img/iconBt/icon-bt-group.png"; // For จัดกลุ่มข้อมูล
import iconPlan from "../../../assets/img/iconBt/icon-bt-plan.png"; // For แผนการปลูก
import iconReport from "../../../assets/img/iconBt/icon-bt-report.png"; // For รายงานข้อมูล
import iconStation from "../../../assets/img/iconBt/icon-bt-sensor.png"; // For สภาพอากาศ
import iconForm from "../../../assets/img/iconBt/icon-bt-form.png"; // For แบบบันทึกการปลูก

import { useNavigate } from "react-router";
import { clientMo } from "../../../assets/js/moduleClient";

// Import components used for navigation
import PageTemplate from "./page/PageTemplate";
import AdminDashboardLayout from "./AdminDashboardLayout";
import PageFormPlantAdmin from "./page/form/PageFormPlantAdmin";

const AdminSidebar = ({ setBodyFileAdmin, socket, setSession, auth, TabOn, HrefData, modifyMainPage, isCollapsed, toggleSidebar, setTitle }) => {
    const { profile } = useContext(AdminContext);
    const navigator = useNavigate();


    // --- Navigation Functions ---

    const dashboard = async () => {
        setTitle("Dashboard");
        if (await auth(true)) {
            HrefData.set("HOME");
            modifyMainPage(50, 50, []);
            navigator("/admin");
            setBodyFileAdmin(
                <AdminDashboardLayout
                    setBodyFileAdmin={setBodyFileAdmin}
                    auth={auth}
                    session={setSession}
                    socket={socket}
                    modify={modifyMainPage}
                    type={1}
                    TabOn={TabOn}
                    HrefData={HrefData}
                />
            );
        } else setSession();
    };

    const doctor = async () => {
        setTitle("ทะเบียนเจ้าหน้าที่");
        if (await auth(true)) {
            HrefData.set("list?default");
            navigator("/admin/list?default");
            setBodyFileAdmin(<PageTemplate key="list" session={setSession} socket={socket} auth={auth} addHref={true} modify={modifyMainPage} TabOn={TabOn} HrefData={HrefData} />);
        } else setSession();
    };

    const data = async () => {
        setTitle("เพิ่มเติมข้อมูล");
        if (await auth(true)) {
            HrefData.set("data?plant");
            navigator("/admin/data?plant");
            setBodyFileAdmin(<PageTemplate key="data" session={setSession} socket={socket} auth={auth} addHref={true} modify={modifyMainPage} TabOn={TabOn} HrefData={HrefData} />);
        } else setSession();
    };

    const group = async () => {
        setTitle("จัดกลุ่มข้อมูล");
        if (await auth(true)) {
            HrefData.set("group?default");
            navigator("/admin/group?default");
            setBodyFileAdmin(<PageTemplate key="group" session={setSession} socket={socket} auth={auth} addHref={true} modify={modifyMainPage} TabOn={TabOn} HrefData={HrefData} />);
        } else setSession();
    };

    const plan = useCallback(async () => {
        setTitle("แผนการปลูก");
        if (await auth(true)) {
            navigator("/admin/schedules");
        } else setSession();
    }, [auth, navigator, setSession, setTitle]);

    const weather = useCallback(async () => {
        setTitle("ข้อมูลสภาพแวดล้อม");
        if (await auth(true)) {
            navigator("/admin/weather-station");
        } else setSession();
    }, [auth, navigator, setSession, setTitle]);

    const formPlant = async () => {
        setTitle("แบบบันทึกการปลูก");
        if (await auth(true)) {
            navigator("/admin/form-plant");
            setBodyFileAdmin(
                <PageFormPlantAdmin
                    setMain={setBodyFileAdmin}
                    session={setSession}
                    socket={socket}
                    type={true}
                />
            );
        } else setSession();
    };

    const report = async () => {
        setTitle("รายงานข้อมูล");
        if (await auth(true)) {
            HrefData.set("report?listlocation");
            navigator("/admin/report?listlocation");
            setBodyFileAdmin(<PageTemplate key="report" session={setSession} socket={socket} auth={auth} addHref={true} modify={modifyMainPage} TabOn={TabOn} HrefData={HrefData} />);
        } else setSession();
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {isCollapsed ? (
                    <button className="toggle-btn" onClick={toggleSidebar}>
                        ☰
                    </button>
                ) : (
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        onClick={toggleSidebar}
                        className="brand-container"
                    >
                        <img src={`${env.subpath_server}/logo2.png`} alt="Logo" className="logo" />
                        <span className="brand-name">ผู้ดูแลระบบ</span>
                    </div>
                )}
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

                <li className="menu-item" onClick={doctor}>
                    <a onClick={(e) => e.preventDefault()}>
                        <div className="icon-container-img">
                            <img src={iconFarmer} alt="Doctor" />
                        </div>
                        <span>ทะเบียนเจ้าหน้าที่</span>
                    </a>
                </li>

                <li className="menu-item" onClick={formPlant}>
                    <a onClick={(e) => e.preventDefault()}>
                        <div className="icon-container-img">
                            <img src={iconForm} alt="Form" />
                        </div>
                        <span>แบบบันทึกการปลูก</span>
                    </a>
                </li>

                <li className="menu-item" onClick={data}>
                    <a onClick={(e) => e.preventDefault()}>
                        <div className="icon-container-img">
                            <img src={iconData} alt="Data" />
                        </div>
                        <span>เพิ่มเติมข้อมูล</span>
                    </a>
                </li>

                <li className="menu-item" onClick={group}>
                    <a onClick={(e) => e.preventDefault()}>
                        <div className="icon-container-img">
                            <img src={iconGroup} alt="Group" />
                        </div>
                        <span>จัดกลุ่มข้อมูล</span>
                    </a>
                </li>

                <li className="menu-item" onClick={plan}>
                    <a onClick={(e) => e.preventDefault()}>
                        <div className="icon-container-img">
                            <img src={iconPlan} alt="Plan" />
                        </div>
                        <span>แผนการปลูก</span>
                    </a>
                </li>

                <li className="menu-item" onClick={weather}>
                    <a onClick={(e) => e.preventDefault()}>
                        <div className="icon-container-img">
                            <img src={iconStation} alt="Station" />
                        </div>
                        <span>สภาพอากาศ</span>
                    </a>
                </li>

                <li className="menu-item" onClick={report}>
                    <a onClick={(e) => e.preventDefault()}>
                        <div className="icon-container-img">
                            <img src={iconReport} alt="Report" />
                        </div>
                        <span>รายงานข้อมูล</span>
                    </a>
                </li>

            </ul>

        </div>
    );
};

export default AdminSidebar;
