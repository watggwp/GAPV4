import { useCallback, useEffect, useRef, useState } from "react";
import { DateSelect, DayJSX, MapsJSX } from "../../../../../../assets/js/module";
import "../../../assets/style/page/form/FormEdit.scss";
import axios from "axios";
import { clientMo } from "../../../../../../assets/js/moduleClient";

export default function FormPlant({
    data,
    mode,
    setMode,
    setEditValue,
    getResize,
}) {
    const [editValue, setLocalEditValue] = useState({});
    const [localMode, setLocalMode] = useState(mode);

    const DateGlow = useRef()
    const DatePlant = useRef()
    const DateHarvest = useRef()
    const DateSuccess = useRef()

    const extractLatLngFromGoogleMapsUrl = (url) => {
        const match = url.match(/@([-.\d]+),([-.\d]+)/);
        return match ? { lat: match[1], lng: match[2] } : null;
    };

    // แปลงวันที่ให้ตรงกับรูปแบบ input type="date"
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
    };

    // ฟังก์ชันแปลงวันที่เป็นภาษาไทย
    const formatDateThai = (dateString) => {
        if (!dateString) return "ยังไม่ระบุ";
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "รูปแบบวันที่ไม่ถูกต้อง";

        const monthNamesThai = [
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
        ];

        return `วันที่ ${date.getDate()} ${monthNamesThai[date.getMonth()]} ${date.getFullYear() + 543}`;
    };

    const onEdit = useCallback((name, value) => {
        setLocalEditValue(editValue => ({
            ...editValue,
            [name]: value
        }));
    }, []);

    useEffect(() => {
        setMode("view");
        setEditValue({});
        setLocalEditValue({});
        setLocalMode("view");
    }, [setMode, setEditValue]);

    const toggleMode = () => {
        if (localMode === "view") {
            setLocalMode("edit");
            setMode("edit");
        } else {
            handleSaveToAPI();
        }
    };

    // ฟังก์ชันบันทึกข้อมูลไป API
    const handleSaveToAPI = async () => {
        console.log("🟢 บันทึกค่า editValue:", editValue);

        if (Object.keys(editValue).length === 0) {
            console.log("⚠️ ไม่มีการเปลี่ยนแปลง");
            setLocalMode("view");
            setMode("view");
            return;
        }

        try {
            const stringData = await clientMo.post("/api/doctor/formplant/edit", {
                id_plant: data.id,
                id_farmhouse: data.id_farm_house,
                dataChange: editValue
            });

            const app = JSON.parse(stringData)
            console.log("✅ API app:", app.data);

            if (app.data === "133") {
                console.log("🎉 บันทึกสำเร็จ");
                setLocalMode("view");
                setMode("view");
                setEditValue({});
                setLocalEditValue({});
            } else {
                console.error("❌ เกิดข้อผิดพลาด:", app.data);
            }
        } catch (error) {
            console.error("❌ API ERROR:", error);
        }
    };

    const onCancel = () => {
        console.log("❌ ยกเลิกการแก้ไข");
        setLocalEditValue({});
        setLocalMode("view");
        setMode("view");
    };

    return (
        <section className="detail-main-form">
            <div className="button-group">
                {localMode === "edit" ? (
                    <>
                        <button onClick={handleSaveToAPI} className="toggle-btn">บันทึก</button>
                        <button onClick={onCancel} className="cancel-btn">ยกเลิก</button>
                    </>
                ) : (
                    <button onClick={toggleMode} className="toggle-btn">แก้ไข</button>
                )}
            </div>

            {/* ถ้าอยู่ในโหมด edit ให้เพิ่มช่องกรอกหมายเหตุ */}
            {localMode === "edit" && (
                <div className="content-data">
                    <div className="data-row">
                        <div className={`data-main ${getResize >= 450 ? "in-1" : "in-1 screen-small"}`}>
                            <span className="head-data">หมายเหตุ</span>
                            <input 
                                type="text" 
                                className="data-show" 
                                placeholder="ใส่หมายเหตุ" 
                                value={editValue.remark ?? ""} 
                                onChange={(event) => onEdit("remark", event.target.value)} 
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="content-data">
                <div className="number">1.</div>
                <div className="data-row">
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ชนิดพืช</span>
                            <input className="data-show" 
                                value={editValue.type_main ?? data.type_main} 
                                readOnly={localMode==="view"} 
                                onChange={(event) => onEdit("type_main", event.target.value)} />
                        </div>
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ชื่อพืช</span>
                            <input className="data-show" 
                                value={editValue.name_plant ?? data.name_plant} 
                                readOnly={localMode==="view"} 
                                onChange={(event) => onEdit("name_plant", event.target.value)} />
                        </div>
                    </div>

                    {/* วันที่เพาะกล้า */}
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่เพาะกล้า</span>
                            {localMode === "view" ? (
                                <span className="data-show">{formatDateThai(data.date_glow)}</span>
                            ) : (
                                <DateSelect RefDateValue={DateGlow} Value={data.date_glow} onChangeDate={(dateNew) => onEdit("date_glow", dateNew)}/>
                            )}
                        </div>

                        {/* วันที่ปลูก */}
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่ปลูก</span>
                            {localMode === "view" ? (
                                <span className="data-show">{formatDateThai(data.date_plant)}</span>
                            ) : (
                                <DateSelect RefDateValue={DatePlant} Value={data.date_plant} onChangeDate={(dateNew) => onEdit("date_plant", dateNew)}/>
                            )}
                        </div>
                    </div>
                    <div className="row">
                        {/* วันที่คาดว่าจะเก็บเกี่ยว */}
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่คาดว่าจะเก็บเกี่ยว</span>
                            {localMode === "view" ? (
                                <DayJSX TYPE="small" TEXT="วันที่" DATE={data.date_harvest} />
                            ) : (
                                <DateSelect RefDateValue={DateHarvest} Value={data.date_harvest} onChangeDate={(dateNew) => onEdit("date_harvest", dateNew)}/>
                            )}
                        </div>

                        {/* วันที่เก็บเกี่ยว */}
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่เก็บเกี่ยว</span>
                            {localMode === "view" ? (
                                data.date_success ? (
                                    <DayJSX TYPE="small" TEXT="วันที่" DATE={data.date_success} />
                                ) : (
                                    <span className="data-show">ยังไม่เก็บเกี่ยว</span>
                                )
                            ) : (
                                <DateSelect RefDateValue={DateSuccess} Value={data.date_success} onChangeDate={(dateNew) => onEdit("date_success", dateNew)}/>
                            )}
                        </div>
                    </div>

                    <div className="row">
                        {/* พื้นที่เพาะปลูก */}
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">พื้นที่</span>
                            {localMode === "view" ? (
                                <span className="data-show">
                                    {data.area} <span className="unit">{data.unit}</span>
                                </span>
                            ) : (
                                <div className="data-show">
                                    <input 
                                        type="number" 
                                        className="data-input" 
                                        value={editValue.area ?? data.area} 
                                        onChange={(event) => onEdit("area", event.target.value)}
                                    />
                                    <select 
                                        className="unit-select"
                                        value={editValue.unit ?? data.unit}
                                        onChange={(event) => onEdit("unit", event.target.value)}
                                    >
                                        <option value="โรงเรือน">โรงเรือน</option>
                                        <option value="ตารางเมตร">ตารางเมตร</option>
                                        <option value="ไร่">ไร่</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* จำนวนต้น */}
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">จำนวนต้น</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.qty}</span>
                            ) : (
                                <input 
                                    type="number" 
                                    className="data-show" 
                                    value={editValue.qty ?? data.qty} 
                                    onChange={(event) => onEdit("qty", event.target.value)} 
                                />
                            )}
                        </div>
                    </div>

                    <div className="row">
                        <span className="head-text">ระยะการปลูก</span>
                        <div className="text-body">
                            {/* ระยะระหว่างต้น */}
                            <div className={`data-main ${getResize >= 450 ? "in-2 column" : "in-1 screen-small"}`}>
                                <span className="head-data">ระหว่างต้น</span>
                                {localMode === "view" ? (
                                    <span className="data-show">{data.posi_w} เซนติเมตร</span>
                                ) : (
                                    <div className="data-show">
                                        <input 
                                            type="number" 
                                            className="data-input" 
                                            value={editValue.posi_w ?? data.posi_w} 
                                            onChange={(event) => onEdit("posi_w", event.target.value)}
                                        />
                                        <span className="unit">เซนติเมตร</span>
                                    </div>
                                )}
                            </div>

                            {/* ระยะระหว่างแถว */}
                            <div className={`data-main ${getResize >= 450 ? "in-2 column" : "in-1 screen-small"}`}>
                                <span className="head-data">ระหว่างแถว</span>
                                {localMode === "view" ? (
                                    <span className="data-show">{data.posi_h} เซนติเมตร</span>
                                ) : (
                                    <div className="data-show">
                                        <input 
                                            type="number" 
                                            className="data-input" 
                                            value={editValue.posi_h ?? data.posi_h} 
                                            onChange={(event) => onEdit("posi_h", event.target.value)}
                                        />
                                        <span className="unit">เซนติเมตร</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">รุ่นที่ปลูก</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.generation}</span>
                            ) : (
                                <input 
                                    type="text" 
                                    className="data-show" 
                                    value={editValue.generation ?? data.generation} 
                                    onChange={(event) => onEdit("generation", event.target.value)} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-data">
                <div className="number">2.</div>
                <div className="data-row">
                    <div className="row">
                        <div className={`data-main in-1 column ${getResize < 450 ? "screen-small" : ""}`}>
                            <span className="head-data" style={{width : "110px"}}>รูปแบบการปลูก</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.system_glow}</span>
                            ) : (
                                <input 
                                    type="text" 
                                    className="data-show" 
                                    value={editValue.system_glow ?? data.system_glow} 
                                    onChange={(event) => onEdit("system_glow", event.target.value)} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-data">
                <div className="number">3.</div>
                <div className="data-row">
                    <div className="row">
                        <div className={`data-main in-1 ${getResize < 450 ? "screen-small" : ""}`}>
                            <span className="head-data" style={{width : "110px"}}>แหล่งน้ำ</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.water}</span>
                            ) : (
                                <input 
                                    type="text" 
                                    className="data-show" 
                                    value={editValue.water ?? data.water} 
                                    onChange={(event) => onEdit("water", event.target.value)} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-data">
                <div className="number">4.</div>
                <div className="data-row">
                    <div className="row">
                        <div className={`data-main in-1 ${getResize < 450 ? "screen-small" : ""}`}>
                            <span className="head-data" style={{width : "110px"}}>วิธีการให้น้ำ</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.water_flow}</span>
                            ) : (
                                <input 
                                    type="text" 
                                    className="data-show" 
                                    value={editValue.water_flow ?? data.water_flow} 
                                    onChange={(event) => onEdit("water_flow", event.target.value)} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-data">
                <div className="number">5.</div>
                <div className="data-row">
                    <div className="row">
                        <div className={`data-main in-1 ${getResize < 450 ? "screen-small" : ""}`}>
                            <span style={{width : "100%"}} className="head-data">ประวัติการใช้พื้นที่และการเกิดโรค</span>
                        </div>
                    </div>

                    {/* ชนิดพืชก่อนหน้า & โรค/แมลงที่พบ */}
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ชนิดพืชก่อนหน้า</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.history ? data.history : "ไม่ระบุ"}</span>
                            ) : (
                                <input 
                                    type="text" 
                                    className="data-show" 
                                    value={editValue.history ?? data.history} 
                                    onChange={(event) => onEdit("history", event.target.value)} 
                                />
                            )}
                        </div>

                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">โรค/แมลงที่พบ</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.insect ? data.insect : "ไม่ระบุ"}</span>
                            ) : (
                                <input 
                                    type="text" 
                                    className="data-show" 
                                    value={editValue.insect ?? data.insect} 
                                    onChange={(event) => onEdit("insect", event.target.value)} 
                                />
                            )}
                        </div>
                    </div>

                    {/* ปริมาณการเกิด & การป้องกันกำจัด */}
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ปริมาณการเกิด</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.qtyInsect ? data.qtyInsect : "ไม่ระบุ"}</span>
                            ) : (
                                <input 
                                    type="number" 
                                    className="data-show" 
                                    value={editValue.qtyInsect ?? data.qtyInsect} 
                                    onChange={(event) => onEdit("qtyInsect", event.target.value)} 
                                />
                            )}
                        </div>

                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">การป้องกันกำจัด</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.seft ? data.seft : "ไม่ระบุ"}</span>
                            ) : (
                                <input 
                                    type="text" 
                                    className="data-show" 
                                    value={editValue.seft ?? data.seft} 
                                    onChange={(event) => onEdit("seft", event.target.value)} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {data.location_house && (
                <div className="content-data">
                    <div className="data-row">
                        <div className="row">
                            <div className="data-main in-1 column">
                                <span className="head-data">ตำแหน่งที่ทำการเกษตรกร</span>

                                {localMode === "view" ? (
                                    <a 
                                        href={`https://www.google.com/maps?q=${data.location_house.x},${data.location_house.y}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="data-show"
                                    >
                                        ดูตำแหน่งบน Google Maps
                                    </a>
                                ) : (
                                    <div className="edit-map">
                                        <label>ลิงก์ Google Maps:</label>
                                        <input 
                                            type="text" 
                                            className="data-input"
                                            placeholder="วางลิงก์จาก Google Maps"
                                            value={editValue.mapUrl ?? ""}
                                            onChange={(event) => {
                                                const url = event.target.value;
                                                onEdit("mapUrl", url);

                                                const coords = extractLatLngFromGoogleMapsUrl(url);
                                                if (coords) {
                                                    onEdit("lat", coords.lat);
                                                    onEdit("lng", coords.lng);
                                                }
                                            }}
                                        />

                                        {editValue.lat && editValue.lng && (
                                            <p>พิกัด: {editValue.lat}, {editValue.lng}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
}
