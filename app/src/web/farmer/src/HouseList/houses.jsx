import React, { useCallback, useEffect, useState } from "react";
import { clientMo } from "../../../../assets/js/moduleClient";
import { CardActionArea, Stack } from "@mui/material";
import { useNavigate } from "react-router";

export default function Houses() {

    const navigator = useNavigate()

    // ── Tab State ──
    const [activeTab, setActiveTab] = useState("houses"); // "houses" | "settings"

    // ── Houses ──
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ show: false, house: null });

    // ── Notification settings ──
    const [reminderDays, setReminderDays] = useState(1);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsError, setSettingsError] = useState("");
    const [settingsSaved, setSettingsSaved] = useState(false);

    useEffect(() => {
        fetchHouses();
        fetchReminderSettings();
        clientMo.unLoadingPage();
    }, []);

    const fetchHouses = async () => {
        try {
            const result = await clientMo.get("/api/farmer/farmhouse/get/HouseList");
            const parsedResult = JSON.parse(result);
            if (Array.isArray(parsedResult)) {
                const housesWithStatus = parsedResult.map((house) => ({
                    ...house,
                    isOpen: house.status === 1,
                }));
                housesWithStatus.sort((a, b) => {
                    if (b.isOpen === a.isOpen) return a.id_farm_house - b.id_farm_house;
                    return b.isOpen - a.isOpen;
                });
                setHouses(housesWithStatus);
            } else {
                setHouses([]);
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error.message);
            setHouses([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchReminderSettings = async () => {
        try {
            const profileResponse = await clientMo.get("/api/farmer/profile");
            const parsedProfile = JSON.parse(profileResponse);
            if (parsedProfile && parsedProfile.profile) {
                setReminderDays(parsedProfile.profile.reminder_days_advance ?? 1);
            }
        } catch (error) {
            console.error("Failed to fetch notification settings:", error);
        }
    };

    const handleReminderDaysChange = async (event) => {
        const value = parseInt(event.target.value, 10);
        setReminderDays(value);
        setSavingSettings(true);
        setSettingsError("");
        setSettingsSaved(false);
        try {
            const response = await clientMo.post("/api/farmer/profile/updateReminderDays", {
                reminder_days_advance: value
            });
            const data = JSON.parse(response);
            if (data.status !== "success") {
                throw new Error(data.message || "Failed to update settings");
            }
            setSettingsSaved(true);
        } catch (error) {
            console.error("Error updating notification settings:", error);
            setSettingsError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setSavingSettings(false);
        }
    };

    const confirmToggle = (house) => {
        setModal({ show: true, house });
    };

    const toggleHouseStatus = async () => {
        if (!modal.house) return;
        try {
            const { id_farm_house, isOpen } = modal.house;
            const response = await clientMo.post("/api/farmer/farmhouse/updateStatus", {
                id_farm_house,
                status: isOpen ? 0 : 1,
            });
            const data = JSON.parse(response);
            if (data.status === "success") {
                setHouses((prevHouses) =>
                    prevHouses.map((house) =>
                        house.id_farm_house === id_farm_house ? { ...house, isOpen: !isOpen } : house
                    )
                );
            } else {
                throw new Error(data.message || "ไม่สามารถอัปเดตสถานะได้");
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ:", error.message);
        } finally {
            setModal({ show: false, house: null });
        }
    };

    const onOpenSetup = useCallback((greenhouse_id) => {
        navigator(`/farmer/houses/${greenhouse_id}`)
    }, [navigator]);

    return (
        <React.Fragment>

            {/* ── Dynamic Title ── */}
            <div className="title">
                ตั้งค่า{activeTab === "houses" ? "โรงเรือน" : "แจ้งเตือน"}
            </div>

            {/* ── Tab Bar ── */}
            <div className="tab-bar">
                <button
                    className={`tab-btn ${activeTab === "houses" ? "active" : ""}`}
                    onClick={() => setActiveTab("houses")}
                >
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    โรงเรือน
                </button>
                <button
                    className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
                    onClick={() => setActiveTab("settings")}
                >
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="2" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                            stroke="currentColor" strokeWidth="2" />
                    </svg>
                    แจ้งเตือน
                </button>
            </div>

            {/* ── Tab Content ── */}
            {activeTab === "houses" && (
                loading ? (
                    <div className="loading">กำลังโหลด...</div>
                ) : (
                    <div className="house-list">
                        {houses.length > 0 ? (
                            <Stack paddingTop={2}>
                                {houses.map((house) => (
                                    <div className="house-card" key={house.id_farm_house}>
                                        <div className="house-image">
                                            <img src={house.img_house} alt={house.name_house} />
                                            <div className="house-name">{house.name_house}</div>
                                            <div
                                                className={`toggle-switch ${house.isOpen ? "on" : "off"}`}
                                                onClick={() => confirmToggle(house)}
                                            >
                                                <span className="toggle-text">{house.isOpen ? "เปิด" : "ปิด"}</span>
                                                <div className="toggle-circle"></div>
                                            </div>
                                            <CardActionArea
                                                onClick={() => onOpenSetup(house.id_farm_house)}
                                                sx={{
                                                    width: "100%", height: "100%",
                                                    position: "absolute", top: 0, left: 0
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </Stack>
                        ) : (
                            <div className="no-houses">ไม่พบโรงเรือน</div>
                        )}
                    </div>
                )
            )}

            {activeTab === "settings" && (
                <div className="settings-page">
                    <div className="settings-section-title">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                        </svg>
                        การแจ้งเตือน LINE
                    </div>

                    <div className="notification-settings-card">
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
                            {savingSettings
                                ? "กำลังบันทึก..."
                                : settingsError
                                    ? <span style={{ color: "red" }}>{settingsError}</span>
                                    : settingsSaved
                                        ? <span style={{ color: "#28a745" }}>✔ บันทึกเรียบร้อยแล้ว</span>
                                        : ""}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Modal ── */}
            {modal.show && (
                <div className="modal">
                    <h3>{modal.house.isOpen ? 'ปิดโรงเรือน' : 'เปิดโรงเรือน'}</h3>
                    <p>
                        {modal.house.isOpen
                            ? `ต้องการปิดโรงเรือน ${modal.house.name_house} หรือไม่?`
                            : `ต้องการเปิดโรงเรือน ${modal.house.name_house} หรือไม่?`}
                    </p>
                    <div className="modal-buttons">
                        <button className="cancel" onClick={() => setModal({ show: false, house: null })}>
                            ยกเลิก
                        </button>
                        <button className="confirm" onClick={toggleHouseStatus}>
                            ยืนยัน
                        </button>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
}