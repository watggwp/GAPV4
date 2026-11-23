import React, { useContext, useState, useEffect, useRef } from "react";
import "./assets/style/DoctorHeader.scss"; // Updated style import
import { DoctorContext } from "./Doctor";
import { clientMo } from "../../../assets/js/moduleClient";
import { PopupDom, TimeDiff, Loading } from "../../../assets/js/module";
import ProfilePage from "./page/profile/Profile";
import ManagePopup from "./page/form/ManagePopup";
import SchedulesPopup from "./page/form/schedules/SchedulesPageDoctor";
import { notifyMeta, notifyPath, openDoctorPath } from "./notifyTarget";
import './assets/style/page/form/PageFormPlant.scss';

// การแจ้งเตือนที่กดแล้วมีหน้าให้เปิด: แผนการปลูก (popup) หรือหน้าในเว็บหมอ (notifyTarget.js)
const isScheduleNotify = (val) => (val.type === 1 || val.type === 2) && val.ref_id
const isClickableNotify = (val) => Boolean(isScheduleNotify(val) || notifyPath(val))
// ปุ่มทดสอบแจ้งเตือน: ต้องเปิดเองด้วย REACT_APP_ENABLE_TEST_NOTIFY=true
// (ใช้ NODE_ENV ไม่ได้ เพราะเว็บจริงบนเครื่องนี้เสิร์ฟจาก dev server ผ่าน cloudflared)
const SHOW_TEST_NOTIFY = process.env.REACT_APP_ENABLE_TEST_NOTIFY === "true"

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
            <div className="notify-toasts">
                {toasts.map(toastNotify => {
                    const meta = notifyMeta(toastNotify)
                    const dismiss = () => setToasts(prev => prev.filter(t => t.id !== toastNotify.id))
                    return (
                        <div key={toastNotify.id} className="notify-toast" role="status"
                            style={{ "--notify-color": meta.color }}
                            onClick={() => {
                                if (isScheduleNotify(toastNotify)) {
                                    showSchedulesPopup(toastNotify.ref_id);
                                } else if (notifyPath(toastNotify)) {
                                    openDoctorPath(notifyPath(toastNotify));
                                }
                                dismiss();
                            }}>
                            <NotifyAvatar val={toastNotify} />
                            <div className="toast-body">
                                <span className="toast-label">{meta.label}</span>
                                <span className="toast-text">{toastNotify.notify}</span>
                            </div>
                            <button type="button" className="toast-close" aria-label="ปิด"
                                onClick={(e) => { e.stopPropagation(); dismiss(); }}>×</button>
                        </div>
                    )
                })}
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
                {/* ปุ่มทดสอบแจ้งเตือน (server ต้องตั้ง ENABLE_TEST_NOTIFY=true ด้วย) */}
                {SHOW_TEST_NOTIFY ?
                    <a href="#" className="notification-link" onClick={handleTestNotification} style={{ color: '#22C7A9', marginRight: '15px' }}>
                        <span className="hide-mobile">ทดสอบแจ้งเตือน</span>
                        <span className="show-mobile-icon">🧪</span>
                    </a>
                    : null}
                <div className="menu-content" style={{ position: 'relative' }}>
                    <a href="#" className="notification-link bell-link" onClick={Notify} notify=""
                        aria-label={getNotifyCount ? `การแจ้งเตือน ยังไม่อ่าน ${getNotifyCount} รายการ` : "การแจ้งเตือน"}>
                        <span className="bell-icon" notify="">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {getNotifyCount ? <span notify="" className="count-notify">{getNotifyCount < 100 ? getNotifyCount : "99+"}</span> : null}
                        </span>
                        <span className="hide-mobile">การแจ้งเตือน</span>
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
                    <span className="show-mobile-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" />
                            <path d="M16 17L21 12L16 7" />
                            <path d="M21 12H9" />
                        </svg>
                    </span>
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

    // เลื่อนใกล้ล่างสุด (เหลือไม่ถึง 40px) แล้วโหลดเพิ่ม (เดิมต้องตรงพิกเซลพอดีจึงมักไม่โหลด)
    const LoadGet = async (e) => {
        const box = e.target
        if (box.scrollHeight - box.scrollTop - box.clientHeight < 40 && getLoadGet && getListNew.length !== 0) {
            setLoadGet(false)
            setListNew(await FetchNotify())
            setLoadGet(true)
        }
    }

    const closePanel = () => {
        setShow(false)
        setTimeout(() => setContent(false), 200)
    }

    const openItem = (val) => {
        if (isScheduleNotify(val)) {
            showSchedulesPopup(val.ref_id); setShow(false); setContent(false);
        } else if (notifyPath(val)) {
            openDoctorPath(notifyPath(val)); setShow(false); setContent(false);
        }
    }

    const unreadCount = getWaitContent !== "w" ? dataNotification.filter(isUnread).length : 0
    const groups = groupByDay(dataNotification)

    return (
        <section className="body-notification" notify="">
            <header className="notify-head" notify="">
                <div className="notify-title" notify="">
                    การแจ้งเตือน
                    {unreadCount ? <span className="notify-new-chip" notify="">ใหม่ {unreadCount}</span> : null}
                </div>
                <button type="button" className="notify-close" aria-label="ปิดการแจ้งเตือน" onClick={closePanel}>×</button>
            </header>
            <div className="list-notification" notify="" onScroll={LoadGet}>
                {
                    getWaitContent === "w" ?
                        <div className="notify-loading"><Loading size={30} MaxSize={30} border={8} color="#4FB096" animetion={true} /></div>
                        : dataNotification.length ?
                            groups.map(group =>
                                <div className="notify-group" key={group.label} notify="">
                                    <div className="notify-group-label" notify="">{group.label}</div>
                                    {group.items.map(val => {
                                        const meta = notifyMeta(val)
                                        const clickable = isClickableNotify(val)
                                        return (
                                            <div key={val.id} notify=""
                                                className={`content-notification${isUnread(val) ? " unread" : ""}${clickable ? " clickable" : ""}`}
                                                style={{ "--notify-color": meta.color }}
                                                role={clickable ? "button" : undefined}
                                                tabIndex={clickable ? 0 : undefined}
                                                onClick={() => openItem(val)}
                                                onKeyDown={(e) => { if (clickable && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openItem(val) } }}>
                                                <NotifyAvatar val={val} />
                                                <div className="box-right" notify="">
                                                    <div className="notify-meta" notify="">
                                                        <span className="notify-type" notify="">{meta.label}</span>
                                                        <span className="date" notify=""><TimeDiff DATE={val.date} /></span>
                                                    </div>
                                                    <div className="subject" notify="">{val.notify}</div>
                                                </div>
                                                {isUnread(val) ? <span className="unread-dot" aria-label="ยังไม่อ่าน" notify=""></span> : null}
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                            : <div className="notify-empty" notify="">
                                <div className="notify-empty-icon" notify="">🔔</div>
                                <div className="notify-empty-title" notify="">ยังไม่มีการแจ้งเตือน</div>
                                <div className="notify-empty-text" notify="">เมื่อเกษตรกรสมัครใหม่ หรือเพิ่ม/แก้ไขแบบบันทึก จะแสดงที่นี่</div>
                            </div>
                }
                {!getLoadGet ? <div className="notify-loading small"><Loading size={20} MaxSize={20} border={5} color="#4FB096" animetion={true} /></div> : null}
            </div>
        </section>
    )
}

// รูปเกษตรกร + ไอคอนประเภทมุมขวาล่าง
const NotifyAvatar = ({ val }) => {
    const meta = notifyMeta(val)
    return (
        <div className="notify-avatar" notify="" style={{ "--notify-color": meta.color }}>
            <img notify="" src={val.img_farmer} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden" }} />
            <span className="notify-avatar-icon" notify="" aria-hidden="true">{meta.icon}</span>
        </div>
    )
}

const isUnread = (val) => Number(val.is_read) === 0

// จัดกลุ่มตามวัน: วันนี้ / เมื่อวาน / ก่อนหน้านี้ (รายการเรียงใหม่ไปเก่าอยู่แล้ว)
const groupByDay = (list) => {
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const today = startOfDay(new Date())
    const yesterday = today - 24 * 60 * 60 * 1000
    const groups = []
    list.forEach((val) => {
        const date = new Date(val.date)
        const day = isNaN(date.getTime()) ? 0 : startOfDay(date)
        const label = day >= today ? "วันนี้" : day >= yesterday ? "เมื่อวาน" : "ก่อนหน้านี้"
        const last = groups[groups.length - 1]
        if (last && last.label === label) last.items.push(val)
        else groups.push({ label, items: [val] })
    })
    return groups
}

export default DoctorHeader;
