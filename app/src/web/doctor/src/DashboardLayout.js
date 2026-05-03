import React, { useState } from 'react';
import './assets/style/DashboardLayout.scss';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Custom colored marker icons
const createColoredIcon = (color) => {
    const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
            <path fill="${color}" stroke="white" stroke-width="1.5"
                d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 24 12 24S24 20.5 24 12C24 5.4 18.6 0 12 0z"/>
            <circle cx="12" cy="12" r="5" fill="white"/>
        </svg>`;
    return L.divIcon({
        html: svgIcon,
        className: '',
        iconSize: [24, 36],
        iconAnchor: [12, 36],
        popupAnchor: [0, -36]
    });
};

const greenIcon = createColoredIcon('#4CAF50');
const redIcon = createColoredIcon('#e53935');

L.Marker.prototype.options.icon = DefaultIcon;

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const DashboardLayout = ({ setMain, socket, setSession }) => {
    const now = new Date();
    const [selectedPlantType, setSelectedPlantType] = useState('');
    const [selectedYield, setSelectedYield] = useState('');
    const [selectedDisease, setSelectedDisease] = useState('');
    const [popupInfo, setPopupInfo] = useState(null);

    // default = วันนี้ (พ.ศ.)
    const currentBE = now.getFullYear() + 543;
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
    const [selectedYear, setSelectedYear] = useState(currentBE);

    // แสดงปีปัจจุบันถึง +1 ปี (auto, พ.ศ.)
    const yearOptions = Array.from({ length: 2 }, (_, i) => currentBE + i);

    // Mock Data — แปลงที่ยังไม่กรอกข้อมูลการใช้ปุ๋ย/สารเคมี
    const unfilledPlots = [
        { id: 1, name: 'แปลง A1', type: 'มะเขือเทศ', overdue: 10, statusColor: 'red' },
        { id: 2, name: 'แปลง C2', type: 'กะหล่ำปลี', overdue: 8, statusColor: 'orange' },
        { id: 3, name: 'แปลง D3', type: 'แตงกวา', overdue: 6, statusColor: 'yellow' },
        { id: 4, name: 'แปลง E4', type: 'ผักกาดขาว', overdue: 5, statusColor: 'lightyellow' },
        { id: 5, name: 'แปลง F5', type: 'หัวหอม', overdue: 3, statusColor: 'lightyellow2' },
    ];

    // Mock Data — ปริมาณการผลผลิต
    const productionData = [
        { id: 1, type: 'แตงกวา', amount: 8700, max: 9000, color: '#C8863A' },
        { id: 2, type: 'บล็อกโคลี', amount: 7600, max: 9000, color: '#BFA04F' },
        { id: 3, type: 'กะหล่ำดอก', amount: 6400, max: 9000, color: '#7EAA4F' },
        { id: 4, type: 'ตะไคร้', amount: 5900, max: 9000, color: '#3C9E6E' },
        { id: 5, type: 'มะเขือเทศ', amount: 3198, max: 9000, color: '#4FB8C7' },
    ];

    // Map Pins
    const mapPins = [
        { id: 1, position: [18.810, 98.940], status: 'red', plant: 'แตงกวา', name: 'แปลง C3', disease: 'ราแป้ง', amount: 3500 },
        { id: 2, position: [18.830, 98.960], status: 'green', plant: 'มะเขือเทศ', name: 'แปลง A2', disease: '-', amount: 2100 },
        { id: 3, position: [18.850, 99.010], status: 'green', plant: 'กะหล่ำปลี', name: 'แปลง B1', disease: '-', amount: 4200 },
        { id: 4, position: [18.795, 99.050], status: 'green', plant: 'ผักกาดขาว', name: 'แปลง D4', disease: '-', amount: 1800 },
        { id: 5, position: [18.760, 98.920], status: 'red', plant: 'บล็อกโคลี', name: 'แปลง E1', disease: 'เพลี้ย', amount: 950 },
        { id: 6, position: [18.870, 98.990], status: 'green', plant: 'หัวหอม', name: 'แปลง F2', disease: '-', amount: 3300 },
    ];

    const center = [18.810, 98.980];

    const getBadgeStyle = (color) => {
        const styles = {
            red: { backgroundColor: '#e53935', color: '#fff' },
            orange: { backgroundColor: '#F57C3A', color: '#fff' },
            yellow: { backgroundColor: '#F5C842', color: '#7a5a00' },
            lightyellow: { backgroundColor: '#FDE98E', color: '#7a5a00' },
            lightyellow2: { backgroundColor: '#FFF3C4', color: '#7a5a00' },
        };
        return styles[color] || { backgroundColor: '#eee', color: '#333' };
    };

    return (
        <div className="dashboard-layout">
            {/* Filter Bar */}
            <div className="dashboard-filters">
                <select value={selectedPlantType} onChange={e => setSelectedPlantType(e.target.value)}>
                    <option value="">ชนิดพืช</option>
                    <option value="มะเขือเทศ">มะเขือเทศ</option>
                    <option value="ผักกาดขาว">ผักกาดขาว</option>
                    <option value="แตงกวา">แตงกวา</option>
                    <option value="กะหล่ำปลี">กะหล่ำปลี</option>
                </select>
                <select value={selectedYield} onChange={e => setSelectedYield(e.target.value)}>
                    <option value="">ช่วงปริมาณผลผลิต</option>
                    <option value="low">น้อยกว่า 1,000 กก.</option>
                    <option value="mid">1,000 – 5,000 กก.</option>
                    <option value="high">มากกว่า 5,000 กก.</option>
                </select>
                <select value={selectedDisease} onChange={e => setSelectedDisease(e.target.value)}>
                    <option value="">โรคและศัตรูพืช</option>
                    <option value="none">ไม่พบ</option>
                    <option value="found">พบโรค/ศัตรูพืช</option>
                </select>
                <button className="filter-btn">ค้นหา</button>

                <div className="legend">
                    <div className="legend-item">
                        <span className="dot green-dot"></span>
                        <span>ปกติ</span>
                    </div>
                    <div className="legend-item">
                        <span className="dot red-dot"></span>
                        <span>พบโรค/ศัตรูพืช</span>
                    </div>
                </div>
            </div>

            {/* Main Content: Map + Right Widgets */}
            <div className="dashboard-main">
                {/* Map Section */}
                <div className="map-section">
                    <MapContainer
                        center={center}
                        zoom={11}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%', zIndex: 0 }}
                    >
                        <LayersControl position="topright">
                            <LayersControl.BaseLayer checked name="แผนที่ทั่วไป (Street)">
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="ดาวเทียม (Satellite)">
                                <TileLayer
                                    attribution='Tiles &copy; Esri'
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="สะอาดตา (Clean)">
                                <TileLayer
                                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                />
                            </LayersControl.BaseLayer>
                        </LayersControl>

                        {mapPins.map(pin => (
                            <Marker
                                key={pin.id}
                                position={pin.position}
                                icon={pin.status === 'green' ? greenIcon : redIcon}
                            >
                                <Popup>
                                    <div className="map-popup">
                                        <div className="popup-row"><strong>พืชที่ปลูก:</strong> {pin.plant}</div>
                                        <div className="popup-row"><strong>ชื่อแปลง:</strong> {pin.name}</div>
                                        <div className="popup-row"><strong>โรค/ศัตรูพืช:</strong> {pin.disease}</div>
                                        <div className="popup-row"><strong>ประมาณการผลผลิต:</strong> {pin.amount.toLocaleString()}</div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* Right Widgets */}
                <div className="right-widgets">
                    {/* Widget 1: แปลงที่ยังไม่กรอกข้อมูล */}
                    <div className="widget">
                        <div className="widget-title">
                            แปลงที่ยังไม่กรอกข้อมูลการใช้ปุ๋ยหรือสารเคมีตามแผนการปลูก
                        </div>
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>ลำดับ</th>
                                    <th>ชื่อแปลง</th>
                                    <th>ชนิดพืช</th>
                                    <th>วันที่เกินกำหนด</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unfilledPlots.map((item, idx) => (
                                    <tr key={item.id} className={idx % 2 === 1 ? 'row-highlight' : ''}>
                                        <td>{idx + 1}</td>
                                        <td>{item.name}</td>
                                        <td>{item.type}</td>
                                        <td>
                                            <span
                                                className="day-badge"
                                                style={getBadgeStyle(item.statusColor)}
                                            >
                                                {item.overdue} วัน
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Widget 2: ปริมาณการผลผลิต */}
                    <div className="widget">
                        <div className="widget-header-row">
                            <div className="widget-title-inline">ประมาณการผลผลิต</div>
                            <div className="period-selects">
                                <select
                                    className="month-select"
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(Number(e.target.value))}
                                >
                                    {THAI_MONTHS.map((name, idx) => (
                                        <option key={idx} value={idx}>{name}</option>
                                    ))}
                                </select>
                                <select
                                    className="month-select"
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                >
                                    {yearOptions.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>ลำดับ</th>
                                    <th>ชนิดพืช</th>
                                    <th>ปริมาณผลผลิต (กิโลกรัม)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productionData.map((item, idx) => (
                                    <tr key={item.id} className={idx % 2 === 1 ? 'row-highlight' : ''}>
                                        <td>{idx + 1}</td>
                                        <td>{item.type}</td>
                                        <td>
                                            <div className="bar-cell">
                                                <div className="bar-track">
                                                    <div
                                                        className="bar-fill"
                                                        style={{
                                                            width: `${(item.amount / item.max) * 100}%`,
                                                            backgroundColor: item.color
                                                        }}
                                                    />
                                                </div>
                                                <span className="bar-value">{item.amount.toLocaleString()}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
