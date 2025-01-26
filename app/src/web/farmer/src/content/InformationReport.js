import React, { useEffect, useState } from "react";
import { clientMo } from "../../../../assets/js/moduleClient";
import "../assets/InformationReport.scss";

const InformationReport = ({ setPage }) => {
    const [statistics, setStatistics] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState(null);

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
                        <button className="option-btn" onClick={() => setView("ranking")}>
                            แสดงจำนวนเกษตรกรเเละชนิดพืช
                        </button>
                        <button className="option-btn" onClick={() => setView("doctors")}>
                            แสดงรายชื่อหมอพืชเเละที่ปรึกษาเกษตรกร
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

                        {view === "doctors" && (statistics?.doctors?.length > 0 || statistics?.advisors?.length > 0) && (
                            <div>
                                <h2>รายชื่อหมอพืชและที่ปรึกษาเกษตรกร</h2>
                                <table className="doctor-table">
                                    <thead>
                                        <tr>
                                            <th>ชื่อ</th>
                                            <th>สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statistics?.doctors?.map((doctor) => (
                                            <tr key={doctor.id_doctor}>
                                                <td>{doctor.fullname_doctor}</td>
                                                <td>หมอพืช</td>
                                            </tr>
                                        ))}
                                        {statistics?.advisors?.map((advisor) => (
                                            <tr key={advisor.id_advisor}>
                                                <td>{advisor.fullname_advisor}</td>
                                                <td>ที่ปรึกษาเกษตรกร</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {view === "ranking" && statistics?.farmerStatistics?.length === 0 && (
                            <p>ไม่มีข้อมูลเกษตรกรและพืชในพื้นที่</p>
                        )}
                        {view === "doctors" && statistics?.doctors?.length === 0 && statistics?.advisors?.length === 0 && (
                            <p>ไม่มีรายชื่อหมอพืชหรือที่ปรึกษาเกษตรกรในพื้นที่</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InformationReport;
