import React, { useEffect, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import "../../assets/style/page/form/PageFormPlant.scss"
import "../../assets/style/TemplantList.scss"
import { DayJSX, LoadOtherDom, Loading, PopupDom } from "../../../../../assets/js/module";
import ManagePopup from "./ManagePopup";
import SchedulesPopup from "./schedules/SchedulesPageDoctor";
import { ExportExcel, ExportPDF } from "../../../../../assets/js/Export";
import { useCallback } from "react";
import RequestAPI from "../../../../../assets/js/requestAPI";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AddGapModal from "./formplant/AddGapModal";
import Select from "react-select";
import { useDoctor } from "../../Doctor";
const PageFormPlant = ({ setMain, session, socket, type = false, eleImageCover, LoadType, eleBody, setTextStatus }) => {
    const { profile } = useDoctor();
    // const [Body , setBody] = useState(<></>)
    const [Loading, setLoading] = useState(false)
    const [exportMode, setExportMode] = useState("all"); // "all" | "show"
    // const [statusPage , setStatus] = useState({
    //     status : LoadType.split(":")[0],
    //     open : type
    // })
    const [viewMode, setViewMode] = useState("card") // "card" | "table"
    const [TypeSelectMenu, setTypeSelectMenu] = useState(0)
    const [DataProcess, setDataProcess] = useState(new Map([
        ["statusClick", type]
    ]))

    const [DataIdPlant, setDataIdPlant] = useState([])
    const [DataPlantList, setDataPlantList] = useState([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const Search = useRef()

    const SearchInput = useRef()
    const TypePlant = useRef()
    const StatusForm = useRef()
    const StatusFarmer = useRef()
    const TypeDate = useRef()

    const [ShowDate, setShowDate] = useState(false)

    const [Mount, setMount] = useState([])
    const [OffsetMountStart, setOffsetMountStart] = useState(0)
    const [OffsetMountEnd, setOffsetMountEnd] = useState([0, 12])

    const [Year, setYear] = useState([])
    const [YearContinue, setYearContinue] = useState([])

    const StartMount = useRef()
    const StartYear = useRef()
    const EndMount = useRef()
    const EndYear = useRef()

    const [defaultStartMount, setDefaultStartMount] = useState("")
    const [defaultStartYear, setDefaultStartYear] = useState("")
    const [defaultEndMount, setDefaultEndMount] = useState("")
    const [defaultEndYear, setDefaultEndYear] = useState("")
    let month = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]

    useEffect(() => {
        eleImageCover.current.style.height = "30%"
        eleBody.current.style.height = "70%"
        setTextStatus(["หน้าหลัก", "แบบบันทึกการปลูก", "รายการแบบบันทึก"])
        clientMo.unLoadingPage()
        // fetchPlantList()
        GetDate()

        // if(LoadType.split(":")[1] === "pop") chkPath()

    }, [LoadType])

    const fetchPlantList = useCallback(async () => {
        const { data, status } = await RequestAPI.get("/api/doctor/plant/list")
        try {
            if (typeof data === "string") throw new Error("data error")
            setDataPlantList(data.plants)
        } catch (e) {
            session()
        }
    }, [session])

    // const chkPath = () => {
    //     if(LoadType.split(":")[0] === "ap") 
    //         setStatus({
    //             status : "ap",
    //             open : 0
    //         })
    //     else if(LoadType.split(":")[0] === "wt") 
    //         setStatus({
    //             status : "wt",
    //             open : 0
    //         })
    // }

    // const changeMenu = (typeClick) => {
    //     if(typeClick !== statusPage.status) {
    //         setStatus({
    //             status : typeClick,
    //             open : 1
    //         })
    //     }
    // }
    const GetDate = () => {
        let year = new Date().getUTCFullYear() + 543
        const yearArr = new Array()
        for (let i = year; i >= (year - 10); i--) yearArr.push(i)
        setYear(yearArr)

        // ต้องมีการแยกตาม url
        setMount(["เลือกเดือน", ...month])
        setOffsetMountStart(12)
    }

    const OpenOption = (Ref, option) => {
        setTypeSelectMenu(option)
        if (TypeSelectMenu == option) Ref.current.toggleAttribute("show")
        else if (Ref.current.getAttribute("show") == null) Ref.current.toggleAttribute("show")
    }

    const searchList = (e, keyMap) => {
        const setData = new Map([...DataProcess])
        if (e.target.value) {
            setData.set(keyMap, e.target.value)
            if (TypeDate.current === e.target) setShowDate(true)
        }
        else {
            setData.delete(keyMap)
            if (TypeDate.current === e.target) {
                if (ShowDate) {
                    EndMount.current.setAttribute("disabled", "")
                    EndYear.current.setAttribute("disabled", "")
                }
                setShowDate(false)
                setData.delete("StartDate")
                setData.delete("EndDate")
                setOffsetMountStart(12)
                setDefaultStartMount("")
                setDefaultStartYear("")
                setDefaultEndMount("")
                setDefaultEndYear("")
            }
        }

        if (keyMap === "statusForm" && e.target.value !== "0") {
            setData.delete("subStatusForm")
        }

        setDataProcess(new Map([...setData, ["statusClick", true]]))
    }

    const ManageDateSelect = (e) => {
        if (ShowDate) {
            let checkMountEmply = true
            let CheckSetData = true

            if (e.target === StartMount.current) setDefaultStartMount(e.target.value)
            else if (e.target === StartYear.current) setDefaultStartYear(e.target.value)
            else if (e.target === EndMount.current) setDefaultEndMount(e.target.value)
            else if (e.target === EndYear.current) setDefaultEndYear(e.target.value)

            // set date offset select present
            if (parseInt(StartYear.current.value) === new Date().getUTCFullYear()) {
                setOffsetMountStart(new Date().getMonth() + 1)
                if (parseInt(StartMount.current.value) > new Date().getMonth() + 1) {
                    checkMountEmply = false
                    CheckSetData = false
                    setDefaultStartMount("")
                    setDefaultEndMount("")
                    setDefaultEndYear("")
                }
            }
            else setOffsetMountStart(12)

            // set use date end
            if (StartMount.current.value && StartYear.current.value && checkMountEmply) {
                EndMount.current.removeAttribute("disabled")
                EndYear.current.removeAttribute("disabled")

                const StartM = (e.target === StartMount.current) ? e.target.value : StartMount.current.value
                const StartY = (e.target === StartYear.current) ? e.target.value : StartYear.current.value

                // set year end < year start
                const YearCutinueArray = new Array
                for (let x = parseInt(StartY); x <= new Date().getFullYear(); x++) YearCutinueArray.push(x + 543);
                setYearContinue(YearCutinueArray)

                const endYear = (e.target === EndYear.current) ? e.target.value : EndYear.current.value;

                if (parseInt(StartY) > parseInt(endYear)) {
                    if (e.target === StartYear.current) {
                        setDefaultEndMount("")
                        setDefaultEndYear("")
                        CheckSetData = false
                    }
                }
                // set check offset end date
                if (endYear === StartY && parseInt(endYear) === new Date().getUTCFullYear()) {
                    console.log([parseInt(StartM), new Date().getMonth() + 1], defaultEndMount)
                    setOffsetMountEnd([parseInt(StartM), new Date().getMonth() + 1])
                    const endMount = parseInt(EndMount.current.value)
                    if (parseInt(StartM) > endMount || endMount > new Date().getMonth() + 1) {
                        setDefaultEndMount("")
                        CheckSetData = false
                    }
                }
                else if (endYear === StartY) {
                    setOffsetMountEnd([parseInt(StartM), 12])
                    if (parseInt(EndMount.current.value) < parseInt(StartM)) {
                        setDefaultEndMount("")
                        CheckSetData = false
                    }
                } else if (parseInt(endYear) === new Date().getUTCFullYear()) {
                    setOffsetMountEnd([0, new Date().getMonth() + 1])
                    if (parseInt(EndMount.current.value) > new Date().getMonth() + 1) {
                        setDefaultEndMount("")
                        CheckSetData = false
                    }
                } else setOffsetMountEnd([0, 12])

            } else {
                EndMount.current.setAttribute("disabled", "")
                EndYear.current.setAttribute("disabled", "")
            }

            if (StartMount.current.value && StartYear.current.value
                && EndMount.current.value && EndYear.current.value
                && CheckSetData) {
                setDataProcess(
                    new Map([
                        ...DataProcess,
                        ["StartDate", new Date(`${StartMount.current.value}-01-${StartYear.current.value}`)],
                        ["EndDate", new Date(`${EndMount.current.value}-${new Date(parseInt(EndYear.current.value), parseInt(EndMount.current.value), 0).getDate()}-${EndYear.current.value}`)],
                        ["statusClick", true]
                    ])
                )
            }
            else {
                const setData = new Map([...DataProcess])
                setData.delete("StartDate")
                setData.delete("EndDate")
                setDataProcess(
                    new Map([...setData], ["statusClick", true])
                )
            }
        }
    }

    // export
    const SelectMenuExport = async (type) => {
        let JsonData = {}
        DataProcess.forEach((data, key) => {
            if (key != "statusClick") {
                JsonData[key] = data
            }
        })
        // 🔑 ตัวเลือกการส่งออก: เอาเฉพาะหน้าแบบฟอร์ม (ไม่เอากราฟ/สิ่งแวดล้อม)
        JsonData.exportScope = "forms_only"       // หรือใช้ onlyForms: true ก็ได้
        JsonData.formPages = [1, 2]               // จำกัดเฉพาะ 2 หน้าแรกของแต่ละฟอร์ม
        // ถ้าหลังบ้านอยากอ่านเป็น boolean ก็ส่ง includeEnvironment:false
        JsonData.includeEnvironment = false

        const ExportFetch = await clientMo.post('/api/doctor/form/export', JsonData)
        if (ExportFetch) {
            const DataExport = JSON.parse(ExportFetch)
            if (type === "pdf") ExportPDF(DataExport, { formsOnly: true, pages: [1, 2] })
            else if (type === "excel") ExportExcel(DataExport)
        } else session()
    }

    useEffect(() => {
        fetchPlantList()
    }, [fetchPlantList])

    return (
        <><section className={`data-list-content-page form-page${viewMode === 'table' ? ' table-mode' : ''}`}>
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
                        .view-switch-label {
                            font-size: 14px;
                            color: #444;
                            font-weight: 500;
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
                        .view-switch.active {
                            border-color: #189D85;
                        }
                        .view-switch-handle {
                            width: 18px;
                            height: 18px;
                            border-radius: 50%;
                            background-color: #ccc;
                            position: absolute;
                            left: 2px;
                            transition: all 0.25s cubic-bezier(0.5, 1.6, 0.4, 1);
                        }
                        .view-switch.active .view-switch-handle {
                            left: 36px;
                            background-color: #189D85;
                        }
                        .view-switch-text {
                            font-size: 11px;
                            font-weight: bold;
                            user-select: none;
                            position: absolute;
                            transition: opacity 0.2s;
                            font-family: sans-serif;
                        }
                        .view-switch-text.on {
                            left: 8px;
                            color: #333;
                            opacity: 0;
                        }
                        .view-switch.active .view-switch-text.on {
                            opacity: 1;
                        }
                        .view-switch-text.off {
                            right: 8px;
                            color: #999;
                            opacity: 1;
                        }
                        .view-switch.active .view-switch-text.off {
                            opacity: 0;
                        }
                    `}</style>
                    <a
                        title={viewMode === "card" ? "แสดงแบบตาราง" : "แสดงแบบการ์ด"}
                        className="bt-search-show"
                        onClick={() => setViewMode(prev => prev === "card" ? "table" : "card")}
                    >
                        {viewMode === "card" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <path d="M3 9h18M3 15h18M9 3v18"/>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1"/>
                                <rect x="14" y="3" width="7" height="7" rx="1"/>
                                <rect x="3" y="14" width="7" height="7" rx="1"/>
                                <rect x="14" y="14" width="7" height="7" rx="1"/>
                            </svg>
                        )}
                    </a>
                    {profile?.doctor_role === 1 && (
                        <a title="เพิ่มใบ GAP" className="bt-search-show" onClick={() => setShowAddModal(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                                    <path d="M8 3v10M3 8h10" />
                                </g>
                            </svg>
                        </a>
                    )}
                    <a title="ค้นหา" className="bt-search-show" onClick={() => OpenOption(Search, 0)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                                <path d="m11.25 11.25l3 3" />
                                <circle cx="7.5" cy="7.5" r="4.75" />
                            </g>
                        </svg>
                    </a>
                    <a title="ส่งออกข้อมูล" className="bt-export-show" onClick={() => OpenOption(Search, 1)}>
                        {/* <svg viewBox="0 0 24 24">
        <path d="M20.92 15.62a1.15 1.15 0 0 0-.21-.33l-3-3a1 1 0 0 0-1.42 1.42l1.3 1.29H12a1 1 0 0 0 0 2h5.59l-1.3 1.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l3-3a.93.93 0 0 0 .21-.33 1 1 0 0 0 0-.76ZM14 20H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5v3a3 3 0 0 0 3 3h4a1 1 0 0 0 .92-.62 1 1 0 0 0-.21-1.09l-6-6a1.07 1.07 0 0 0-.28-.19h-.09l-.28-.1H6a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h8a1 1 0 0 0 0-2ZM13 5.41 15.59 8H14a1 1 0 0 1-1-1Z">
        </path>
    </svg> */}
                        <svg viewBox="0 0 400 400">
                            <path d="M360.069 200.5C367.211 200.5 373.05 206.298 372.516 213.419C369.436 254.444 351.767 293.185 322.476 322.476C290.126 354.826 246.25 373 200.5 373C154.75 373 110.874 354.826 78.5241 322.476C49.233 293.185 31.5637 254.444 28.4841 213.419C27.9495 206.298 33.7894 200.5 40.931 200.5V200.5C48.0726 200.5 53.8028 206.302 54.4315 213.415C57.4504 247.572 72.3722 279.75 96.8113 304.189C124.311 331.689 161.609 347.138 200.5 347.138C239.391 347.138 276.689 331.689 304.189 304.189C328.628 279.75 343.55 247.572 346.568 213.415C347.197 206.302 352.927 200.5 360.069 200.5V200.5Z" fill="currentColor" />
                            <path d="M200 71L200 284" stroke="currentColor" strokeWidth="35" strokeLinecap="round" />
                            <path d="M200 71L263.64 134.64" stroke="currentColor" strokeWidth="35" strokeLinecap="round" />
                            <path d="M200 71L136.36 134.64" stroke="currentColor" strokeWidth="35" strokeLinecap="round" />
                        </svg>
                    </a>
                </div>
                <div className="content-option">
                    <div className="field-option">
                        {!TypeSelectMenu ?
                            <>
                                <div className="row">
                                    <input onChange={(e) => searchList(e, "textInput")} type="search" ref={SearchInput} placeholder="รหัสการเก็บเกี่ยว/รหัสแบบฟอร์ม" defaultValue={DataProcess.get("textInput")}></input>
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
                                                            "&:hover": {
                                                                borderColor: state.isFocused ? "#189D85" : "#22C7A9"
                                                            },
                                                            fontFamily: "Sans-font",
                                                            fontSize: "14px",
                                                            minHeight: "30px",
                                                            height: "30px",
                                                            alignItems: "center"
                                                        }),
                                                        valueContainer: (provided) => ({
                                                            ...provided,
                                                            height: "26px",
                                                            padding: "0 6px",
                                                            display: "flex",
                                                            alignItems: "center"
                                                        }),
                                                        input: (provided) => ({
                                                            ...provided,
                                                            margin: "0px",
                                                            padding: "0px",
                                                            fontFamily: "Sans-font",
                                                            fontSize: "14px"
                                                        }),
                                                        indicatorsContainer: (provided) => ({
                                                            ...provided,
                                                            height: "26px",
                                                        }),
                                                        dropdownIndicator: (provided) => ({
                                                            ...provided,
                                                            padding: "2px",
                                                        }),
                                                        clearIndicator: (provided) => ({
                                                            ...provided,
                                                            padding: "2px",
                                                        }),
                                                        option: (provided, state) => ({
                                                            ...provided,
                                                            backgroundColor: state.isSelected ? "#22C7A9" : state.isFocused ? "#e8fbf7" : "white",
                                                            color: state.isSelected ? "white" : "#333",
                                                            fontFamily: "Sans-font",
                                                            fontSize: "14px",
                                                            "&:active": {
                                                                backgroundColor: "#22C7A9"
                                                            }
                                                        }),
                                                        singleValue: (provided) => ({
                                                            ...provided,
                                                            fontFamily: "Sans-font",
                                                            fontSize: "14px",
                                                            color: "#333",
                                                            margin: "0px"
                                                        })
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
                                            <select
                                                onChange={(e) => searchList(e, "subStatusForm")}
                                                value={DataProcess.get("subStatusForm") ?? ""}
                                                className="width-100"
                                            >
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
                                {/* select date */}
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
                            <div className="export">
                                <div className="head">
                                    <span>ส่งออกข้อมูล</span>
                                    <div className="quesion_mask">
                                        <div className="desciption">ส่งออกข้อมูลที่มีเงื่อนไขตรงกับการค้นหา <br></br> หากไม่กำหนดเงื่อนไข จะส่งออกข้อมูลทั้งหมด <br></br> ข้อมูลเฉพาะภายในศูนย์เท่านั้น</div>
                                        <svg viewBox="0 0 93.936 93.936">
                                            <g>
                                                <path d="M80.179,13.758c-18.342-18.342-48.08-18.342-66.422,0c-18.342,18.341-18.342,48.08,0,66.421   c18.342,18.342,48.08,18.342,66.422,0C98.521,61.837,98.521,32.099,80.179,13.758z M44.144,83.117   c-4.057,0-7.001-3.071-7.001-7.305c0-4.291,2.987-7.404,7.102-7.404c4.123,0,7.001,3.044,7.001,7.404   C51.246,80.113,48.326,83.117,44.144,83.117z M54.73,44.921c-4.15,4.905-5.796,9.117-5.503,14.088l0.097,2.495   c0.011,0.062,0.017,0.125,0.017,0.188c0,0.58-0.47,1.051-1.05,1.051c-0.004-0.001-0.008-0.001-0.012,0h-7.867   c-0.549,0-1.005-0.423-1.047-0.97l-0.202-2.623c-0.676-6.082,1.508-12.218,6.494-18.202c4.319-5.087,6.816-8.865,6.816-13.145   c0-4.829-3.036-7.536-8.548-7.624c-3.403,0-7.242,1.171-9.534,2.913c-0.264,0.201-0.607,0.264-0.925,0.173   s-0.575-0.327-0.693-0.636l-2.42-6.354c-0.169-0.442-0.02-0.943,0.364-1.224c3.538-2.573,9.441-4.235,15.041-4.235   c12.36,0,17.894,7.975,17.894,15.877C63.652,33.765,59.785,38.919,54.73,44.921z" />
                                            </g>
                                        </svg>
                                    </div>
                                </div>
                                <a className="pdf" title="ส่งออก PDF" onClick={() => SelectMenuExport("pdf", exportMode)}>PDF</a>
                                <a className="excel" title="ส่งออก EXCEL" onClick={() => SelectMenuExport("excel", exportMode)}>EXCEL</a>
                                {/* <select value={exportMode} onChange={(e) => setExportMode(e.target.value)}>
                    <option value="show">ตามที่แสดง</option>
                    <option value="all">ทั้งหมดจากค้นหา</option>
                </select> */}
                            </div>}
                    </div>
                </div>
            </div>
            <div className={`data-list-content${viewMode === 'table' ? ' table-mode' : ''}`}>
                <List session={session} socket={socket} DataFillter={DataProcess} setDataPlant={setDataPlantList} setDataId={setDataIdPlant} viewMode={viewMode} refreshTrigger={refreshTrigger} />
            </div>


            {showAddModal && (
                <AddGapModal
                    session={session}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        setRefreshTrigger(prev => prev + 1);
                    }}
                />
            )}
        </section>
        </>
    )
}

const List = ({ session, socket, DataFillter, setDataId, viewMode, refreshTrigger }) => {
    const [Data, setData] = useState([])
    const [Count, setCount] = useState(10)
    const [timeOut, setTimeOut] = useState()
    const [LoadingList, setLoadList] = useState(true)
    const prevRefreshTrigger = useRef(refreshTrigger)

    useEffect(() => {
        setLoadList(true)
        clearTimeout(timeOut)

        if (refreshTrigger !== prevRefreshTrigger.current) {
            prevRefreshTrigger.current = refreshTrigger
            FetchList(10)
        } else {
            setTimeOut(setTimeout(() => {
                FetchList(10)
            }, 500))
        }
    }, [DataFillter, refreshTrigger])

    const FetchList = async (Limit) => {
        try {
            let JsonData = {}
            // let stringUrl = new Array
            DataFillter.forEach((data, key) => {
                if (key != "statusClick") {
                    JsonData[key] = data
                    // stringUrl.push(`${key}=${data}`)
                }
            })
            // stringUrl = stringUrl.join("&")
            // if(DataFillter.get("statusClick")) window.history.pushState({} , "" , `/doctor/form${stringUrl ? `?${stringUrl}` : ""}`)
            if (DataFillter.get("statusClick")) window.history.pushState({}, "", `/doctor/form`)

            JsonData["limit"] = Limit
            const list = await clientMo.post('/api/doctor/form/list', JsonData)
            const data = JSON.parse(list)

            delete JsonData['typePlant']
            delete JsonData['limit']
            const listPlant = await clientMo.post('/api/doctor/form/list', JsonData)
            const dataTypePlant = JSON.parse(listPlant)

            const MapPlant = new Map()
            const PlantList = new Array()
            for (let name of dataTypePlant.map((value, key) => value.name_plant)) {
                MapPlant.set(name, MapPlant.get(name) ? MapPlant.get(name) + 1 : 1)
            }
            MapPlant.forEach((val, key) => {
                PlantList.push({ name: key, count: val })
            })

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
            setDataId(filteredData.map(val => val.id))
            setData(filteredData)
            setLoadList(false)
            return filteredData
        } catch (e) {
            session()
        }
    }

    return (LoadingList ?
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
        }}>
            <Loading size={"45px"} border={"5px"} color="rgb(24 157 133)" animetion={true} />
        </div>
        :
        <ManageList Data={Data} session={session} fetch={FetchList} count={Count} setCount={setCount} viewMode={viewMode} />)
}

function isDataIncomplete(item) {
    const requiredFields = [
        item.name_plant,
        item.generation,
        item.date_plant,
        item.posi_w,
        item.posi_h,
        item.qty,
        item.area,
        item.unit,
        item.date_harvest,
        item.system_glow,
        item.water,
        item.water_flow
    ];

    const hasEmptyField = requiredFields.some(val => val === null || val === undefined || val === "" || val === 0);
    return hasEmptyField;
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

        if (diffDays > 0 && diffDays <= 7) {
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

// TagContainer: วัดความกว้างจริงของแต่ละกรอบ แล้วเรียงจากกว้าง→แคบ (บน→ล่าง)
const TagContainer = ({ tags }) => {
    const containerRef = React.useRef(null);
    const [sortedTags, setSortedTags] = React.useState(tags);

    React.useLayoutEffect(() => {
        if (!containerRef.current) return;
        const children = Array.from(containerRef.current.children);
        const withWidth = tags.map((tag, i) => ({
            tag,
            width: children[i] ? children[i].offsetWidth : 0
        }));
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

const ManageList = ({ Data, session, fetch, count, setCount, viewMode }) => {
    const [Body, setBody] = useState(<></>)
    const RefPop = useRef()
    const [PopBody, setPop] = useState(<></>)
    const [schedulesId, setSchedulesId] = useState(null)
    const containerRef = useRef(null)

    let refData = Data.map(() => React.createRef());

    useEffect(() => {
        refData = Data.map(() => React.createRef());
        ManageShow(Data)
    }, [Data])

    const ManageShow = (Data) => {
        if (Data.length !== 0) {
            // let Max = 0 , SizeFont = 0 , SizeFontDate = 0
            // // console.log(Data)
            // if(window.innerWidth >= 920) {
            //     Max = 4
            //     SizeFont = 1.8
            //     SizeFontDate = 1.2
            // }
            // else if (window.innerWidth < 920) {
            //     Max = 2
            //     SizeFont = 2.8
            //     SizeFontDate = 1.8
            // }

            // // const text = [ ...Data , ...Data , ...Data ]
            // const Row = new Array
            // for(let x = 0 ; x < Data.length ; x += Max) Row.push(Data.slice(x , Max + x))

            // let countKey = 0
            const body = Data.map((Data, keyRow) => {
                const Ref = refData[keyRow]
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
                                    <div className="type-main">
                                        {Data.type_main || "-"}
                                    </div>
                                    <div className="type">
                                        {Data.name_plant || "-"}
                                    </div>
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
                                    <div className="content">
                                        <span>ปุ๋ย</span> {(Data.ctFer !== null && Data.ctFer !== undefined && Data.ctFer !== "") ? Data.ctFer : "-"} ครั้ง
                                    </div>
                                    <div className="dot">|</div>
                                    <div className="content">
                                        <span>สารเคมี</span> {(Data.ctChe !== null && Data.ctChe !== undefined && Data.ctChe !== "") ? Data.ctChe : "-"} ครั้ง
                                    </div>
                                </div>
                            </div>
                            <div className="inrow">
                                <div className="insect">
                                    <span>ศัตรูพืช</span> {Data.insect || "-"}
                                </div>
                                <div className="factor">
                                    <div className="content">
                                        <span>รุ่น</span> {Data.generation || "-"}
                                    </div>
                                    <div className="content">
                                        <span>จำนวน</span> {(Data.qty !== null && Data.qty !== undefined && Data.qty !== "") ? Data.qty : "-"} ต้น
                                    </div>
                                </div>
                            </div>
                            <div className="inrow">
                                <div className="content">
                                    <span>ชื่อเกษตรกร</span> {Data.farmer || "-"}
                                </div>
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
                )
            })
            setBody(body)
        } else {
            setBody(
                <section>
                    <div>ไม่พบข้อมูล</div>
                </section>
            )
        }
    }

    const showPopup = async (id_form, Ref) => {
        const context = await clientMo.post('/api/doctor/check')
        if (context)
            setPop(<ManagePopup RefData={Ref} setPopup={setPop} RefPop={RefPop}
                id_form={id_form} session={session} Fecth={() => fetch(count)} />)
        else session()
    }

    return (
        <>
            <div className="body-page-content" id="plant-list-export">
                {viewMode === "table" ? (
                    <>

                        <div className="table-responsive" style={{ width: "100%", marginTop: "10px", padding: "0 10px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", tableLayout: "fixed" }}>
                                <colgroup>
                                    <col style={{ width: "8%" }} />   {/* ชนิดพืช */}
                                    <col style={{ width: "9%" }} />   {/* ชื่อพืช */}
                                    <col style={{ width: "5%" }} />   {/* รุ่น */}
                                    <col style={{ width: "9%" }} />   {/* วันที่ปลูก */}
                                    <col style={{ width: "6%" }} />   {/* จำนวนต้น */}
                                    <col style={{ width: "9%" }} />   {/* รูปแบบการปลูก */}
                                    <col style={{ width: "7%" }} />   {/* ปุ๋ย */}
                                    <col style={{ width: "8%" }} />   {/* สารเคมี */}
                                    <col style={{ width: "8%" }} />   {/* ศัตรูพืช */}
                                    <col style={{ width: "9%" }} />   {/* ชื่อเกษตรกร */}
                                    <col style={{ width: "12%" }} />  {/* หมายเหตุ */}
                                    <col style={{ width: "10%" }} />  {/* จัดการ */}
                                </colgroup>
                                <thead>
                                    <tr style={{ backgroundColor: "#189D85", color: "white", textAlign: "center", fontSize: "13px" }}>
                                        <th style={{ padding: "10px 6px" }}>ชนิดพืช</th>
                                        <th style={{ padding: "10px 6px" }}>ชื่อพืช</th>
                                        <th style={{ padding: "10px 6px" }}>รุ่น</th>
                                        <th style={{ padding: "10px 6px" }}>วันที่ปลูก</th>
                                        <th style={{ padding: "10px 6px" }}>จำนวนต้น</th>
                                        <th style={{ padding: "10px 6px" }}>รูปแบบ</th>
                                        <th style={{ padding: "10px 6px" }}>ปุ๋ย (ครั้ง)</th>
                                        <th style={{ padding: "10px 6px" }}>สารเคมี (ครั้ง)</th>
                                        <th style={{ padding: "10px 6px" }}>ศัตรูพืช</th>
                                        <th style={{ padding: "10px 6px" }}>เกษตรกร</th>
                                        <th style={{ padding: "10px 6px" }}>หมายเหตุ</th>
                                        <th style={{ padding: "10px 6px" }}>จัดการข้อมูล</th>
                                    </tr>
                                </thead>
                                <tbody style={{ fontSize: "15px", color: "#333" }}>
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
                                                style={{
                                                    borderBottom: "1px solid #eef2f0",
                                                    cursor: "pointer",
                                                    transition: "background-color 0.2s"
                                                }}
                                            >
                                                <td data-label="ชนิดพืช" style={{ padding: "10px 6px", fontWeight: "500", wordBreak: "break-word", fontSize: "13px" }}>{item.type_main || "-"}</td>
                                                <td data-label="ชื่อพืช" style={{ padding: "10px 6px", wordBreak: "break-word", fontSize: "13px" }}>{item.name_plant || "-"}</td>
                                                <td data-label="รุ่น" style={{ padding: "10px 6px", fontSize: "13px" }}>{item.generation || "-"}</td>
                                                <td data-label="วันที่ปลูก" style={{ padding: "10px 6px", fontSize: "12px" }}><DayJSX DATE={item.date_plant} TYPE="SMALL" /></td>
                                                <td data-label="จำนวนต้น" style={{ padding: "10px 6px", fontSize: "13px" }}>{item.qty !== null && item.qty !== undefined && item.qty !== "" ? item.qty : "-"}</td>
                                                <td data-label="รูปแบบ" style={{ padding: "10px 6px", wordBreak: "break-word", fontSize: "13px" }}>{item.system_glow || "-"}</td>
                                                <td data-label="ปุ๋ย (ครั้ง)" style={{ padding: "10px 6px", fontSize: "13px" }}>{item.ctFer !== null && item.ctFer !== undefined && item.ctFer !== "" ? item.ctFer : "-"}</td>
                                                <td data-label="สารเคมี (ครั้ง)" style={{ padding: "10px 6px", fontSize: "13px" }}>{item.ctChe !== null && item.ctChe !== undefined && item.ctChe !== "" ? item.ctChe : "-"}</td>
                                                <td data-label="ศัตรูพืช" style={{ padding: "10px 6px", wordBreak: "break-word", fontSize: "13px" }}>{item.insect || "-"}</td>
                                                <td data-label="ชื่อเกษตรกร" style={{ padding: "10px 6px", wordBreak: "break-word", fontSize: "13px" }}>{item.farmer || "-"}</td>
                                                <td data-label="หมายเหตุ" style={{ padding: "10px 6px", fontSize: "12px" }}>
                                                    {tags.length > 0 ? (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                                                            {tags.map((t, idx) => (
                                                                <span key={idx} style={{
                                                                    backgroundColor: t.cls === "incomplete" ? "#ffbebe" : "rgb(230, 247, 134)",
                                                                    color: t.cls === "incomplete" ? "#d63031" : "#E53935",
                                                                    padding: "3px 6px",
                                                                    borderRadius: "8px",
                                                                    fontSize: "11px",
                                                                    fontWeight: "bold",
                                                                    display: "block",
                                                                    textAlign: "center",
                                                                    wordBreak: "break-word"
                                                                }}>
                                                                    {t.label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                                <td data-label="จัดการข้อมูล" style={{ padding: "10px 6px", textAlign: "center" }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            setSchedulesId(item.id);
                                                        }}
                                                        style={{
                                                            backgroundColor: "#F5E642",
                                                            color: "#333",
                                                            border: "none",
                                                            borderRadius: "20px",
                                                            padding: "5px 10px",
                                                            fontFamily: "Sans-font",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            cursor: "pointer",
                                                            whiteSpace: "nowrap",
                                                            display: "block",
                                                            margin: "0 auto"
                                                        }}
                                                    >
                                                        ดูแผนการปลูก
                                                    </button>
                                                </td>

                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={12} style={{ padding: "20px", textAlign: "center", color: "#666" }}>ไม่พบข้อมูล</td>
                                        </tr>
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
                <div id="popup-detail-form">
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
    )
}

export default PageFormPlant