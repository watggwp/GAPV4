import React, { useEffect, useRef, useState } from "react";
import { HrefData, TabLoad } from "../../../assets/js/module";
import { clientMo } from "../../../assets/js/moduleClient";
import "./assets/style/adminMain.scss";
import Login from "./Login";
import NavFirst from "./navFirst";
import DesktopNev from "./navTop/desktop";
import PageTemplate from "./page/PageTemplate";
import SessionOut from "./sesionOut";

export const AdminContext = React.createContext({
    TabOn : undefined
})

const Admin = ({ setBodyFileMain, socket, username, password }) => {
    const [body, setBody] = useState(<div></div>);
    const [TabMenuTop, setTabMenu] = useState(<></>);
    const [session, setSession] = useState(<div></div>);
    const [TextPage, setTextPage] = useState([]);
    const [getProfile, setProfile] = useState([]);
    const [Responsive, setResponsive] = useState(window.innerWidth);
    const [SizeProfileImg , setSizeProfileImg] = useState(0)

    const ImageCover = useRef();
    const BodyRef = useRef();
    const Tabbar = useRef();
    const sessionRef = useRef();
    const frameImage = useRef()

    const { current : TabOn } = useRef(new TabLoad(Tabbar));
    const Href = new HrefData("HOME");

    useEffect(() => {
        FetchProfile();
        ChkPath(null , "web")
        setTabMenu(
            <DesktopNev
                setSession={sessionoff}
                setBodyFileMain={setBodyFileMain}
                setBodyFileAdmin={setBody}
                socket={socket}
                auth={Auth}
                modify={modifyMainPage}
                eleImageCover={ImageCover} 
                eleBody={BodyRef} setTextStatus={setTextPage} 
                TabOn={TabOn}
                HrefData={Href}
                getProfile={getProfile} 
                FetchProfile={FetchProfile}
            />
        );

        window.addEventListener("popstate", ChkPath);
        window.addEventListener("resize", Resize);
        socket.emit("connect-account", username, password);

        return () => {
            socket.emit("disconnect-account", username, password);
            window.removeEventListener("popstate", ChkPath);
            window.removeEventListener("resize", Resize);
        };
    }, []);

    const FetchProfile = async () => {
        try {
            const result = await clientMo.get("/api/admin/profile/get");
            console.log(result)
    
            if (result) {
                setProfile(JSON.parse(result));
            } else {
                console.log("No result, setting session.");
                setSession();
            }
        } catch (error) {
            // Log ข้อผิดพลาดถ้ามี
            console.error("Error fetching profile:", error);
        }
    };
    

    const ChkPath = async (e) => {
        if (await Auth(true)) method(e);
    };

    const method = (e) => {
        let path = window.location.href.replace(window.location.origin, "").split("/").filter(val => val);
        const type = e ? "=pop" : '';
        if (path.length === 1 && path[0] === "admin") {
            setBody(
                <NavFirst
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
            let query = seconPath[1];

            console.log(query)
            if (seconPath[0] === "list") {
                if (query.indexOf("default") === 0) {
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
                } else if (query.indexOf("delete") === 0) {
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
                }
            }
            else if (seconPath[0] === "listadmin") {
                if (query.indexOf("admin") === 0) {
                Href.set(`istadmin?admin${type}`);
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
            else if (query.indexOf("deleteAdmin") === 0) {
                Href.set(`listadmin?deleteAdmin${type}`);
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
                if (query.indexOf("plant") === 0) {
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
                } else if (query.indexOf("station") === 0) {
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
                
            } else if (query.indexOf("group") === 0) {
                Href.set(`data?group${type}`);
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

            } else if (query.indexOf("statistics") >= 0) {
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
            } else if (query.indexOf("listlocation") === 0) {
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
            
        } else if (query.indexOf("chemical") === 0) {
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
        

        } else if (query.indexOf("pest") === 0) {
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
            }
            
        } else {
            setBody(
                <NavFirst
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
    };

    const Auth = async (tebLoadOn = false) => {
        if (tebLoadOn) TabOn.start();
        const result = await clientMo.post('/api/admin/check');
        if (result) return true;
        else sessionoff();
    };

    const sessionoff = (type = false) => {
        if (type) {
            setBodyFileMain(<Login setBodyFileMain={setBodyFileMain} socket={socket} />);
        } else {
            setSession(<SessionOut setBodyFileMain={setBodyFileMain} sessionEle={sessionRef} />);
        }
    };

    const modifyMainPage = (heigthBody, heightCover, ArrtextPage = []) => {
        setTextPage(ArrtextPage.filter(val => val !== ""));
        ImageCover.current.style.height = `${heightCover}%`;
        BodyRef.current.style.height = `${heigthBody}%`;
    };

    const Resize = () => {
        setResponsive(window.innerWidth);

        const LoadImg = () => {
            setSizeProfileImg(frameImage.current.clientWidth * 43 / 100)
        }
    
    };

    return (
        <AdminContext.Provider
            value={{
                TabOn : TabOn
            }}
        >
            <div
                onLoad={clientMo.unLoadingPage}
                className="admin"
            >
                {TabMenuTop}
                <div className="status-loadPage">
                    <div ref={Tabbar} className="tab-load"></div>
                </div>
                <section ref={ImageCover} className="image-cover">
                    {Responsive > 800 ? (
                        <>
                            <div className="text-cover">
                                <div className="icon">
                                    <span>ยินดีต้อนรับ</span>
                                    <img src="/Logo-white.png" alt="Logo" />
                                </div>
                                <div className="status">
                                    {TextPage.map((val, index) => (
                                        <div className="box-status" key={index}>
                                            <span>{val}</span>
                                            {TextPage.length - 1 > index ? <img src="/arrow.png" alt="arrow" /> : <></>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="frame">
                                <img src="/ดอย.jpg" alt="cover" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-icon-cover">
                                <div className="text">
                                    <span>ยินดีต้อนรับ</span>
                                    <span style={{ fontWeight: 900 }}>ผู้ดูแลระบบ</span>
                                </div>
                            </div>
                            <div className="frame-image-cover">
                                <img src="/ดอย.jpg" alt="cover" />
                            </div>
                        </>
                    )}
                </section>
                <section ref={BodyRef} className="container-body-admin">
                    <bot-main>
                        <bot-content>
                            {body}
                        </bot-content>
                    </bot-main>
                </section>
                <section ref={sessionRef} id="session">
                    {session}
                </section>
            </div>
        </AdminContext.Provider>
    );
};

export default Admin;
