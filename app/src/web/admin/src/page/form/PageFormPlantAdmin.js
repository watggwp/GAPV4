import React, { useEffect, useRef, useState, useCallback } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import "../../assets/style/page/form/PageFormPlantAdmin.scss";
import { DayJSX, LoadOtherDom, Loading, PopupDom } from "../../../../../assets/js/module";
import ManagePopup from "./ManagePopup";
import SchedulesPopup from "./schedules/SchedulesPageAdmin";
import { ExportExcel, ExportPDF } from "../../../../../assets/js/Export";
import RequestAPI from "../../../../../assets/js/requestAPI";
import AddGapModal from "./AddGapModalAdmin";
import Select from "react-select";

// ─────────────────────────────────────────────────────────────
// Admin auth wrapper: ใช้ /api/admin/check แทน /api/doctor/check
// ─────────────────────────────────────────────────────────────
const adminSession = async () => {
    const result = await clientMo.post('/api/admin/check');
    return !!result;
};

const PageFormPlantAdmin = ({ setMain, session, socket, type = false, setTextStatus }) => {
    const [isLoading, setLoading] = useState(false);
    const [exportMode, setExportMode] = useState("all");
    const [viewMode, setViewMode] = useState("card");
    const [TypeSelectMenu, setTypeSelectMenu] = useState(0);
    const [DataProcess, setDataProcess] = useState(new Map([["statusClick", type]]));

    const [DataIdPlant, setDataIdPlant] = useState([]);
    const [DataPlantList, setDataPlantList] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [stations, setStations] = useState([]);

    const Search = useRef();
    const SearchInput = useRef();
    const TypePlant = useRef();
    const StatusForm = useRef();
    const StatusFarmer = useRef();
    const TypeDate = useRef();

    const [ShowDate, setShowDate] = useState(false);

    const [Mount, setMount] = useState([]);
    const [OffsetMountStart, setOffsetMountStart] = useState(0);
    const [OffsetMountEnd, setOffsetMountEnd] = useState([0, 12]);

    const [Year, setYear] = useState([]);
    const [YearContinue, setYearContinue] = useState([]);

    const StartMount = useRef();
    const StartYear = useRef();
    const EndMount = useRef();
    const EndYear = useRef();

    const [defaultStartMount, setDefaultStartMount] = useState("");
    const [defaultStartYear, setDefaultStartYear] = useState("");
    const [defaultEndMount, setDefaultEndMount] = useState("");
    const [defaultEndYear, setDefaultEndYear] = useState("");
    let month = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

    const fetchStations = useCallback(async () => {
        try {
            const res = await clientMo.post("/api/admin/station/list");
            if (res) {
                setStations(JSON.parse(res));
            }
        } catch (e) {
            console.error("fetchStations error:", e);
        }
    }, []);

    useEffect(() => {
        if (setTextStatus) setTextStatus(["หน้าหลัก", "แบบบันทึกการปลูก", "รายการแบบบันทึก"]);
        clientMo.unLoadingPage();
        GetDate();
        fetchStations();
    }, [fetchStations]);

    const fetchPlantList = useCallback(async () => {
        const { data, status } = await RequestAPI.get("/api/admin/plant/list");
        try {
            if (typeof data === "string") throw new Error("data error");
            setDataPlantList(data.plants);
        } catch (e) {
            // silent fail
        }
    }, []);

    const GetDate = () => {
        let year = new Date().getUTCFullYear() + 543;
        const yearArr = new Array();
        for (let i = year; i >= (year - 10); i--) yearArr.push(i);
        setYear(yearArr);
        setMount(["เลือกเดือน", ...month]);
        setOffsetMountStart(12);
    };

    const OpenOption = (Ref, option) => {
        setTypeSelectMenu(option);
        if (TypeSelectMenu == option) Ref.current.toggleAttribute("show");
        else if (Ref.current.getAttribute("show") == null) Ref.current.toggleAttribute("show");
    };

    const searchList = (e, keyMap) => {
        const setData = new Map([...DataProcess]);
        if (e.target.value) {
            setData.set(keyMap, e.target.value);
            if (TypeDate.current === e.target) setShowDate(true);
        } else {
            setData.delete(keyMap);
            if (TypeDate.current === e.target) {
                if (ShowDate) {
                    EndMount.current.setAttribute("disabled", "");
                    EndYear.current.setAttribute("disabled", "");
                }
                setShowDate(false);
                setData.delete("StartDate");
                setData.delete("EndDate");
                setOffsetMountStart(12);
                setDefaultStartMount("");
                setDefaultStartYear("");
                setDefaultEndMount("");
                setDefaultEndYear("");
            }
        }
        if (keyMap === "statusForm" && e.target.value !== "0") {
            setData.delete("subStatusForm");
        }
        setDataProcess(new Map([...setData, ["statusClick", true]]));
    };

    const ManageDateSelect = (e) => {
        if (ShowDate) {
            let checkMountEmply = true;
            let CheckSetData = true;

            if (e.target === StartMount.current) setDefaultStartMount(e.target.value);
            else if (e.target === StartYear.current) setDefaultStartYear(e.target.value);
            else if (e.target === EndMount.current) setDefaultEndMount(e.target.value);
            else if (e.target === EndYear.current) setDefaultEndYear(e.target.value);

            if (parseInt(StartYear.current.value) === new Date().getUTCFullYear()) {
                setOffsetMountStart(new Date().getMonth() + 1);
                if (parseInt(StartMount.current.value) > new Date().getMonth() + 1) {
                    checkMountEmply = false;
                    CheckSetData = false;
                    setDefaultStartMount("");
                    setDefaultEndMount("");
                    setDefaultEndYear("");
                }
            } else setOffsetMountStart(12);

            if (StartMount.current.value && StartYear.current.value && checkMountEmply) {
                EndMount.current.removeAttribute("disabled");
                EndYear.current.removeAttribute("disabled");

                const StartM = (e.target === StartMount.current) ? e.target.value : StartMount.current.value;
                const StartY = (e.target === StartYear.current) ? e.target.value : StartYear.current.value;

                const YearCutinueArray = new Array();
                for (let x = parseInt(StartY); x <= new Date().getFullYear(); x++) YearCutinueArray.push(x + 543);
                setYearContinue(YearCutinueArray);

                const endYear = (e.target === EndYear.current) ? e.target.value : EndYear.current.value;

                if (parseInt(StartY) > parseInt(endYear)) {
                    if (e.target === StartYear.current) {
                        setDefaultEndMount("");
                        setDefaultEndYear("");
                        CheckSetData = false;
                    }
                }
                if (endYear === StartY && parseInt(endYear) === new Date().getUTCFullYear()) {
                    setOffsetMountEnd([parseInt(StartM), new Date().getMonth() + 1]);
                    const endMount = parseInt(EndMount.current.value);
                    if (parseInt(StartM) > endMount || endMount > new Date().getMonth() + 1) {
                        setDefaultEndMount("");
                        CheckSetData = false;
                    }
                } else if (endYear === StartY) {
                    setOffsetMountEnd([parseInt(StartM), 12]);
                    if (parseInt(EndMount.current.value) < parseInt(StartM)) {
                        setDefaultEndMount("");
                        CheckSetData = false;
                    }
                } else if (parseInt(endYear) === new Date().getUTCFullYear()) {
                    setOffsetMountEnd([0, new Date().getMonth() + 1]);
                    if (parseInt(EndMount.current.value) > new Date().getMonth() + 1) {
                        setDefaultEndMount("");
                        CheckSetData = false;
                    }
                } else setOffsetMountEnd([0, 12]);
            } else {
                EndMount.current.setAttribute("disabled", "");
                EndYear.current.setAttribute("disabled", "");
            }

            if (StartMount.current.value && StartYear.current.value
                && EndMount.current.value && EndYear.current.value
                && CheckSetData) {
                setDataProcess(new Map([
                    ...DataProcess,
                    ["StartDate", new Date(`${StartMount.current.value}-01-${StartYear.current.value}`)],
                    ["EndDate", new Date(`${EndMount.current.value}-${new Date(parseInt(EndYear.current.value), parseInt(EndMount.current.value), 0).getDate()}-${EndYear.current.value}`)],
                    ["statusClick", true]
                ]));
            } else {
                const setData = new Map([...DataProcess]);
                setData.delete("StartDate");
                setData.delete("EndDate");
                setDataProcess(new Map([...setData], ["statusClick", true]));
            }
        }
    };

    /* const SelectMenuExport = async (type) => {
        let JsonData = {};
        DataProcess.forEach((data, key) => {
            if (key != "statusClick") { JsonData[key] = data; }
        });
        JsonData.exportScope = "forms_only";
        JsonData.formPages = [1, 2];
        JsonData.includeEnvironment = false;

        const ExportFetch = await clientMo.post('/api/admin/form/export', JsonData);
        if (ExportFetch) {
            const DataExport = JSON.parse(ExportFetch);
            if (type === "pdf") ExportPDF(DataExport, { formsOnly: true, pages: [1, 2] });
            else if (type === "excel") ExportExcel(DataExport);
        } else session();
    }; */

    useEffect(() => {
        fetchPlantList();
    }, [fetchPlantList]);

    const selectedStationId = DataProcess.get("station");
    const selectedStation = stations.find(s => String(s.id) === String(selectedStationId));
    const selectedStationName = selectedStation ? selectedStation.name : "";

    return (
        <><section className="data-list-content-page form-page admin-form-plant">
            <div className="search-form" ref={Search}>
                <div className="bt-select-option">
                    <style>{`
                        .view-switch-container {
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                            margin-right: 15px;
                            vertical-align: middle;
                        }
                        .view-switch {
                            width: 60px;
                            height: 26px;
                            border-radius: 13px;
                            border: 2px solid #ccc;
                            position: relative;
                            cursor: pointer;
                            transition: all 0.25s ease;
                            background-color: #fff;
                            display: inline-flex;
                            align-items: center;
                        }
                        .view-switch.active { border-color: #189D85; }
                        .view-switch-handle {
                            width: 18px;
                            height: 18px;
                            border-radius: 50%;
                            background-color: #ccc;
                            position: absolute;
                            left: 2px;
                            transition: all 0.25s cubic-bezier(0.5, 1.6, 0.4, 1);
                        }
                        .view-switch.active .view-switch-handle { left: 36px; background-color: #189D85; }
                        .view-switch-text {
                            font-size: 30px;
                            font-weight: bold;
                            user-select: none;
                            position: absolute;
                            transition: opacity 0.2s;
                            font-family: sans-serif;
                        }
                        .view-switch-text.on { left: 8px; color: #333; opacity: 0; }
                        .view-switch.active .view-switch-text.on { opacity: 1; }
                        .view-switch-text.off { right: 8px; color: #999; opacity: 1; }
                        .view-switch.active .view-switch-text.off { opacity: 0; }
                    `}</style>
                    <a
                        title={viewMode === "card" ? "แสดงแบบตาราง" : "แสดงแบบการ์ด"}
                        className="bt-search-show"
                        onClick={() => setViewMode(prev => prev === "card" ? "table" : "card")}
                    >
                        {viewMode === "card" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z" />
                            </svg>
                        )}
                    </a>
                    <a title="เพิ่มใบ GAP" className="bt-search-show" onClick={() => setShowAddModal(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                                <path d="M8 3v10M3 8h10" />
                            </g>
                        </svg>
                    </a>
                    <a title="ค้นหา" className="bt-search-show" onClick={() => OpenOption(Search, 0)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                                <path d="m11.25 11.25l3 3" />
                                <circle cx="7.5" cy="7.5" r="4.75" />
                            </g>
                        </svg>
                    </a>
                    {/* <a title="ส่งออกข้อมูล" className="bt-export-show" onClick={() => OpenOption(Search, 1)} style={{ padding: "0" }}>
                        <svg viewBox="0 0 400 400">
                            <path d="M360.069 200.5C367.211 200.5 373.05 206.298 372.516 213.419C369.436 254.444 351.767 293.185 322.476 322.476C290.126 354.826 246.25 373 200.5 373C154.75 373 110.874 354.826 78.5241 322.476C49.233 293.185 31.5637 254.444 28.4841 213.419C27.9495 206.298 33.7894 200.5 40.931 200.5V200.5C48.0726 200.5 53.8028 206.302 54.4315 213.415C57.4504 247.572 72.3722 279.75 96.8113 304.189C124.311 331.689 161.609 347.138 200.5 347.138C239.391 347.138 276.689 331.689 304.189 304.189C328.628 279.75 343.55 247.572 346.568 213.415C347.197 206.302 352.927 200.5 360.069 200.5V200.5Z" fill="#22C7A9" />
                            <path d="M200 71L200 284" stroke="#22C7A9" strokeWidth="35" strokeLinecap="round" />
                            <path d="M200 71L263.64 134.64" stroke="#22C7A9" strokeWidth="35" strokeLinecap="round" />
                            <path d="M200 71L136.36 134.64" stroke="#22C7A9" strokeWidth="35" strokeLinecap="round" />
                        </svg>
                    </a> */}
                </div>
                <div className="content-option">
                    <div className="field-option">
                        {!TypeSelectMenu ?
                            <>
                                <div className="row">
                                    <label className="field-select">
                                        <span>ศูนย์/สถานี :</span>
                                        <select onChange={(e) => searchList(e, "station")} value={DataProcess.get("station") ?? ""} className="width-100">
                                            <option value={""}>ทั้งหมด</option>
                                            {stations.map((station) => (
                                                <option key={station.id} value={station.id}>
                                                    {station.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="row">
                                    {(() => {
                                        const typePlantOptions = [
                                            { value: "", label: "ทั้งหมด" },
                                            ...DataPlantList.map(data => ({ value: data.name, label: `${data.name} ${data.count}` }))
                                        ];
                                        const selectedTypePlant = typePlantOptions.find(opt => opt.value === (DataProcess.get("typePlant") ?? ""));
                                        return (
                                            <label className="field-select">
                                                <span>ชนิดพืช :</span>
                                                <Select
                                                    options={typePlantOptions}
                                                    value={selectedTypePlant}
                                                    onChange={(selectedOption) => {
                                                        const val = selectedOption ? selectedOption.value : "";
                                                        const fakeEvent = { target: { value: val } };
                                                        searchList(fakeEvent, "typePlant");
                                                    }}
                                                    placeholder="เลือกชนิดพืช"
                                                    isSearchable={true}
                                                    isClearable={false}
                                                    styles={{
                                                        control: (provided, state) => ({
                                                            ...provided,
                                                            borderRadius: "10px",
                                                            border: "2px solid #22C7A9",
                                                            boxShadow: state.isFocused ? "0 0 0 1px #22C7A9" : null,
                                                            borderColor: state.isFocused ? "#189D85" : "#22C7A9",
                                                            "&:hover": { borderColor: state.isFocused ? "#189D85" : "#22C7A9" },
                                                            fontFamily: "Sans-font",
                                                            fontSize: "14px",
                                                            minHeight: "30px",
                                                            height: "30px",
                                                            alignItems: "center"
                                                        }),
                                                        valueContainer: (provided) => ({ ...provided, height: "26px", padding: "0 6px", display: "flex", alignItems: "center" }),
                                                        input: (provided) => ({ ...provided, margin: "0px", padding: "0px", fontFamily: "Sans-font", fontSize: "14px" }),
                                                        indicatorsContainer: (provided) => ({ ...provided, height: "26px" }),
                                                        dropdownIndicator: (provided) => ({ ...provided, padding: "2px" }),
                                                        clearIndicator: (provided) => ({ ...provided, padding: "2px" }),
                                                        option: (provided, state) => ({
                                                            ...provided,
                                                            backgroundColor: state.isSelected ? "#22C7A9" : state.isFocused ? "#e8fbf7" : "white",
                                                            color: state.isSelected ? "white" : "#333",
                                                            fontFamily: "Sans-font",
                                                            fontSize: "14px",
                                                            "&:active": { backgroundColor: "#22C7A9" }
                                                        }),
                                                        singleValue: (provided) => ({ ...provided, fontFamily: "Sans-font", fontSize: "14px", color: "#333", margin: "0px" })
                                                    }}
                                                />
                                            </label>
                                        );
                                    })()}
                                    <label className="field-select">
                                        <span>สถานะแบบฟอร์ม :</span>
                                        <select onChange={(e) => searchList(e, "statusForm")} value={DataProcess.get("statusForm") ?? ""} className="width-100" ref={StatusForm}>
                                            <option value={""}>ทั้งหมด</option>
                                            <option value={0}>กำลังปลูก</option>
                                            <option value={1}>ตรวจสอบผลผลิต</option>
                                            <option value={2}>เก็บเกี่ยวแล้ว</option>
                                        </select>
                                    </label>
                                </div>
                                {(DataProcess.get("statusForm") === 0 || DataProcess.get("statusForm") === "0") && (
                                    <div className="row">
                                        <label className="field-select">
                                            <span>สถานะย่อยกำลังปลูก :</span>
                                            <select onChange={(e) => searchList(e, "subStatusForm")} value={DataProcess.get("subStatusForm") ?? ""} className="width-100">
                                                <option value={""}>ทั้งหมด</option>
                                                <option value={"1.1"}>ข้อมูลพื้นฐานไม่ครบ</option>
                                                {/* <option value={"1.2"}>เก็บเกี่ยวในอีก...วัน</option> */}
                                                <option value={"1.3"}>ครบกำหนดเก็บเกี่ยว</option>
                                                <option value={"1.4"}>เลยกำหนดเก็บเกี่ยว</option>
                                            </select>
                                        </label>
                                    </div>
                                )}
                                <div className="row">
                                    <label className="field-select">
                                        <span>สถานะผู้บันทึก :</span>
                                        <select onChange={(e) => searchList(e, "statusFarmer")} defaultValue={DataProcess.get("statusFarmer")} className="width-100" ref={StatusFarmer}>
                                            <option value={""}>ทั้งหมด</option>
                                            <option value={1}>ตรวจสอบแล้ว</option>
                                            <option value={0}>ยังไม่ตรวจสอบ</option>
                                        </select>
                                    </label>
                                    <label className="field-select">
                                        <span>ประเภทช่วงเวลา :</span>
                                        <select onChange={(e) => searchList(e, "typeDate")} defaultValue={DataProcess.get("typeDate")} className="width-100" ref={TypeDate}>
                                            <option value={""}>ทั้งหมด</option>
                                            <option value={0}>วันที่เพาะปลูก</option>
                                            <option value={1}>วันที่เก็บเกี่ยวผลผลิต</option>
                                        </select>
                                    </label>
                                </div>
                                {ShowDate ?
                                    <div className="row">
                                        <div className="field-select">
                                            <span>เลือกช่วงเวลา :</span>
                                            <div>
                                                <select value={defaultStartMount} ref={StartMount} onChange={ManageDateSelect}>
                                                    {Mount.map((val, index) => {
                                                        if (index === 0) return <option disabled key={index} value={""}>{val}</option>;
                                                        else {
                                                            if (index <= OffsetMountStart) return <option className="on" key={index} value={(index >= 10) ? index : `0${index}`}>{val}</option>;
                                                            else return <option key={index} disabled value={val}>{val}</option>;
                                                        }
                                                    })}
                                                </select>
                                                <select value={defaultStartYear} ref={StartYear} onChange={ManageDateSelect}>
                                                    <option disabled value={""}>เลือกปี</option>
                                                    {Year.map((val, index) => (
                                                        <option key={index} value={val - 543}>{val}</option>)
                                                    )}
                                                </select>
                                                ถึง
                                                <select value={defaultEndMount} ref={EndMount} disabled={DataProcess.get("EndDate") ? false : true} onChange={ManageDateSelect}>
                                                    {Mount.map((val, index) => {
                                                        if (index === 0) return <option disabled key={index} value={""}>{val}</option>;
                                                        else {
                                                            if (OffsetMountEnd[0] <= index && index <= OffsetMountEnd[1])
                                                                return <option className="on" key={index} value={(index >= 10) ? index : `0${index}`}>{val}</option>;
                                                            else return <option key={index} disabled value={val}>{val}</option>;
                                                        }
                                                    })}
                                                </select>
                                                <select value={defaultEndYear} ref={EndYear} disabled={DataProcess.get("EndDate") ? false : true} onChange={ManageDateSelect}>
                                                    <option disabled value={""}>เลือกปี</option>
                                                    {YearContinue.map((val, index) => (
                                                        <option key={index} value={val - 543}>{val}</option>)
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    : <></>}
                            </>
                            :
                            null
                        }
                    </div>
                </div>
            </div>
            <div className="data-list-content">
                {selectedStationName && (
                    <div style={{ textAlign: "center", margin: "15px 0 5px 0", fontSize: "20px", fontWeight: "bold", color: "#189D85" }}>
                        {selectedStationName}
                    </div>
                )}
                <ListAdmin session={session} socket={socket} DataFillter={DataProcess} setDataPlant={setDataPlantList} setDataId={setDataIdPlant} viewMode={viewMode} />
            </div>

            {showAddModal && (
                <AddGapModal
                    session={session}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        // Reset ALL filters to show newly added form
                        const newMap = new Map([["statusClick", true]]);
                        setDataProcess(newMap);
                    }}
                    apiPrefix="/api/admin"
                />
            )}
        </section>
        </>
    );
};

// ─────────────────────────────────────────────────────────────
// Helper functions (ซ้ำจาก doctor แต่ standalone)
// ─────────────────────────────────────────────────────────────
function isDataIncomplete(item) {
    const requiredFields = [
        item.name_plant, item.generation, item.date_plant,
        item.posi_w, item.posi_h, item.qty, item.area, item.unit,
        item.date_harvest, item.system_glow, item.water, item.water_flow
    ];
    return requiredFields.some(val => val === null || val === undefined || val === "" || val === 0);
}

const parseDateStr = (dateStr) => {
    if (!dateStr) return new Date(NaN);
    const cleanStr = dateStr.split(" ")[0];
    const parts = cleanStr.split("-");
    if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d);
    }
    return new Date(dateStr);
};

function getSortPriority(item) {
    const status = parseInt(item.state_status);
    if (status === 0) {
        const isIncomplete = isDataIncomplete(item);
        if (isIncomplete) {
            return { group: 1, sub: 0 };
        }

        if (!item.date_harvest) {
            return { group: 1, sub: 0 };
        }

        const dateHarvest = parseDateStr(item.date_harvest);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateHarvest.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((dateHarvest - today) / (24 * 60 * 60 * 1000));

        if (diffDays > 0) {
            return { group: 2, sub: diffDays }; // เก็บเกี่ยวในอีก...วัน
        } else if (diffDays === 0) {
            return { group: 3, sub: 0 };        // ครบกำหนดเก็บเกี่ยว
        } else {
            return { group: 4, sub: diffDays };  // เลยกำหนดเก็บเกี่ยว
        }
    } else if (status === 1) {
        return { group: 5, sub: 0 };             // ตรวจสอบผลผลิต
    } else {
        return { group: 6, sub: 0 };             // เก็บเกี่ยวแล้ว
    }
}

function sortPlantData(list) {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
        const pA = getSortPriority(a);
        const pB = getSortPriority(b);

        if (pA.group !== pB.group) {
            return pA.group - pB.group;
        }
        // Sub-sorting for groups 2 and 4 (remaining/overdue days)
        if (pA.group === 2 && pA.sub !== pB.sub) {
            return pA.sub - pB.sub; // Ascending: closer harvest first
        }
        if (pA.group === 4 && pA.sub !== pB.sub) {
            return pA.sub - pB.sub; // Ascending: most overdue first (more negative days first)
        }
        // Secondary sort: latest added first (id descending)
        const idA = Number(a.id) || 0;
        const idB = Number(b.id) || 0;
        return idB - idA;
    });
}

const TagContainer = ({ tags }) => {
    const containerRef = React.useRef(null);
    const [sortedTags, setSortedTags] = React.useState(tags);

    React.useLayoutEffect(() => {
        if (!containerRef.current) return;
        const children = Array.from(containerRef.current.children);
        const withWidth = tags.map((tag, i) => ({ tag, width: children[i] ? children[i].offsetWidth : 0 }));
        withWidth.sort((a, b) => a.width - b.width);
        setSortedTags(withWidth.map(x => x.tag));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (!tags.length) return null;
    return (
        <div className="report-container" ref={containerRef}>
            {sortedTags.map((tag, i) => (
                <div key={i} className={`report-list${tag.cls ? ` ${tag.cls}` : ''}`}>
                    <div className="text">{tag.label}</div>
                </div>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// ListAdmin: ดึงข้อมูลจาก /api/doctor/form/list (shared API)
// ─────────────────────────────────────────────────────────────
const ListAdmin = ({ session, socket, DataFillter, setDataId, viewMode }) => {
    const [Data, setData] = useState([]);
    const [Count, setCount] = useState(10);
    const [timeOut, setTimeOut] = useState();
    const [LoadingList, setLoadList] = useState(true);

    useEffect(() => {
        setLoadList(true);
        clearTimeout(timeOut);
        setTimeOut(setTimeout(() => { FetchList(10); }, 500));
    }, [DataFillter]);

    const FetchList = async (Limit) => {
        try {
            let JsonData = {};
            DataFillter.forEach((data, key) => {
                if (key != "statusClick") { JsonData[key] = data; }
            });
            // Always include station to indicate user's explicit choice (even if empty = show all)
            if (!JsonData.hasOwnProperty("station")) {
                JsonData["station"] = "";
            }
            if (DataFillter.get("statusClick")) window.history.pushState({}, "", `/admin/form-plant`);
            // JsonData["limit"] = Limit;
            console.log("JsonData", JsonData);
            const list = await clientMo.post('/api/admin/form/list', JsonData);
            const data = JSON.parse(list);
            console.log("station =",
                JsonData.station,
                "count =",
                data.length
            );

            delete JsonData['typePlant'];
            delete JsonData['limit'];
            const listPlant = await clientMo.post('/api/admin/form/list', JsonData);
            const dataTypePlant = JSON.parse(listPlant);

            const MapPlant = new Map();
            const PlantList = new Array();
            for (let name of dataTypePlant.map((value) => value.name_plant)) {
                MapPlant.set(name, MapPlant.get(name) ? MapPlant.get(name) + 1 : 1);
            }
            MapPlant.forEach((val, key) => { PlantList.push({ name: key, count: val }); });

            const sortedData = sortPlantData(data);
            let filteredData = sortedData;
            const statusForm = DataFillter.get("statusForm");
            const subStatusForm = DataFillter.get("subStatusForm");
            const isGrowing = statusForm === 0 || statusForm === "0";

            // Filter by main status first (0=growing, 1=checking, 2=harvested)
            if (statusForm !== "" && statusForm !== null && statusForm !== undefined) {
                const mainStatus = parseInt(statusForm);
                filteredData = sortedData.filter(item => parseInt(item.state_status) === mainStatus);
            }

            // Then apply sub-status filter if on growing status
            if (subStatusForm && isGrowing) {
                filteredData = filteredData.filter(item => {
                    const priority = getSortPriority(item);
                    if (subStatusForm === "1.1") return priority.group === 1;

                    if (subStatusForm === "1.2" && priority.group === 2) return true;
                    if (subStatusForm === "1.3" && priority.group === 3) return true;
                    if (subStatusForm === "1.4" && priority.group === 4) return true;

                    if (priority.group === 1 && item.date_harvest) {
                        const dateHarvest = parseDateStr(item.date_harvest);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        dateHarvest.setHours(0, 0, 0, 0);
                        const diffDays = Math.ceil((dateHarvest - today) / (24 * 60 * 60 * 1000));

                        if (subStatusForm === "1.2" && diffDays > 0) return true;
                        if (subStatusForm === "1.3" && diffDays === 0) return true;
                        if (subStatusForm === "1.4" && diffDays < 0) return true;
                    }
                    return false;
                });
            }
            filteredData = filteredData.slice(0, Limit);
            setDataId(filteredData.map(val => val.id));
            setData(filteredData);
            setLoadList(false);
            return filteredData;
        } catch (e) {
            session();
        }
    };

    return (LoadingList ?
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Loading size={"45px"} border={"5px"} color="rgb(24 157 133)" animetion={true} />
        </div>
        :
        <ManageListAdmin Data={Data} session={session} fetch={FetchList} count={Count} setCount={setCount} viewMode={viewMode} />);
};

// ─────────────────────────────────────────────────────────────
// ManageListAdmin
// ─────────────────────────────────────────────────────────────
const ManageListAdmin = ({ Data, session, fetch, count, setCount, viewMode }) => {
    const [Body, setBody] = useState(<></>);
    const RefPop = useRef();
    const [PopBody, setPop] = useState(<></>);
    const [schedulesId, setSchedulesId] = useState(null);

    let refData = Data.map(() => React.createRef());

    useEffect(() => {
        refData = Data.map(() => React.createRef());
        ManageShow(Data);
    }, [Data]);

    const ManageShow = (Data) => {
        if (Data.length !== 0) {
            const body = Data.map((Data, keyRow) => {
                const Ref = refData[keyRow];
                const dateHarvest = parseDateStr(Data.date_harvest);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                dateHarvest.setHours(0, 0, 0, 0);
                const DateHarvestDiff = Math.ceil((dateHarvest - today) / (24 * 60 * 60 * 1000));
                const isIncomplete = isDataIncomplete(Data);
                const showHarvest = Data.state_status == 0 && Data.date_harvest && !isNaN(DateHarvestDiff);

                return (
                    <a key={keyRow} className="list-some-data-on-page" title="เปิดแบบฟอร์ม"
                        ref={Ref} status={Data.state_status} onClick={() => showPopup(Data.id, Ref)}
                    >
                        {(() => {
                            const tags = [];
                            if (isIncomplete) tags.push({ label: "ข้อมูลพื้นฐานยังไม่ครบ", cls: "incomplete" });
                            if (showHarvest) {
                                let harvestText = null;
                                if (DateHarvestDiff < 0) {
                                    harvestText = `เลยกำหนดเก็บเกี่ยว ${Math.abs(DateHarvestDiff)} วัน`;
                                } else if (DateHarvestDiff === 0) {
                                    harvestText = "ครบกำหนดเก็บเกี่ยว";
                                } else if (DateHarvestDiff <= 7) {
                                    harvestText = `เก็บเกี่ยวในอีก ${DateHarvestDiff} วัน`;
                                }
                                if (harvestText) tags.push({ label: harvestText, cls: "" });
                            }
                            if (!tags.length) return null;
                            return <TagContainer tags={tags} />;
                        })()}
                        <div className="frame-data-list">
                            <div className="inrow">
                                <div className="column">
                                    <div className="type-main">{Data.type_main || "-"}</div>
                                    <div className="type">{Data.name_plant || "-"}</div>
                                </div>
                                <div className="date">
                                    <span>ปลูก</span>
                                    <DayJSX DATE={Data.date_plant} TYPE="SMALL" />
                                </div>
                            </div>
                            <div className="inrow">
                                <div className="system-glow">
                                    <span>รูปแบบการปลูก</span>
                                    <div>{" " + (Data.system_glow || "-")}</div>
                                </div>
                                <div className="factor">
                                    <div className="content"><span>ปุ๋ย</span> {(Data.ctFer !== null && Data.ctFer !== undefined && Data.ctFer !== "") ? Data.ctFer : "-"} ครั้ง</div>
                                    <div className="dot">|</div>
                                    <div className="content"><span>สารเคมี</span> {(Data.ctChe !== null && Data.ctChe !== undefined && Data.ctChe !== "") ? Data.ctChe : "-"} ครั้ง</div>
                                </div>
                            </div>
                            <div className="inrow">
                                <div className="insect"><span>ศัตรูพืช</span> {Data.insect || "-"}</div>
                                <div className="factor">
                                    <div className="content"><span>รุ่น</span> {Data.generation || "-"}</div>
                                    <div className="content"><span>จำนวน</span> {(Data.qty !== null && Data.qty !== undefined && Data.qty !== "") ? Data.qty : "-"} ต้น</div>
                                </div>
                            </div>
                            <div className="inrow">
                                <div className="content"><span>ชื่อเกษตรกร</span> {Data.farmer || "-"}</div>
                                <button
                                    className="btn-plan"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();

                                        setSchedulesId(Data.id);
                                    }}
                                >
                                    ดูแผนการปลูก
                                </button>
                            </div>
                        </div>
                    </a>
                );
            });
            setBody(body);
        } else {
            setBody(<section><div>ไม่พบข้อมูล</div></section>);
        }
    };

    const showPopup = async (id_form, Ref) => {
        // Admin ใช้ /api/admin/check สำหรับตรวจสอบ session
        const context = await clientMo.post('/api/admin/check');
        if (context)
            setPop(<ManagePopup RefData={Ref} setPopup={setPop} RefPop={RefPop}
                id_form={id_form} session={session} Fecth={() => fetch(count)} />)
        else session();
    };

    return (
        <>
            <div className="body-page-content" id="plant-list-export">
                {viewMode === "table" ? (
                    <>
                        <style>{`
                            .table-row-hover:hover { background-color: #f5fbf9; }
                            table th, table td { text-align: center !important; }
                            table td input {
                                text-align: center !important; border: none !important;
                                background: transparent !important; outline: none !important;
                                padding: 0 !important; margin: 0 !important;
                                font-size: inherit !important; font-family: inherit !important;
                                color: inherit !important; width: auto !important; cursor: pointer;
                            }
                        `}</style>
                        <div className="table-responsive" style={{ width: "100%", overflowX: "auto", marginTop: "10px", padding: "0 10px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#189D85", color: "white", textAlign: "center", fontSize: "15px" }}>
                                        <th style={{ padding: "14px 16px" }}>ชนิดพืช</th>
                                        <th style={{ padding: "14px 16px" }}>ชื่อพืช</th>
                                        <th style={{ padding: "14px 16px" }}>รุ่น</th>
                                        <th style={{ padding: "14px 16px" }}>วันที่ปลูก</th>
                                        <th style={{ padding: "14px 16px" }}>จำนวนต้น</th>
                                        <th style={{ padding: "14px 16px" }}>รูปแบบการปลูก</th>
                                        <th style={{ padding: "14px 16px" }}>ปุ๋ย (ครั้ง)</th>
                                        <th style={{ padding: "14px 16px" }}>สารเคมี (ครั้ง)</th>
                                        <th style={{ padding: "14px 16px" }}>ศัตรูพืช</th>
                                        <th style={{ padding: "14px 16px" }}>ชื่อเกษตรกร</th>
                                        <th style={{ padding: "14px 16px" }}>หมายเหตุ</th>
                                        <th style={{ padding: "14px 16px" }}>จัดการข้อมูล</th>
                                    </tr>
                                </thead>
                                <tbody style={{ fontSize: "14px", color: "#333" }}>
                                    {Data.length > 0 ? Data.map((item, index) => {
                                        const dateHarvest = parseDateStr(item.date_harvest);
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        dateHarvest.setHours(0, 0, 0, 0);
                                        const DateHarvestDiff = Math.ceil((dateHarvest - today) / (24 * 60 * 60 * 1000));
                                        const isIncomplete = isDataIncomplete(item);
                                        const showHarvest = item.state_status == 0 && item.date_harvest && !isNaN(DateHarvestDiff);

                                        const tags = [];
                                        if (isIncomplete) tags.push({ label: "ข้อมูลพื้นฐานยังไม่ครบ", cls: "incomplete" });
                                        if (showHarvest) {
                                            let harvestText = null;
                                            if (DateHarvestDiff < 0) {
                                                harvestText = `เลยกำหนดเก็บเกี่ยว ${Math.abs(DateHarvestDiff)} วัน`;
                                            } else if (DateHarvestDiff === 0) {
                                                harvestText = "ครบกำหนดเก็บเกี่ยว";
                                            } else if (DateHarvestDiff <= 7) {
                                                harvestText = `เก็บเกี่ยวในอีก ${DateHarvestDiff} วัน`;
                                            }
                                            if (harvestText) tags.push({ label: harvestText, cls: "" });
                                        }

                                        return (
                                            <tr key={index}
                                                onClick={() => showPopup(item.id, React.createRef())}
                                                className="table-row-hover"
                                                style={{ borderBottom: "1px solid #eef2f0", cursor: "pointer", transition: "background-color 0.2s" }}
                                            >
                                                <td data-label="ชนิดพืช" style={{ padding: "14px 16px", fontWeight: "500" }}>{item.type_main || "-"}</td>
                                                <td data-label="ชื่อพืช" style={{ padding: "14px 16px" }}>{item.name_plant || "-"}</td>
                                                <td data-label="รุ่น" style={{ padding: "14px 16px" }}>{item.generation || "-"}</td>
                                                <td data-label="วันที่ปลูก" style={{ padding: "14px 16px" }}><DayJSX DATE={item.date_plant} TYPE="SMALL" /></td>
                                                <td data-label="จำนวนต้น" style={{ padding: "14px 16px" }}>{item.qty !== null && item.qty !== undefined && item.qty !== "" ? item.qty : "-"}</td>
                                                <td data-label="รูปแบบการปลูก" style={{ padding: "14px 16px" }}>{item.system_glow || "-"}</td>
                                                <td data-label="ปุ๋ย (ครั้ง)" style={{ padding: "14px 16px" }}>{item.ctFer !== null && item.ctFer !== undefined && item.ctFer !== "" ? item.ctFer : "-"}</td>
                                                <td data-label="สารเคมี (ครั้ง)" style={{ padding: "14px 16px" }}>{item.ctChe !== null && item.ctChe !== undefined && item.ctChe !== "" ? item.ctChe : "-"}</td>
                                                <td data-label="ศัตรูพืช" style={{ padding: "14px 16px" }}>{item.insect || "-"}</td>
                                                <td data-label="ชื่อเกษตรกร" style={{ padding: "14px 16px" }}>{item.farmer || "-"}</td>
                                                <td data-label="หมายเหตุ" style={{ padding: "14px 16px" }}>
                                                    {tags.length > 0 ? (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                                                            {tags.map((t, idx) => (
                                                                <span key={idx} style={{
                                                                    backgroundColor: t.cls === "incomplete" ? "#ffbebe" : "rgb(230, 247, 134)",
                                                                    color: t.cls === "incomplete" ? "#d63031" : "#E53935",
                                                                    padding: "4px 10px",
                                                                    borderRadius: "8px",
                                                                    fontSize: "12px",
                                                                    fontWeight: "bold",
                                                                    whiteSpace: "nowrap"
                                                                }}>
                                                                    {t.label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                                <td data-label="จัดการข้อมูล" style={{ padding: "10px 16px", textAlign: "center" }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();

                                                            setSchedulesId(item.id);
                                                        }}
                                                        style={{
                                                            backgroundColor: "#F5E642", color: "#333", border: "none",
                                                            borderRadius: "20px", padding: "6px 14px", fontFamily: "Sans-font",
                                                            fontSize: "13px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap"
                                                        }}
                                                    >
                                                        ดูแผนการปลูก
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan={12} style={{ padding: "20px", textAlign: "center", color: "#666" }}>ไม่พบข้อมูล</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : Body}
            </div>
            <div className="footer">
                <LoadOtherDom Fetch={fetch} count={count} setCount={setCount} Limit={10}
                    style={{ backgroundColor: "rgb(24 157 133)" }} />
                <div id="popup-detail-form-admin">
                    <PopupDom Ref={RefPop} Body={PopBody} zIndex={1001} />
                </div>
                {schedulesId && (
                    <SchedulesPopup
                        id_form={schedulesId}
                        onClose={() => setSchedulesId(null)}
                    />
                )}
            </div>
        </>
    );
};

export default PageFormPlantAdmin;