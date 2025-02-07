import React, { useEffect, useState } from "react";
import { clientMo } from "../../../../assets/js/moduleClient";
import "../assets/InformationReport.scss";

const InformationReport = ({ setPage }) => {
    const [statistics, setStatistics] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState(null);
    const [activeButton, setActiveButton] = useState(""); // กำหนด state สำหรับปุ่มที่ถูกเลือก

    useEffect(() => {
        fetchStatistics();
        clientMo.unLoadingPage();
    }, []);

    const fetchStatistics = async () => {
        try {
            const response = await clientMo.get("/api/farmer/statistics");
            const parsedResult = JSON.parse(response);

            if (parsedResult.status === "success" && parsedResult.data) {
                setStatistics(parsedResult.data);
            } else {
                throw new Error(parsedResult.message || "โครงสร้างข้อมูลไม่ถูกต้อง");
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="Information-Report">
            <div className="content-max-width">
                <div className="chart-heading">
                    <span className="header-text">รายงานข้อมูลพื้นฐาน</span>
                </div>

                {loading ? (
                    <div className="loading">กำลังโหลด...</div>
                ) : error ? (
                    <p className="error-text">เกิดข้อผิดพลาด: {error}</p>
                ) : (
                    <div className="button-container">
                    <button 
                        className={`option-btn ${activeButton === 'ranking' ? 'active' : ''}`}
                        onClick={() => {
                            setView("ranking");
                            setActiveButton('ranking'); // ตั้งค่าสถานะเมื่อกดปุ่ม
                        }}
                    >
                        จำนวนเกษตรกรเเละชนิดพืช
                    </button>

                    <button 
                        className={`option-btn ${activeButton === 'doctors' ? 'active' : ''}`}
                        onClick={() => {
                            setView("doctors");
                            setActiveButton('doctors'); // ตั้งค่าสถานะเมื่อกดปุ่ม
                        }}
                    >
                        รายชื่อเจ้าหน้าที่
                    </button>
                </div>
                )}

                {view && (
                    <div className="result-display">
                        {view === "ranking" && statistics?.farmerStatistics?.length > 0 && (
                            <div>
                                <h2>ตารางชนิดพืชและจำนวนชนิดพืช</h2>
                                <table className="ranking-table">
                                    <thead>
                                        <tr>
                                            <th>อันดับ</th>
                                            <th>ชนิดพืช</th>
                                            <th>จำนวน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statistics?.farmerStatistics?.[0]?.plantDetails
                                            ?.sort((a, b) => b.farmersCount - a.farmersCount)
                                            ?.map((plant, index) => (
                                                <tr key={plant.plantName}>
                                                    <td>{index + 1}</td>
                                                    <td>{plant.plantName}</td>
                                                    <td>{plant.farmersCount}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                                <ul>
                                    <div className="total-farmers">
                                        <strong>จำนวนเกษตรกรในพื้นที่</strong>{" "}
                                        {statistics?.farmerStatistics?.[0]?.totalFarmers || 0} คน
                                    </div>
                                </ul>
                            </div>
                        )}  
                        {view === "doctors" && (statistics?.doctors?.length > 0 || statistics?.consultants?.length > 0) && (
                            <div>
                                <h2>รายชื่อหมอพืชและที่ปรึกษาเกษตรกร</h2>
                                <table className="doctor-table">
                                    <thead>
                                        <tr>
                                            <th>ชื่อ</th>
                                            <th>ตำเเหน่ง</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {Object.values(
                                            [...statistics?.doctors, ...statistics?.consultants].reduce((acc, person) => {
                                                if (!acc[person.id_doctor]) {
                                                    acc[person.id_doctor] = {
                                                        name: person.fullname_doctor,
                                                        roles: new Set(),
                                                    };
                                                }
                                                if (person.doctor_role === 1) {
                                                    acc[person.id_doctor].roles.add("หมอพืช");
                                                }
                                                if (person.consultant_role === 1) {
                                                    acc[person.id_doctor].roles.add("ที่ปรึกษาเกษตรกร");
                                                }
                                                return acc;
                                            }, {})
                                        ).map((person) => (
                                            <tr key={person.name}>
                                                <td>{person.name}</td>
                                                <td>{[...person.roles].join(", ")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {view === "ranking" && statistics?.farmerStatistics?.length === 0 && (
                            <p className="no-data-text">ไม่มีข้อมูลเกษตรกรและพืชในพื้นที่</p>
                        )}
                        {view === "doctors" && statistics?.doctors?.length === 0 && statistics?.consultants?.length === 0 && (
                            <p className="no-data-text">ไม่มีรายชื่อหมอพืชหรือที่ปรึกษาเกษตรกรในพื้นที่</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
export default InformationReport;
