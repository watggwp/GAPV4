import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { DatePickerThai, DateSelect, Loading } from "../../../../../assets/js/module";
import { CloseAccount } from "../../method";
import { Stack } from "@mui/material";
import { useFarmer } from "../../main";
import "./GapCardList.scss";

const DEFAULT_IMG = "/plant_glow.jpg";

/* ══════════════════════════════════════════════════════
   Modal: เพิ่มใบ GAP  (ฟอร์มเต็มเหมือน InsertPlant)
══════════════════════════════════════════════════════ */
const AddGapModal = ({ houses, onClose, onSuccess }) => {

    /* ── House selection ── */
    const [selectedHouseId, setSelectedHouseId] = useState("");

    /* ── Form state ── */
    const [DataPlant, setDataPlant] = useState([]);
    const [getHistoryPlantLoad, setHistory] = useState(true);
    const [DateNowOnForm, setDateNowOnForm] = useState(
        `${new Date().getFullYear()}-${("0" + (new Date().getMonth() + 1)).slice(-2)}-${("0" + new Date().getDate()).slice(-2)}`
    );
    const [getDateOut, setDateOut] = useState("");
    const [DateHarvest, setDateHarvest] = useState("");
    const [placeholder, setPlaceholder] = useState("");
    const [unit, setUnit] = useState("");
    const [previousInsect, setPreviousInsect] = useState("");
    const [previousInsects, setPreviousInsects] = useState([]);
    const [getWait, setWait] = useState(false);

    /* ── Refs ── */
    const FormContent = useRef();
    const TypePlantInput = useRef();
    const Generation = useRef();
    const DateGlow = useRef();
    const DatePlant = useRef();
    const PositionW = useRef();
    const PositionH = useRef();
    const Qty = useRef();
    const Area = useRef();
    const DateOut = useRef();
    const DayOut = useRef();
    const MountOut = useRef();
    const YearOut = useRef();
    const System = useRef();
    const Water = useRef();
    const WaterStep = useRef();
    const History = useRef();
    const Insect = useRef();
    const QtyInsect = useRef();
    const Seft = useRef();
    const BTConfirm = useRef();
    const timeout = useRef(0);
    const expected_yield = useRef();
    const default_yield = useRef();

    /* keep "เลือก" always first in insect list */
    useEffect(() => {
        setPreviousInsects((prev) => {
            if (!prev.includes("เลือก")) return ["เลือก", ...prev];
            return prev;
        });
    }, [previousInsects]);

    useEffect(() => {
        FetchPlant();
        return () => clearTimeout(timeout.current);
    }, []);



    // useEffect(() => {
    //     if (YearOut.current) YearOut.current.classList.add("report-not");
    // }, []);

    /* ── API: plant list ── */
    const FetchPlant = async () => {
        const Data = await clientMo.post("/api/farmer/plant/list");
        // if (YearOut.current) YearOut.current.classList.add("report-not");
        if (await CloseAccount(Data)) {
            setDataPlant(JSON.parse(Data));
        }
    };

    /* ── API: history per plant name (uses selectedHouseId from closure) ── */
    const FetchDataForm = (name_plant_list, houseId) => {
        clearTimeout(timeout.current);
        setHistory(true);
        if (FormContent.current) FormContent.current.setAttribute("over", "");

        timeout.current = setTimeout(async () => {
            if (!houseId) {
                setHistory(false);
                if (FormContent.current) FormContent.current.removeAttribute("over");
                return;
            }
            const Data = await clientMo.post("/api/farmer/formplant/history", {
                id_farmhouse: houseId,
                name_plant_list,
            });
            if (await CloseAccount(Data)) {
                try {
                    const obj = JSON.parse(Data);
                    // if (obj.qtyDate.length !== 0) {
                    //     const qtyHarvest = parseInt(obj.qtyDate[0].qty_harvest);
                    //     MathDateHarvest(DateNowOnForm, qtyHarvest);
                    //     setDateHarvest(qtyHarvest);
                    // }
                    if (obj.FromHistory.length !== 0) {
                        Generation.current.value = parseInt(obj.FromHistory[0].generation) + 1;
                        PositionW.current.value = obj.FromHistory[0].posi_w;
                        PositionH.current.value = obj.FromHistory[0].posi_h;
                        Qty.current.value = obj.FromHistory[0].qty;
                        Area.current.value = obj.FromHistory[0].area;
                        System.current.value = obj.FromHistory[0].system_glow;
                        Water.current.value = obj.FromHistory[0].water;
                        WaterStep.current.value = obj.FromHistory[0].water_flow;
                        History.current.value = obj.FromHistory[0].name_plant;
                        Insect.current.value = obj.FromHistory[0].insect;
                        QtyInsect.current.value = obj.FromHistory[0].qtyInsect;
                        Seft.current.value = obj.FromHistory[0].seft;
                        expected_yield.current.value = obj.FromHistory[0].expected_yield;
                        default_yield.current.value = obj.FromHistory[0].default_yield;
                    }
                    if (obj.insect.length > 0) {
                        setPreviousInsects(obj.insect);
                        setPreviousInsect(obj.insect_generation[0]);
                    } else {
                        setPreviousInsects([]);
                    }
                } catch (e) { console.error(e); }
            }
            if (name_plant_list !== "") {
                if (FormContent.current) FormContent.current.removeAttribute("over");
                setHistory(false);
            }
            ChangeCHK();
        }, 1500);
    };

    /* ── Helpers ── */
    const MathDateHarvest = (plantDate, qty) => {
        try {
            const d = new Date(plantDate);
            d.setDate(d.getDate() + parseInt(qty));
            DateOut.current.value = d.toISOString().split("T")[0]
                .split("-").map((v, i) => i === 0 ? parseInt(v) + 543 : v).reverse().join("-");
            setDateOut(d.toISOString().split("T")[0]);
        } catch (e) { }
    };

    /* เหมือน Change handler ในต้นฉบับ */
    const Change = (event) => {
        const value = event.target.value;
        let placeholderText = "";
        switch (value) {
            case "โรงเรือน": placeholderText = "จำนวนโรงเรือน"; break;
            case "ไร่": placeholderText = "จำนวนไร่"; break;
            case "ตารางเมตร": placeholderText = "จำนวนตารางเมตร"; break;
            default: placeholderText = "หน่วยพื้นที่";
        }
        setPlaceholder(placeholderText);
        setUnit(value);
        if (event.target.value) event.target.classList.remove("report-not");
    };

    const ChangeCHK = () => {
        const type = TypePlantInput.current;
        // const generetion = Generation.current;
        // const dateGlow = DateGlow.current;
        const datePlant = DatePlant.current;
        // const posiW = PositionW.current;
        // const posiH = PositionH.current;
        // const qty = Qty.current;
        // const area = Area.current;
        const dateOut = DateOut.current;
        // const system = System.current;
        // const water = Water.current;
        // const waterStep = WaterStep.current;


        // const ListCheck = [type, generetion, dateGlow, datePlant, posiW, posiH,
        //     qty, area, dateOut, system, water, waterStep];

        // ListCheck.forEach((current) => {
        //     if (current) {
        //         if (current.value !== "") {
        //             if (current === DateGlow.current) {/* YearOut.current?.classList.remove("report-not"); */}
        //             else current.classList.remove("report-not");
        //         } else {
        //             if (current === DateGlow.current) {/* YearOut.current?.classList.add("report-not"); */}
        //             else current.classList.add("report-not");
        //         }
        //     }
        // });

        if (type?.value && // generetion?.value && dateGlow?.value?.split("-")[0] &&
            datePlant?.value && // posiW?.value && posiH?.value && qty?.value && area?.value && 
            dateOut?.value // && system?.value && water?.value && waterStep?.value
        ) {
            // if (type?.value && generetion?.value && dateGlow?.value?.split("-")[0] &&
            //     datePlant?.value && posiW?.value && posiH?.value && qty?.value &&
            //     area?.value && dateOut?.value && system?.value && water?.value && waterStep?.value
            //     ) {
            BTConfirm.current?.removeAttribute("no");
        } else {
            BTConfirm.current?.setAttribute("no", "");
        }
    };

    const SetTextOnOther = (e) => {
        if (selectedHouseId) {
            const selectedIdx = e.target.value;
            const selectedPlant = DataPlant[selectedIdx];
            const plantName = selectedPlant ? selectedPlant.name : "";

            if (selectedPlant && selectedPlant.qty_harvest !== undefined && selectedPlant.qty_harvest !== null) {
                const qtyHarvest = parseInt(selectedPlant.qty_harvest);
                MathDateHarvest(DateNowOnForm, qtyHarvest);
                setDateHarvest(qtyHarvest);
            }

            FetchDataForm(plantName, selectedHouseId);
        }
        ChangeCHK();
    };

    /* ── Submit ── */
    // const Confirm = async () => {
    //     if (!selectedHouseId) return;
    //     const type = TypePlantInput.current;
    //     const generetion = Generation.current;
    //     const dateGlow = DateGlow.current;
    //     const datePlant = DatePlant.current;
    //     const posiW = PositionW.current;
    //     const posiH = PositionH.current;
    //     const qty = Qty.current;
    //     const area = Area.current;
    //     const dateOut = DateOut.current;
    //     const system = System.current;
    //     const water = Water.current;
    //     const waterStep = WaterStep.current;
    //     const history = History.current;
    //     const insect = Insect.current;
    //     const qtyInsect = QtyInsect.current;
    //     const seft = Seft.current;
    //     const expectedYield = expected_yield.current;
    //     const defaultYield = default_yield.current;

    //     if (type.value && generetion.value && dateGlow.value.split("-")[0] &&
    //         datePlant.value && posiW.value && posiH.value && qty.value &&
    //         area.value && dateOut.value && system.value && water.value && waterStep.value) {

    //         const data = {
    //             id_farmhouse: selectedHouseId,
    //             name_plant: type.value,
    //             generetion: generetion.value || null,
    //             dateGlow: dateGlow.value || null,
    //             datePlant: datePlant.value.split("-").reverse().map((v, i) => i === 0 ? parseInt(v) - 543 : v).join("-"),
    //             posiW: posiW.value || null,
    //             posiH: posiH.value || null,
    //             qty: qty.value || null,
    //             area: area.value || null,
    //             unit: unit.value || null,
    //             dateOut: dateOut.value.split("-").reverse().map((v, i) => i === 0 ? parseInt(v) - 543 : v).join("-"),
    //             system: system.value || null,
    //             water: water.value || null,
    //             waterStep: waterStep.value || null,
    //             history: history.value || null,
    //             insect: insect.value || null,
    //             qtyInsect: qtyInsect.value || null,
    //             seft: seft.value || null,
    //             expectedYield: expectedYield.value || null,
    //             defaultYield: defaultYield.value || null,
    //         };

    //         setWait(true);
    //         const response = await clientMo.post("/api/farmer/formplant/insert", data);
    //         if (await CloseAccount(response)) {
    //             onSuccess();
    //         } else {
    //             console.error("Insert failed:", response);
    //             setWait(false);
    //         }
    //     } else {
    //         console.error("Missing required fields");
    //     }
    // };

    // ฟังก์ชันแปลงวันที่ พ.ศ. → ค.ศ. รองรับทั้ง yyyy-mm-dd และ dd-mm-yyyy
    function convertThaiDateToISO(dateStr) {
        if (!dateStr) return dateStr;
        let parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        // ถ้าเป็น yyyy-mm-dd
        if (parts[0].length === 4) {
            let year = parseInt(parts[0], 10);
            if (year > 2400) year -= 543;
            return [year, parts[1].padStart(2, '0'), parts[2].padStart(2, '0')].join('-');
        }
        // ถ้าเป็น dd-mm-yyyy
        if (parts[2].length === 4) {
            let year = parseInt(parts[2], 10);
            if (year > 2400) year -= 543;
            return [year, parts[1].padStart(2, '0'), parts[0].padStart(2, '0')].join('-');
        }
        return dateStr;
    }

    const Confirm = async () => {

        console.log("CLICK CONFIRM");

        try {

            console.log("selectedHouseId =>", selectedHouseId);

            if (!selectedHouseId) {
                console.log("ไม่มี selectedHouseId");
                return;
            }

            const type = TypePlantInput?.current;
            const selectedIdx = type ? type.value : "";
            const selectedPlant = DataPlant[selectedIdx];
            const selectedPlantName = selectedPlant ? selectedPlant.name : "";
            const selectedVarietyName = selectedPlant ? selectedPlant.variety_name : "";

            if (!selectedPlantName) {
                console.log("ยังไม่ได้เลือก type");
                return;
            }
            console.log("DATE PLANT =>", DatePlant.current?.value);
            console.log("DATE OUT =>", DateOut.current?.value);

            if (!DatePlant.current?.value) {
                console.log("ไม่มีวันที่ปลูก");
                return;
            }

            if (!DateOut.current?.value) {
                console.log("ไม่มีวันที่เก็บเกี่ยว");
                return;
            }

            const data = {
                id_farmhouse: selectedHouseId,
                name_plant: selectedPlantName,
                name_varieties: selectedVarietyName,
                datePlant: convertThaiDateToISO(DatePlant.current.value),
                dateOut: convertThaiDateToISO(DateOut.current.value),
            };

            console.log("SEND DATA =>", data);

            setWait(true);

            const response = await clientMo.post(
                "/api/farmer/formplant/insert",
                data
            );

            console.log("RESPONSE =>", response);

            if (await CloseAccount(response)) {
                onSuccess();
            } else {
                setWait(false);
            }

        } catch (err) {

            console.log("CONFIRM ERROR =>", err);

            setWait(false);
        }
    };
    /* ── JSX ── */
    return (
        <div className="gap-modal-overlay" onClick={onClose}>
            <div className="gap-modal-full" onClick={(e) => e.stopPropagation()}>

                {/* Title */}
                <h2 className="gap-modal-title">เพิ่มใบ GAP</h2>

                {/* Scrollable area */}
                <div className="gap-modal-scroll">

                    {/* ─ House dropdown row ─ */}
                    <div className="gap-modal-house-row">
                        <span className="gap-modal-label">โรงเรือน</span>
                        <select
                            className="gap-modal-select"
                            value={selectedHouseId}
                            onChange={(e) => {
                                setSelectedHouseId(e.target.value);
                                setHistory(true);
                                if (FormContent.current) FormContent.current.setAttribute("over", "");
                            }}
                        >
                            <option value="" disabled>กรุณาเลือกโรงเรือน</option>
                            {houses.filter((h) => h.status === 1).map((h) => (
                                <option key={h.id_farm_house} value={h.id_farm_house}>
                                    {h.name_house}
                                </option>
                            ))}
                        </select>
                    </div>
                    {!selectedHouseId && (
                        <p className="gap-modal-hint">* กรุณาเลือกโรงเรือน</p>
                    )}

                    {/* ─ Inner form ─ */}
                    <div className="gap-inner-form">
                        <div className="head-form">
                            <span>การปลูกของฉัน</span>
                        </div>
                        <div className="body-content">
                            <div ref={FormContent} className="frame-content" over="">
                                <div className="content">

                                    {/* Step 1 */}
                                    <div className="step">
                                        <div className="num">1.</div>
                                        <div className="body">
                                            <div className="row">
                                                {!selectedHouseId && <div className="block-wait" />}
                                                <label className="frame-textbox">
                                                    <span>ชนิดพืช</span>
                                                    <select
                                                        className="report-not"
                                                        onChange={SetTextOnOther}
                                                        ref={TypePlantInput}
                                                        defaultValue=""
                                                        disabled={!selectedHouseId}
                                                    >
                                                        <option disabled value="">เลือกพืช</option>
                                                        {DataPlant.map((p, i) => (
                                                            <option key={i} value={i}>{p.name} {p.variety_name ? `(${p.variety_name})` : ""}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>รุ่นที่ปลูก</span>
                                                    <input onInput={ChangeCHK} ref={Generation} type="number" placeholder="ตัวเลข" />
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>วันที่เพาะกล้า (เฉพาะปีได้)</span>
                                                    <DateSelect RefDateValue={DateGlow} methodCheckValue={ChangeCHK} Ref={{ DayCK: DayOut, MountCK: MountOut, YearCK: YearOut }} />
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>วันที่ปลูก</span>
                                                    <DatePickerThai
                                                        classNameMain="input-date"
                                                        defaultDate={DateNowOnForm}
                                                        offsetQtyDate={DateHarvest}
                                                        refIn={DatePlant}
                                                        onInputIn={(e) => {
                                                            const plantDate = e.target.value.split("-").reverse().map((v, i) => i === 0 ? parseInt(v) - 543 : v).join("-");
                                                            setDateNowOnForm(plantDate);
                                                            MathDateHarvest(plantDate, DateHarvest);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox colume">
                                                    <div className="full">ระยะการปลูก</div>
                                                    <div className="choose">
                                                        <label className="choose colume">
                                                            ระหว่างต้น
                                                            <input onInput={ChangeCHK} ref={PositionW} type="number" />
                                                        </label>
                                                        <div>X</div>
                                                        <label className="choose colume">
                                                            ระหว่างแถว
                                                            <input onInput={ChangeCHK} ref={PositionH} type="number" />
                                                        </label>
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>จำนวนต้น</span>
                                                    <input onInput={ChangeCHK} ref={Qty} type="number" placeholder="ตัวเลข" />
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <Stack>
                                                        <Stack direction={"row"}>
                                                            <span>พื้นที่</span>
                                                            <select onChange={Change} ref={System} defaultValue="">
                                                                <option disabled value="">เลือก</option>
                                                                <option value="โรงเรือน">โรงเรือน</option>
                                                                <option value="ไร่">ไร่</option>
                                                                <option value="ตารางเมตร">ตารางเมตร</option>
                                                            </select>
                                                        </Stack>
                                                        <Stack marginTop={1} alignItems={"center"}>
                                                            <input style={{ width: "calc(100% - 16px)" }} onInput={ChangeCHK} ref={Area} type="number" placeholder={placeholder} />
                                                        </Stack>
                                                    </Stack>
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>วันที่คาดว่า <br />จะเก็บเกี่ยว</span>
                                                    <DatePickerThai classNameMain="input-date" defaultDate={getDateOut} onInputIn={ChangeCHK} refIn={DateOut} />
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>ปริมาณผลผลิต <br /> ที่คาดว่าจะได้รับ</span>
                                                    <input onInput={ChangeCHK} ref={Qty} type="number" placeholder="ตัวเลข" />
                                                    กก.
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>ผลผลิตที่ได้จริง</span>
                                                    <input onInput={ChangeCHK} ref={Qty} type="number" placeholder="ตัวเลข" />
                                                    กก.
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="step">
                                        <div className="num">2.</div>
                                        <div className="body">
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>รูปแบบการปลูก</span>
                                                    <select onChange={ChangeCHK} ref={System} defaultValue="">
                                                        <option disabled value="">เลือก</option>
                                                        <option value="ขึ้นแปลงปลูกตามไหล่เขา">ขึ้นแปลงปลูกตามไหล่เขา</option>
                                                        <option value="ขึ้นแปลงปลูกที่ลุ่มหลังนา">ขึ้นแปลงปลูกที่ลุ่มหลังนา</option>
                                                        <option value="ปลูกแบบขึ้นค้าง">ปลูกแบบขึ้นค้าง</option>
                                                        <option value="ระบบ Hydroponic">ระบบ Hydroponic</option>
                                                        <option value="ปลูกในวัสดุปลูก">ปลูกในวัสดุปลูก</option>
                                                        <option value="ในโรงเรือน">ในโรงเรือน</option>
                                                    </select>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="step">
                                        <div className="num">3.</div>
                                        <div className="body">
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>แหล่งน้ำ</span>
                                                    <select onChange={ChangeCHK} ref={Water} defaultValue="">
                                                        <option disabled value="">เลือก</option>
                                                        <option value="อาศัยน้ำฝน">อาศัยน้ำฝน</option>
                                                        <option value="ลำธาร/คลองธรรมชาติ">ลำธาร/คลองธรรมชาติ</option>
                                                        <option value="บ่อบาดาล">บ่อบาดาล</option>
                                                        <option value="บ่อ/สระขุด">บ่อ/สระขุด</option>
                                                        <option value="คลองชลประทาน">คลองชลประทาน</option>
                                                        <option value="อ่างเก็บน้ำ">อ่างเก็บน้ำ</option>
                                                    </select>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 4 */}
                                    <div className="step">
                                        <div className="num">4.</div>
                                        <div className="body">
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>วิธีการให้น้ำ</span>
                                                    <select onChange={ChangeCHK} ref={WaterStep} defaultValue="">
                                                        <option disabled value="">เลือก</option>
                                                        <option value="สปริงเกอร์">สปริงเกอร์</option>
                                                        <option value="ระบบน้ำหยด">ระบบน้ำหยด</option>
                                                        <option value="ปล่อยตามร่อง">ปล่อยตามร่อง</option>
                                                        <option value="ใช้สายยางรด">ใช้สายยางรด</option>
                                                        <option value="ตักรด">ตักรด</option>
                                                    </select>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 5 */}
                                    <div className="step">
                                        <div className="num">5.</div>
                                        <div className="body">
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span style={{ width: "100%" }}>ประวัติการใช้พื้นที่และการเกิดโรคระบาด</span>
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>พืชที่ปลูกก่อนหน้า</span>
                                                    <input onInput={ChangeCHK} ref={History} type="text" placeholder="กรอก" />
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>โรค/แมลงที่พบ</span>
                                                    <select onChange={ChangeCHK} ref={Insect} defaultValue="">
                                                        {previousInsects.map((ins, i) => (
                                                            <option selected={previousInsect === ins} key={i} value={ins}>{ins}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>ปริมาณการเกิดโรค และแมลงที่พบ</span>
                                                    <select onChange={ChangeCHK} ref={QtyInsect} defaultValue="">
                                                        <option disabled value="">เลือก</option>
                                                        <option value="น้อย">น้อย</option>
                                                        <option value="ปานกลาง">ปานกลาง</option>
                                                        <option value="มาก">มาก</option>
                                                    </select>
                                                </label>
                                            </div>
                                            <div className="row">
                                                {getHistoryPlantLoad ? <div className="block-wait" /> : <></>}
                                                <label className="frame-textbox">
                                                    <span>การป้องกันกำจัด</span>
                                                    <textarea ref={Seft} placeholder="กรอก" />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                </div>{/* .content */}
                            </div>{/* .frame-content */}
                        </div>{/* .body-content */}
                    </div>{/* .gap-inner-form */}

                </div>{/* .gap-modal-scroll */}

                {/* Action buttons */}
                <div className="gap-modal-actions">
                    <button className="gap-modal-btn gap-modal-btn--cancel" onClick={onClose}>ยกเลิก</button>
                    {getWait
                        ? <div className="gap-modal-btn gap-modal-btn--confirm" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <Loading size={27} border={5} color="white" animetion={true} />
                        </div>
                        : <button className="gap-modal-btn gap-modal-btn--confirm" ref={BTConfirm} no="" onClick={Confirm}>ยืนยัน</button>
                    }
                </div>

            </div>
        </div>
    );
};


/* ══════════════════════════════════════════════════════
   Main Component: GapCardList
══════════════════════════════════════════════════════ */
const GapCardList = () => {
    const navigator = useNavigate();
    const { uid } = useFarmer();

    const [cards, setCards] = useState([]);
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const houseRaw = await clientMo.get("/api/farmer/farmhouse/get/HouseList");
            const allHouses = JSON.parse(houseRaw);
            if (!Array.isArray(allHouses)) { setCards([]); setHouses([]); return; }
            setHouses(allHouses);
            const openHouses = allHouses.filter((h) => h.status === 1);
            const allCards = [];
            for (const house of openHouses) {
                const formRaw = await clientMo.post("/api/farmer/formplant/select", { id_farmhouse: house.id_farm_house });
                if (!formRaw || formRaw === "error auth" || formRaw === "close") continue;
                const forms = JSON.parse(formRaw);
                if (!Array.isArray(forms)) continue;
                for (const gap of forms) {
                    if (parseInt(gap.state_status) === 2) continue;
                    allCards.push({ house, gap });
                }
            }
            setCards(allCards);
        } catch (err) {
            console.error("GapCardList fetchAll error:", err);
            setCards([]);
        } finally {
            setLoading(false);
            clientMo.unLoadingPage?.();
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const goGap = (houseId, gapId) => navigator(`/farmer/form/${houseId}/${gapId}/p`);
    const goFertilizer = (houseId, gapId) => navigator(`/farmer/form/${houseId}/${gapId}/z?open-insert=1`);
    const goChemical = (houseId, gapId) => navigator(`/farmer/form/${houseId}/${gapId}/c?open-insert=1`);

    const handleSuccess = () => { setShowModal(false); fetchAll(); };

    return (
        <div className="gap-liff-page">
            <header className="gap-liff-header">
                <div className="header-logo">
                    <div className="logo-circle">
                        <img src="/logo2.png" alt="logo" width="35" height="35" />
                    </div>
                    <span className="logo-text">Good Agricultural Practices</span>
                </div>
            </header>

            <div className="gap-liff-title-wrap">
                <h1 className="gap-liff-title">GAP</h1>
            </div>

            {loading ? (
                <div className="gap-liff-loading"><div className="spinner" /><p>กำลังโหลด…</p></div>
            ) : cards.length === 0 ? (
                <div className="gap-liff-empty">ไม่มีข้อมูลแปลง กรุณาสร้างแปลง</div>
            ) : (
                <div className="gap-card-grid">
                    {cards.map(({ house, gap }) => (
                        <div key={`${house.id_farm_house}-${gap.id}`} className="gap-card">
                            <div className="gap-card-img-wrap">
                                <img
                                    src={house.img_house || DEFAULT_IMG} alt={house.name_house}
                                    onError={(e) => { e.target.src = DEFAULT_IMG; }}
                                    className="gap-card-img"
                                />
                                <span className="gap-house-badge">{'โรงเรือน ' + house.name_house}</span>
                                {(gap.report || gap.form || gap.plant || gap.success) && gap.state_status < 2 && (
                                    <span className="gap-card-badge">มีข้อความจากเจ้าหน้าที่</span>
                                )}
                            </div>
                            <div className="gap-card-body">
                                <p className="gap-card-plant-name">{gap.name_plant || `แปลง ${gap.id}`}</p>
                                <button className="gap-btn" onClick={() => goGap(house.id_farm_house, gap.id)}>ข้อมูลพื้นฐาน</button>
                                <button className="gap-btn" onClick={() => goFertilizer(house.id_farm_house, gap.id)}>บันทึกปุ๋ย</button>
                                <button className="gap-btn" onClick={() => goChemical(house.id_farm_house, gap.id)}>บันทึกสารเคมี</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {houses.length > 0 && (
                <button className="gap-fab" onClick={() => setShowModal(true)} aria-label="เพิ่มใบ GAP">+</button>
            )}

            {showModal && (
                <AddGapModal
                    houses={houses}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};

export default GapCardList;