import React, { useCallback, useEffect, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { CloseAccount } from "../../method";
import "./DataForm.scss";
import { ConvertDate, DatePickerThai, DateSelect, DayJSX, Loading } from "../../../../../assets/js/module";
import DetailEdit from "../DetailEdit";
import { useNavigate, useParams } from "react-router";
import { useGreenhouse } from "..";
import { useFarmer } from "../../main";

const DataForm = () => {

    const { greenhouse_id , gap_id } = useParams()
    const navigator = useNavigate()

    const { setCurrentPage } = useGreenhouse()

    const [Data, setData] = useState([]);
    const [Load, setLoad] = useState(false);
    const [StatusEdit, setStatusEdit] = useState(false);
    const [Popup, setPopup] = useState(<></>);
    const [DataPlant, setDataPlant] = useState([]);
    const [getDateOut, setDateOut] = useState("");
    const [QtyDate, setQtyDate] = useState(0);
    const [getWait, setWait] = useState(false);
    // const [varieties, setVarieties] = useState([]);
    const [selectedPlantId, setSelectedPlantId] = useState(null); // ประกาศ state อย่างถูกต้อง
    const [previousInsects, setPreviousInsects] = useState([]); // เก็บข้อมูลโรค/แมลงที่พบ
    const [selectedInsect, setSelectedInsect] = useState("");
    const [allInsects, setAllInsects] = useState([]); // เก็บค่าทั้งหมดที่ต้องแสดง




    const PopupRef = useRef();
    const ManageMenu = useRef();
    const BtManageMenu = {
        Frame: useRef(),
        Svg: useRef(),
        Path: useRef()
    };
    const DataContent = useRef();

    const TypePlantInput = useRef();
    const VarietyInput = useRef();
    const Generation = useRef();
    const DateGlow = useRef();
    const DatePlant = useRef();
    const PositionW = useRef();
    const PositionH = useRef();
    const Qty = useRef();
    const Area = useRef();
    const Unit = useRef();
    const DateOut = useRef();
    const System = useRef();
    const Water = useRef();
    const WaterStep = useRef();
    const History = useRef();
    const Insect = useRef();
    const QtyInsect = useRef();
    const Seft = useRef();
    const Because = useRef();
    const BtConfirm = useRef();

    // useEffect(() => {
    //     if (Data.id_plant) {
    //         FetchVarieties(Data.id_plant);
    //     }
    //     console.log(Data.id_plant)
    // }, [Data.id_plant]);

    // useEffect(() => {
    //     if (selectedPlantId) {
    //         FetchVarieties(selectedPlantId); // ดึง varieties เมื่อ selectedPlantId เปลี่ยน
    //     }
    // }, [selectedPlantId]);
    useEffect(() => {
        if (Data.insect) {
            setSelectedInsect(Data.insect); // ตั้งค่าเริ่มต้นเป็นค่าที่เคยเลือก
        }

        // รวมค่าที่มีอยู่ใน previousInsects + ค่าที่เลือกไว้ (ถ้าไม่มีใน previousInsects)
        if (Data.insect && !previousInsects.includes(Data.insect)) {
            setAllInsects([Data.insect, ...previousInsects]); // เอาค่าที่เลือกไว้ขึ้นก่อน
        } else {
            setAllInsects(previousInsects);
        }
    }, [Data.insect, previousInsects]);


    useEffect(() => {
        setPreviousInsects((prev) => {
            if (!prev.includes("เลือก")) {
                return ["เลือก", ...prev]; // เพิ่ม "เลือก" เป็นตัวเลือกแรกเสมอ
            }
            return prev;
        });
    }, [previousInsects]);

    const FetchData = useCallback(async () => {
        setLoad(false);
        setData({});
        const result = await clientMo.post("/api/farmer/formplant/select", { id_formplant: gap_id, id_farmhouse: greenhouse_id });

        if (await CloseAccount(result, setCurrentPage)) {
            const DataIn = JSON.parse(result);
            if (DataIn && DataIn[0]) {
                setData(DataIn[0]);
                setDateOut(DataIn[0].date_harvest.split(" ")[0]);
                if (DataIn[0].previousData) {
                    const insects = [];
                    DataIn[0].previousData.forEach(({ insect }) => {
                        if (insect) { // ตรวจสอบว่า insect ไม่ใช่ null หรือ undefined
                            insects.push(...insect.split(","));
                        }
                    });
                    setPreviousInsects([...new Set(insects)]); // แยกเป็น Array ไม่ซ้ำกัน
                } else {
                    setPreviousInsects([]);                
                }
            } else {
                console.error("DataIn ไม่มีข้อมูลที่ต้องการ");
            }
            setLoad(true);
            setWait(false);
        }
    } , [gap_id, greenhouse_id, setCurrentPage])
    
    
    

    // const FetchVarieties = async (plantId) => {
    //     try {
    //         const response = await clientMo.post("/api/farmer/varieties" , { plant_id: plantId })
    //         const data = JSON.parse(response);
    //         setVarieties(data);
    //         console.log(data)
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };

    const FetchPlant = async () => {
        setDataPlant([]);
        const DataFetch = await clientMo.post("/api/farmer/plant/list");
        if (await CloseAccount(DataFetch, setCurrentPage)) {
            const LIST = JSON.parse(DataFetch);
            const SelectPlant = LIST.filter(val => val.name == Data.name_plant);
            setDataPlant(LIST);
            setQtyDate(SelectPlant.length != 0 ? SelectPlant[0].qty_harvest : 0);
            return LIST
        }
    };
    

    // const handlePlantChange = (event) => {
    //     const plantId = event.target.value;
    //     FetchVarieties(plantId);
    // };

    const MathDateHarvest = (DatePlant, DateQty) => {
        try {
            const DatePlantQty = new Date(DatePlant);
            DatePlantQty.setDate(DatePlantQty.getDate() + parseInt(DateQty));
            DateOut.current.value = DatePlantQty.toISOString().split("T")[0]
                .split("-")
                .map((val, key) => key == 0 ? parseInt(val) + 543 : val) // เพิ่ม 543 เฉพาะปี
                .reverse()
                .join("-");
            setDateOut(DatePlantQty.toISOString().split("T")[0]);
        } catch (e) {
            console.error("Error calculating harvest date:", e);
        }
    };
     

    const handlePlantChange = (event) => {
        const plantName = event.target.value;
    
        // ค้นหา id_plant จาก DataPlant ที่ตรงกับชื่อพืช
        const selectedPlant = DataPlant.find((plant) => plant.name === plantName);
    
        if (selectedPlant) {
            setSelectedPlantId(selectedPlant.id);
            setQtyDate(selectedPlant.qty_harvest); // อัปเดตจำนวนวันที่ใช้เก็บเกี่ยว
    
            // ถ้ามีวันที่ปลูกแล้ว ให้คำนวณวันที่เก็บเกี่ยว
            if (DatePlant.current?.value) {
                const plantDate = DatePlant.current.value
                    .split("-")
                    .reverse()
                    .map((val, idx) => (idx === 0 ? parseInt(val) - 543 : val))
                    .join("-");
                MathDateHarvest(plantDate, selectedPlant.qty_harvest);
            }
        }
    };

    const ReturnPage = useCallback(async () => {
        navigator(`/farmer/form/${greenhouse_id}/p/${gap_id}`)
    } , [gap_id, greenhouse_id, navigator])

    const ShowMenuManageForm = () => {
        ManageMenu.current.toggleAttribute("show");
    }

    const CloseManageMenu = useCallback((e) => {
        if (ManageMenu.current) {
            if (e.target !== BtManageMenu.Frame.current && e.target !== BtManageMenu.Svg.current && e.target !== BtManageMenu.Path.current) {
                ManageMenu.current.removeAttribute("show");
            }
        }
    } , [BtManageMenu.Frame, BtManageMenu.Path, BtManageMenu.Svg])

    const EditForm = async () => {
        const plants = await FetchPlant();
        const selectedPlant = plants.find((plant) => plant.name === Data.name_plant)
        // await FetchVarieties(selectedPlant?.id);
        DataContent.current.setAttribute("edit", "");
        setStatusEdit(true);
        document.querySelectorAll("#data-form-page *[readonly='']").forEach((val) => {
            if (val.getAttribute("date_dom") !== "") {
                val.removeAttribute("readonly");
            }
        });
    };

    const CancelEdit = (cancel = true) => {
        setLoad(false);
        setDateOut(Data.date_harvest.split(" ")[0]);
        setStatusEdit(false);
        DataContent.current.removeAttribute("edit");
        if (cancel) {
            setTimeout(() => {
                setLoad(true);
            }, 100);
        }
    };

    const ChangeDate = () => {
        if (!DateGlow.current) {
            console.error("DateGlow ยังไม่ได้เชื่อมกับ DOM");
            return;
        }
    
        const dateGlowValue = DateGlow.current.value || "";
        console.log("DateGlow Value:", dateGlowValue);
        // ดำเนินการต่อด้วย dateGlowValue
    };


    const validateInputs = () => {
        const requiredRefs = [
            TypePlantInput,
            VarietyInput,
            Generation,
            DateGlow,
            DatePlant,
            PositionW,
            PositionH,
            Qty,
            Area,
            Unit,
            DateOut,
            System,
            Water,
            WaterStep
        ];
    
        const isValid = requiredRefs.every(ref => ref.current && ref.current.value !== "");
        if (!isValid) {
            console.error("Input บางตัวไม่มีค่า");
        }
    
        return isValid;
    };
    

    const ConfirmEdit = async () => {
        //  {
        //     if (!TypePlantInput.current || !VarietyInput.current || !DateGlow.current) {
        //         return;
        //     }
        
        //     const type = TypePlantInput.current.value || "";
        //     const variety = VarietyInput.current.value || "";
        //     const dateGlow = DateGlow.current.value || "";
        
        //     // ตรวจสอบเงื่อนไขหรือทำงานต่อ
        // };
        if (BtConfirm.current.getAttribute("no") == null) {
            const type = TypePlantInput.current;
            // const variety = VarietyInput.current;
            const generetion = Generation.current;
            const dateGlow = DateGlow.current;
            const datePlant = DatePlant.current;
            const posiW = PositionW.current;
            const posiH = PositionH.current;
            const qty = Qty.current;
            const area = Area.current;
            const unit = Unit.current;
            const dateOut = DateOut.current;
            const system = System.current;
            const water = Water.current;
            const waterStep = WaterStep.current;
            const history = History.current;
            const insect = Insect.current;
            const qtyInsect = QtyInsect.current;
            const seft = Seft.current;
            const because = Because.current;

            

            const CheckChange = [
                type.value != Data.name_plant,
                // variety.value != Data.name_varieties,
                generetion.value != Data.generation,
                dateGlow.value?.split(" ")[0] != Data.date_glow.split(" ")[0],
                datePlant.value.split("-").reverse().map((val, key) => key == 0 ? parseInt(val) - 543 : val).join("-") != Data.date_plant.split(" ")[0],
                posiW.value != Data.posi_w,
                posiH.value != Data.posi_h,
                qty.value != Data.qty,
                Number(area.value) !== Number(Data.area),
                unit.value != Data.unit,
                dateOut.value.split("-").reverse().map((val, key) => key == 0 ? parseInt(val) - 543 : val).join("-") != Data.date_harvest.split(" ")[0],
                system.value != Data.system_glow,
                water.value != Data.water,
                waterStep.value != Data.water_flow,
                history.value != Data.history,
                insect.value != Data.insect,
                qtyInsect.value != Data.qtyInsect,
                seft.value != Data.seft
            ];

            if (
                (type.value && generetion.value && dateGlow.value && datePlant.value &&
                    posiW.value && posiH.value && qty.value && area.value && unit.value && dateOut.value && system.value &&
                    water.value && waterStep.value && because.value)
                &&
                (
                    CheckChange.filter(val => val)[0]
                )
            ) {
                const Key = [
                    "name_plant", "generation", "date_glow", "date_plant",
                    "posi_w", "posi_h", "qty", "area", "unit", "date_harvest", "system_glow",
                    "water", "water_flow", "history", "insect", "qtyInsect", "seft"
                ];
                const Value = [
                    type.value,
                    // variety.value,
                    generetion.value,
                    dateGlow.value,
                    ConvertDate(datePlant.value).christDate,
                    posiW.value,
                    posiH.value,
                    qty.value,
                    area.value,
                    unit.value,
                    ConvertDate(dateOut.value).christDate,
                    system.value,
                    water.value,
                    waterStep.value,
                    history.value,
                    insect.value,
                    qtyInsect.value,
                    seft.value
                ];

                const foundChange = CheckChange.map((val, index) => (val) ? [Key[index], Value[index]] : "").filter(val => val !== "");
                const data = {
                    id_farmhouse: greenhouse_id,
                    id_plant: gap_id,
                    because: because.value,
                    dataChange: Object.fromEntries(new Map([...foundChange])),
                    num: foundChange.length
                };

                setWait(true);
                const result = await clientMo.post("/api/farmer/formplant/edit", data);
                if (await CloseAccount(result, setCurrentPage)) {
                    if (result === "133") {
                        CancelEdit(false);
                        FetchData();
                    } else if (result === "submit") {
                        CancelEdit(false);
                        FetchData();
                    }
                }
            } else {
                let RefObject = [
                    type, generetion, dateGlow, datePlant,
                    posiW, posiH, qty, area, unit, dateOut, system,
                    water, waterStep, history, insect, qtyInsect, because
                ];
                RefObject.forEach((ele) => {
                    if (ele && !ele.value) ele.style.border = "2px solid red";
                    else if (ele && ele.value) ele.style.border = "2px solid transparent";
                });
            }
        }
    };

    const ChangeEdit = () => {
        // if (!TypePlantInput.current || !VarietyInput.current || !Data) {
        //     console.error("Ref หรือ Data ยังไม่พร้อม");
        //     return;
        // }

        const type = TypePlantInput.current.value || '';
        // const variety = VarietyInput.current.value || '';
        const generetion = Generation.current ? Generation.current.value : '';
        const dateGlow = DateGlow.current ? DateGlow.current.value : '';
        const datePlant = DatePlant.current ? DatePlant.current.value : '';
        const posiW = PositionW.current ? PositionW.current.value : '';
        const posiH = PositionH.current ? PositionH.current.value : '';
        const qty = Qty.current ? Qty.current.value : '';
        const area = Area.current ? Area.current.value : '';
        const unit = Unit.current ? Unit.current.value : '';
        const dateOut = DateOut.current ? DateOut.current.value : '';
        const system = System.current ? System.current.value : '';
        const water = Water.current ? Water.current.value : '';
        const waterStep = WaterStep.current ? WaterStep.current.value : '';
        const history = History.current ? History.current.value : '';
        const insect = Insect.current ? Insect.current.value : '';
        const qtyInsect = QtyInsect.current ? QtyInsect.current.value : '';
        const seft = Seft.current ? Seft.current.value : '';
        const because = Because.current ? Because.current.value : '';

        const CheckChange = [
            type !== Data.name_plant,
            // variety !== Data.name_varieties,
            generetion !== Data.generation,
            dateGlow?.split(" ")[0] !== Data.date_glow?.split(" ")[0],
            ConvertDate(datePlant).christDate !== Data.date_plant?.split(" ")[0],
            posiW !== Data.posi_w,
            posiH !== Data.posi_h,
            qty !== Data.qty,
            area !== Data.area,
            unit !== Data.unit,
            ConvertDate(dateOut).christDate !== Data.date_harvest?.split(" ")[0],
            system !== Data.system_glow,
            water !== Data.water,
            waterStep !== Data.water_flow,
            history !== Data.history,
            insect !== Data.insect,
            qtyInsect !== Data.qtyInsect,
            seft !== Data.seft
        ];

        if (CheckChange.some(change => change)) {
            BtConfirm.current?.removeAttribute("no");
        } else {
            BtConfirm.current?.setAttribute("no", "");
        }
    };

    const HistoryEdit = async () => {
        setPopup(
            <DetailEdit 
                Ref={PopupRef} 
                setRef={setPopup}
                type={"plant"} 
            />
        );
    };

    useEffect(() => {
        // setCurrentPage("DataForm");
        // if (isClick === 1) window.history.pushState({}, null, `/farmer/form/${greenhouse_id}/d/${id_plant}`);
        window.addEventListener("touchstart", CloseManageMenu);
        FetchData();

        return () => {
            window.removeEventListener("touchstart", CloseManageMenu);
        };
    }, [CloseManageMenu, FetchData]);

    return (
        <section className="data-form-page" id="data-form-page">
            <div className="head">
                <div className="return" onClick={ReturnPage}>
                    <svg fill="#000000" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                        <g fillRule="evenodd">
                            <path d="M1052 92.168L959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z" />
                            <path d="M1920 92.168L1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z" />
                        </g>
                    </svg>
                </div>
                <span>ข้อมูลแบบบันทึก</span>
                {
                    !StatusEdit && Load ?
                        <>
                            <div className="manage-form" ref={BtManageMenu.Frame} onClick={ShowMenuManageForm}>
                                <svg ref={BtManageMenu.Svg} fill="#000000" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path ref={BtManageMenu.Path} d="M0 26.016q0 2.496 1.76 4.224t4.256 1.76h20q2.464 0 4.224-1.76t1.76-4.224v-20q0-2.496-1.76-4.256t-4.224-1.76h-20q-2.496 0-4.256 1.76t-1.76 4.256v20zM4 26.016v-20q0-0.832 0.576-1.408t1.44-0.608h20q0.8 0 1.408 0.608t0.576 1.408v20q0 0.832-0.576 1.408t-1.408 0.576h-20q-0.832 0-1.44-0.576t-0.576-1.408zM8 24h16v-4h-16v4zM8 18.016h16v-4h-16v4zM8 12h16v-4h-16v4z"></path>
                                </svg>
                            </div>
                            <div className="manage-menu" ref={ManageMenu}>
                                {Data.state_status < 2 ?
                                    <div onClick={EditForm}>แก้ไขข้อมูล</div>
                                    : <></>
                                }
                                <div onClick={HistoryEdit}>ประวัติแก้ไข</div>
                            </div>
                        </> : <></>
                }
            </div>
            <div className="form">
                <div className="data-content" ref={DataContent}>
                    <div className="frame-content">
                        {Load ?
                            <div className="content">
                                <div className="step">
                                    <div className="num">1.</div>
                                    <div className="body">
                                        <div className="row">
                                            <label className={`frame-textbox${Data.subjectResult.name_plant == 2 ? " not" : ""}`}>
                                                <span>ชนิดพืช</span>
                                                <div className="input-select-popup">
                                                    {StatusEdit ?
                                                        DataPlant.length !== 0 ?
                                                            <select style={{ width: "100%" }} onChange={handlePlantChange} ref={TypePlantInput} defaultValue={Data.name_plant}>
                                                                <option disabled value={""}>เลือกพืช</option>
                                                                {
                                                                    DataPlant.map((plant, key) =>
                                                                        <option key={key} value={plant.name}>{plant.name}</option>

                                                                    
                                                                    )
                                                                }
                                                            </select> : <></>
                                                        : <input readOnly defaultValue={Data.name_plant}></input>
                                                    }
                                                </div>
                                            </label>
                                        </div>
                                        {/* <div className="row">
                                            <label className={`frame-textbox${Data.subjectResult.name_varieties == 2 ? " not" : ""}`}>
                                            <span>สายพันธุ์พืช</span>
                                                <div className="input-select-popup">
                                                    {StatusEdit ?
                                                       (varieties) && varieties.length !== 0 ?
                                                            <select style={{ width: "100%" }} ref={VarietyInput} defaultValue={Data.name_varieties} onChange={ChangeEdit}>
                                                                <option disabled value="">เลือกสายพันธุ์พืช</option>
                                                                {varieties.map((variety, key) =>
                                                                    <option key={key} value={variety.variety_name}>{variety.variety_name}</option>
                                                                )}
                                                            </select>
                                                            : <input readOnly value={Data.name_varieties} />
                                                        : <input readOnly defaultValue={Data.name_varieties} />
                                                    }
                                                </div>
                                            </label>
                                        </div> */}
                                        
                                        <div className="row">
                                            <label className={`frame-textbox${Data.subjectResult.generation == 2 ? " not" : ""}`}>
                                                <span>รุ่นที่ปลูก</span>
                                                <input ref={Generation} onChange={StatusEdit ? ChangeEdit : null} type="number" readOnly defaultValue={Data.generation}></input>
                                            </label>
                                        </div>
                                        <div className="row">
                                            <label className={`frame-textbox colume${Data.subjectResult.date_glow == 2 ? " not" : ""}`}>
                                            <span className="full">วันที่เพาะกล้า</span>
                                                <div className="full">
                                                    {
                                                        StatusEdit ? 
                                                            // <input ref={DateGlow} onChange={StatusEdit ? ChangeEdit : null} type="date" 
                                                            // defaultValue={Data.date_glow.split(" ")[0]}></input> 
                                                            <DateSelect RefDateValue={DateGlow} Value={Data.date_glow} methodCheckValue={ChangeEdit}/>
                                                            : 
                                                            <DayJSX className="w-100" DATE={Data.date_glow} TYPE="normal"/>
                                                    }
                                                </div>
                                            </label>
                                        </div>
                                        <div className="row">
                                            <label className={`frame-textbox colume${Data.subjectResult.date_plant == 2 ? " not" : ""}`}>
                                                <span className="full">วันที่ปลูก</span>
                                                <div className="full">
                                                    {
                                                        StatusEdit ?
                                                            <DatePickerThai classNameMain="input-date" className="w-100" defaultDate={Data.date_plant.split(" ")[0]} offsetQtyDate={QtyDate} refIn={DatePlant} onInputIn={(e, qty) => {
                                                                ChangeEdit();
                                                                const DateChis = e.target.value.split("-").reverse().map((val, key) => key == 0 ? parseInt(val) - 543 : val).join("-");
                                                                const DatePlantQty = new Date(DateChis);
                                                                DatePlantQty.setDate(DatePlantQty.getDate() + parseInt(qty));
                                                                DateOut.current.value = DatePlantQty.toISOString().split("T")[0].split("-").map((val, key) => key == 0 ? parseInt(val) + 543 : val).reverse().join("-");
                                                                setDateOut(DatePlantQty.toISOString().split("T")[0]);
                                                            }} />
                                                            :
                                                            <DayJSX className="w-100" DATE={Data.date_plant} TYPE="normal" />
                                                    }
                                                </div>
                                            </label>
                                        </div>
                                        <div className="row">
                                            <label className={`frame-textbox colume${Data.subjectResult.posi_w == 2 || Data.subjectResult.posi_h == 2 ? " not" : ""}`}>
                                                <div className="full">ระยะการปลูก</div>
                                                <div className="choose w-100">
                                                    <label className="choose colume w-100">
                                                        ระหว่างต้น
                                                        <input ref={PositionW} onChange={StatusEdit ? ChangeEdit : null} readOnly type="number" defaultValue={Data.posi_w} ></input>
                                                    </label>
                                                    <div>X</div>
                                                    <label className="choose colume w-100">
                                                        ระหว่างแถว
                                                        <input ref={PositionH} onChange={StatusEdit ? ChangeEdit : null} readOnly type="number" defaultValue={Data.posi_h}></input>
                                                    </label>
                                                </div>
                                            </label>
                                        </div>
                                        <div className="row">
                                            <label className={`frame-textbox${Data.subjectResult.qty == 2 ? " not" : ""}`}>
                                                <span>จำนวนต้น</span>
                                                <input ref={Qty} onChange={StatusEdit ? ChangeEdit : null} readOnly type="text" defaultValue={Data.qty}></input>
                                            </label>
                                        </div>
                                        <div className="row">
                                             <label className={`frame-textbox colume${(Data.subjectResult.area == 2 || Data.subjectResult.unit == 2) ? " not" : ""}`}> 
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ marginRight: '1px' }}>พื้นที่</span>
                                                    <input
                                                        ref={Area}
                                                        onChange={StatusEdit ? ChangeEdit : null}
                                                        type="number"
                                                        defaultValue={Data.area}
                                                        style={{ marginRight: '5px', flex: 1 }}
                                                    />
                                                    {StatusEdit ? (
                                                        <select onChange={ChangeEdit} ref={Unit} defaultValue={Data.unit} style={{ flex: 1, maxWidth: '150px' }}>
                                                            <option disabled value="">เลือก</option>
                                                            <option value="โรงเรือน">โรงเรือน</option>
                                                            <option value="ไร่">ไร่</option>
                                                            <option value="ตารางเมตร">ตารางเมตร</option>
                                                        </select>
                                                    ) : (
                                                        <input readOnly defaultValue={Data.unit} style={{ flex: 1, maxWidth: '150px' }} />
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                        <div className="row">
                                            <label className={`frame-textbox colume${Data.subjectResult.date_harvest == 2 ? " not" : ""}`}>
                                                <span className="full">วันที่คาดว่าจะเก็บเกี่ยว</span>
                                                <div className="full">
                                                    {
                                                        StatusEdit ?
                                                            <DatePickerThai classNameMain="input-date" className="w-100" defaultDate={getDateOut} refIn={DateOut} onInputIn={ChangeEdit} />
                                                            :
                                                            <DayJSX className="w-100" DATE={Data.date_harvest} TYPE="normal" />
                                                    }
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="num">2.</div>
                                    <div className="body">
                                        <div className="row">
                                            <label className={`frame-textbox${Data.subjectResult.system_glow == 2 ? " not" : ""}`}>
                                                <span>รูปแบบการปลูก</span>
                                                {StatusEdit ?
                                                    <select onChange={ChangeEdit} ref={System} defaultValue={Data.system_glow}>
                                                        <option disabled value="">เลือก</option>
                                                        <option value={"ขึ้นแปลงปลูกตามไหล่เขา"}>ขึ้นแปลงปลูกตามไหล่เขา</option>
                                                        <option value={"ขึ้นแปลงปลูกที่ลุ่มหลังนา"}>ขึ้นแปลงปลูกที่ลุ่มหลังนา</option>
                                                        <option value={"ปลูกแบบขึ้นค้าง"}>ปลูกแบบขึ้นค้าง</option>
                                                        <option value={"ระบบ Hydroponic"}>ระบบ Hydroponic</option>
                                                        <option value={"ปลูกในวัสดุปลูก"}>ปลูกในวัสดุปลูก</option>
                                                        <option value={"ในโรงเรือน"}>ในโรงเรือน</option>
                                                    </select>
                                                    : <input readOnly defaultValue={Data.system_glow}></input>
                                                }
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="num">3.</div>
                                    <div className="body">
                                        <div className="row">
                                            <label className={`frame-textbox${Data.subjectResult.water == 2 ? " not" : ""}`}>
                                                <span>แหล่งน้ำ</span>
                                                {StatusEdit ?
                                                    <select onChange={ChangeEdit} ref={Water} defaultValue={Data.water}>
                                                        <option disabled value="">เลือก</option>
                                                        <option value={"อาศัยน้ำฝน"}>อาศัยน้ำฝน</option>
                                                        <option value={"ลำธาร/คลองธรรมชาติ"}>ลำธาร/คลองธรรมชาติ</option>
                                                        <option value={"บ่อบาดาล"}>บ่อบาดาล</option>
                                                        <option value={"บ่อ/สระขุด"}>บ่อ/สระขุด</option>
                                                        <option value={"คลองชลประทาน"}>คลองชลประทาน</option>
                                                        <option value={"อ่างเก็บน้ำ"}>อ่างเก็บน้ำ</option>
                                                    </select>
                                                    : <input readOnly defaultValue={Data.water}></input>
                                                }
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="num">4.</div>
                                    <div className="body">
                                        <div className="row">
                                            <label className={`frame-textbox${Data.subjectResult.water_flow == 2 ? " not" : ""}`}>
                                                <span>วิธีการให้น้ำ</span>
                                                {StatusEdit ?
                                                    <select onChange={ChangeEdit} ref={WaterStep} defaultValue={Data.water_flow}>
                                                        <option disabled value="">เลือก</option>
                                                        <option value={"สปริงเกอร์"}>สปริงเกอร์</option>
                                                        <option value={"ระบบน้ำหยด"}>ระบบน้ำหยด</option>
                                                        <option value={"ปล่อยตามร่อง"}>ปล่อยตามร่อง</option>
                                                        <option value={"ใช้สายยางรด"}>ใช้สายยางรด</option>
                                                        <option value={"ตักรด"}>ตักรด</option>
                                                    </select>
                                                    : <input readOnly defaultValue={Data.water_flow}></input>
                                                }
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="num">5.</div>
                                    <div className="body">
                                        <div className="row">
                                            <label className={`frame-textbox`}>
                                                <span style={{ width: "100%" }}>ประวัติการใช้พื้นที่และการเกิดโรคระบาด</span>
                                            </label>
                                        </div>
                                        <div className="row">
                                            <label className={`frame-textbox${Data.subjectResult.history == 2 ? " not" : ""}`}>
                                                <span>พืชที่ปลูกก่อนหน้า</span>
                                                <input ref={History} onChange={StatusEdit ? ChangeEdit : null} readOnly type="text" defaultValue={Data.history}></input>
                                            </label>
                                        </div>
                                        <div className="row">
                                        <label className={`frame-textbox${Data.subjectResult.insect == 2 ? " not" : ""}`}>
                                        <span>โรค/แมลงที่พบ</span>
                                        {StatusEdit ? (
                                            <select
                                                onChange={(e) => {
                                                    setSelectedInsect(e.target.value); // อัปเดตค่าเมื่อเลือกใหม่
                                                    ChangeEdit();
                                                }}
                                                value={selectedInsect} // กำหนดค่าเริ่มต้นให้เป็นค่าที่เลือกไว้
                                                ref={Insect}
                                            >
                                                {/* <option disabled value="">เลือก</option> */}
                                                {previousInsects.map((insect, index) => (
                                                    <option key={index} value={insect}>{insect}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input readOnly defaultValue={Data.insect}></input>
                                        )}
                                    </label>

                                        </div>
                                        <div className="row">
                                            <label className={`frame-textbox${Data.subjectResult.qtyInsect == 2 ? " not" : ""}`}>
                                                <span>ปริมาณการเกิดโรค และแมลงที่พบ</span>
                                                {StatusEdit ?
                                                    <select onChange={ChangeEdit} ref={QtyInsect} defaultValue={Data.qtyInsect}>
                                                        <option disabled value="">เลือก</option>
                                                        <option value={"น้อย"}>น้อย</option>
                                                        <option value={"ปานกลาง"}>ปานกลาง</option>
                                                        <option value={"มาก"}>มาก</option>
                                                    </select>
                                                    : <input readOnly defaultValue={Data.qtyInsect}></input>
                                                }
                                            </label>
                                        </div>
                                        <div className="row">
                                            <label className={`frame-textbox${Data.subjectResult.seft == 2 ? " not" : ""}`}>
                                                <span>การป้องกันกำจัด</span>
                                                <textarea style={{ textAlign: "start", padding: "0.5em" }} ref={Seft} onChange={StatusEdit ? ChangeEdit : null} readOnly defaultValue={Data.seft}></textarea>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {
                                    StatusEdit ?
                                        <div className="step">
                                            <div className="body">
                                                <div className="row">
                                                    <label className={`frame-textbox colume`}>
                                                        <span className="full">เหตุผลการแก้ไข</span>
                                                        <textarea style={{ textAlign: "start", padding: "0.5em" }} className="full" onChange={ChangeEdit} ref={Because}></textarea>
                                                    </label>
                                                </div>
                                            </div>
                                        </div> : <></>
                                }
                            </div> : <></>
                        }
                    </div>
                </div>
                {
                    StatusEdit ?
                        <div className="bt">
                            <button style={{ backgroundColor: "red" }} className="bt-confirm-edit" onClick={CancelEdit}>ยกเลิก</button>
                            {getWait ?
                                <div className="bt-confirm-edit" style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    padding: "2px"
                                }}>
                                    <Loading size={24} border={5} color="white" animetion={true} />
                                </div> :
                                <button ref={BtConfirm} no="" className="bt-confirm-edit" onClick={ConfirmEdit}>ยืนยัน</button>
                            }
                        </div>
                        : <></>
                }
            </div>
            <div className="popup-detail-edit" ref={PopupRef}>
                {Popup}
            </div>
        </section>
    );
}

export default DataForm;
