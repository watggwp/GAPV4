import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import "./ListFertilizer.scss";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { CloseAccount } from "../../method";
import {
    CloseDatePopup,
    DatePickerThaiApp,
    Loading
} from "../../../../../assets/js/module";
import { useParams, useLocation, useNavigate } from "react-router";
import Swal from 'sweetalert2';
import { useGreenhouse } from "..";
import { Autocomplete, TextField } from "@mui/material";
import RoyalGapFrontendUtil from "../../../../../assets/core/RoyalGapUtil";

const getDateNow = () => {
    return new Date()
}

export default function TemplatePopup({
    setPopup,
    RefPop,
    type_path,
    ReloadData,
    editDefaultField,
    greenhouse_id: propGreenhouseId,
    gap_id: propGapId,
}) {
    const { greenhouse_id, gap_id } = useParams()
    const location = useLocation();
    const navigate = useNavigate();

    // เก็บ schedule_id ครั้งแรกที่โหลดหน้าเว็บ เพราะ LIFF อาจจะเปลี่ยน URL ทิ้งภายหลัง
    const scheduleIdRef = useRef(new URLSearchParams(location.search).get("schedule_id"));

    const { setCurrentPage } = useGreenhouse()

    const endpointManage = useRef(
        editDefaultField ?
            "/api/farmer/factor/edit" :
            "/api/farmer/factor/insert"
    )

    const [pestChemicalData, setPestChemicalData] = useState([]);
    const [loading, setLoading] = useState(false);

    // State สำหรับการแจ้งเตือน
    const [popupMessage, setPopupMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [errors, setErrors] = useState({})

    const [useDate, setUseDate] = useState(editDefaultField?.date || getDateNow())
    const [primaryName, setPrimaryName] = useState(editDefaultField?.name || "")
    const [secondaryName, setSecondaryName] = useState(editDefaultField?.formula_name || "")
    const [use, setUse] = useState(editDefaultField?.use_is || "")
    const [volume, setVolume] = useState(editDefaultField?.volume.split(" ")?.[0] || "")
    const [unit, setUnit] = useState(editDefaultField?.volume.split(" ")?.[1] || (type_path === "z" ? "ลิตร" : "กรัม"))
    const [source, setSource] = useState(editDefaultField?.source || "")

    //  chemical
    const [insectName, setInsectName] = useState(editDefaultField?.insect || "")
    const [rate, setRate] = useState(editDefaultField?.rate || "")
    const [safeDate, setSafeDate] = useState(editDefaultField?.date_safe || "")

    const [because, setBesauce] = useState("")

    const [factors, setFactors] = useState([]);
    const [sources, setSources] = useState([]);

    const PrimarySearch = useMemo(() => {
        const factorsName = new Set([...factors.map(({ name }) => name)])
        return {
            factorsName: [...factorsName],
            match: RoyalGapFrontendUtil.GetMatchSearch(
                factorsName,
                {
                    threshold: 0.5
                }
            )
        }
    }, [factors])

    const SecondarySearch = useMemo(() => {
        const factorsName = factors
            .filter(({ name }) => name === primaryName)
            .map(({ name_formula }) => name_formula)
        return {
            factorsName: factorsName,
            match: RoyalGapFrontendUtil.GetMatchSearch(
                factorsName,
                {
                    threshold: 0.5
                }
            )
        }
    }, [factors, primaryName])

    const [loadingSources, setLoadingSources] = useState(true)
    const [loadingSecondaryName, setLoadingSecondaryName] = useState(false);
    const [loadingPrimaryName, setLoadingPrimaryName] = useState(false);

    // State และ Refs สำหรับศัตรูพืช
    const [pests, setPests] = useState([]);
    const [loadingPest, setLoadingPest] = useState(false);
    const [currentPlantPlantName, setCurrentPlantName] = useState(""); // ชื่อสายพันธุ์พืช

    const [getWait, setWait] = useState(false);

    const fetchFactor = useCallback(async (type) => {
        setLoadingSecondaryName(true);
        setLoadingPrimaryName(true);
        const data = await clientMo.post("/api/farmer/factor/get/auto", {
            type: type
        });

        setLoadingSecondaryName(false);
        setLoadingPrimaryName(false);
        if (await CloseAccount(data, setCurrentPage)) {
            const list = JSON.parse(data);
            list.sort((a, b) => a.name.localeCompare(b.name, 'th'));
            list.sort((a, b) => a.name_formula.localeCompare(b.name_formula, 'th'));
            setFactors(list);

            return list;
        }
    }, [setCurrentPage])

    const fetchSource = useCallback(async () => {
        setLoadingSources(true)
        const Data = await clientMo.post("/api/farmer/source/get");
        setLoadingSources(false)
        if (await CloseAccount(Data, setCurrentPage)) {
            const LIST = JSON.parse(Data);
            setSources(LIST);
        }
    }, [setCurrentPage])

    // ฟังก์ชัน fetchPests ดึงข้อมูลศัตรูพืช
    const fetchPests = useCallback(async () => {
        setLoadingPest(true)
        const data = await clientMo.post("/api/farmer/pests")
        setLoadingPest(false)
        if (await CloseAccount(data, setCurrentPage)) {
            let list = JSON.parse(data);
            list = list.map((item) => ({
                ...item,
                pest_name: item.pest_name.trim()
            }));
            const collator = new Intl.Collator('th', { sensitivity: 'base', numeric: true });
            list.sort((a, b) => collator.compare(a.pest_name, b.pest_name));

            setPests(list);

            return list;
        }
    }, [setCurrentPage])

    // ฟังก์ชันโหลดข้อมูลจาก API
    const fetchPestChemicalData = useCallback(async () => {
        setLoading(true);
        try {
            const Data = await clientMo.post("/api/farmer/pest-chemical", {
                id_form_plant: gap_id
            });

            // ตรวจสอบว่า CloseAccount ผ่านหรือไม่
            if (await CloseAccount(Data, setCurrentPage)) {
                const response = JSON.parse(Data); // แปลงข้อมูล JSON

                // ตรวจสอบโครงสร้างข้อมูล
                if (response?.plant_name && Array.isArray(response.data)) {
                    const { plant_name, data } = response; // Destructure ข้อมูล

                    if (data.length > 0) {
                        setPestChemicalData(data);
                        setCurrentPlantName(plant_name);
                    } else {
                        // console.warn("No pest-chemical data found:", data);
                        // setPopupMessage("ไม่พบข้อมูลสารเคมีเเละศัตรูพืชตรงกัน");
                        // setShowPopup(true);
                    }
                } else {
                    // console.error(
                    //     "Invalid response structure or missing required fields"
                    // );
                    // setPopupMessage("ไม่พบข้อมูลที่ตรงกันของชนิดพืช สารเคมี เเละศัตรูพืช");
                    // setShowPopup(true);
                }
            } else {
                // console.error("CloseAccount validation failed");
                // setPopupMessage("เกิดข้อผิดพลาดในการตรวจสอบสารเคมีเเละศัตรูพืช");
                // setShowPopup(true);
            }
        } catch (error) {
            // console.error(
            //     "Error fetching pest-chemical data:",
            //     error.message || error
            // );
            // setPopupMessage("เกิดข้อผิดพลาดในดึงข้อมูลสารเคมีเเละศัตรูพืช");
            // setShowPopup(true);
        } finally {
            setLoading(false)
        }
    }, [gap_id, setCurrentPage])

    const cancel = useCallback(() => {
        RefPop.current.removeAttribute("show");
        navigate(location.pathname, { replace: true });
        setTimeout(() => {
            setPopup(<></>);
        }, 500);
    }, [RefPop, setPopup, navigate, location.pathname])

    const validateInputs = useCallback(() => {
        let isValid = true;
        const errors = {}

        // ตรวจสอบชื่อสารเคมี
        if (!factors.some((val) => val.name === primaryName.trim())) {
            errors["primaryName"] = true
            isValid = false;
        } else {
            delete errors["primaryName"]
        }

        // ตรวจสอบชื่อสามัญสารเคมี
        if (
            !factors.some((val) => val.name_formula === secondaryName.trim())
        ) {
            errors["secondaryName"] = true
            isValid = false;
        } else {
            delete errors["secondaryName"]
        }

        // ตรวจสอบศัตรูพืช
        if (!pests.some((val) => val.pest_name === insectName.trim())) {
            errors["insectName"] = true
            isValid = false;
        } else {
            delete errors["insectName"]
        }

        setErrors(errors)
        return isValid;
    }, [factors, insectName, pests, primaryName, secondaryName])

    const setHowUse = useCallback(() => {
        try {
            !use && setUse(
                factors.filter((factor) =>
                    factor.name_formula === secondaryName &&
                    factor.name === primaryName
                ).map((factor) => factor.how_use)[0] ?? ""
            )
        } catch (e) { }
    }, [factors, primaryName, secondaryName, use])

    const setUpData = useCallback(() => {
        if (!editDefaultField) {
            return {
                id_farmhouse: greenhouse_id,
                id_plant: gap_id,
                date: useDate,
                formula_name: secondaryName,
                name: primaryName,
                use: use,
                volume: volume + " " + unit,
                source: source,
                type_request: type_path
            }
        } else {

        }
    }, [])

    const onConfirmFertilizer = useCallback(async () => {
        // if (
        //     useDate &&
        //     primaryName &&
        //     secondaryName &&
        //     use &&
        //     volume &&
        //     source
        // ) {

        // } else {
        //     const dataAll = new Map(
        //         [
        //             ["useDate" , useDate],
        //             ["primaryName" , primaryName],
        //             ["secondaryName" , secondaryName],
        //             ["use" , use],
        //             ["volume" , volume],
        //             ["source" , source]
        //         ]
        //     )

        //     setErrors(errors => {
        //         const newErrors = { ...errors }
        //         dataAll.forEach((data, title) => {
        //             if(data) delete newErrors[title]
        //             else newErrors[title] = true
        //         })

        //         return newErrors
        //     })
        // }

        const schedule_id = scheduleIdRef.current;

        let requestData = {
            id_farmhouse: greenhouse_id,
            id_plant: gap_id,
            type_request: type_path,
            ...(schedule_id && { schedule_id })
        }

        if (!editDefaultField) {
            requestData = {
                ...requestData,
                date: useDate,
                formula_name: secondaryName,
                name: primaryName,
                use: use,
                volume: volume + " " + unit,
                source: source,
            }
        } else {
            requestData = {
                ...requestData,
                id_form: editDefaultField?.id,
                because,
                change: {
                    ...(useDate !== editDefaultField.date && { date: useDate }),
                    ...(secondaryName !== editDefaultField.formula_name && { formula_name: secondaryName }),
                    ...(primaryName !== editDefaultField.name && { name: primaryName }),
                    ...(use !== editDefaultField.use_is && { use }),
                    ...(volume + " " + unit !== editDefaultField.volume && { volume: volume + " " + unit }),
                    ...(source !== editDefaultField.source && { source }),
                }
            }
        }

        setWait(true);
        const result = await clientMo.post(endpointManage.current, requestData)
        if (await CloseAccount(result, setCurrentPage)) {
            cancel();
            if (propGreenhouseId && propGapId) {
                navigator(`/farmer/form/${greenhouse_id}/${gap_id}/${type_path}`);
            } else {
                ReloadData();
            }
            setWait(false);
        }
    }, [ReloadData, because, cancel, editDefaultField, gap_id, greenhouse_id, primaryName, secondaryName, setCurrentPage, source, type_path, unit, use, useDate, volume, navigator, propGreenhouseId, propGapId])

    const onConfirmChemical = useCallback(async () => {
        // if (!validateInputs()) {
        //     return;
        // }

        const schedule_id = scheduleIdRef.current;

        let requestData = {
            id_farmhouse: greenhouse_id,
            id_plant: gap_id,
            type_request: type_path,
            ...(schedule_id && { schedule_id })
        };

        if (!editDefaultField) {
            requestData = {
                ...requestData,
                date: useDate,
                formula_name: secondaryName,
                name: primaryName,
                insect: insectName,
                use: use,
                rate: rate,
                volume: volume + " " + unit,
                dateSafe: safeDate,
                source: source,
            }
        } else {
            requestData = {
                ...requestData,
                id_form: editDefaultField?.id,
                because,
                change: {
                    ...(useDate !== editDefaultField.date && { date: useDate }),
                    ...(secondaryName !== editDefaultField.formula_name && { formula_name: secondaryName }),
                    ...(primaryName !== editDefaultField.name && { name: primaryName }),
                    ...(use !== editDefaultField.use_is && { use }),
                    ...(volume + " " + unit !== editDefaultField.volume && { volume: volume + " " + unit }),
                    ...(source !== editDefaultField.source && { source }),
                    ...(insectName !== editDefaultField.insect && { insect: insectName }),
                    ...(rate !== editDefaultField.rate && { rate }),
                    ...(safeDate !== editDefaultField.date_safe && { date_safe: safeDate }),
                }
            }
        }

        setWait(true);
        const result = await clientMo.post(endpointManage.current, requestData);
        if (await CloseAccount(result, setCurrentPage)) {
            cancel();
            if (propGreenhouseId && propGapId) {
                navigator(`/farmer/form/${greenhouse_id}/${gap_id}/${type_path}`);
            } else {
                ReloadData();
            }
            setWait(false);
        }
    }, [ReloadData, because, cancel, editDefaultField, gap_id, greenhouse_id, insectName, primaryName, rate, safeDate, secondaryName, setCurrentPage, source, type_path, unit, use, useDate, volume, navigator, propGreenhouseId, propGapId])

    const onChangeHowUse = useCallback(() => {
        primaryName && secondaryName && setHowUse()
    }, [primaryName, secondaryName, setHowUse])

    const onSafeDate = useCallback((day_safe) => {
        try {
            const DateUsePut = new Date(
                useDate
                // ? ConvertDate(useDate).christDate : ""
            )
            DateUsePut.setDate(DateUsePut.getDate() + parseInt(day_safe) + 1);
            setSafeDate(DateUsePut);
        } catch (e) { }
    }, [useDate])


    const debounce = useRef(0)
    const ValidateChemicalAndPest = useCallback(({
        chemicalNameData, insectNameData
    }) => {
        clearTimeout(debounce.current)
        debounce.current = setTimeout(() => {
            document.activeElement.blur()
            const chemicalValue = (chemicalNameData || primaryName).trim(); // ใช้ Optional Chaining ป้องกัน undefined
            const pestValue = (insectNameData || insectName).trim();
            const plantNameValue = currentPlantPlantName?.trim(); // ชนิดพืชที่ได้จากไอดีฟอร์ม

            const matchedDateSafe = pestChemicalData.find(
                (entry) => entry.chemical_name === chemicalValue
            );

            matchedDateSafe && onSafeDate(matchedDateSafe.safe_days)

            // ตรวจสอบว่ามีค่าในฟิลด์หรือไม่
            if (!chemicalValue || !pestValue || !plantNameValue) {
                return;
            }

            // ตรวจสอบความสัมพันธ์ใน pestChemicalData
            const matchedEntry = pestChemicalData.find(
                (entry) => entry.pest_name === pestValue && entry.chemical_name === chemicalValue
            );

            if (!matchedEntry) {
                // ดึงประเภทศัตรูพืช (type_pest) ถ้ามี
                const pestType = pests.find((entry) => entry.pest_name === pestValue)?.type_pest || 'ศัตรูพืช/โรคพืช';  // ถ้าไม่พบ type_pest จะใช้ค่าเริ่มต้น

                setPopupMessage(
                    `สารเคมี "${chemicalValue}" ไม่ตรงกับ${pestType} "${pestValue}" `
                );
                setShowPopup(true);
            } else {
                console.log("Matched entry:", matchedEntry);
            }
        }, 0)
    }, [currentPlantPlantName, insectName, onSafeDate, pestChemicalData, pests, primaryName])

    useEffect(() => {
        RefPop.current.setAttribute("show", "")
        fetchFactor(type_path === "z" ? "fertilizer" : "chemical");
        fetchSource()

        const checkSchedule = async () => {
            const schedule_id = scheduleIdRef.current;
            if (gap_id && schedule_id) {
                try {
                    const res = await clientMo.post("/api/farmer/check-schedule", { formplant_id: gap_id, schedule_id });
                    const data = JSON.parse(res);
                    if (data && data.recorded) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'แจ้งเตือน',
                            text: 'คุณได้บันทึกข้อมูลตามแผนนี้เรียบร้อยแล้ว ไม่สามารถบันทึกซ้ำได้',
                            confirmButtonColor: '#3085d6',
                            confirmButtonText: 'ตกลง'
                        }).then(() => {
                            cancel();
                        });
                    }
                } catch (e) {
                    console.error("Check schedule error:", e);
                }
            }
        };
        checkSchedule();
    }, [fetchFactor, fetchSource, RefPop, type_path, gap_id, cancel]);

    useEffect(() => {
        type_path !== "z" && fetchPestChemicalData()
    }, [fetchPestChemicalData, type_path])

    useEffect(() => {
        fetchPests()
    }, [fetchPests]);

    useEffect(() => {
        onChangeHowUse()
    }, [onChangeHowUse])

    const Disabled = useMemo(() =>
        type_path === "z" ?
            !Boolean(
                useDate &&
                primaryName &&
                use &&
                volume &&
                source &&
                unit &&
                (editDefaultField ? because : true)
            ) :
            !Boolean(
                useDate &&
                primaryName &&
                use &&
                volume &&
                source &&
                unit &&
                insectName &&
                rate &&
                safeDate &&
                validateInputs() &&
                (editDefaultField ? because : true)
            )
        , [because, editDefaultField, insectName, primaryName, rate, safeDate, source, type_path, unit, use, useDate, validateInputs, volume])

    return (
        // <section className="popup-content-fertilizer" onTouchStart={OutListSearch}>
        <section className="popup-content-fertilizer">
            {/* ป๊อปอัปแจ้งเตือน */}
            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <div className="icon">⚠️</div>
                        <div className="title">การแจ้งเตือน</div>
                        <p>{popupMessage}</p>
                        <button onClick={() => setShowPopup(false)}>ปิด</button>
                    </div>
                </div>
            )}

            <div className="head">แบบบันทึกเกษตรกร</div>
            <div className="form">
                <div className="head-form">
                    {
                        type_path === "z" ? (
                            <span>ปัจจัยการผลิต (ปุ๋ยที่ใช้)</span>
                        ) : (
                            <span>สารเคมี</span>
                        )
                    }
                </div>
                <div className="body-content">
                    <div className="frame-content">
                        <div className="content">
                            <div className="step">
                                <div className="num">1.</div>
                                <div className="body">
                                    {type_path === "z" ? (
                                        <>
                                            <div className="row">
                                                <label className="frame-textbox">
                                                    <span>ว/ด/ป ที่ใช้</span>
                                                    <DatePickerThaiApp
                                                        className={"input-date"}
                                                        value={useDate}
                                                        maxDate={new Date()}
                                                        onChange={(christDate) => setUseDate(christDate)}
                                                        format="DD-MM-YYYY"
                                                    />
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox colume">
                                                    <span className="full">
                                                        ชื่อสิ่งที่ใช้ (ชื่อการค้า, ตรา)
                                                    </span>
                                                    <div className="content-colume-input">
                                                        <div className="input-select-popup">
                                                            <Autocomplete
                                                                disableClearable
                                                                sx={{
                                                                    [`& .MuiOutlinedInput-root`]: {
                                                                        padding: "0px !important"
                                                                    }
                                                                }}
                                                                filterOptions={(options, { inputValue }) => {
                                                                    if (!inputValue) return options;
                                                                    return PrimarySearch.match.search(inputValue).map(r => r.item);
                                                                }}
                                                                value={primaryName}
                                                                options={PrimarySearch.factorsName}
                                                                renderInput={(params) =>
                                                                    <TextField {...params} placeholder={loadingPrimaryName ? "กำลังโหลด" : "เลือกชื่อปุ๋ย"} />
                                                                }
                                                                readOnly={loadingPrimaryName}
                                                                onChange={(e, value) => {
                                                                    setPrimaryName(value)
                                                                    setSecondaryName("")
                                                                }}
                                                                noOptionsText="ไม่พบปุ๋ย"
                                                            />
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox">
                                                    <span>ชื่อสูตรปุ๋ย</span>
                                                    <div className="input-select-other">
                                                        <Autocomplete
                                                            disableClearable
                                                            sx={{
                                                                [`& .MuiOutlinedInput-root`]: {
                                                                    padding: "0px !important"
                                                                }
                                                            }}
                                                            filterOptions={(options, { inputValue }) => {
                                                                if (!inputValue) return options;
                                                                return SecondarySearch.match.search(inputValue).map(r => r.item);
                                                            }}
                                                            value={secondaryName}
                                                            options={SecondarySearch.factorsName}
                                                            renderInput={(params) =>
                                                                <TextField {...params} placeholder={loadingSecondaryName ? "กำลังโหลด" : (primaryName ? "เลือกสูตรปุ๋ย" : "ต้องเลือกชื่อก่อน")} />
                                                            }
                                                            readOnly={loadingSecondaryName || !primaryName}
                                                            onChange={(e, value) => setSecondaryName(value)}
                                                            noOptionsText="ไม่พบสูตรปุ๋ย"
                                                        />
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox colume">
                                                    <span className="full">วิธีการใช้</span>
                                                    <TextField
                                                        value={use}
                                                        onChange={(e) => setUse(e.target.value)}
                                                        multiline
                                                        rows={2}
                                                        fullWidth
                                                        sx={{
                                                            bgcolor: "white",
                                                            [`& .MuiInputBase-root`]: {
                                                                padding: 1
                                                            }
                                                        }}
                                                    />
                                                    {/* <textarea
                                                onChange={() => }
                                                className="content-colume-input"
                                                style={{ textAlign: "left" }}
                                            >
                                                
                                            </textarea> */}
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox">
                                                    <span>ปริมาณที่ใช้</span>
                                                    <div className="input-row">
                                                        <input
                                                            onChange={(e) => setVolume(e.target.value)}
                                                            value={volume}
                                                            type="number"
                                                            placeholder="ตัวเลข"
                                                        ></input>
                                                        <select
                                                            onChange={(e) => setUnit(e.target.value)}
                                                            value={unit}
                                                        >
                                                            <option value={"ลิตร"}>ลิตร</option>
                                                            <option value={"กก."}>กก.</option>
                                                        </select>
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox">
                                                    <span>แหล่งที่ซื้อ</span>
                                                    {!loadingSources ? (
                                                        <select
                                                            onChange={(e) => setSource(e.target.value)}
                                                            value={source}
                                                        >
                                                            <option value={""} disabled>
                                                                เลือก
                                                            </option>
                                                            {
                                                                sources && (
                                                                    sources.map(({ name, id }) => (
                                                                        <option value={name} key={id}>
                                                                            {name}
                                                                        </option>
                                                                    ))
                                                                )}
                                                        </select>
                                                    ) : (
                                                        <select
                                                            disabled
                                                            defaultValue={""}
                                                        >
                                                            <option disabled value={""}>
                                                                กำลังโหลด
                                                            </option>
                                                        </select>
                                                    )}
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="row">
                                                <label className="frame-textbox">
                                                    <span>ว/ด/ป ที่พ่นสาร</span>
                                                    <DatePickerThaiApp
                                                        className={"input-date"}
                                                        value={useDate}
                                                        maxDate={new Date()}
                                                        onChange={(christDate) => setUseDate(christDate)}
                                                        format="DD-MM-YYYY"
                                                    />
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox colume">
                                                    <span className="full">
                                                        ชื่อสารเคมี (ชื่อการค้า, ตรา)
                                                    </span>
                                                    <div className="content-colume-input">
                                                        <div className="input-select-popup">
                                                            <Autocomplete
                                                                disableClearable
                                                                sx={{
                                                                    [`& .MuiOutlinedInput-root`]: {
                                                                        padding: "0px !important"
                                                                    }
                                                                }}
                                                                filterOptions={(options, { inputValue }) => {
                                                                    if (!inputValue) return options;
                                                                    return PrimarySearch.match.search(inputValue).map(r => r.item);
                                                                }}
                                                                value={primaryName}
                                                                options={PrimarySearch.factorsName}
                                                                renderInput={(params) =>
                                                                    <TextField {...params} placeholder={loadingPrimaryName ? "กำลังโหลด" : "เลือกชื่อสารเคมี"} />
                                                                }
                                                                readOnly={loadingPrimaryName}
                                                                onChange={(event, value) => {
                                                                    setPrimaryName(value)
                                                                    setSecondaryName("")
                                                                    ValidateChemicalAndPest({
                                                                        chemicalNameData: value
                                                                    })
                                                                }}
                                                                noOptionsText="ไม่พบชื่อสารเคมี"
                                                            />
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox">
                                                    <span>ชื่อสามัญสารเคมี</span>
                                                    <div className="input-select-other">
                                                        <Autocomplete
                                                            disableClearable
                                                            sx={{
                                                                [`& .MuiOutlinedInput-root`]: {
                                                                    padding: "0px !important"
                                                                }
                                                            }}
                                                            filterOptions={(options, { inputValue }) => {
                                                                if (!inputValue) return options;
                                                                return SecondarySearch.match.search(inputValue).map(r => r.item);
                                                            }}
                                                            value={secondaryName}
                                                            options={SecondarySearch.factorsName}
                                                            renderInput={(params) =>
                                                                <TextField {...params} placeholder={loadingSecondaryName ? "กำลังโหลด" : (primaryName ? "เลือกชื่อสามัญ" : "ต้องเลือกชื่อก่อน")} />
                                                            }
                                                            readOnly={loadingSecondaryName || !primaryName}
                                                            onChange={(event, value) => {
                                                                setSecondaryName(value)
                                                            }}
                                                            noOptionsText="ไม่พบชื่อสามัญสารเคมี"
                                                        />
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox colume">
                                                    <span className="full">ศัตรูพืชหรือโรคที่พบ</span>
                                                    <div className="content-colume-input">
                                                        <div className="input-select-popup">
                                                            <Autocomplete
                                                                disableClearable
                                                                sx={{
                                                                    [`& .MuiOutlinedInput-root`]: {
                                                                        padding: "0px !important"
                                                                    }
                                                                }}
                                                                value={insectName}
                                                                options={
                                                                    pests.map(({ pest_name }) => pest_name)
                                                                }
                                                                renderInput={(params) =>
                                                                    <TextField {...params} placeholder={loadingPest ? "กำลังโหลด" : "เลือกชื่อศัตรูพืช"} />
                                                                }
                                                                readOnly={loadingPest}
                                                                onChange={(event, value) => {
                                                                    setInsectName(value)
                                                                    ValidateChemicalAndPest({
                                                                        insectNameData: value
                                                                    })
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox colume">
                                                    <span className="full">วิธีการใช้</span>
                                                    <TextField
                                                        value={use}
                                                        onChange={(e) => setUse(e.target.value)}
                                                        multiline
                                                        rows={2}
                                                        fullWidth
                                                        sx={{
                                                            bgcolor: "white",
                                                            [`& .MuiInputBase-root`]: {
                                                                padding: 1
                                                            }
                                                        }}
                                                    />
                                                    {/* <textarea
                                                className="content-colume-input"
                                                style={{ textAlign: "left" }}
                                                ref={Use}
                                            ></textarea> */}
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox">
                                                    <span>อัตราที่ผสม</span>
                                                    <div className="input-row">
                                                        <input
                                                            onChange={(e) => setRate(e.target.value)}
                                                            value={rate}
                                                            type="number"
                                                            placeholder="cc."
                                                        />
                                                        <div className="unit">CC/น้ำ20ล.</div>
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox">
                                                    <span>ปริมาณที่ใช้ทั้งหมด</span>
                                                    <div className="input-row">
                                                        <input
                                                            onChange={(e) => setVolume(e.target.value)}
                                                            value={volume}
                                                            type="number"
                                                            placeholder="ตัวเลข"
                                                        />
                                                        <select
                                                            onChange={(e, value) => setUnit(e.target.value)}
                                                            value={unit}
                                                            defaultValue={"กรัม"}
                                                        >
                                                            <option value={"กรัม"}>กรัม</option>
                                                            <option value={"มิลลิลิตร"}>มิลลิลิตร</option>
                                                        </select>
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox">
                                                    <span>วันที่ปลอดภัย</span>
                                                    {/* <DatePickerThai
                                                    classNameMain="input-date"
                                                    defaultDate={getDateNow()}
                                                    onChange={(date) => {
                                                        setSafeDate(date)
                                                    }}
                                                /> */}
                                                    <DatePickerThaiApp
                                                        className={"input-date"}
                                                        value={safeDate}
                                                        onChange={(christDate) => setSafeDate(christDate)}
                                                        format="DD-MM-YYYY"
                                                    />
                                                    {/* <input onChange={ChangeChemi} onClick={()=>clickDate(DateSafe)} ref={DateSafe} type="date"></input> */}
                                                </label>
                                            </div>
                                            <div className="row">
                                                <label className="frame-textbox">
                                                    <span>แหล่งที่ซื้อ</span>
                                                    {/* <input onChange={ChangeChemi} ref={Source} type="text" placeholder="เลือกข้อมูล"></input> */}
                                                    {/* {sources ? (
                                                <select
                                                key={0}
                                                onChange={ChangeChemi}
                                                ref={Source}
                                                defaultValue={""}
                                                >
                                                <option value={""} disabled>
                                                    เลือก
                                                </option>
                                                {sources ? (
                                                    sources.map((val, key) => (
                                                    <option value={val.name} key={val.id}>
                                                        {val.name}
                                                    </option>
                                                    ))
                                                ) : (
                                                    <></>
                                                )}
                                                </select>
                                            ) : (
                                                <select
                                                key={1}
                                                disabled
                                                defaultValue={""}
                                                ref={Source}
                                                >
                                                <option disabled value={""}>
                                                    กำลังโหลด
                                                </option>
                                                </select>
                                            )} */}
                                                    {!loadingSources ? (
                                                        <select
                                                            onChange={(e) => setSource(e.target.value)}
                                                            value={source}
                                                        >
                                                            <option value={""} disabled>
                                                                เลือก
                                                            </option>
                                                            {
                                                                sources && (
                                                                    sources.map(({ name, id }) => (
                                                                        <option value={name} key={id}>
                                                                            {name}
                                                                        </option>
                                                                    ))
                                                                )}
                                                        </select>
                                                    ) : (
                                                        <select
                                                            disabled
                                                            defaultValue={""}
                                                        >
                                                            <option disabled value={""}>
                                                                กำลังโหลด
                                                            </option>
                                                        </select>
                                                    )}
                                                </label>
                                            </div>
                                        </>
                                    )}
                                    {
                                        Boolean(editDefaultField) &&
                                        <div className="row">
                                            <label className={`frame-textbox colume`}>
                                                <span className="full">เหตุผลการแก้ไข</span>
                                                <TextField
                                                    value={because}
                                                    onChange={(e) => setBesauce(e.target.value)}
                                                    multiline
                                                    rows={2}
                                                    fullWidth
                                                    sx={{
                                                        bgcolor: "white",
                                                        [`& .MuiInputBase-root`]: {
                                                            padding: 1
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bt-form">
                    <button
                        style={{ backgroundColor: "#FF8484" }}
                        className="bt-confirm-factor"
                        onClick={cancel}
                    >
                        ยกเลิก
                    </button>
                    {
                        getWait ? (
                            <div
                                className="bt-confirm-factor"
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    padding: "2px",
                                    height: "30.8px"
                                }}
                            >
                                <Loading size={27} border={5} color="white" animetion={true} />
                            </div>
                        ) : (
                            <button
                                disabled={Disabled}
                                className="bt-confirm-factor"
                                onClick={type_path === "z" ? onConfirmFertilizer : onConfirmChemical}
                            >
                                ยืนยัน
                            </button>
                        )
                    }
                </div>
            </div>
        </section>
    )
}