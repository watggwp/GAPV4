import React, { useEffect, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import "../../assets/style/page/PopupManage.scss";
import { Loading, ReportAction } from "../../../../../assets/js/module";

const ManageRole = ({ RefOnPage, id_table, ReloadFetch, setBecause }) => {
    const [Profile, setProfile] = useState({
        id_table: "",
        doctor_role: false,
        analyst_role: false,
        consultant_role: false,
        protection_role: false,
    });

    const [LoadingStatus, setLoading] = useState(true);
    const [Open, setOpen] = useState(false);
    const [Text, setText] = useState("");
    const [Status, setStatus] = useState("");
    const PasswordRef = useRef();

    // ✅ ดึงข้อมูลเมื่อ id_table เปลี่ยน
    useEffect(() => {
        if (RefOnPage?.current) {
            RefOnPage.current.style.opacity = "1";
            RefOnPage.current.style.visibility = "visible";
        }
        fetchProfile();
    }, [id_table]);

    const fetchProfile = async () => {
        setLoading(true);
        console.log("🟢 Fetching profile for id_table:", id_table);

        if (!id_table) {
            console.error("❌ id_table is missing!");
            setLoading(false);
            return;
        }

        try {
            const response = await clientMo.post("/api/admin/role/get", { id_table });

            console.log("🔎 Full API Response Object:", response);

            let profileData;
            if (typeof response === "string") {
                console.warn("⚠️ Response is a string, parsing to JSON...");
                profileData = JSON.parse(response);
            } else if (Array.isArray(response)) {
                profileData = response;
            } else if (response.data) {
                profileData = response.data;
            } else {
                console.warn("⚠️ API response format incorrect:", response);
                setLoading(false);
                return;
            }

            console.log("✅ Parsed Profile Data:", profileData);

            if (!Array.isArray(profileData) || profileData.length === 0) {
                console.warn("⚠️ API response is empty:", profileData);
                setLoading(false);
                return;
            }

            const profile = profileData[0];
            console.log("📌 Extracted Profile Data before setting state:", profile);

            // ✅ ใช้ `Boolean(value)` เพื่อแปลง `0` เป็น `false` และ `1` เป็น `true`
            setProfile({
                id_table: profile.id_table_doctor?.toString() || "",
                doctor_role: Boolean(profile.doctor_role),
                analyst_role: Boolean(profile.analyst_role),
                consultant_role: Boolean(profile.consultant_role),
                protection_role: Boolean(profile.protection_role),
            });

            console.log("✅ Profile State Updated:", {
                id_table: profile.id_table_doctor?.toString() || "",
                doctor_role: Boolean(profile.doctor_role),
                analyst_role: Boolean(profile.analyst_role),
                consultant_role: Boolean(profile.consultant_role),
                protection_role: Boolean(profile.protection_role),
            });

        } catch (error) {
            console.error("❌ Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (role) => {
        setProfile((prevProfile) => ({
            ...prevProfile,
            [role]: !prevProfile[role],
        }));
    };

    // 
    const Submit = async () => {
        if (PasswordRef.current.value.trim() === "") {
            setText("กรุณากรอกรหัสผ่าน");
            setStatus("warning");
            setOpen(true);
            return;
        }

        try {

            const result = await clientMo.post("/api/admin/role/update", {
                password: PasswordRef.current.value,

                id_table_doctor: Profile.id_table,
                doctor_role: Profile.doctor_role ? 1 : 0,
                analyst_role: Profile.analyst_role ? 1 : 0,
                consultant_role: Profile.consultant_role ? 1 : 0,
                protection_role: Profile.protection_role ? 1 : 0,
            });


            if (result.data === "password") {
                setText("รหัสผ่านไม่ถูกต้อง");
                setStatus("error");
                PasswordRef.current.value = "";
            } else {
                setText("อัปเดตสิทธิ์การใช้งานสำเร็จ");
                setStatus(1);
                ReloadFetch();
            }
        } catch (error) {
            setText("เกิดข้อผิดพลาดในการอัปเดต");
            setStatus("error");
            console.error("❌ Error updating role:", error);
        }
        setOpen(true);
    };

    // ✅ ฟังก์ชันปิด popup
    const close = () => {
        if (RefOnPage?.current) {
            RefOnPage.current.removeAttribute("style");
        }
        setBecause(null);
    };

    return (
        <div className="manage-page">
            <div className="head-page">สิทธิ์การใช้งาน</div>

            {LoadingStatus ? (
                <Loading />
            ) : (
                <div className="form-manage">
                    <label className="column">
                        <span>สิทธิ์การใช้งาน</span>
                        <div className="checkbox-role">
                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={!!Profile.doctor_role}
                                    onChange={() => handleCheckboxChange("doctor_role")}
                                />
                                <span>หมอพืช</span>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={!!Profile.analyst_role}
                                    onChange={() => handleCheckboxChange("analyst_role")}
                                />
                                <span>นักวิเคราะห์สาร</span>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={!!Profile.consultant_role}
                                    onChange={() => handleCheckboxChange("consultant_role")}
                                />
                                <span>ที่ปรึกษาเกษตรกร</span>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={!!Profile.protection_role}
                                    onChange={() => handleCheckboxChange("protection_role")}
                                />
                                <span>อารักขาพืช</span>
                            </label>
                        </div>
                    </label>

                    <label className="column">
                        <span>รหัสผ่านผู้ดูแลระบบ</span>
                        <input
                            placeholder="กรอกรหัสผ่าน"
                            ref={PasswordRef}
                            type="password"
                            className="input-text input-pw"
                        />
                    </label>

                    <div className="bt-manage">
                        <button onClick={close} className="close">
                            ยกเลิก
                        </button>
                        <button onClick={Submit} className="submit">
                            ยืนยัน
                        </button>
                    </div>
                </div>
            )}

            <ReportAction
                Open={Open}
                Text={Text}
                Status={Status}
                setOpen={setOpen}
                setText={setText}
                setStatus={setStatus}
                sizeLoad={Math.max(6 / 100 * window.innerWidth, 60)}
                BorderLoad={Math.max(0.8 / 100 * window.innerWidth, 10)}
                color="#1CFFF1"
                action={close}
            />
        </div>
    );
};

export default ManageRole;
