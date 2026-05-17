import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { HrefData, TabLoad } from "../../../assets/js/module";
import { clientMo } from "../../../assets/js/moduleClient";
import "./assets/style/adminMain.scss";
import Login from "./Login";
import AdminDashboardLayout from "./AdminDashboardLayout";
import PageTemplate from "./page/PageTemplate";
import SessionOut from "./sesionOut";
import { BrowserRouter, Route, Routes } from "react-router";
import ScheduleIndex from "./page/schedule";
import SchedulesPlan from "./page/schedule/schedules";
import SchedulePlants from "./page/schedule/schedulePlants";
import env from "../../../env";
import WeatherStation from "./page/station";

// New Components
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export const AdminContext = React.createContext({
    TabOn: undefined,
    titlePageNested: (heigthBody, heightCover, ArrtextPage = []) => { },
    profile: {}
})

const Admin = ({ setBodyFileMain, socket, username, password }) => {
    const [body, setBody] = useState(<div></div>);
    const [session, setSession] = useState(<div></div>);
    const [TextPage, setTextPage] = useState([]);
    const [getProfile, setProfile] = useState([]);
    const [Responsive, setResponsive] = useState(window.innerWidth);
    
    // Sidebar Collapse State
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
    // Page Title State
    const [pageTitle, setPageTitle] = useState("Dashboard");

    const ImageCover = useRef();
    const BodyRef = useRef();
    const Tabbar = useRef();
    const sessionRef = useRef();

    const { current: TabOn } = useRef(new TabLoad(Tabbar));
    const Href = new HrefData("HOME");

    const FetchProfile = useCallback(async () => {
        try {
            const result = await clientMo.get("/api/admin/profile/get");

            if (result) {
                setProfile(JSON.parse(result));
            } else {
                console.log("No result, setting session.");
                setSession();
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    }, [])

    const sessionoff = useCallback((type = false) => {
        if (type) {
            setBodyFileMain(<Login setBodyFileMain={setBodyFileMain} socket={socket} />);
        } else {
            setSession(<SessionOut setBodyFileMain={setBodyFileMain} sessionEle={sessionRef} />);
        }
    }, [setBodyFileMain, socket])

    const Auth = useCallback(async (tebLoadOn = false) => {
        if (tebLoadOn) TabOn.start();
        const result = await clientMo.post('/api/admin/check');
        if (result) return true;
        else sessionoff();
    }, [TabOn, sessionoff])

    const modifyMainPage = useCallback((heigthBody, heightCover, ArrtextPage = []) => {
        setTextPage(ArrtextPage.filter(val => val !== ""));
        if (ImageCover.current) ImageCover.current.style.height = `${heightCover}%`;
        // Removed dynamic height on BodyRef to allow flex-grow to stretch it without bounds
        // if (BodyRef.current) BodyRef.current.style.height = `${heigthBody}%`;
    }, [])

    const method = useCallback((e) => {
        const path = window.location.pathname.replace("/uat", "").split("/").filter(val => val);
        const type = e ? "=pop" : '';
        if (path.length === 1 && path[0] === "admin") {
            setPageTitle("Dashboard");
            setBody(
                <AdminDashboardLayout
                    session={sessionoff}
                    setBodyFileAdmin={setBody}
                    auth={Auth}
                    socket={socket}
                    modify={modifyMainPage}
                    TabOn={TabOn}
                    HrefData={Href}
                />
            );
        } else if (path.length >= 2 && path[0] === "admin") {
            let seconPath = path[1].split("?");
            let query = seconPath[1] || "";

            if (seconPath[0] === "schedules") {
                setPageTitle("แผนการปลูก");
                TabOn.addTimeOut(TabOn.end());
                return
            }

            if (seconPath[0] === "list") {
                setPageTitle("ทะเบียนเจ้าหน้าที่");
                if (query === "default") {
                    Href.set(`list?default${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                } else if (query === "delete") {
                    Href.set(`list?delete${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                } else if (query === "admin") {
                    Href.set(`list?admin${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                }
                else if (query === "deleteAdmin") {
                    Href.set(`list?deleteAdmin${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                }
            } else if (seconPath[0] === "data") {
                setPageTitle("เพิ่มเติมข้อมูล");
                if (query === "plant") {
                    Href.set(`data?plant${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                } else if (query === "station") {
                    Href.set(`data?station${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                } else if (query === "chemical") {
                    Href.set(`data?chemical${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                } else if (query === "pest") {
                    Href.set(`data?pest${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                }
            } else if (seconPath[0] === "report") {
                setPageTitle("รายงานข้อมูล");
                if (query === "statistics") {
                    Href.set(`report?statistics${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                } else if (query === "listlocation") {
                    Href.set(`report?listlocation${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                } else if (query.indexOf("graph") === 0) {
                    Href.set(`report?graph${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                } else if (query.indexOf("user-access-logs") === 0) {
                    Href.set(`report?user-access-logs${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                } else if (query.indexOf("admin-access-logs") === 0) {
                    Href.set(`report?admin-access-logs${type}`);
                    setBody(
                        <PageTemplate
                            session={sessionoff}
                            TabOn={TabOn}
                            socket={socket}
                            modify={modifyMainPage}
                            auth={Auth}
                            HrefData={Href}
                        />
                    );
                }
            } else if (query.indexOf("group") === 0) {
                setPageTitle("จัดกลุ่มข้อมูล");
                Href.set(`group?default${type}`);
                setBody(
                    <PageTemplate
                        session={sessionoff}
                        TabOn={TabOn}
                        socket={socket}
                        modify={modifyMainPage}
                        auth={Auth}
                        HrefData={Href}
                    />
                );

            }
        } else {
            setPageTitle("Dashboard");
            setBody(
                <AdminDashboardLayout
                    session={sessionoff}
                    setBodyFileAdmin={setBody}
                    auth={Auth}
                    socket={socket}
                    modify={modifyMainPage}
                    TabOn={TabOn}
                    HrefData={Href}
                />
            );
        }
    }, [Auth, Href, TabOn, modifyMainPage, sessionoff, socket])

    const ChkPath = useCallback(async (e) => {
        if (await Auth(true)) method(e);
    }, [Auth, method])

    const Resize = useCallback(() => {
        setResponsive(window.innerWidth);
        if (window.innerWidth <= 768) {
            setSidebarCollapsed(true);
        }
    }, [])

    useEffect(() => {
        FetchProfile();
        ChkPath(null, "web")

        window.addEventListener("popstate", ChkPath);
        window.addEventListener("resize", Resize);
        socket.emit("connect-account", username, password);

        return () => {
            socket.emit("disconnect-account", username, password);
            window.removeEventListener("popstate", ChkPath);
            window.removeEventListener("resize", Resize);
        };
    }, []);

    return (
        <AdminContext.Provider
            value={{
                TabOn: TabOn,
                titlePageNested: modifyMainPage,
                profile: getProfile
            }}
        >
            <BrowserRouter basename={env.subpath_server}>
                <div
                    onLoad={clientMo.unLoadingPage}
                    className="admin"
                    style={{ flexDirection: 'row', overflow: 'hidden', display: 'flex', width: '100%', height: '100vh' }}
                >
                    <AdminSidebar
                        setBodyFileAdmin={setBody}
                        socket={socket}
                        setSession={sessionoff}
                        auth={Auth}
                        TabOn={TabOn}
                        HrefData={Href}
                        modifyMainPage={modifyMainPage}
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

                        <AdminHeader
                            setSession={sessionoff}
                            isSidebarCollapsed={isSidebarCollapsed}
                            pageTitle={pageTitle}
                            toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        />

                        <section ref={BodyRef} className="container-body-admin" style={{
                            flexGrow: 1,
                            padding: '0',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            justifyContent: 'flex-start'
                        }}>
                            <bot-main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'stretch', justifyContent: 'flex-start' }}>
                                <bot-content style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'stretch', justifyContent: 'flex-start' }}>
                                    <Routes>
                                        <Route path="/admin/schedules" element={<ScheduleIndex />}>
                                            <Route index element={<SchedulesPlan />} />
                                            <Route path=":station_id" element={<SchedulesPlan />} />
                                            <Route path=":station_id/:plant_id" element={<SchedulePlants />} />
                                        </Route>
                                        <Route path="/admin/station" element={<WeatherStation />}>
                                        </Route>
                                        <Route path="/admin/weather-station" element={
                                            <></>
                                        }>
                                        </Route>
                                        <Route path="*" element={body} />
                                    </Routes>
                                </bot-content>
                            </bot-main>
                        </section>
                    </div>

                    <div className="status-loadPage" style={{ display: 'none' }}>
                        <div ref={Tabbar} className="tab-load"></div>
                    </div>
                    {/* Dummy element for legacy ImageCover ref compatibility */}
                    <div ref={ImageCover} style={{ display: 'none' }}></div>

                    <section ref={sessionRef} id="session">
                        {session}
                    </section>
                </div>
            </BrowserRouter>
        </AdminContext.Provider>
    );
};

export function useAdminContext() {
    return useContext(AdminContext)
}

export default Admin;