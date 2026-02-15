import React from 'react';
import './assets/style/DashboardLayout.scss';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import env from '../../../env';

// Fix for default Leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
        { id: 1, position: [18.79, 98.98], status: "red", name: "แปลง A1" }, // Chiang Mai example
        { id: 2, position: [18.78, 98.99], status: "green", name: "แปลง B2" },
        { id: 3, position: [18.80, 98.97], status: "yellow", name: "แปลง C3" },
    ];

    const center = [18.7883, 98.9853];

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
                <MapContainer center={center} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="แผนที่ทั่วไป (Street)">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="ดาวเทียม (Satellite)">
                            <TileLayer
                                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="สะอาดตา (Clean)">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>

                    {mapPins.map(pin => (
                        <Marker key={pin.id} position={pin.position}>
                            <Popup>
                                {pin.name} <br /> สถานะ: {pin.status}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
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
                                <th>สถานะ</th>
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
                                            {item.status === 'red' ? 'พบโรค' :
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
