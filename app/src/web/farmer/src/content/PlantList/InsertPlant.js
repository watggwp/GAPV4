import React , {useEffect , useRef, useState} from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { DatePickerThai, DateSelect, DayJSX, Loading } from "../../../../../assets/js/module";
import { CloseAccount } from "../../method";

const PopupInsertPlant = ({setPopup , RefPop , id_house , ReloadData , setPage}) =>{
    const [getTimeOut , setTimeOut] = useState(0)
    
    const [DateNowOnForm , setDateNowOnForm] = useState(`${new Date().getFullYear()}-${("0" + (new Date().getMonth() + 1).toString()).slice(-2)}-${("0" + new Date().getDate().toString()).slice(-2)}`)
    const [getDateOut , setDateOut] = useState("")
    const [DateHarvest , setDateHarvest] = useState("")
    // const [varieties, setVarieties] = useState([]);
    const [selectedPlant, setSelectedPlant] = useState("")
    const [placeholder, setPlaceholder] = useState('')
    const [unit, setUnit] = useState("")
    const [previousInsects, setPreviousInsects] = useState([]);
    


    
    const FormContent = useRef()
    // const TypevarietiesInput = useRef()
    const TypePlantInput = useRef()
    const Generation = useRef()
    const DateGlow = useRef()
    const DatePlant = useRef()
    const PositionW = useRef()
    const PositionH = useRef()
    const Qty = useRef()
    const Area = useRef()

    const DateOut = useRef()
    const DayOut = useRef()
    const MountOut = useRef()
    const YearOut = useRef()

    const System = useRef()

    const Water = useRef()

    const WaterStep = useRef()

    const History = useRef()
    const Insect = useRef()
    const QtyInsect = useRef()
    const Seft = useRef()

    const ListSearch = useRef()
    const [ListSelect , setListOther] = useState(<></>)
    const [DataPlant , setDataPlant] = useState([])

    const [getHistoryPlantLoad , setHistory] = useState(true)

    const BTConfirm = useRef()

    const [getWait , setWait] = useState(false)

    const [insectOptions, setInsectOptions] = useState([]);
    

    useEffect(()=>{
        FetchPlant()
        RefPop.current.setAttribute("show" , "")
    } , [])

    useEffect(()=>{
        if(YearOut.current) YearOut.current.classList.add("report-not")
    } , [YearOut.current])

    useEffect(()=>{
        return() => {
            clearTimeout(getTimeOut)
        }
    } , [getTimeOut])
    
    // useEffect(() => {
    //     FetchVarieties(selectedPlant);
    //   }, [selectedPlant]);

    // useEffect(() => {
    //     if (selectedPlant) {
    //         FetchVarieties(selectedPlant);
    //     }
    // }, [selectedPlant]);
    
    useEffect(()=>{
        clearTimeout(getTimeOut)
    } , [getHistoryPlantLoad])

    // const FetchVarieties = async (plantId) => {
    //     try {
    //         const response = await clientMo.post("/api/farmer/varieties" , { plant_id: plantId })
    //         const data = JSON.parse(response);
    //         setVarieties(data);
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };

    const handlePlantChange = (event) => {
        const plantId = event.target.value;
        setSelectedPlant(plantId);
        // FetchVarieties(!!plantId);
    };

    // const handleVarietyChange = (event) => {
    //     const varietyId = event.target.value;
    //     console.log("Selected variety ID:", varietyId);
    //     const selectedVariety = varieties.find((variety) => variety.variety_id === varietyId);
    //     const harvestDays = selectedVariety ? parseInt(selectedVariety.dates) : 0;
    //     setDateHarvest(harvestDays);
    //     MathDateHarvest(DateNowOnForm, harvestDays);
    //   };

    // const handleVarietyChange = (event) => {
    //     const varietyId = event.target.value;
    //     // const selectedVariety = varieties.find((variety) => variety.variety_id === parseInt(varietyId));
    //     // const harvestDays = selectedVariety ? parseInt(selectedVariety.dates) : 0;
    
    //     if (DatePlant.current.value) {
    //         const plantDate = DatePlant.current.value.split("-").reverse().map((val, idx) => (idx === 0 ? parseInt(val) - 543 : val)).join("-");
    //         MathDateHarvest(plantDate, harvestDays);
    //     }
    
    //     setDateHarvest(harvestDays); // เก็บจำนวนวันที่ต้องการเพิ่ม
    // };
    

  

    
      
    

    const combinedFunction = (event) => {
        handlePlantChange(event);
        SetTextOnOther(event);
    };
    
    const Change = (event) => {
        const value = event.target.value;
        let placeholderText = '';
    
        switch (value) {
            case 'โรงเรือน':
                placeholderText = 'จำนวนโรงเรือน';
                break;
            case 'ไร่':
                placeholderText = 'จำนวนไร่';
                break;
            case 'ตารางเมตร':
                placeholderText = 'จำนวนตารางเมตร';
                break;
            default:
                placeholderText = 'หน่วยพื้นที่';
        }
    
        setPlaceholder(placeholderText);
        setUnit(value); 
    };
    
    
    
    
    // const FetchPlant = async () => {
    //     const Data = await clientMo.post("/api/farmer/plant/list")
    //     if(await CloseAccount(Data , setPage)) {
    //         const LIST = JSON.parse(Data)
    //         setDataPlant(LIST)
    //     }
    // }

    const FetchPlant = async () => {
        const Data = await clientMo.post("/api/farmer/plant/list")
        YearOut.current.classList.add("report-not")
        if(await CloseAccount(Data , setPage)) {
            const LIST = JSON.parse(Data)
            setDataPlant(LIST)
        }
    }


    

    const FetchDataForm = async (name_plant_list) => {
        setHistory(true);
        FormContent.current.setAttribute("over", "");
    
        setTimeOut(setTimeout(async () => {
            const Data = await clientMo.post("/api/farmer/formplant/history", {
                id_farmhouse: id_house,
                name_plant_list: name_plant_list
            });
    
            if (await CloseAccount(Data, setPage)) {
                try {
                    const Object = JSON.parse(Data);
    
                    if (Object.qtyDate.length !== 0) {
                        const qtyHarvest = parseInt(Object.qtyDate[0].qty_harvest);
                        MathDateHarvest(DateNowOnForm, qtyHarvest);
                        setDateHarvest(qtyHarvest);
                    }
    
                    if (Object.FromHistory.length !== 0) {
                        Generation.current.value = parseInt(Object.FromHistory[0].generation) + 1;
                        PositionW.current.value = Object.FromHistory[0].posi_w;
                        PositionH.current.value = Object.FromHistory[0].posi_h;
                        Qty.current.value = Object.FromHistory[0].qty;
                        Area.current.value = Object.FromHistory[0].area;
                        System.current.value = Object.FromHistory[0].system_glow;
                        Water.current.value = Object.FromHistory[0].water;
                        WaterStep.current.value = Object.FromHistory[0].water_flow;
                        History.current.value = Object.FromHistory[0].history;
                        Insect.current.value = Object.FromHistory[0].insect;
                        QtyInsect.current.value = Object.FromHistory[0].qtyInsect;
                        Seft.current.value = Object.FromHistory[0].seft;
                        History.current.value = Object.FromHistory[0].name_plant; // ใช้ค่าจาก FromHistory
                    }
    
                   // ดึงข้อมูลโรคพืชที่ปลูกก่อนหน้า
                   if (Object.insect.length > 0) {
                    setPreviousInsects(Object.insect);
                } else {
                    setPreviousInsects([]); // กรณีไม่มีข้อมูล
                }
    
                } catch (err) {
                    console.error(err);
                }
            }
    
            if (name_plant_list !== "") {
                FormContent.current.removeAttribute("over");
                setHistory(false);
            }
    
            ChangeCHK();
        }, 1500));
    };
    

    const Confirm = async () => {
        const type = TypePlantInput.current;
        // const varietiesInput = TypevarietiesInput.current;
        const generetion = Generation.current;
        const dateGlow = DateGlow.current;
        const datePlant = DatePlant.current;
        const posiW = PositionW.current;
        const posiH = PositionH.current;
        const qty = Qty.current;
        const area = Area.current;
        const dateOut = DateOut.current;
        const system = System.current;
        const water = Water.current;
        const waterStep = WaterStep.current;
        const history = History.current;
        const insect = Insect.current;
        const qtyInsect = QtyInsect.current;
        const seft = Seft.current;
    
        if (type.value && generetion.value && dateGlow.value.split("-")[0] && datePlant.value &&
            posiW.value && posiH.value && qty.value && area.value && dateOut.value && system.value &&
            water.value && waterStep.value) {
    
            // const selectedPlant = DataPlant.find(plant => plant.id == type.value);
            // // const selectedVariety = Array.isArray(varieties) ? varieties.find(variety => variety.variety_id == varietiesInput.value) : null;
    
            // const selectedPlantName = selectedPlant ? selectedPlant.name : "";
            // // const selectedVarietyName = selectedVariety ? selectedVariety.variety_name : "";
    
            const data = {
                id_farmhouse: id_house,
                name_plant : type.value,
                // name_variety: selectedVarietyName,
                generetion: generetion.value,
                dateGlow: dateGlow.value,
                datePlant: datePlant.value.split("-").reverse().map((val, key) => key == 0 ? parseInt(val) - 543 : val).join("-"),
                posiW: posiW.value,
                posiH: posiH.value,
                qty: qty.value,
                area: area.value,
                unit: unit, 
                dateOut: dateOut.value.split("-").reverse().map((val, key) => key == 0 ? parseInt(val) - 543 : val).join("-"),
                system: system.value,
                water: water.value,
                waterStep: waterStep.value,
                history: history.value,
                insect: insect.value,
                qtyInsect: qtyInsect.value,
                seft: seft.value
            };
    
            console.log("Data to be sent:", data); 
    
            setWait(true);
            const response = await clientMo.post("/api/farmer/formplant/insert", data);
            if (await CloseAccount(response, setPage)) {
                cancel();
                ReloadData();
                setWait(false);
            } else {
                console.error("Failed to insert data:", response);
            }
        } else {
            console.error("Missing required fields");
        }
    };
    
    
    
    

    const cancel = () => {
        RefPop.current.removeAttribute("show")
        setTimeout(()=>{
            setPopup(<></>)
        } , 500)
    }

    const ChangeCHK = () => {
        
        const type = TypePlantInput.current
        // const varieties = TypevarietiesInput.current
        const generetion = Generation.current
        const dateGlow = DateGlow.current
        const datePlant = DatePlant.current
        const posiW = PositionW.current
        const posiH = PositionH.current
        const qty = Qty.current
        const area = Area.current
        const dateOut = DateOut.current
        const system = System.current
        const water = Water.current
        const waterStep = WaterStep.current
        // const history = History.current
        // const insect = Insect.current
        // const qtyInsect = QtyInsect.current
        const ListCheck = [
            TypePlantInput.current,
            Generation.current,
            DateGlow.current,
            DatePlant.current,
            PositionW.current,
            PositionH.current,
            Qty.current,
            Area.current,
            DateOut.current,
            System.current,
            Water.current,
            WaterStep.current
        ]

        ListCheck.forEach(current=>{
            console.log(current)
            if(current) {
                if(current.value != "") {
                    if(current == DateGlow.current) {
                        YearOut.current.classList.remove("report-not")
                    }
                    else current.classList.remove("report-not")
                }
                else {
                    if(current == DateGlow.current) {
                        YearOut.current.classList.add("report-not")
                    }
                    else current.classList.add("report-not")
                }
            }
        })
        
        if(type.value && generetion.value && dateGlow.value.split("-")[0] && datePlant.value && 
            posiW.value && posiH.value && qty.value && area.value && dateOut.value && system.value &&
            water.value && waterStep.value 
            ) {
                BTConfirm.current.removeAttribute("no")
        } else {
            BTConfirm.current.setAttribute("no" , "")
        }
    }



    const SetTextOnOther = async (e) => {
        await FetchDataForm(e.target.value)
        ChangeCHK()
    }


    const MathDateHarvest = (DatePlant , DateQty) => {
        try {
            const DatePlantQty = new Date(DatePlant)
            DatePlantQty.setDate(DatePlantQty.getDate() + parseInt(DateQty))
            DateOut.current.value = DatePlantQty.toISOString().split("T")[0].split("-").map((val , key)=> key==0 ? parseInt(val) + 543 : val).reverse().join("-")
            setDateOut(DatePlantQty.toISOString().split("T")[0])
        } catch(e) {}
    }

    // const MathDateHarvest = (plantDate, harvestDays) => {
    //     try {
    //         // คำนวณวันที่เก็บเกี่ยว
    //         const date = new Date(plantDate);
    //         date.setDate(date.getDate() + harvestDays);
    
    //         // แปลงวันที่ให้อยู่ในรูปแบบ DD-MM-YYYY โดยเพิ่ม 543 ให้ปี
    //         const formattedDate = date
    //             .toISOString()
    //             .split("T")[0]
    //             .split("-")
    //             .map((val, idx) => (idx === 0 ? parseInt(val) + 543 : val)) // เพิ่ม 543 เฉพาะปี
    //             .reverse() // กลับลำดับเป็น DD-MM-YYYY
    //             .join("-");
    
    //         // อัปเดตค่าในฟิลด์ DateOut
    //         DateOut.current.value = formattedDate;
    //         setDateOut(date.toISOString().split("T")[0]);
    //     } catch (error) {
    //         console.error("Error calculating harvest date:", error);
    //     }
    // };
    
    
    


    // const ResetListPopup = () => {
    //     setListOther(<></>)
    //     ListSearch.current.setAttribute("remove" , "")
    // }

    return(
        <section className="popup-content">
            <div className="head">แบบบันทึกเกษตรกร</div>
            <div className="form">
                <div className="head-form">
                    <span>การปลูกของฉัน</span>
                </div>
                <div className="body-content">
    <div ref={FormContent} className="frame-content" over="">
        <div className="content">
            <div className="step">
                <div className="num">1.</div>
                <div className="body">
                    <div className="row">
                        <label className="frame-textbox">
                        <span>ชนิดพืช</span>
                            <select className="report-not" onChange={SetTextOnOther} ref={TypePlantInput} defaultValue="">
                                <option disabled value="">เลือกพืช</option>
                                {DataPlant.map((plant, key) => (
                                    <option key={key} value={plant.name}>{plant.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    {/* <div className="row">
                       <label className="frame-textbox">
                        <span>สายพันธุ์พืช</span> */}
                                            {/* <select className="report-not" onChange={handleVarietyChange} ref={TypevarietiesInput} defaultValue="">
                                                <option disabled value="">เลือกสายพันธุ์พืช</option>
                                                {varieties.map((variety, key) => (
                                                    <option key={key} value={variety.variety_id}>{variety.variety_name}</option>
                                                ))}
                                             </select> */}

                           {/* <select
                               className="report-not"
                               onChange={handleVarietyChange}
                               ref={TypevarietiesInput}
                               defaultValue=""
                            >
                                 <option disabled value="">เลือกสายพันธุ์พืช</option>
                                    {varieties.map((variety, key) => (
                                 <option key={key} value={variety.variety_id}>{variety.variety_name}</option>
                           ))}
                           </select> */}

                                           
                                            {/* <div className="input-select-popup">
                                                <input onChange={OpenPopupPlant} onTouchStart={OpenPopupPlant} placeholder="กรอกชื่อพืช" ref={TypePlantInput}></input>
                                                <div ref={ListSearch} remove="" className="list-input-search">
                                                    {ListSelect}
                                                </div>
                                            </div> */}

                                        {/* </label>
                                        <span className="dot-required">*</span>
                                    </div> */}
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <span className="dot-required">*</span>
                                        }
                                        <label className="frame-textbox">
                                            <span>รุ่นที่ปลูก</span>
                                            <input className="report-not" onInput={ChangeCHK} ref={Generation} type="number" placeholder="ตัวเลข"></input>
                                        </label>
                                    </div>
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <span className="dot-required">*</span>
                                        }
                                        <label className="frame-textbox">
                                            <span>วันที่เพาะกล้า (เฉพาะปีได้)</span>
                                            <DateSelect RefDateValue={DateGlow} methodCheckValue={ChangeCHK} Ref={{
                                                DayCK : DayOut,
                                                MountCK : MountOut,
                                                YearCK : YearOut
                                            }}/>
                                            {/* <input onInput={ChangeCHK} ref={DateGlow} onClick={()=>clickDate(DateGlow)} type="date" placeholder="ว/ด/ป"></input> */}
                                        </label>
                                    </div>
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <span className="dot-required">*</span>
                                        }
                                        <label className="frame-textbox">
                                            <span>วันที่ปลูก</span>
                                            {/* <DatePickerThai classNameMain="input-date" defaultDate={DateNowOnForm} offsetQtyDate={DateHarvest} refIn={DatePlant}
                                                onInputIn={(e , offset)=>{
                                                    ChangeCHK()
                                                    const DateChis = e.target.value.split("-").reverse().map((val , key)=> key==0 ? parseInt(val) - 543 : val).join("-")
                                                    setDateNowOnForm(DateChis)
                                                    MathDateHarvest(DateChis , offset)
                                                }}
                                            /> */}
                                            <DatePickerThai
   
                                           classNameMain="input-date"
                                           defaultDate={DateNowOnForm}
                                           offsetQtyDate={DateHarvest}
                                           refIn={DatePlant}
                                           onInputIn={(e) => {
                                           const plantDate = e.target.value.split("-").reverse().map((val, idx) => (idx === 0 ? parseInt(val) - 543 : val)).join("-");
                                          setDateNowOnForm(plantDate);
                                          MathDateHarvest(plantDate, DateHarvest);
                                          }}
                                        />


                                            {/* <input onInput={(e)=>{
                                                ChangeCHK()
                                                setDateNowOnForm(e.target.value)
                                                MathDateHarvest(e.target.value , DateHarvest)
                                            }} defaultValue={DateNowOnForm} ref={DatePlant} type="date" placeholder="ว/ด/ป"></input> */}
                                        </label>
                                    </div>
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <span className="dot-required">*</span>
                                        }
                                        <label className="frame-textbox colume">
                                            <div className="full">ระยะการปลูก</div>
                                            <div className="choose">
                                                <label className="choose colume">
                                                    ระหว่างต้น
                                                    <input onInput={ChangeCHK} ref={PositionW} type="number" placeholder="" className="center report-not"></input>
                                                </label>
                                                <div>X</div>
                                                <label className="choose colume">
                                                    ระหว่างแถว
                                                    <input onInput={ChangeCHK} ref={PositionH} type="number" placeholder="" className="center report-not"></input>
                                                </label>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <span className="dot-required">*</span>
                                        }
                                        <label className="frame-textbox">
                                            <span>จำนวนต้น</span>
                                            <input className="report-not" onInput={ChangeCHK} ref={Qty} type="number" placeholder="ตัวเลข"></input>
                                        </label>
                                    </div>
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <span className="dot-required">*</span>
                                        }
                                    <label className="frame-textbox">
                                    <span>พื้นที่</span>
                                        <select className="report-not" onChange={Change} ref={System} defaultValue={""}>
                                        <option disabled value="">เลือก</option>
                                        <option value={"โรงเรือน"}>โรงเรือน</option>
                                        <option value={"ไร่"}>ไร่</option>
                                        <option value={"ตารางเมตร"}>ตารางเมตร</option>
                                    </select>
                                       <input className="report-not" onInput={ChangeCHK} ref={Area} type="number" placeholder={placeholder}></input>
                                     </label>
                                    </div>
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <span className="dot-required">*</span>
                                        }
                                       <label className="frame-textbox">
                                       <span>วันที่คาดว่า <br></br>จะเก็บเกี่ยว</span>
                                            <DatePickerThai classNameMain="input-date" defaultDate={getDateOut} onInputIn={ChangeCHK} refIn={DateOut} className="report-not"/>
                                            {/* <input className="report-not" onInput={ChangeCHK} ref={DateOut} type="date"></input> */}
                                        </label>


                                    </div>
                                </div>
                            </div>
                            <div className="step">
                                <div className="num">2.</div>
                                <div className="body">
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <span className="dot-required">*</span>
                                        }
                                        <label className="frame-textbox">
                                            <span>รูปแบบการปลูก</span>
                                            <select className="report-not" onChange={ChangeCHK} ref={System} defaultValue={""}>
                                                <option disabled value="">เลือก</option>
                                                <option value={"ขึ้นแปลงปลูกตามไหล่เขา"}>ขึ้นแปลงปลูกตามไหล่เขา</option>
                                                <option value={"ขึ้นแปลงปลูกที่ลุ่มหลังนา"}>ขึ้นแปลงปลูกที่ลุ่มหลังนา</option>
                                                <option value={"ปลูกแบบขึ้นค้าง"}>ปลูกแบบขึ้นค้าง</option>
                                                <option value={"ระบบ Hydroponic"}>ระบบ Hydroponic</option>
                                                <option value={"ปลูกในวัสดุปลูก"}>ปลูกในวัสดุปลูก</option>
                                                <option value={"ในโรงเรือน"}>ในโรงเรือน</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="step">
                                <div className="num">3.</div>
                                <div className="body">
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <span className="dot-required">*</span>
                                        }
                                        <label className="frame-textbox">
                                            <span>แหล่งน้ำ</span>
                                            <select className="report-not" onChange={ChangeCHK} ref={Water} defaultValue={""}>
                                                <option disabled value="">เลือก</option>
                                                <option value={"อาศัยน้ำฝน"}>อาศัยน้ำฝน</option>
                                                <option value={"ลำธาร/คลองธรรมชาติ"}>ลำธาร/คลองธรรมชาติ</option>
                                                <option value={"บ่อบาดาล"}>บ่อบาดาล</option>
                                                <option value={"บ่อ/สระขุด"}>บ่อ/สระขุด</option>
                                                <option value={"คลองชลประทาน"}>คลองชลประทาน</option>
                                                <option value={"อ่างเก็บน้ำ"}>อ่างเก็บน้ำ</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="step">
                                <div className="num">4.</div>
                                <div className="body">
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <span className="dot-required">*</span>
                                        }
                                        <label className="frame-textbox">
                                            <span>วิธีการให้น้ำ</span>
                                            <select className="report-not" onChange={ChangeCHK} ref={WaterStep} defaultValue={""}>
                                                <option disabled value="">เลือก</option>
                                                <option value={"สปริงเกอร์"}>สปริงเกอร์</option>
                                                <option value={"ระบบน้ำหยด"}>ระบบน้ำหยด</option>
                                                <option value={"ปล่อยตามร่อง"}>ปล่อยตามร่อง</option>
                                                <option value={"ใช้สายยางรด"}>ใช้สายยางรด</option>
                                                <option value={"ตักรด"}>ตักรด</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="step">
                                <div className="num">5.</div>
                                <div className="body">
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <></>
                                        }
                                        <label className="frame-textbox">
                                            <span style={{width : "100%"}}>ประวัติการใช้พื้นที่และการเกิดโรคระบาด</span>
                                        </label>
                                    </div>
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <></>
                                        }
                                        <label className="frame-textbox">
                                            <span>พืชที่ปลูกก่อนหน้า</span>
                                            <input onInput={ChangeCHK} ref={History} type="" placeholder="กรอก"></input>
                                        </label>
                                    </div>
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <></>
                                        }
                                        <label className="frame-textbox">
                                            <span>โรค/แมลงที่พบ</span>
                                            <select onChange={ChangeCHK} ref={Insect} defaultValue="">
                                            <option disabled value="" selected>เลือก</option> {/* แสดงเป็นค่าเริ่มต้น */}
                                            {previousInsects.map((insect, index) => (
                                                    <option key={index} value={insect}>{insect}</option>
                                                ))
                                            }
                                        </select>
                                        </label>
                                    </div>
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <></>
                                        }
                                        <label className="frame-textbox">
                                            <span>ปริมาณการเกิดโรค และแมลงที่พบ</span>
                                            <select onChange={ChangeCHK} ref={QtyInsect} defaultValue={""}>
                                                <option disabled value="">เลือก</option>
                                                <option value={"น้อย"}>น้อย</option>
                                                <option value={"ปานกลาง"}>ปานกลาง</option>
                                                <option value={"มาก"}>มาก</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div className="row">
                                        { getHistoryPlantLoad ? 
                                            <div className="block-wait"></div>
                                            : <></>
                                        }
                                        <label className="frame-textbox">
                                            <span>การป้องกันกำจัด</span>
                                            <textarea ref={Seft} type="text" placeholder="กรอก"></textarea>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bt-form">
                    <button className="bt-confirm-add" style={{backgroundColor : "#FF8484"}} onClick={cancel}>ยกเลิก</button>
                    { getWait ?
                        <div className="bt-confirm-add" style={{
                            display : "flex",
                            justifyContent : "center",
                            alignItems : "center",
                            padding : "2px",
                            height : "31.2px"
                        }}>
                            <Loading size={27} border={5} color="white" animetion={true}/>
                        </div>
                        :
                        <button className="bt-confirm-add" ref={BTConfirm} no="" onClick={Confirm}>ยืนยัน</button>
                    }
                </div>
            </div>
        </section>
    )
}

export default PopupInsertPlant