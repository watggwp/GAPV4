import React from 'react';
import './assets/style/DashboardLayout.scss';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import env from '../../../env';

const DashboardLayout = ({ setMain, socket, setSession }) => {
    // Mock Data for Tables
    const unfilledPlots = [
        { id: 1, name: "แปลง A1", type: "มะเขือเทศ", dueDate: "2 ก.พ. 2569", overdue: "10 วัน", status: "red" },
        { id: 2, name: "แปลง B3", type: "ผักกาดขาว", dueDate: "5 ก.พ. 2569", overdue: "7 วัน", status: "yellow" },
        { id: 3, name: "แปลง C1", type: "กะหล่ำปลี", dueDate: "10 ก.พ. 2569", overdue: "2 วัน", status: "green" },
    ];

    const productionEstimates = [
        { id: 1, name: "แปลง A2", type: "มะเขือม่วง", amount: 3500, color: "#E88A4F" },
        { id: 2, name: "แปลง B1", type: "ถั่วฝักยาว", amount: 2100, color: "#4FB096" },
        { id: 3, name: "แปลง C2", type: "แตงกวา", amount: 1800, color: "#F8B400" },
    ];

    // Dummy Map data
    const mapPins = [
        { id: 1, position: { lat: 18.79, lng: 98.98 }, status: "red" }, // Chiang Mai example
        { id: 2, position: { lat: 18.78, lng: 98.99 }, status: "green" },
        { id: 3, position: { lat: 18.80, lng: 98.97 }, status: "yellow" },
    ];

    const containerStyle = {
        width: '100%',
        height: '100%'
    };

    const center = {
        lat: 18.7883,
        lng: 98.9853
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: env.google_maps_key || ""
    })

    return (
        <div className="dashboard-layout">
            <div className="dashboard-filters">
                <select>
                    <option>ชนิดพืช</option>
                    <option>มะเขือเทศ</option>
                    <option>ผักกาดขาว</option>
                </select>
                <select>
                    <option>ช่วงปริมาณผลผลิต</option>
                    <option>น้อยกว่า 1000</option>
                    <option>1000 - 5000</option>
                </select>
                <select>
                    <option>โรคและศัตรูพืช</option>
                    <option>ไม่พบ</option>
                    <option>พบโรค</option>
                </select>
                <button className="filter-btn">ค้นหา</button>

                <div className="legend">
                    <div className="legend-item normal">
                        <span className="dot"></span> ปกติ
                    </div>
                    <div className="legend-item watch">
                        <span className="dot"></span> เฝ้าระวัง
                    </div>
                    <div className="legend-item disease">
                        <span className="dot"></span> พบโรค/ศัตรูพืช
                    </div>
                </div>
            </div>

            <div className="map-section">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={12}
                    >
                        {mapPins.map(pin => (
                            <Marker key={pin.id} position={pin.position} />
                        ))}
                    </GoogleMap>
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        Loading Map...
                    </div>
                )}
            </div>

            <div className="dashboard-widgets">
                <div className="widget left-widget">
                    <div className="widget-header">
                        <h3>แปลงที่ยังไม่กรอกข้อมูล</h3>
                        <div className="select-wrapper">
                            {/* Optional select if needed */}
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ลำดับ</th>
                                <th>ชื่อแปลง</th>
                                <th>ชนิดพืช</th>
                                <th>วันที่ครบกำหนด</th>
                                <th>วันที่เกินกำหนด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unfilledPlots.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td>{item.name}</td>
                                    <td>{item.type}</td>
                                    <td>{item.dueDate}</td>
                                    <td>{item.overdue}</td>
                                    <td>
                                        <span className={`status-badge ${item.status}`}>
                                            {item.status === 'red' ? 'ล่าช้า' :
                                                item.status === 'yellow' ? 'เฝ้าระวัง' : 'ปกติ'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="widget right-widget">
                    <div className="widget-header">
                        <h3>ปริมาณผลผลิตเดือนมีนาคม</h3>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ลำดับ</th>
                                <th>ชื่อแปลง</th>
                                <th>ชนิดพืช</th>
                                <th>จำนวน (กก.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productionEstimates.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td>{item.name}</td>
                                    <td>{item.type}</td>
                                    <td>
                                        <div className="production-bar-container">
                                            <div className="bar-bg">
                                                <div className="bar-fill" style={{ width: `${(item.amount / 5000) * 100}%`, backgroundColor: item.color }}></div>
                                            </div>
                                            <div className="value">{item.amount.toLocaleString()}</div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
