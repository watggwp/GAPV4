import React, { useEffect, useState, useRef, useCallback } from "react";
import { clientMo } from "../../../../assets/js/moduleClient";
import { PopupDom } from "../../../../assets/js/module";
import House from "../content/House/House";
import { Stack } from "@mui/material";
import { useNavigate } from "react-router";
import env from "../../../../env";
import "./NotificationSettings.scss";
import "../assets/FarmBody.scss";

export default function NotificationSettings() {
    const navigator = useNavigate();
    const [reminderDays, setReminderDays] = useState(1);
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsError, setSettingsError] = useState("");
    const [greenhouseId, setGreenhouseId] = useState("");

    const [paddingBody, setPadding] = useState(0);

    const HeadNav = useRef();
    const HeadNavMini = useRef();
    const Nav = useRef();

    const HomeClick = useCallback(async () => {
        navigator(`/farmer/gap`);
    }, [navigator]);

    const toInformation = useCallback(() => {
        if (greenhouseId) {
            navigator(`/farmer/form/${greenhouseId}/information`);
        }
    }, [greenhouseId, navigator]);

    const toNotifications = useCallback(() => {
        navigator(`/farmer/notifications`);
    }, [navigator]);

    const CloseNav = useCallback((e) => {
        if (Nav.current) {
            Nav.current.removeAttribute("show");
        }
    }, []);

    const Load = useCallback(() => {
        if (HeadNavMini.current && HeadNav.current) {
            HeadNavMini.current.style.height = `${HeadNav.current.clientHeight}px`;
            setPadding(HeadNav.current.clientHeight);
        }
    }, []);

    const RefHouse = useRef();
    const [getHouseEdit, setHouseEdit] = useState(<></>);
    const OpenEditHouse = useCallback(() => {
        setHouseEdit(<House Ref={RefHouse} setPopup={setHouseEdit} />);
    }, []);

    useEffect(() => {
        fetchReminderSettings();
        clientMo.unLoadingPage();
    }, []);

    const fetchReminderSettings = async () => {
        try {
            // Get profile reminder settings
            const profileResponse = await clientMo.get("/api/farmer/profile");
            const parsedProfile = JSON.parse(profileResponse);
            if (parsedProfile && parsedProfile.profile) {
                setReminderDays(parsedProfile.profile.reminder_days_advance ?? 1);
            }

            // Get houses
            const houseResponse = await clientMo.get("/api/farmer/farmhouse/get/HouseList");
            const parsedHouses = JSON.parse(houseResponse);
            if (Array.isArray(parsedHouses) && parsedHouses.length > 0) {
                // Determine greenhouseId
                const cachedId = localStorage.getItem("last_greenhouse_id");
                const cachedExists = parsedHouses.some(h => String(h.id_farm_house) === String(cachedId));
                if (cachedId && cachedExists) {
                    setGreenhouseId(cachedId);
                } else {
                    const openHouse = parsedHouses.find(h => h.status === 1) || parsedHouses[0];
                    if (openHouse) {
                        setGreenhouseId(openHouse.id_farm_house);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch notification settings or houses:", error);
        } finally {
            setLoading(false);
            // Trigger layout calculation
            setTimeout(Load, 100);
        }
    };

    const handleReminderDaysChange = async (event) => {
        const value = parseInt(event.target.value, 10);
        setReminderDays(value);
        setSavingSettings(true);
        setSettingsError("");
        try {
            const response = await clientMo.post("/api/farmer/profile/updateReminderDays", {
                reminder_days_advance: value
            });
            const data = JSON.parse(response);
            if (data.status !== "success") {
                throw new Error(data.message || "Failed to update settings");
            }
        } catch (error) {
            console.error("Error updating notification settings:", error);
            setSettingsError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <section className="farm">
            <div className="farm-body">
                <div className="head-nav" ref={HeadNav}>
                    <div onLoad={Load} className="logo" onClick={HomeClick}>
                        <img src={`${env.subpath_server}/logo2.png`} alt="Logo" />
                        <span>GAP</span>
                    </div>
                    <div className="menu-icon">
                        <svg onClick={() => Nav.current.setAttribute("show", "")} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                            <path d="M160 448a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32H160zm448 0a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32H608zM160 896a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32H160zm448 0a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32H608z" />
                        </svg>
                    </div>
                </div>
                <div style={{ paddingTop: `${paddingBody}px` }} className="body-main">
                    <div className="Notification-Settings">
                        {loading ? (
                            <div className="loading">กำลังโหลด...</div>
                        ) : (
                            <div className="settings-container">
                                <div className="notification-settings-card">
                                    <div className="settings-header">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                                        </svg>
                                        <span>ตั้งค่าการแจ้งเตือน LINE</span>
                                    </div>
                                    <div className="settings-description">
                                        เลือกจำนวนวันเพื่อรับการแจ้งเตือนกิจกรรมการปลูกล่วงหน้าทาง LINE
                                    </div>
                                    <div className="settings-control">
                                        <select
                                            className="select-days"
                                            value={reminderDays}
                                            onChange={handleReminderDaysChange}
                                            disabled={savingSettings}
                                        >
                                            <option value="0">ไม่แจ้งเตือนล่วงหน้า (แจ้งเฉพาะวันปัจจุบันเท่านั้น)</option>
                                            <option value="1">แจ้งเตือนล่วงหน้า 1 วัน</option>
                                            <option value="2">แจ้งเตือนล่วงหน้า 2 วัน</option>
                                            <option value="3">แจ้งเตือนล่วงหน้า 3 วัน</option>
                                            <option value="4">แจ้งเตือนล่วงหน้า 4 วัน</option>
                                            <option value="5">แจ้งเตือนล่วงหน้า 5 วัน</option>
                                            <option value="6">แจ้งเตือนล่วงหน้า 6 วัน</option>
                                            <option value="7">แจ้งเตือนล่วงหน้า 7 วัน</option>
                                        </select>
                                    </div>
                                    <div className="save-indicator">
                                        {savingSettings ? "กำลังบันทึก..." : settingsError ? <span style={{ color: "red" }}>{settingsError}</span> : "บันทึกเรียบร้อยแล้ว"}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div onClick={CloseNav} ref={Nav} className="background-nav">
                <div className="nav-menu">
                    <div ref={HeadNavMini} className="head-nav">
                        <div></div>
                        <div className="menu-icon">
                            <svg onClick={() => Nav.current.removeAttribute("show")} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                                <path d="M160 448a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32H160zm448 0a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32H608zM160 896a32 32 0 0 1-32-32V608a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32H160zm448 0a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32H608z" />
                            </svg>
                        </div>
                    </div>
                    <Stack className="content-list-menu" paddingLeft={2}>
                        <div className="frame-list-menu">
                            <div className="menu-list" onClick={HomeClick}>
                                <svg viewBox="0 0 25 25" fill="none">
                                    <path d="M3.0802 9.15381L12.0802 2.15381L21.0802 9.15381V20.1538C21.0802 20.6842 20.8695 21.1929 20.4944 21.568C20.1193 21.9431 19.6106 22.1538 19.0802 22.1538H5.0802C4.54977 22.1538 4.04106 21.9431 3.66599 21.568C3.29091 21.1929 3.0802 20.6842 3.0802 20.1538V9.15381Z" stroke="#22C7A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9.0802 22.1538V12.1538H15.0802V22.1538" stroke="#22C7A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>รายการปลูก</span>
                            </div>
                            {greenhouseId && (
                                <>
                                    <div className="menu-list" onClick={OpenEditHouse}>
                                        <svg viewBox="0 0 26 22" fill="none">
                                            <path d="M23.7206 0H2.15642C0.965895 0 0 1.04116 0 2.32445V19.3704C0 20.6537 0.965895 21.6949 2.15642 21.6949H23.7206C24.9111 21.6949 25.877 20.6537 25.877 19.3704V2.32445C25.877 1.04116 24.9111 0 23.7206 0ZM7.90686 4.6489C9.49273 4.6489 10.7821 6.03873 10.7821 7.74817C10.7821 9.45761 9.49273 10.8474 7.90686 10.8474C6.321 10.8474 5.03164 9.45761 5.03164 7.74817C5.03164 6.03873 6.321 4.6489 7.90686 4.6489ZM12.9385 16.1162C12.9385 16.6295 12.4892 17.046 11.9322 17.046H3.88155C3.32448 17.046 2.87522 16.6295 2.87522 16.1162V15.1864C2.87522 13.6465 4.22748 12.3971 5.89421 12.3971H6.11883C6.67142 12.6441 7.27341 12.7845 7.90686 12.7845C8.54031 12.7845 9.1468 12.6441 9.69489 12.3971H9.91952C11.5862 12.3971 12.9385 13.6465 12.9385 15.1864V16.1162ZM23.0018 13.5593C23.0018 13.7724 22.8401 13.9467 22.6424 13.9467H16.1731C15.9755 13.9467 15.8137 13.7724 15.8137 13.5593V12.7845C15.8137 12.5714 15.9755 12.3971 16.1731 12.3971H22.6424C22.8401 12.3971 23.0018 12.5714 23.0018 12.7845V13.5593ZM23.0018 10.46C23.0018 10.6731 22.8401 10.8474 22.6424 10.8474H16.1731C15.9755 10.8474 15.8137 10.6731 15.8137 10.46V9.68522C15.8137 9.47214 15.9755 9.29781 16.1731 9.29781H22.6424C22.8401 9.29781 23.0018 9.47214 23.0018 9.68522V10.46ZM23.0018 7.36077C23.0018 7.57384 22.8401 7.74817 22.6424 7.74817H16.1731C15.9755 7.74817 15.8137 7.57384 15.8137 7.36077V6.58595C15.8137 6.37287 15.9755 6.19854 16.1731 6.19854H22.6424C22.8401 6.19854 23.0018 6.37287 23.0018 6.58595V7.36077Z" fill="#22C7A9" />
                                        </svg>
                                        <span>แก้ไขโรงเรือน</span>
                                    </div>
                                    <div className="menu-list" onClick={toInformation}>
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L2 22h20L12 2z" stroke="#22C7A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>รายงานข้อมูลพื้นฐาน</span>
                                    </div>
                                </>
                            )}
                            <div className="menu-list" onClick={toNotifications}>
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#22C7A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#22C7A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>ตั้งค่าการแจ้งเตือน</span>
                            </div>
                        </div>
                    </Stack>
                </div>
            </div>
            <PopupDom Ref={RefHouse} Body={getHouseEdit} zIndex={999} />
        </section>
    );
}
