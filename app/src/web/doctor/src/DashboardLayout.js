import React, { useState, useEffect, useRef } from 'react';
import { clientMo } from "../../../assets/js/moduleClient";
import './assets/style/DashboardLayout.scss';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useDoctor } from "./Doctor";
import { PopupDom } from "../../../assets/js/module";
import ManagePopup from "./page/form/ManagePopup";
import './assets/style/page/form/PageFormPlant.scss';

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
    const { profile } = useDoctor();
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
    const [allUnfilledPlots, setAllUnfilledPlots] = useState([]);
    const [unfilledPlots, setUnfilledPlots] = useState([]);

    const [PopBody, setPop] = useState(<></>);
    const RefPop = useRef();

    const showPopup = async (id_form) => {
        const context = await clientMo.post('/api/doctor/check');
        if (context) {
            setPop(
                <div className="data-list-content-page form-page" style={{ width: '100%', height: '100%', background: 'transparent' }}>
                    <ManagePopup
                        RefData={{ current: null }}
                        setPopup={setPop}
                        RefPop={RefPop}
                        id_form={id_form}
                        session={setSession}
                        Fecth={() => { }}
                    />
                </div>
            );
            setTimeout(() => {
                if (RefPop.current) {
                    RefPop.current.style.opacity = "1";
                    RefPop.current.style.visibility = "visible";
                }
            }, 100);
        } else {
            setSession();
        }
    };

    // ข้อมูลจริง — ประมาณการผลผลิต (รวมจากแต่ละใบ GAP ตามชนิดพืช + เดือน/ปีเก็บเกี่ยว)
    const [allProductionData, setAllProductionData] = useState([]);
    const [productionData, setProductionData] = useState([]);

    // Pagination state
    const [pageUnfilled, setPageUnfilled] = useState(1);
    const [pageProduction, setPageProduction] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const [allMapPins, setAllMapPins] = useState([]); // Store raw data
    const [mapPins, setMapPins] = useState([]);
    const [availablePlants, setAvailablePlants] = useState([]);

    const [highlightedFarmId, setHighlightedFarmId] = useState(null);
    const mapRef = useRef(null);

    const handleRowClick = (item) => {
        if (!item.id_farm_house) return;
        setHighlightedFarmId(item.id_farm_house);
        const pin = mapPins.find(p => p.id === item.id_farm_house);
        if (pin && mapRef.current) {
            mapRef.current.flyTo(pin.position, 18);
        }
    };

    const handlePinClick = (pin) => {
        setHighlightedFarmId(pin.id);
        // Find if this pin exists in the unfilledPlots table
        const index = unfilledPlots.findIndex(item => item.id_farm_house === pin.id);
        if (index !== -1) {
            // Calculate which page it is on
            const page = Math.floor(index / ITEMS_PER_PAGE) + 1;
            setPageUnfilled(page);
        }
    };

    // ดึงข้อมูลแปลงที่เกินกำหนดการใส่ปุ๋ย/สารเคมี
    useEffect(() => {
        const fetchOverduePlots = async () => {
            try {
                const response = await clientMo.post('/api/doctor/dashboard/overdue-plots', {});
                if (response) {
                    const data = typeof response === 'string' ? JSON.parse(response) : response;
                    if (Array.isArray(data)) {
                        setAllUnfilledPlots(data);
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
                // Fetch ALL locations once
                const response = await clientMo.post('/api/doctor/farmhouse/locations', {});
                if (response) {
                    const data = JSON.parse(response);
                    setAllMapPins(data);
                    
                    // Extract unique plants
                    const plants = new Set();
                    data.forEach(pin => {
                        if (pin.plants) {
                            pin.plants.forEach(p => {
                                if (p.name && p.name !== '-') plants.add(p.name);
                            });
                        }
                    });
                    setAvailablePlants(Array.from(plants));
                }
            } catch (error) {
                console.error("Error fetching locations:", error);
            }
        };
        fetchLocations();
    }, []); // Run only once on mount

    // Client-side filtering logic
    useEffect(() => {
        let filtered = allMapPins;

        if (selectedPlantType || selectedYield || selectedDisease) {
            filtered = allMapPins.map(pin => {
                // Filter the plants inside the pin
                const filteredPlants = (pin.plants || []).filter(p => {
                    let pass = true;

                    if (selectedPlantType && p.name !== selectedPlantType) pass = false;

                    if (selectedYield) {
                        let y = p.amount || 0;
                        if (selectedYield === 'low' && y >= 1000) pass = false;
                        if (selectedYield === 'mid' && (y < 1000 || y > 5000)) pass = false;
                        if (selectedYield === 'high' && y <= 5000) pass = false;
                    }

                    if (selectedDisease) {
                        let hasDisease = p.disease !== '-';
                        if (selectedDisease === 'none' && hasDisease) pass = false;
                        if (selectedDisease === 'found' && !hasDisease) pass = false;
                    }

                    return pass;
                });

                // If no plants match the filter, hide the entire pin
                if (filteredPlants.length === 0) return null;

                // Recompute pin status based on filtered plants
                const hasDisease = filteredPlants.some(p => p.disease !== '-');
                const totalAmount = filteredPlants.reduce((sum, p) => sum + (p.amount || 0), 0);

                return {
                    ...pin,
                    plants: filteredPlants,
                    hasDisease,
                    status: hasDisease ? 'red' : 'green',
                    totalAmount
                };
            }).filter(Boolean); // Remove null pins
        }

        setMapPins(filtered);
    }, [allMapPins, selectedPlantType, selectedYield, selectedDisease]);

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
                        setAllProductionData(data);
                    }
                }
            } catch (error) {
                console.error("Error fetching production data:", error);
            }
        };
        fetchProduction();
    }, [selectedMonth, selectedYear]);

    // Client-side filtering for Tables
    useEffect(() => {
        // Filter unfilled plots based on the currently filtered mapPins
        const allowedFormplantIds = new Set();
        mapPins.forEach(pin => {
            if (pin.plants) {
                pin.plants.forEach(p => allowedFormplantIds.add(p.formplant_id));
            }
        });
        
        let filteredUnfilled = allUnfilledPlots;
        if (selectedPlantType || selectedYield || selectedDisease) {
            filteredUnfilled = allUnfilledPlots.filter(plot => allowedFormplantIds.has(plot.id));
        }
        setUnfilledPlots(filteredUnfilled);
        setPageUnfilled(1);

        // Filter production data based on plant type
        let filteredProduction = allProductionData;
        if (selectedPlantType) {
            filteredProduction = allProductionData.filter(p => p.type === selectedPlantType);
        }
        setProductionData(filteredProduction);
        setPageProduction(1);

    }, [mapPins, allUnfilledPlots, allProductionData, selectedPlantType, selectedYield, selectedDisease]);


    const getBadgeStyle = (overdueDays) => {
        if (overdueDays >= 10) return { backgroundColor: '#e53935', color: '#fff' };
        if (overdueDays >= 7) return { backgroundColor: '#F57C3A', color: '#fff' };
        if (overdueDays >= 5) return { backgroundColor: '#F5C842', color: '#7a5a00' };
        if (overdueDays >= 3) return { backgroundColor: '#FDE98E', color: '#7a5a00' };
        return { backgroundColor: '#FFF3C4', color: '#7a5a00' };
    };

    // Pagination calculations
    const totalPagesUnfilled = Math.ceil(unfilledPlots.length / ITEMS_PER_PAGE);
    const paginatedUnfilled = unfilledPlots.slice(
        (pageUnfilled - 1) * ITEMS_PER_PAGE,
        pageUnfilled * ITEMS_PER_PAGE
    );

    const totalPagesProduction = Math.ceil(productionData.length / ITEMS_PER_PAGE);
    const paginatedProduction = productionData.slice(
        (pageProduction - 1) * ITEMS_PER_PAGE,
        pageProduction * ITEMS_PER_PAGE
    );

    return (
        <div className="dashboard-layout">
            {/* Filter Bar */}
            <div className="dashboard-filters">
                <select value={selectedPlantType} onChange={e => setSelectedPlantType(e.target.value)}>
                    <option value="">ชนิดพืช</option>
                    {availablePlants.map((plant, idx) => (
                        <option key={idx} value={plant}>{plant}</option>
                    ))}
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
                        key={`${profile?.lat}-${profile?.lng}`}
                        center={profile?.lat && profile?.lng ? [profile.lat, profile.lng] : [18.810, 98.980]}
                        zoom={16}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%', zIndex: 0 }}
                        ref={mapRef}
                    >
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
                        </LayersControl>

                        {mapPins.map(pin => (
                            <Marker
                                key={pin.id}
                                position={pin.position}
                                icon={pin.status === 'green' ? greenIcon : redIcon}
                                eventHandlers={{
                                    click: () => handlePinClick(pin)
                                }}
                            >
                                <Popup>
                                    <div className="map-popup">
                                        <div className="popup-header">
                                            <span className="popup-house-icon">🏠</span>
                                            <span className="popup-house-name">{pin.name}</span>
                                        </div>
                                        <div className="popup-plants-list">
                                            {pin.plants && pin.plants.map((plant, idx) => (
                                                <div key={idx} className="popup-plant-card" style={{ cursor: "pointer" }} onClick={() => showPopup(plant.formplant_id)}>
                                                    <div className="plant-card-header">
                                                        <span className="plant-icon">🌱</span>
                                                        <span className="plant-name">{plant.name}</span>
                                                        <span className={`plant-status-badge ${plant.status === 'กำลังปลูก' ? 'status-growing' : 'status-checking'}`}>
                                                            {plant.status}
                                                        </span>
                                                    </div>
                                                    <div className="plant-card-details">
                                                        <div className="plant-detail-item">
                                                            <span className="detail-label">ผลผลิต</span>
                                                            <span className="detail-value">{plant.amount.toLocaleString()} กก.</span>
                                                        </div>
                                                        <div className="plant-detail-item">
                                                            <span className="detail-label">โรค/ศัตรูพืช</span>
                                                            <span className={`detail-value ${plant.disease !== '-' ? 'disease-found' : ''}`}>{plant.disease}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {pin.plants && pin.plants.length > 1 && (
                                            <div className="popup-total">
                                                <span>รวมผลผลิตทั้งหมด</span>
                                                <strong>{pin.totalAmount.toLocaleString()} กก.</strong>
                                            </div>
                                        )}
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
                            แปลงที่รอการบันทึกข้อมูลตามแผน
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
                                    paginatedUnfilled.map((item, idx) => {
                                        const realIdx = (pageUnfilled - 1) * ITEMS_PER_PAGE + idx;
                                        return (
                                            <tr
                                                id={`row-${item.id}`}
                                                key={`${item.id}-${realIdx}`}
                                                className={`${idx % 2 === 1 ? 'row-highlight' : ''} ${highlightedFarmId === item.id_farm_house ? 'active-highlight' : ''}`}
                                                onClick={() => handleRowClick(item)}
                                                style={{ cursor: 'pointer', backgroundColor: highlightedFarmId === item.id_farm_house ? '#fff3e0' : undefined }}
                                            >
                                                <td>{realIdx + 1}</td>
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
                                                    {item.is_filled ? (
                                                        <span className="day-badge" style={{ backgroundColor: '#e53935', color: '#fff' }}>
                                                            ไม่ตรงตามแผน
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="day-badge"
                                                            style={getBadgeStyle(item.overdue)}
                                                        >
                                                            {item.overdue} วัน
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        {totalPagesUnfilled > 1 && (
                            <div className="pagination-controls">
                                <button
                                    className="page-btn"
                                    disabled={pageUnfilled === 1}
                                    onClick={() => setPageUnfilled(p => p - 1)}
                                >
                                    &laquo; ก่อนหน้า
                                </button>
                                <span className="page-info">หน้า {pageUnfilled} จาก {totalPagesUnfilled}</span>
                                <button
                                    className="page-btn"
                                    disabled={pageUnfilled === totalPagesUnfilled}
                                    onClick={() => setPageUnfilled(p => p + 1)}
                                >
                                    ถัดไป &raquo;
                                </button>
                            </div>
                        )}
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
                                    paginatedProduction.map((item, idx) => {
                                        const realIdx = (pageProduction - 1) * ITEMS_PER_PAGE + idx;
                                        return (
                                            <tr key={item.id} className={idx % 2 === 1 ? 'row-highlight' : ''}>
                                                <td>{realIdx + 1}</td>
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
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        {totalPagesProduction > 1 && (
                            <div className="pagination-controls">
                                <button
                                    className="page-btn"
                                    disabled={pageProduction === 1}
                                    onClick={() => setPageProduction(p => p - 1)}
                                >
                                    &laquo; ก่อนหน้า
                                </button>
                                <span className="page-info">หน้า {pageProduction} จาก {totalPagesProduction}</span>
                                <button
                                    className="page-btn"
                                    disabled={pageProduction === totalPagesProduction}
                                    onClick={() => setPageProduction(p => p + 1)}
                                >
                                    ถัดไป &raquo;
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div id="popup-detail-form">
                <PopupDom Ref={RefPop} Body={PopBody} zIndex={1001} />
            </div>
        </div>
    );
};

export default DashboardLayout;
