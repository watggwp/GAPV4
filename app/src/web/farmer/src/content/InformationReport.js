import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { clientMo } from "../../../../assets/js/moduleClient";
import "../assets/InformationReport.scss";

ChartJS.register(ArcElement, Tooltip, Legend);

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

    const existingColors = ["#FF6384", "#36A2EB", "#FFCE56", "#8A2BE2", "#7FFF00"];

    const ensureColors = (existingColors, requiredCount) => {
        const colors = [...existingColors];
        const hueStep = 360 / requiredCount; // เว้นระยะระหว่างสีด้วย Hue
    
        while (colors.length < requiredCount) {
            const hue = (colors.length * hueStep) % 360; // กระจายเฉดสี
            const saturation = 70 + Math.random() * 30; // ความเข้มของสี (70%-100%)
            const lightness = 50 + Math.random() * 20; // ความสว่างของสี (50%-70%)
    
            colors.push(`hsl(${Math.floor(hue)}, ${Math.floor(saturation)}%, ${Math.floor(lightness)}%)`);
        }
        return colors;
    };
    

    const pieData = {
        labels: statistics?.farmerStatistics?.[0]?.plantDetails
            ? statistics.farmerStatistics[0].plantDetails.map((plant) => plant.plantName)
            : [],
        datasets: [
            {
                label: "ข้อมูลพื้นฐาน",
                data: statistics?.farmerStatistics?.[0]?.plantDetails
                    ? statistics.farmerStatistics[0].plantDetails.map((plant) => plant.farmersCount)
                    : [],
                backgroundColor: ensureColors(
                    existingColors,
                    statistics?.farmerStatistics?.[0]?.plantDetails?.length || 0
                ),
            },
        ],
    };

    const options = {
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const plant = statistics?.farmerStatistics?.[0]?.plantDetails?.[context.dataIndex];
                        return `${plant.plantName}: ${plant.farmersCount}`;
                    },
                },
            },
        },
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
                        <button className="option-btn" onClick={() => setView("chart")}>
                            แสดงจำนวนเกษตรกรและพืชที่ปลูก
                        </button>
                        <button className="option-btn" onClick={() => setView("doctors")}>
                            แสดงรายชื่อหมอพืชเเละที่ปรึกษาเกษตรกร
                        </button>
                    </div>
                )}

                {view && (
                    <div className="result-display">
                        {view === "chart" && statistics?.farmerStatistics?.length > 0 && (
                            <div>
                                <h2>จำนวนเกษตรกรและชนิดพืชในพื้นที่</h2>
                                <div className="chart-container">
                                    <Pie data={pieData} options={options} />
                                </div>
                                <h3>ข้อมูลเพิ่มเติม</h3>
                                <ul>
                                    <li>
                                        <strong>จำนวนเกษตรกร:</strong>{" "}
                                        {statistics?.farmerStatistics?.[0]?.totalFarmers || 0}
                                    </li>
                                    <li>
                                        <strong>ชนิดพืช:</strong>{" "}
                                        {statistics?.farmerStatistics?.[0]?.plantDetails?.map((plant, index) => (
                                            <span key={index}>
                                                {plant.plantName} ({plant.farmersCount})
                                                {index !==
                                                statistics.farmerStatistics[0].plantDetails.length - 1
                                                    ? ", "
                                                    : ""}
                                            </span>
                                        ))}
                                    </li>
                                </ul>
                            </div>
                        )}
                        {view === "doctors" && statistics?.doctors?.length > 0 && (
                            <div>
                                <h2>รายชื่อหมอพืชในพื้นที่</h2>
                                <ul className="doctor-list">
                                    {statistics?.doctors.map((doctor) => (
                                        <li key={doctor.id_doctor}>
                                            {doctor.fullname_doctor}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {view === "chart" && statistics?.farmerStatistics?.length === 0 && (
                            <p>ไม่มีข้อมูลเกษตรกรและพืชในพื้นที่</p>
                        )}
                        {view === "doctors" && statistics?.doctors?.length === 0 && (
                            <p>ไม่มีรายชื่อหมอพืชในพื้นที่</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InformationReport;
