import { useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateSelect, DayJSX, MapsJSX } from "../../../../../assets/js/module";
import "../../../../doctor/src/assets/style/page/form/FormEdit.scss";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { AdminContext } from "../../Admin";
import { inputBaseClasses, MenuItem, Select, selectClasses, Stack, TextField, textFieldClasses } from "@mui/material";
import RequestAPI from "../../../../../assets/js/requestAPI";

export default function FormPlant({
    data,
    mode,
    setMode,
    setEditValue,
    getResize,
    FetchContent
}) {
    const [editValue, setLocalEditValue] = useState({});
    const [localMode, setLocalMode] = useState(mode);

    const [plants, setPlants] = useState({
        plants: [],
        mapping_plants: new Map()
    })
    const [loadingPlants, setLoadingPlants] = useState(false)

    const { profile } = useContext(AdminContext) //role
    const [previousInsects, setPreviousInsects] = useState([]);

    const fetchInsectList = useCallback(async () => {
        try {
            const res = await clientMo.post("/api/admin/formplant/history", {
                id_farmhouse: data.id_farm_house,
                name_plant_list: editValue.name_plant ?? data.name_plant
            });
            if (res) {
                const parsed = JSON.parse(res);
                setPreviousInsects(parsed.insect || []);
            }
        } catch (e) {
            console.error("fetchInsectList error:", e);
        }
    }, [data.id_farm_house, data.name_plant, editValue.name_plant]);

    useEffect(() => {
        if (localMode === "edit") {
            fetchInsectList();
        }
    }, [localMode, editValue.name_plant, fetchInsectList]);



    const systemGlowOptions = useMemo(() => {
        const base = ["เลือก", "ขึ้นแปลงปลูกตามไหล่เขา", "ขึ้นแปลงปลูกที่ลุ่มหลังนา", "ปลูกแบบขึ้นค้าง", "ระบบ Hydroponic", "ปลูกในวัสดุปลูก", "ในโรงเรือน"];
        const current = editValue.system_glow ?? data.system_glow;
        if (current && !base.includes(current)) {
            base.push(current);
        }
        return base;
    }, [editValue.system_glow, data.system_glow]);

    const waterOptions = useMemo(() => {
        const base = ["เลือก", "อาศัยน้ำฝน", "ลำธาร/คลองธรรมชาติ", "บ่อบาดาล", "บ่อ/สระขุด", "คลองชลประทาน", "อ่างเก็บน้ำ"];
        const current = editValue.water ?? data.water;
        if (current && !base.includes(current)) {
            base.push(current);
        }
        return base;
    }, [editValue.water, data.water]);

    const waterFlowOptions = useMemo(() => {
        const base = ["เลือก", "สปริงเกอร์", "ระบบน้ำหยด", "ปล่อยตามร่อง", "ใช้สายยางรด", "ตักรด"];
        const current = editValue.water_flow ?? data.water_flow;
        if (current && !base.includes(current)) {
            base.push(current);
        }
        return base;
    }, [editValue.water_flow, data.water_flow]);

    const qtyInsectOptions = useMemo(() => {
        const base = ["เลือก", "น้อย", "ปานกลาง", "มาก"];
        const current = editValue.qtyInsect ?? data.qtyInsect;
        if (current && !base.includes(current)) {
            base.push(current);
        }
        return base;
    }, [editValue.qtyInsect, data.qtyInsect]);

    const insectOptions = useMemo(() => {
        const list = ["เลือก", ...previousInsects];
        const current = editValue.insect ?? data.insect;
        if (current && !list.includes(current)) {
            list.push(current);
        }
        return list;
    }, [previousInsects, editValue.insect, data.insect]);



    const DisabledButtonEdit = useMemo(() => {
        const { because, ...editDatas } = editValue;
        if (!because || because.trim() === "") return true;
        const keys = Object.keys(editDatas);
        if (keys.length === 0) return true;

        // fields that must not be empty if they are present in editDatas
        const requiredFields = ["name_plant", "date_plant", "date_harvest", "qty", "area", "generation"];
        for (const key of keys) {
            if (requiredFields.includes(key) && !editDatas[key]) {
                return true;
            }
        }
        return false;
    }, [editValue])

    const DateGlow = useRef()
    const DatePlant = useRef()
    const DateHarvest = useRef()
    const DateSuccess = useRef()

    const fetchPlantList = useCallback(async () => {
        setLoadingPlants(true)
        const { data, status } = await RequestAPI.get("/api/admin/plant/list", {
            is_variety_name: true
        })
        setLoadingPlants(false)
        try {
            if (typeof data === "string") throw new Error("data error")

            const { plants } = data

            if (!Array.isArray(plants)) throw new Error("data error")

            setPlants((plantsData) => {
                const uniquePlantsMap = new Map();
                const mappingPlants = new Map();
                const qtyMap = new Map();
                const typeMainMap = new Map();

                plants.forEach(plant => {
                    const { name, variety_name, qty_harvest, type_main } = plant;
                    if (!uniquePlantsMap.has(name)) {
                        uniquePlantsMap.set(name, { name });
                    }
                    if (!mappingPlants.has(name)) {
                        mappingPlants.set(name, []);
                    }
                    if (variety_name && variety_name !== '' && variety_name !== '-') {
                        mappingPlants.get(name).push(variety_name);
                    }
                    qtyMap.set(name + "|" + (variety_name || ""), qty_harvest);
                    if (type_main && !typeMainMap.has(name)) {
                        typeMainMap.set(name, type_main);
                    }
                });

                return {
                    plants: Array.from(uniquePlantsMap.values()),
                    mapping_plants: mappingPlants,
                    qty_map: qtyMap,
                    type_main_map: typeMainMap
                };
            })
        } catch (e) { }
    }, [])

    const extractLatLngFromGoogleMapsUrl = (url) => {
        const match = url.match(/@([-.\d]+),([-.\d]+)/);
        return match ? { lat: match[1], lng: match[2] } : null;
    };

    // ฟังก์ชันแปลงวันที่เป็นภาษาไทย
    const formatDateThai = (dateString) => {
        if (!dateString) return "ยังไม่ระบุ";

        const monthNamesThai = [
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
        ];

        const str = String(dateString);

        if (/^\d{4}$/.test(str)) {
            return `ปี ${Number(str) + 543}`;
        }

        if (/^\d{4}-(\d{2}|##)$/.test(str)) {
            const year = str.slice(0, 4);
            const month = str.slice(5, 7);
            if (month === "##") return `ปี ${Number(year) + 543}`;
            return `${monthNamesThai[Number(month) - 1]} ปี ${Number(year) + 543}`;
        }

        if (/^\d{4}-(\d{2}|##)-(\d{2}|##)$/.test(str)) {
            const year = str.slice(0, 4);
            const month = str.slice(5, 7);
            const day = str.slice(8, 10);
            if (month === "##") return `ปี ${Number(year) + 543}`;
            if (day === "##") return `${monthNamesThai[Number(month) - 1]} ปี ${Number(year) + 543}`;
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "รูปแบบวันที่ไม่ถูกต้อง";
        return `วันที่ ${date.getDate()} ${monthNamesThai[date.getMonth()]} ${date.getFullYear() + 543}`;
    };

    const onEdit = useCallback((name, value) => {
        setLocalEditValue(editValue => ({
            ...editValue,
            [name]: value
        }));
    }, [])

    const calculateHarvestDate = useCallback((plantName, varietyName, plantDate) => {
        if (!plantName || !plantDate) return null;
        const vName = varietyName || "";
        let qty = plants.qty_map?.get(plantName + "|" + vName);
        if (qty === undefined) {
            qty = plants.qty_map?.get(plantName + "|");
        }
        if (qty === undefined) {
            for (const [key, val] of plants.qty_map?.entries() || []) {
                if (key.startsWith(plantName + "|")) {
                    qty = val;
                    break;
                }
            }
        }
        if (qty !== undefined && qty !== null) {
            const pDate = new Date(plantDate);
            if (!isNaN(pDate.getTime())) {
                pDate.setDate(pDate.getDate() + parseInt(qty) + 1);
                return pDate.toISOString().split('T')[0];
            }
        }
        return null;
    }, [plants.qty_map]);

    const handlePlantChange = useCallback((newPlantName) => {
        setLocalEditValue(editValue => {
            const updated = {
                ...editValue,
                name_plant: newPlantName,
                name_varieties: ""
            };
            const plantDate = updated.date_plant ?? data.date_plant;

            // auto-set type_main
            const newTypeMain = plants.type_main_map?.get(newPlantName);
            if (newTypeMain) {
                updated.type_main = newTypeMain;
            }

            // auto-set name_varieties ถ้ามีสายพันธุ์เดียว
            const varieties = plants.mapping_plants?.get(newPlantName) ?? [];
            const autoVariety = varieties.length === 1 ? varieties[0] : "";
            updated.name_varieties = autoVariety;

            const newHarvestDate = calculateHarvestDate(newPlantName, autoVariety, plantDate);
            if (newHarvestDate) {
                updated.date_harvest = newHarvestDate;
            }
            return updated;
        });
    }, [data.date_plant, calculateHarvestDate, plants.type_main_map, plants.mapping_plants]);

    const handleVarietyChange = useCallback((newVarietyName) => {
        setLocalEditValue(editValue => {
            const updated = {
                ...editValue,
                name_varieties: newVarietyName
            };
            const plantName = updated.name_plant ?? data.name_plant;
            const plantDate = updated.date_plant ?? data.date_plant;
            const newHarvestDate = calculateHarvestDate(plantName, newVarietyName, plantDate);
            if (newHarvestDate) {
                updated.date_harvest = newHarvestDate;
            }
            return updated;
        });
    }, [data.name_plant, data.date_plant, calculateHarvestDate]);

    const handlePlantDateChange = useCallback((newPlantDate) => {
        setLocalEditValue(editValue => {
            const updated = {
                ...editValue,
                date_plant: newPlantDate
            };
            const plantName = updated.name_plant ?? data.name_plant;
            const varietyName = updated.name_varieties ?? data.name_varieties ?? "";
            const newHarvestDate = calculateHarvestDate(plantName, varietyName, newPlantDate);
            if (newHarvestDate) {
                updated.date_harvest = newHarvestDate;
            }
            return updated;
        });
    }, [data.name_plant, data.name_varieties, calculateHarvestDate]);

    useEffect(() => {
        setMode("view");
        setEditValue({});
        setLocalEditValue({});
        setLocalMode("view");
    }, [setMode, setEditValue]);

    const handleSaveToAPI = useCallback(async () => {
        const { because, ...editDatas } = editValue
        console.log("🟢 บันทึกค่า editValue:", editDatas);

        if (editDatas.date_plant) {
            const dateStr = editDatas.date_plant.replace(/##/g, "01");
            const selectedDate = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            if (!isNaN(selectedDate.getTime()) && selectedDate > today) {
                alert("วันที่ปลูกต้องไม่เป็นวันที่ในอนาคต");
                return;
            }
        }

        setLocalMode("view");
        setMode("view");
        setEditValue({});
        setLocalEditValue({})
        if (Object.keys(editDatas).length === 0) {
            console.log("⚠️ ไม่มีการเปลี่ยนแปลง");
            alert("กรุณาแก้ไขข้อมูล")
            return;
        }

        try {
            const stringData = await clientMo.post("/api/admin/formplant/edit", {
                id_plant: data.id,
                id_farmhouse: data.id_farm_house,
                because: because,
                dataChange: editDatas
            });

            const response = JSON.parse(stringData)
            console.log("✅ API response:", response);

            switch (response) {
                case 133:
                    FetchContent(0)
                    break;
                default:
                    alert("เกิดข้อผิดพลาด")
            }
        } catch (error) {
            console.error("❌ API ERROR:", error);
        }
    }, [FetchContent, data.id, data.id_farm_house, editValue, setEditValue, setMode])

    const toggleMode = useCallback(() => {
        if (localMode === "view") {
            setLocalMode("edit");
            setMode("edit");
            fetchPlantList()
        } else {
            handleSaveToAPI();
        }
    }, [fetchPlantList, handleSaveToAPI, localMode, setMode])

    const onCancel = () => {
        console.log("❌ ยกเลิกการแก้ไข");
        setLocalEditValue({});
        setLocalMode("view");
        setMode("view");
    };

    return (
        <section className="detail-main-form">

            {
                Boolean(profile?.username) && //role
                <div className="button-group">
                    {
                        localMode === "edit" ? (
                            <>
                                <button disabled={DisabledButtonEdit} onClick={handleSaveToAPI} className="toggle-btn">บันทึก</button>
                                <button onClick={onCancel} className="cancel-btn">ยกเลิก</button>
                            </>
                        ) : (
                            <button onClick={toggleMode} className="toggle-btn">แก้ไข</button>
                        )
                    }
                </div>
            }

            {/* ถ้าอยู่ในโหมด edit ให้เพิ่มช่องกรอกหมายเหตุ */}
            {localMode === "edit" && (
                <div className="content-data">
                    <div className="data-row">
                        <Stack>
                            <span className="head-data">หมายเหตุ</span>
                            {/* <input 
                                type="text" 
                                
                            /> */}
                            <TextField
                                hiddenLabel
                                className="data-show"
                                placeholder="ใส่หมายเหตุ"
                                value={editValue.because ?? ""}
                                onChange={(event) => onEdit("because", event.target.value)}
                                size="small"
                                multiline
                                rows={3}
                                sx={{
                                    [`& .${inputBaseClasses.root}`]: {
                                        bgcolor: "white"
                                    }
                                }}
                            />
                        </Stack>
                        {/* <div className={`data-main ${getResize >= 450 ? "in-1" : "in-1 screen-small"}`}>
                            
                        </div> */}
                    </div>
                </div>
            )}

            <div className="content-data">
                <div className="number">1.</div>
                <div className="data-row">
                    <div className="row-content">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ชนิดพืช</span>
                            <input className="data-show" disabled
                                value={editValue.type_main ?? data.type_main}
                                readOnly={localMode === "view"}
                                onChange={(event) => onEdit("type_main", event.target.value)} />
                        </div>

                        <div className={`data-main in-1 screen-small`}>
                            <span className="head-data">ชื่อพืช</span>
                            {
                                localMode === "view" ?
                                    <input className="data-show"
                                        readOnly
                                        value={editValue.name_plant ?? data.name_plant}
                                    />
                                    :
                                    <Select
                                        value={editValue.name_plant ?? data.name_plant}
                                        onChange={(event) => handlePlantChange(event.target.value)}
                                        size="small"
                                        sx={{
                                            [`& .${selectClasses.select}`]: {
                                                bgcolor: "white"
                                            },
                                            textAlign: "center"
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 300,
                                                },
                                            },
                                        }}
                                    >
                                        {
                                            plants.plants.map(({ name }) =>
                                                <MenuItem value={name} >{name}</MenuItem>
                                            )
                                        }
                                    </Select>
                            }
                        </div>

                        <div className={`data-main in-1 screen-small`}>
                            <span className="head-data">ชื่อสายพันธุ์พืช</span>
                            {
                                localMode === "view" ?
                                    <input className="data-show"
                                        readOnly
                                        value={editValue.name_varieties ?? data.name_varieties}
                                    />
                                    :
                                    (
                                        plants.mapping_plants?.get(editValue.name_plant ?? data.name_plant)?.length ?
                                            <Select
                                                value={(editValue.name_varieties ?? data.name_varieties) || ""}
                                                onChange={(event) => handleVarietyChange(event.target.value)}
                                                size="small"
                                                sx={{
                                                    [`& .${selectClasses.select}`]: {
                                                        bgcolor: "white"
                                                    },
                                                    textAlign: "center",
                                                }}
                                                displayEmpty
                                                MenuProps={{
                                                    PaperProps: {
                                                        style: {
                                                            maxHeight: 300,
                                                        },
                                                    },
                                                }}
                                            >
                                                <MenuItem value={""} >เลือกสายพันธุ์พืช</MenuItem>
                                                {
                                                    plants.mapping_plants?.get(editValue.name_plant ?? data.name_plant)?.map((name) =>
                                                        <MenuItem value={name} >{name}</MenuItem>
                                                    )
                                                }
                                            </Select> :
                                            <input className="data-show"
                                                readOnly
                                                value={"ไม่พบสายพันธุ์พืช"}
                                            />
                                    )
                            }
                        </div>
                    </div>

                    {/* วันที่เพาะกล้า */}
                    <div className="row-content">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่เพาะกล้า</span>
                            {localMode === "view" ? (
                                <span className="data-show">{formatDateThai(data.date_glow)}</span>
                            ) : (
                                <DateSelect RefDateValue={DateGlow} Value={data.date_glow} onChangeDate={(dateNew) => onEdit("date_glow", dateNew)} />
                            )}
                        </div>

                        {/* วันที่ปลูก */}
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่ปลูก</span>
                            {
                                localMode === "view" ? (
                                    <span className="data-show">{formatDateThai(data.date_plant)}</span>
                                ) : (
                                    <DateSelect RefDateValue={DatePlant} Value={data.date_plant} restrictFuture={true} onChangeDate={handlePlantDateChange} />
                                )
                            }
                        </div>
                    </div>
                    <div className="row-content">
                        {/* วันที่คาดว่าจะเก็บเกี่ยว */}
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่คาดว่าจะเก็บเกี่ยว</span>
                            {localMode === "view" ? (
                                <DayJSX className="data-show" TYPE="small" TEXT="วันที่" DATE={data.date_harvest} />
                            ) : (
                                <DateSelect RefDateValue={DateHarvest} Value={editValue.date_harvest ?? data.date_harvest} onChangeDate={(dateNew) => onEdit("date_harvest", dateNew)} />
                            )}
                        </div>

                        {/* วันที่เก็บเกี่ยว */}
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่เก็บเกี่ยว</span>
                            {localMode === "view" ? (
                                data.date_success ? (
                                    <DayJSX className="data-show" TYPE="small" TEXT="วันที่" DATE={data.date_success} />
                                ) : (
                                    <span className="data-show">ยังไม่เก็บเกี่ยว</span>
                                )
                            ) : (
                                <DateSelect RefDateValue={DateSuccess} Value={data.date_success} onChangeDate={(dateNew) => onEdit("date_success", dateNew)} />
                            )}
                        </div>
                    </div>

                    <div className="row-content">
                        {/* ปริมาณผลผลิตที่คาดว่าจะได้รับ */}
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ปริมาณผลผลิตที่คาดว่าจะได้รับ</span>
                            {localMode === "view" ? (
                                <span className="data-show">
                                    {data.expected_yield != null && data.expected_yield !== "" ? parseInt(data.expected_yield) : "ยังไม่ได้ระบุ"}
                                </span>
                            ) : (
                                <input
                                    type="number"
                                    className="data-show"
                                    value={(editValue.expected_yield ?? data.expected_yield) != null && (editValue.expected_yield ?? data.expected_yield) !== "" ? parseInt(editValue.expected_yield ?? data.expected_yield) : ""}
                                    onChange={(event) => onEdit("expected_yield", event.target.value)}
                                />
                            )}
                        </div>

                        {/* ผลผลิตที่ได้จริง */}
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ผลผลิตที่ได้จริง</span>
                            {localMode === "view" ? (
                                <span className="data-show">
                                    {data.default_yield != null && data.default_yield !== "" ? parseInt(data.default_yield) : "ยังไม่ได้ระบุ"}
                                </span>
                            ) : (
                                <input
                                    type="number"
                                    className="data-show"
                                    value={(editValue.default_yield ?? data.default_yield) != null && (editValue.default_yield ?? data.default_yield) !== "" ? parseInt(editValue.default_yield ?? data.default_yield) : ""}
                                    onChange={(event) => onEdit("default_yield", event.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="row-content">
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

                    <div className="row-content">
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

                    <div className="row-content">
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
                    <div className="row-content">
                        <div className={`data-main in-1 column ${getResize < 450 ? "screen-small" : ""}`}>
                            <span className="head-data" style={{ width: "110px" }}>รูปแบบการปลูก</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.system_glow}</span>
                            ) : (
                                <select
                                    className="data-show"
                                    value={editValue.system_glow ?? data.system_glow ?? ""}
                                    onChange={(event) => onEdit("system_glow", event.target.value)}
                                >
                                    {systemGlowOptions.map((opt, idx) => (
                                        <option key={idx} value={opt === "เลือก" ? "" : opt} disabled={opt === "เลือก"}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-data">
                <div className="number">3.</div>
                <div className="data-row">
                    <div className="row-content">
                        <div className={`data-main in-1 ${getResize < 450 ? "screen-small" : ""}`}>
                            <span className="head-data" style={{ width: "110px" }}>แหล่งน้ำ</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.water}</span>
                            ) : (
                                <select
                                    className="data-show"
                                    value={editValue.water ?? data.water ?? ""}
                                    onChange={(event) => onEdit("water", event.target.value)}
                                >
                                    {waterOptions.map((opt, idx) => (
                                        <option key={idx} value={opt === "เลือก" ? "" : opt} disabled={opt === "เลือก"}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-data">
                <div className="number">4.</div>
                <div className="data-row">
                    <div className="row-content">
                        <div className={`data-main in-1 ${getResize < 450 ? "screen-small" : ""}`}>
                            <span className="head-data" style={{ width: "110px" }}>วิธีการให้น้ำ</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.water_flow}</span>
                            ) : (
                                <select
                                    className="data-show"
                                    value={editValue.water_flow ?? data.water_flow ?? ""}
                                    onChange={(event) => onEdit("water_flow", event.target.value)}
                                >
                                    {waterFlowOptions.map((opt, idx) => (
                                        <option key={idx} value={opt === "เลือก" ? "" : opt} disabled={opt === "เลือก"}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-data">
                <div className="number">5.</div>
                <div className="data-row">
                    <div className="row-content">
                        <div className={`data-main in-1 ${getResize < 450 ? "screen-small" : ""}`}>
                            <span style={{ width: "100%" }} className="head-data">ประวัติการใช้พื้นที่และการเกิดโรค</span>
                        </div>
                    </div>

                    {/* ชนิดพืชก่อนหน้า & โรค/แมลงที่พบ */}
                    <div className="row-content">
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
                                <select
                                    className="data-show"
                                    value={editValue.insect ?? data.insect ?? ""}
                                    onChange={(event) => onEdit("insect", event.target.value)}
                                >
                                    {insectOptions.map((opt, idx) => (
                                        <option key={idx} value={opt === "เลือก" ? "" : opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* ปริมาณการเกิด & การป้องกันกำจัด */}
                    <div className="row-content">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ปริมาณการเกิด</span>
                            {localMode === "view" ? (
                                <span className="data-show">{data.qtyInsect ? data.qtyInsect : "ไม่ระบุ"}</span>
                            ) : (
                                <select
                                    className="data-show"
                                    value={editValue.qtyInsect ?? data.qtyInsect ?? ""}
                                    onChange={(event) => onEdit("qtyInsect", event.target.value)}
                                >
                                    {qtyInsectOptions.map((opt, idx) => (
                                        <option key={idx} value={opt === "เลือก" ? "" : opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
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
                        <div className="row-content">
                            <div className="data-main in-1 column">
                                <span className="head-data">ตำแหน่งที่ทำการเกษตรกร</span>
                                {
                                    localMode === "view" ? (
                                        <MapsJSX
                                            lat={data.location_house.x}
                                            lng={data.location_house.y}
                                        />
                                    ) : (
                                        <div className="edit-map">
                                            <label>ลิงก์ Google Maps:</label>
                                            <input
                                                type="text"
                                                className="data-input"
                                                placeholder="วางลิงก์จาก Google Maps"
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

                                            {
                                                editValue.lat && editValue.lng && (
                                                    <MapsJSX
                                                        lat={editValue.lat}
                                                        lng={editValue.lng}
                                                    />
                                                )
                                            }
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
}
