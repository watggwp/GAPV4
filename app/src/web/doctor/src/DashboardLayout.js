import React, { useState, useEffect } from 'react';
import { clientMo } from "../../../assets/js/moduleClient";
import './assets/style/DashboardLayout.scss';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
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

const CurrentLocationMarker = () => {
    const map = useMap();
    useEffect(() => {
        map.locate().on("locationfound", function (e) {
            map.flyTo(e.latlng, map.getZoom());
        });
    }, [map]);
    return null;
};

const DashboardLayout = ({ setMain, socket, setSession }) => {
    const now = new Date();
    const [selectedPlantType, setSelectedPlantType] = useState('');
    const [selectedYield, setSelectedYield] = useState('');
    const [selectedDisease, setSelectedDisease] = useState('');

    // default = วันนี้ (พ.ศ.)
    const currentBE = now.getFullYear() + 543;
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
    const [selectedYear, setSelectedYear] = useState(currentBE);

    // แสดงปีปัจจุบันถึง +1 ปี (auto, พ.ศ.)
    const yearOptions = Array.from({ length: 2 }, (_, i) => currentBE + i);

    // ข้อมูลจริง — แปลงที่ยังไม่กรอกข้อมูลการใช้ปุ๋ย/สารเคมีตามแผนการปลูก
    const [unfilledPlots, setUnfilledPlots] = useState([]);

    // ข้อมูลจริง — ประมาณการผลผลิต (รวมจากแต่ละใบ GAP ตามชนิดพืช + เดือน/ปีเก็บเกี่ยว)
    const [productionData, setProductionData] = useState([]);

    const [mapPins, setMapPins] = useState([]);

    // ดึงข้อมูลแปลงที่เกินกำหนดการใส่ปุ๋ย/สารเคมี
    useEffect(() => {
        const fetchOverduePlots = async () => {
            try {
                const response = await clientMo.post('/api/doctor/dashboard/overdue-plots', {});
                if (response) {
                    const data = typeof response === 'string' ? JSON.parse(response) : response;
                    if (Array.isArray(data)) {
                        setUnfilledPlots(data);
                    }
                }
            } catch (error) {
                console.error("Error fetching overdue plots:", error);
            }
        };
        fetchOverduePlots();
    }, []);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await clientMo.post('/api/doctor/farmhouse/locations', {
                    plant_type: selectedPlantType,
                    yield_range: selectedYield,
                    disease_status: selectedDisease
                });
                if (response) {
                    setMapPins(JSON.parse(response));
                }
            } catch (error) {
                console.error("Error fetching locations:", error);
            }
        };
        fetchLocations();
    }, [selectedPlantType, selectedYield, selectedDisease]);

    // ดึงข้อมูลประมาณการผลผลิต (re-fetch เมื่อเปลี่ยนเดือน/ปี)
    useEffect(() => {
        const fetchProduction = async () => {
            try {
                const response = await clientMo.post('/api/doctor/dashboard/production', {
                    month: selectedMonth,
                    year: selectedYear
                });
                if (response) {
                    const data = typeof response === 'string' ? JSON.parse(response) : response;
                    if (Array.isArray(data)) {
                        setProductionData(data);
                    }
                }
            } catch (error) {
                console.error("Error fetching production data:", error);
            }
        };
        fetchProduction();
    }, [selectedMonth, selectedYear]);

    const center = [18.810, 98.980];

    const getBadgeStyle = (overdueDays) => {
        if (overdueDays >= 10) return { backgroundColor: '#e53935', color: '#fff' };
        if (overdueDays >= 7) return { backgroundColor: '#F57C3A', color: '#fff' };
        if (overdueDays >= 5) return { backgroundColor: '#F5C842', color: '#7a5a00' };
        if (overdueDays >= 3) return { backgroundColor: '#FDE98E', color: '#7a5a00' };
        return { backgroundColor: '#FFF3C4', color: '#7a5a00' };
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
                        <CurrentLocationMarker />
                        <LayersControl position="topright">
                            <LayersControl.BaseLayer name="แผนที่ทั่วไป (Street)">
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer checked name="ดาวเทียม (Satellite)">
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
                            <LayersControl.BaseLayer name="โหมดมืด (Dark Matter)">
                                <TileLayer
                                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="ภูมิประเทศ (OpenTopoMap)">
                                <TileLayer
                                    attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
                                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="ถนนและอาคารชัดเจน (OSM HOT)">
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="เส้นทางรอง/สีเขียว (CyclOSM)">
                                <TileLayer
                                    attribution='&copy; <a href="https://www.cyclosm.org">CyclOSM</a>'
                                    url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
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
                                    <th>กิจกรรม</th>
                                    <th>วันที่เกินกำหนด</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unfilledPlots.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                            ไม่มีแปลงที่เกินกำหนด
                                        </td>
                                    </tr>
                                ) : (
                                    unfilledPlots.map((item, idx) => (
                                        <tr key={`${item.id}-${idx}`} className={idx % 2 === 1 ? 'row-highlight' : ''}>
                                            <td>{idx + 1}</td>
                                            <td>{item.name}</td>
                                            <td>{item.type}</td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.85em',
                                                    color: item.category === 1 ? '#2e7d32' : '#c62828'
                                                }}>
                                                    {item.category === 1 ? '🌿 ' : '🧪 '}
                                                    {item.schedule_title}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className="day-badge"
                                                    style={getBadgeStyle(item.overdue)}
                                                >
                                                    {item.overdue} วัน
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
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
                                    <th>จำนวนแปลง</th>
                                    <th>ปริมาณผลผลิต (กิโลกรัม)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productionData.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                            ไม่มีข้อมูลผลผลิตในเดือนนี้
                                        </td>
                                    </tr>
                                ) : (
                                    productionData.map((item, idx) => (
                                        <tr key={item.id} className={idx % 2 === 1 ? 'row-highlight' : ''}>
                                            <td>{idx + 1}</td>
                                            <td>{item.type}</td>
                                            <td style={{ textAlign: 'center' }}>{item.plot_count}</td>
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
