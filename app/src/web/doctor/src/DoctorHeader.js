import React, { useContext, useState, useEffect, useRef } from "react";
import "./assets/style/DoctorHeader.scss"; // Updated style import
import { DoctorContext } from "./Doctor";
import { clientMo } from "../../../assets/js/moduleClient";
import { PopupDom, TimeDiff, Loading } from "../../../assets/js/module";
import ProfilePage from "./page/profile/Profile";
import ManagePopup from "./page/form/ManagePopup";
import SchedulesPopup from "./page/form/schedules/SchedulesPageDoctor";
import './assets/style/page/form/PageFormPlant.scss';

const DoctorHeader = ({ setMain, socket, setSession, isSidebarCollapsed, pageTitle, toggleSidebar }) => {
    const { profile } = useContext(DoctorContext);

    // Notification & Profile States
    const RefPopup = useRef();
    const [BodyPopup, setBodyPopup] = useState(<></>);

    const [getNotifyContent, setNotifyContent] = useState(false);
    const [getNotifyCount, setNotifyCount] = useState(0);
    const [getNotifyList, setNotifyList] = useState([]);
    const [getShowNotify, setShowNotify] = useState(false);
    const [getStation, setStation] = useState(0);

    const latestNotifyIdRef = useRef(0);
    const [toasts, setToasts] = useState([]);

    const playNotificationSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const playNote = (freq, startTime, duration) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };
            const now = audioCtx.currentTime;
            playNote(523.25, now, 0.15); // C5
            playNote(659.25, now + 0.15, 0.3); // E5
        } catch (e) {
            console.log("Audio play failed", e);
        }
    };

    const addToast = (notifyData) => {
        setToasts(prev => {
            if (prev.find(t => t.id === notifyData.id)) return prev;
            return [...prev, notifyData];
        });
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== notifyData.id));
        }, 7000);
    };

    const FetchNotify = async (id_focus, type) => {
        const SelectDataOn = (type === "update") ? "update" : (getNotifyContent ? type : "count");
        const notify = await clientMo.get(`/api/doctor/notify/get?type=${SelectDataOn}&id=${id_focus}`);
        if (notify) {
            const notifyData = JSON.parse(notify);

            if (notifyData.station !== undefined) {
                setStation(notifyData.station);
            }

            if (notifyData.maxId !== undefined) {
                if (notifyData.maxId > latestNotifyIdRef.current) {
                    latestNotifyIdRef.current = notifyData.maxId;
                }
            }
            if (notifyData.List && notifyData.List.length > 0) {
                const maxId = notifyData.List[0].id;
                if (maxId > latestNotifyIdRef.current) {
                    latestNotifyIdRef.current = maxId;
                }
            }

            if (SelectDataOn === "start") {
                setNotifyList(notifyData.List);
                setNotifyCount(0);
            } else if (SelectDataOn === "update") {
                let addedItems = [];
                setNotifyList((prevent) => {
                    const newItems = notifyData.List.filter(item => !prevent.find(p => p.id === item.id));
                    addedItems = newItems;
                    return [...newItems, ...prevent];
                });
                setTimeout(() => {
                    if (addedItems.length > 0 && !getNotifyContent) {
                        playNotificationSound();
                        addedItems.forEach(item => addToast(item));
                    }
                }, 0);
                setNotifyCount(notifyData.countUn ? notifyData.countUn : 0);
            } else if (SelectDataOn === "get") {
                setNotifyList((prevent) => [...prevent, ...notifyData.List]);
            } else {
                setNotifyCount(notifyData.countUn ? notifyData.countUn : 0);
            }
            return notifyData.List;
        } else {
            setSession();
        }
    };

    // Initial load
    useEffect(() => {
        FetchNotify(0, "count");
    }, []);

    // Socket listeners setup
    useEffect(() => {
        if (!socket || getStation === 0) return;

        socket.emit("connect_notify_doctor", getStation);

        const handleUpdate = () => {
            FetchNotify(latestNotifyIdRef.current, "update");
        };

        socket.on("update", handleUpdate);

        return () => {
            socket.emit("disconnect_notify_doctor", getStation);
            socket.off("update", handleUpdate);
        };
    }, [socket, getStation]);

    // --- Profile Logic ---
    const Home = (e) => {
        if (e) e.preventDefault();
        setBodyPopup(<></>); // Close popup
    };

    const showPopup = async (id_form) => {
        const context = await clientMo.post('/api/doctor/check');
        if (context) {
            setBodyPopup(
                <div className="data-list-content-page form-page" style={{ width: '100%', height: '100%', background: 'transparent' }}>
                    <ManagePopup
                        RefData={{ current: null }}
                        setPopup={setBodyPopup}
                        RefPop={RefPopup}
                        id_form={id_form}
                        session={setSession}
                        Fecth={() => { }}
                    />
                </div>
            );
            setTimeout(() => {
                if (RefPopup.current) {
                    RefPopup.current.style.opacity = "1";
                    RefPopup.current.style.visibility = "visible";
                }
            }, 100);
        } else {
            setSession();
        }
    };

    const showSchedulesPopup = async (id_form) => {
        const context = await clientMo.post('/api/doctor/check');
        if (context) {
            setBodyPopup(
                <SchedulesPopup
                    id_form={id_form}
                    onClose={() => {
                        setBodyPopup(<></>);
                        if (RefPopup.current) {
                            RefPopup.current.style.opacity = "0";
                            RefPopup.current.style.visibility = "hidden";
                        }
                    }}
                />
            );
            setTimeout(() => {
                if (RefPopup.current) {
                    RefPopup.current.style.opacity = "1";
                    RefPopup.current.style.visibility = "visible";
                }
            }, 100);
        } else {
            setSession();
        }
    };

    const Profile = (e) => {
        if (e) e.preventDefault();
        setBodyPopup(<ProfilePage RefPop={RefPopup} setPopup={setBodyPopup} session={setSession} returnToHome={Home} FetchProfileReload={() => { }} FetchNotify={FetchNotify} />);
    };

    const Notify = (e) => {
        if (e) e.preventDefault();
        setNotifyContent(true);
        setShowNotify(!getShowNotify);
    };
    //ทดสอบ popup แจ้งเตือน
    const handleTestNotification = async (e) => {
        if (e) e.preventDefault();
        try {
            await clientMo.post('/api/doctor/notify/test');
        } catch (err) {
            console.error("Test notification failed:", err);
        }
    };
    //-------------------------------------------------------------
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

    return (
        <div className="header-bar" style={{ width: '100%', marginBottom: '20px' }}>
            <PopupDom Ref={RefPopup} Body={BodyPopup} zIndex={999} />
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {toasts.map(toastNotify => (
                    <div key={toastNotify.id} style={{
                        background: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        animation: 'fadeIn 0.3s ease-out',
                        cursor: 'pointer',
                        width: '350px',
                        borderLeft: '4px solid #22C7A9'
                    }} onClick={() => {
                        if ((toastNotify.type === 1 || toastNotify.type === 2) && toastNotify.ref_id) {
                            showSchedulesPopup(toastNotify.ref_id);
                        }
                        setToasts(prev => prev.filter(t => t.id !== toastNotify.id));
                    }}>
                        <img src={toastNotify.img_farmer} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="farmer" />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>การแจ้งเตือนใหม่</span>
                            <span style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{toastNotify.notify}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button className="mobile-menu-btn" onClick={toggleSidebar}>
                    ☰
                </button>
                <div className="page-title">
                    {pageTitle}
                </div>
            </div>

            <div className="header-actions">
                <a href="#" className="notification-link" onClick={handleTestNotification} style={{ color: '#22C7A9', marginRight: '15px' }}>
                    <span className="hide-mobile">ทดสอบแจ้งเตือน</span>
                    <span className="show-mobile-icon">🧪</span>
                </a>
                <div className="menu-content" style={{ position: 'relative' }}>
                    <a href="#" className="notification-link" onClick={Notify} notify="">
                        <span className="hide-mobile">การแจ้งเตือน</span>
                        {getNotifyCount ? <div notify="" className="count-notify" style={{
                            position: 'absolute', top: '-5px', right: '-5px',
                            background: 'red', color: 'white', borderRadius: '50%',
                            padding: '2px 5px', fontSize: '10px'
                        }}>{getNotifyCount < 10 ? getNotifyCount : "9+"}</div> :
                            <span className="show-mobile-icon">🔔</span>
                        }
                    </a>
                    <div className="notify-content" show={getShowNotify ? "" : null}>
                        {getNotifyContent ?
                            <Notification
                                session={setSession}
                                setCount={setNotifyCount}
                                setShow={setShowNotify}
                                setContent={setNotifyContent}
                                FetchNotifyData={() => FetchNotify(0, "start")}
                                dataNotification={getNotifyList}
                                FetchNotify={() => FetchNotify(getNotifyList.length !== 0 ? getNotifyList[getNotifyList.length - 1].id : 0, "get")}
                                showPopup={showPopup}
                                showSchedulesPopup={showSchedulesPopup}
                            />
                            : <></>
                        }
                    </div>
                </div>

                <a href="#" className="profile-link" onClick={Profile}>
                    <span className="hide-mobile">โปรไฟล์</span>
                    <span className="show-mobile-icon">👤</span>
                </a>
                <div className="logout-btn" onClick={logout}>
                    <span className="hide-mobile">ออกจากระบบ</span>
                    <span className="show-mobile-icon">🚪</span>
                </div>
            </div>
        </div>
    );
};

// Notification Component
const Notification = ({ setShow, setContent, dataNotification, FetchNotifyData, FetchNotify, setCount, session, showPopup, showSchedulesPopup }) => {
    const [getLoadGet, setLoadGet] = useState(true)
    const [getListNew, setListNew] = useState([0])
    const [getWaitContent, setWaitContent] = useState("w")

    useEffect(() => {
        window.addEventListener("click", Close)
        LoadContent()
        setShow(true)

        return (() => {
            window.removeEventListener("click", Close)
        })
    }, [])

    const LoadContent = async () => {
        setWaitContent(await FetchNotifyData())
    }

    const Close = (e) => {
        if (e.target.closest('.notify-content') || e.target.closest('.notification-link')) return;

        if (e.target.getAttribute("notify") == null) {
            setShow(false)
            setTimeout(() => {
                setContent(false)
            }, 500)
        }
    }

    const LoadGet = async (e) => {
        if (parseInt(e.target.scrollHeight) === parseInt(e.target.scrollTop + e.target.clientHeight) + 1 && getLoadGet && getListNew.length !== 0) {
            setLoadGet(false)
            setListNew(await FetchNotify())
            setLoadGet(true)
        }
    }

    return (
        <section className="body-notification" notify="" onScroll={LoadGet}>
            <div className="list-notification" notify="">
                {
                    getWaitContent !== "w" ?
                        dataNotification.length ?
                            dataNotification.map(val =>
                                <div className="content-notification" key={val.id} notify=""
                                    onClick={() => {
                                        if ((val.type === 1 || val.type === 2) && val.ref_id) {
                                            showSchedulesPopup(val.ref_id); setShow(false); setContent(false);
                                        }
                                    }}
                                    style={{ cursor: ((val.type === 1 || val.type === 2) && val.ref_id) ? 'pointer' : 'default' }}>
                                    <div className="box-left" notify="">
                                        <img notify="" src={val.img_farmer} alt="farmer"></img>
                                    </div>
                                    <div className="box-right" notify="">
                                        <div className="subject" notify="">
                                            {val.notify}
                                        </div>
                                        <div className="date" notify="">
                                            <TimeDiff DATE={val.date} />
                                        </div>
                                    </div>
                                </div>
                            )
                            : <div>ไม่มีการแจ้งเตือน</div>
                        : <Loading size={30} MaxSize={30} border={8} color="#22C7A9" animetion={true} />
                }
            </div>
        </section>
    )
}

export default DoctorHeader;
