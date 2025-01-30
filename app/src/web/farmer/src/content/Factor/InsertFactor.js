import React, { useRef, useEffect, useState, useCallback } from "react";
import "./ListFertilizer.scss";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { CloseAccount } from "../../method";
import {
  ConvertDate,
  DatePickerThai,
  Loading
} from "../../../../../assets/js/module";

const PopupInsertFactor = ({
  setPopup,
  RefPop,
  uid,
  id_house,
  id_form_plant,
  type_path,
  ReloadData,
  setPage
}) => {
  const DateNowOnForm = `${new Date().getFullYear()}-${(
    "0" + (new Date().getMonth() + 1).toString()
  ).slice(-2)}-${("0" + new Date().getDate().toString()).slice(-2)}`;
  const [getDateOut, setDateOut] = useState("");
  const [pestChemicalData, setPestChemicalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFormId, setCurrentFormId] = useState(null);

  // State สำหรับการแจ้งเตือน
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // same
  const DateUse = useRef();
  const NameMainFactor = useRef();
  const NameFactor = useRef();
  const Use = useRef();
  const Volume = useRef();
  const Unit = useRef();
  const Source = useRef();

  // chemical
  const NameInsect = useRef();
  const Rate = useRef();
  const DateSafe = useRef();

  const [DataFactor, setDataFactor] = useState([]);
  const [DataSource, setSource] = useState([]);

  const ListSearchName = useRef();
  const [ListSelectName, setListName] = useState(<></>);

  const ListSearchFactorNameMain = useRef();
  const [ListSelectNameMain, setListOther] = useState(<></>);

  const BTConfirm = useRef();

  const [LoadSearchName, setLoadName] = useState(false);
  const [LoadSearchNameMain, setLoadNameMain] = useState(false);

  // State และ Refs สำหรับศัตรูพืช
  const [DataPests, setDataPests] = useState([]);
  const [ListSelectPests, setListPests] = useState(<></>);
  const ListSearchPests = useRef();
  const [LoadSearchPests, setLoadPests] = useState(false);

  const [formId, setFormId] = useState(""); // สำหรับ formId
  const [currentPlantPlantName, setCurrentPlantName] = useState(""); // ชื่อสายพันธุ์พืช
  const [error, setError] = useState(null); // สำหรับข้อความแสดงข้อผิดพลาด

  const [getWait, setWait] = useState(false);
  useEffect(() => {
    RefPop.current.setAttribute("show", "");
    FetchFactor(type_path === "z" ? "fertilizer" : "chemical");
    FetchSource();
    // (type_path === "z") ? FetchFactor("fertilizer") : FetchFactor("chemical")
  }, []);

  useEffect(() => {
    console.log("Pest Chemical Data Updated:", pestChemicalData);
  }, [pestChemicalData]);

  const FetchFactor = async (type) => {
    setLoadName(false);
    setLoadNameMain(false);
    const Data = await clientMo.post("/api/farmer/factor/get/auto", {
      type: type
    });
    if (await CloseAccount(Data, setPage)) {
      const LIST = JSON.parse(Data);
      LIST.sort((a, b) => a.name.localeCompare(b.name, 'th'));
      LIST.sort((a, b) => a.name_formula.localeCompare(b.name_formula, 'th'));
      setDataFactor(LIST);
      setLoadName(true);
      setLoadNameMain(true);
      return LIST;
    }
  };

  // ฟังก์ชัน FetchPests ดึงข้อมูลศัตรูพืช
  const FetchPests = async () => {
    setLoadPests(false);
    const Data = await clientMo.post("/api/farmer/pests"); // เรียก API
    if (await CloseAccount(Data, setPage)) {
      let LIST = JSON.parse(Data);
      LIST = LIST.map((item) => ({
        ...item,
        pest_name: item.pest_name.trim() 
    }));
    const collator = new Intl.Collator('th', { sensitivity: 'base', numeric: true });
    LIST.sort((a, b) => collator.compare(a.pest_name, b.pest_name));

      setDataPests(LIST);
      setLoadPests(true);
      return LIST;
    }
  };

  // ฟังก์ชันโหลดข้อมูลจาก API
  const FetchPestChemicalData = async () => {
    setLoading(true);
    try {
      const Data = await clientMo.post("/api/farmer/pest-chemical", {
        id_form_plant: formId
      }); // เรียก API

      console.log("Full API Response:", JSON.stringify(Data, null, 2));

      // ตรวจสอบว่า CloseAccount ผ่านหรือไม่
      if (await CloseAccount(Data, setPage)) {
        const response = JSON.parse(Data); // แปลงข้อมูล JSON

        console.log("Parsed Response Data:", response);

        // ตรวจสอบโครงสร้างข้อมูล
        if (response?.plant_name && Array.isArray(response.data)) {
          const { plant_name, data } = response; // Destructure ข้อมูล
          console.log("Plant Name:", plant_name);
          console.log("Extracted Data:", data);

          if (data.length > 0) {
            setPestChemicalData(data);
            setCurrentPlantName(plant_name);
          } else {
            console.warn("No pest-chemical data found:", data);
            setPopupMessage("ไม่พบข้อมูลความสัมพันธ์จากระบบ");
            setShowPopup(true);
          }
        } else {
          console.error(
            "Invalid response structure or missing required fields"
          );
          setPopupMessage("ไม่พบข้อมูลที่ตอบกลับจากระบบ");
          setShowPopup(true);
        }
      } else {
        console.error("CloseAccount validation failed");
        setPopupMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
        setShowPopup(true);
      }
    } catch (error) {
      console.error(
        "Error fetching pest-chemical data:",
        error.message || error
      );
      setPopupMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };


  // // ฟังก์ชันโหลดข้อมูลจาก API
  // const FetchPestChemicalData = async () => {
  //     try {
  //         const response = await clientMo.post("/api/farmer/pest-chemical");
  //         const data = JSON.parse(response);
  //         setPestChemicalData(data);
  //     } catch (error) {
  //         console.error('Error fetching pest-chemical data:', error);
  //     }
  // };

  useEffect(() => {
    if (formId) {
      console.log("Fetching data for formId:", formId);
      FetchPestChemicalData();
    }
  }, [formId]);

  useEffect(() => {
    if (id_form_plant) {
      setFormId(id_form_plant);
    } else {
      console.error("id_form_plant is undefined");
      FetchPestChemicalData();
    }
  }, [id_form_plant]);

  const SearchPests = async (e) => {
    ListSearchPests.current.removeAttribute("remove");

    try {
      let search = DataPests.filter(
        (val) => val.pest_name.indexOf(e.target.value) >= 0
      ).map((val) => val.pest_name);
      search.sort((a, b) => a.localeCompare(b, 'th'));
      const setSearch = ChangeData(search);
      if (setSearch.length !== 0) {
        setListPests(
          setSearch.map((val, key) => (
            <span
              search_name=""
              onClick={() => SetTextInputPests(val)}
              key={key}
            >
              {val}
            </span>
          ))
        );
      } else {
        ResetListPestsPopup();
      }
    } catch (e) {}

    ChangeChemi();
  };

  // ฟังก์ชันตั้งค่า Input ของศัตรูพืช
  
  const SetTextInputPests = (name) => {
    NameInsect.current.value = name;
    NameInsect.current.style.border = "2px solid transparent"; // รีเซ็ตกรอบแดง
    ChangeChemi();
    ResetListPestsPopup();
  };

  // ฟังก์ชันรีเซ็ต Popup ของศัตรูพืช
  const ResetListPestsPopup = () => {
    setListPests(<></>);
    ListSearchPests.current.setAttribute("remove", "");
  };

  // ใช้งาน FetchPests เมื่อโหลด component
  useEffect(() => {
    FetchPests();
  }, []);

  const FetchSource = async () => {
    const Data = await clientMo.post("/api/farmer/source/get");
    if (await CloseAccount(Data, setPage)) {
      const LIST = JSON.parse(Data);
      setSource(LIST);
    }
  };

  const ConfirmFerti = async () => {
    const dateUse = DateUse.current;
    const formula_name = NameMainFactor.current;
    const Name = NameFactor.current;
    const use = Use.current;
    const volume = Volume.current;
    const source = Source.current;

    if (
      dateUse.value &&
      Name.value &&
      use.value &&
      volume.value &&
      source.value
    ) {
      const DataInsert = {
        id_farmhouse: id_house,
        id_plant: id_form_plant,
        date: ConvertDate(dateUse.value).christDate,
        formula_name: formula_name.value,
        name: Name.value,
        use: use.value,
        volume: volume.value + " " + Unit.current.value,
        source: source.value,
        type_insert: type_path
      };

      setWait(true);
      const result = await clientMo.post(
        "/api/farmer/factor/insert",
        DataInsert
      );
      if (await CloseAccount(result, setPage)) {
        cancel();
        ReloadData();
        setWait(false);
      }
    } else {
      let RefObject = [
        dateUse,
        formula_name,
        Name,
        use,
        volume,
        source
        // , seft
      ];
      RefObject.forEach((ele, index) => {
        if (!ele.value && ele) ele.style.border = "2px solid red";
        else if (ele.value && ele) ele.style.border = "2px solid transparent";
      });
    }
  };

  // const ConfirmChemi = async () => {
  //     const dateUse = DateUse.current
  //     const formula_name = NameMainFactor.current
  //     const Name = NameFactor.current
  //     const insect = NameInsect.current
  //     const use = Use.current
  //     const rate = Rate.current
  //     const volume = Volume.current
  //     const dateSafe = DateSafe.current
  //     const source = Source.current

  //     if( dateUse.value && formula_name.value && Name.value
  //             && insect.value && use.value && rate.value
  //             && volume.value && dateSafe.value && source.value
  //         ) {
  //             const DataInsert = {
  //                 id_farmhouse : id_house,
  //                 id_plant : id_form_plant,
  //                 date : ConvertDate(dateUse.value).christDate,
  //                 formula_name : formula_name.value,
  //                 name : Name.value,
  //                 insect : insect.value,
  //                 use : use.value,
  //                 rate : rate.value,
  //                 volume : volume.value + " " + Unit.current.value,
  //                 dateSafe : ConvertDate(dateSafe.value).christDate,
  //                 source : source.value,
  //                 type_insert : type_path
  //             }

  //             setWait(true)
  //             const result = await clientMo.post("/api/farmer/factor/insert" , DataInsert)
  //             if(await CloseAccount(result , setPage)) {
  //                 cancel()
  //                 ReloadData()
  //                 setWait(false)
  //             }
  //     } else {
  //         let RefObject = [
  //                     dateUse ,
  //                     formula_name ,
  //                     Name ,
  //                     insect,
  //                     use ,
  //                     rate,
  //                     volume ,
  //                     dateSafe,
  //                     source ,
  //                     // , seft
  //                 ]
  //         RefObject.forEach((ele)=>{
  //             if(!ele.value && ele) ele.style.border = "2px solid red"
  //             else if (ele.value && ele) ele.style.border = "2px solid transparent"
  //         })
  //     }
  // }

  // ฟังก์ชัน ConfirmChemi ที่ปรับปรุง
  const ConfirmChemi = async () => {
    if (!validateInputs()) {
      // หากไม่ผ่านการตรวจสอบข้อมูล ให้หยุดการทำงาน
      return;
    }
  
    const DataInsert = {
      id_farmhouse: id_house,
      id_plant: id_form_plant,
      date: ConvertDate(DateUse.current.value).christDate,
      formula_name: NameMainFactor.current.value,
      name: NameFactor.current.value,
      insect: NameInsect.current.value,
      use: Use.current.value,
      rate: Rate.current.value,
      volume: Volume.current.value + " " + Unit.current.value,
      dateSafe: ConvertDate(DateSafe.current.value).christDate,
      source: Source.current.value,
      type_insert: type_path,
    };
  
    setWait(true);
    const result = await clientMo.post("/api/farmer/factor/insert", DataInsert);
    if (await CloseAccount(result, setPage)) {
      cancel();
      ReloadData();
      setWait(false);
    }
  };
  

  const cancel = () => {
    RefPop.current.removeAttribute("show");
    setTimeout(() => {
      setPopup(<></>);
    }, 500);
  };

  const ChangeFerti = (e) => {
    const dateUse = DateUse.current;
    const formula_name = NameMainFactor.current;
    const Name = NameFactor.current;
    const use = Use.current;
    const volume = Volume.current;
    const source = Source.current;

    if (!e) {
      if (Name.value && formula_name.value) {
        setHowUse();
      }
    }

    if (
      dateUse.value &&
      Name.value &&
      use.value &&
      volume.value &&
      source.value
    ) {
      BTConfirm.current.removeAttribute("no");
    } else {
      BTConfirm.current.setAttribute("no", "");
    }
  };

  const ChangeChemi = (e) => {
    const dateUse = DateUse.current;
    const formula_name = NameMainFactor.current;
    const Name = NameFactor.current;
    const insect = NameInsect.current;
    const use = Use.current;
    const rate = Rate.current;
    const volume = Volume.current;
    const dateSafe = DateSafe.current;
    const source = Source.current;

    if (!e) {
      if (Name.value && formula_name.value) {
        setHowUse();
      }
    }

    if (
      dateUse.value &&
      formula_name.value &&
      Name.value &&
      insect.value &&
      use.value &&
      rate.value &&
      volume.value &&
      dateSafe.value &&
      source.value
    ) {
      BTConfirm.current.removeAttribute("no");
    } else {
      BTConfirm.current.setAttribute("no", "");
    }
  };

  // name
  const SearchNameFactor = async (e) => {
    ListSearchName.current.removeAttribute("remove");

    try {
      let search = DataFactor;
      search = search
        .filter(
          (val) =>
            val.name.indexOf(e.target.value) >= 0 &&
            val.name_formula.indexOf(NameMainFactor.current.value) >= 0
        )
        .map((val) => val.name);
        search.sort((a, b) => a.localeCompare(b, 'th'));
      const setSearch = ChangeData(search) ;
      console.log(setSearch)
      if (setSearch.length !== 0)
        setListName(
          setSearch.map((val, key) => (
            <span
              search_name=""
              onClick={() => SetTextInputName(val)}
              key={key}
            >
              {val}
            </span>
          ))
        );
      else ResetListNamePopup();
    } catch (e) {console.log(e)}

    type_path === "z" ? ChangeFerti() : ChangeChemi();
  };

 

  const SetTextInputName = (name) => {
    console.log(name)
    NameFactor.current.value = name;
    NameFactor.current.style.border = "2px solid transparent"; // รีเซ็ตกรอบแดง
    type_path === "z" ? ChangeFerti() : ChangeChemi();
    ResetListNamePopup();
    SearchFactorNameOther({ target: { value: "", selectBt: true } });
  };
  

  const ResetListNamePopup = () => {
    setListName(<></>);
    ListSearchName.current.setAttribute("remove", "");
  };

  // other
  const SearchFactorNameOther = async (e) => {
    ListSearchFactorNameMain.current.removeAttribute("remove");

    try {
      let search = DataFactor;
      search = search
        .filter(
          (val) =>
            val.name_formula.indexOf(e.target.value) >= 0 &&
            val.name.indexOf(NameFactor.current.value) >= 0
        )
        .map((val) => val.name_formula);
        search.sort((a, b) => a.localeCompare(b, 'th'));
      const setSearch = ChangeData(search);
      if (setSearch.length !== 0) {
        if (setSearch.length === 1 && e.target.selectBt) {
          SetTextInputOther(setSearch[0]);
        } else {
          setListOther(
            setSearch.map((val, key) => (
              <span
                search_other=""
                onClick={() => SetTextInputOther(val)}
                key={key}
              >
                {val}
              </span>
            ))
          );
        }
      } else ResetListOtherPopup();
    } catch (e) {}

    type_path === "z" ? ChangeFerti() : ChangeChemi();
  };

  const SetTextInputOther = (name) => {
    NameMainFactor.current.value = name;
    NameMainFactor.current.style.border = "2px solid transparent"; // รีเซ็ตกรอบแดง
    type_path === "z" ? ChangeFerti() : ChangeChemi();
    ResetListOtherPopup();
  };
  

  const ResetListOtherPopup = () => {
    setListOther(<></>);
    ListSearchFactorNameMain.current.setAttribute("remove", "");
  };

  // change how use
  const setHowUse = () => {
    try {
      if (Use.current.value === "") {
        Use.current.value =
          DataFactor.filter(
            (val) =>
              val.name_formula === NameMainFactor.current.value &&
              val.name === NameFactor.current.value
          ).map((val) => val.how_use)[0] ?? "";
      }
    } catch (e) {}
  };

  // math date sefe chemical
  const setDateSafe = (day_safe) => {
    try {
      const DateUsePut = new Date(
        DateUse.current.value
          ? ConvertDate(DateUse.current.value).christDate
          : ""
      );
      DateUsePut.setDate(DateUsePut.getDate() + parseInt(day_safe) + 1);
      const result = DateUsePut.toISOString().split("T")[0];
      DateSafe.current.value = ConvertDate(result).buddhistDate;
      setDateOut(result);
    } catch (e) {}
  };
  

  // const ValidateChemicalAndPest = () => {
  //     // ListSearchName.current.setAttribute("remove","")
  //     // ListSearchFactorNameMain.current.setAttribute("remove","")
  //     // ListSearchPests.current.setAttribute("remove","")
  //     const chemicalValue = NameFactor.current.value.trim();
  //     const pestValue = NameInsect.current.value.trim();

  //     // ตรวจสอบว่ามีการกรอกข้อมูลทั้งศัตรูพืชและสารเคมี
  //     if (!chemicalValue || !pestValue) {
  //         return; // ไม่แสดง Popup หากช่องว่าง
  //     }

  //     // ค้นหาข้อมูลศัตรูพืชและสารเคมีใน pestChemicalData
  //     const matchedEntry = pestChemicalData.find(
  //         (entry) =>
  //             entry.pest_name === pestValue && entry.chemical_name === chemicalValue
  //     );

  //     if (!matchedEntry) {
  //         setPopupMessage(
  //             `สารเคมี "${chemicalValue}" ไม่สัมพันธ์กับศัตรูพืช "${pestValue}"`
  //         );
  //         setShowPopup(true); // แสดง Popup หากข้อมูลไม่สัมพันธ์กัน
  //     } else {
  //         setShowPopup(false); // ซ่อน Popup หากข้อมูลถูกต้อง
  //     }
  // };

  // const ValidateChemicalAndPest = () => {
  //     const chemicalValue = NameFactor.current?.value.trim(); // ใช้ Optional Chaining ป้องกัน undefined
  //     const pestValue = NameInsect.current?.value.trim();
  //     const varietyValue = currentPlantVarietyName?.trim();

  //     // ตรวจสอบว่ามีค่าในฟิลด์หรือไม่
  //     if (!chemicalValue || !pestValue || !varietyValue) {
  //         console.warn("Missing required inputs:", { chemicalValue, pestValue, varietyValue });
  //         return;
  //     }

  //     // ตรวจสอบความสัมพันธ์ใน pestChemicalData
  //     const matchedEntry = pestChemicalData.find(
  //         (entry) =>
  //             entry.pest_name === pestValue &&
  //             entry.chemical_name === chemicalValue
  //     );

  //     if (!matchedEntry) {
  //         console.warn("No match found in pestChemicalData for:", {
  //             pestValue,
  //             chemicalValue,
  //         });
  //         setPopupMessage( `สารเคมี "${chemicalValue}" ไม่สัมพันธ์กับศัตรูพืช "${pestValue}"`);
  //         setShowPopup(true);
  //     } else {
  //         console.log("Matched entry:", matchedEntry);
  //     }
  // };

  const debounce = useRef(0)
  const ValidateChemicalAndPest = () => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      const chemicalValue = NameFactor.current?.value.trim(); // ใช้ Optional Chaining ป้องกัน undefined
      const pestValue = NameInsect.current?.value.trim();
      const plantNameValue = currentPlantPlantName?.trim(); // ชนิดพืชที่ได้จากไอดีฟอร์ม

      const matchedDateSafe = pestChemicalData.find(
        (entry) => entry.chemical_name === chemicalValue
      );
      console.log(matchedDateSafe)
      matchedDateSafe && setDateSafe(matchedDateSafe.safe_days)

      // ตรวจสอบว่ามีค่าในฟิลด์หรือไม่
      if (!chemicalValue || !pestValue || !plantNameValue) {
          console.warn("Missing required inputs:", {
              chemicalValue,
              pestValue,
              plantNameValue
          });
          return;
      }

      // ตรวจสอบความสัมพันธ์ใน pestChemicalData
      const matchedEntry = pestChemicalData.find(
        (entry) =>
          entry.pest_name === pestValue && entry.chemical_name === chemicalValue
      );

      if (!matchedEntry) {
        console.warn("No match found in pestChemicalData for:", {
          pestValue,
          chemicalValue,
          plantNameValue
        });
        setPopupMessage(
          `สารเคมี "${chemicalValue}" ไม่สัมพันธ์กับศัตรูพืช "${pestValue}" `
        );
        setShowPopup(true);
      } else {
        console.log("Matched entry:", matchedEntry);
      }
    } , 0)
  };


  const validateInputs = () => {
    let isValid = true;
  
    // ตรวจสอบชื่อสารเคมี
    if (!DataFactor.some((val) => val.name === NameFactor.current?.value.trim())) {
      NameFactor.current.style.border = "2px solid red";
      isValid = false;
    } else {
      NameFactor.current.style.border = "2px solid transparent";
    }
  
    // ตรวจสอบชื่อสามัญสารเคมี
    if (
      !DataFactor.some((val) => val.name_formula === NameMainFactor.current?.value.trim())
    ) {
      NameMainFactor.current.style.border = "2px solid red";
      isValid = false;
    } else {
      NameMainFactor.current.style.border = "2px solid transparent";
    }
  
    // ตรวจสอบศัตรูพืช
    if (!DataPests.some((val) => val.pest_name === NameInsect.current?.value.trim())) {
      NameInsect.current.style.border = "2px solid red";
      isValid = false;
    } else {
      NameInsect.current.style.border = "2px solid transparent";
    }
  
    return isValid;
  };
  
  

  const handleInputChange = (e, type) => {
    const value = e.target.value.trim();
  
    if (type === "NameFactor") {
      if (DataFactor.some((val) => val.name === value)) {
        NameFactor.current.style.border = "2px solid transparent";
      }
    } else if (type === "NameMainFactor") {
      if (DataFactor.some((val) => val.name_formula === value)) {
        NameMainFactor.current.style.border = "2px solid transparent";
      }
    } else if (type === "NameInsect") {
      if (DataPests.some((val) => val.pest_name === value)) {
        NameInsect.current.style.border = "2px solid transparent";
      }
    }
  };

  

  const containsHidePopup = useCallback((element, target) => {
    setTimeout(() => {
      if (!element.contains(target) && !target.closest(".list-input-search")) {
        element.setAttribute("remove", "");
      }
    }, 10);
  }, []);
  

  //
  const ChangeData = (DataFilter) => {
    const search = DataFilter;
    const setSearch = new Set(search);
    const ObjectName = new Array();
    setSearch.forEach((val) => ObjectName.push(val));
    return ObjectName;
  };

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
          {type_path === "z" ? (
            <span>ปัจจัยการผลิต (ปุ๋ยที่ใช้)</span>
          ) : (
            <span>สารเคมี</span>
          )}
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
                          <DatePickerThai
                            classNameMain="input-date"
                            defaultDate={DateNowOnForm}
                            refIn={DateUse}
                            onInputIn={ChangeFerti}
                          />
                          {/* <input onChange={ChangeFerti} defaultValue={DateNowOnForm} onClick={()=>clickDate(DateUse)} ref={DateUse} type="date"></input> */}
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox colume">
                          <span className="full">
                            ชื่อสิ่งที่ใช้ (ชื่อการค้า, ตรา)
                          </span>
                          <div className="content-colume-input">
                            <div className="input-select-popup">
                              <input
                                onChange={
                                  LoadSearchName ? SearchNameFactor : null
                                }
                                onMouseDown={
                                  LoadSearchName ? SearchNameFactor : null
                                }
                                placeholder={
                                  !LoadSearchName ? "กำลังโหลด" : "กรอกชื่อปุ๋ย"
                                }
                                ref={NameFactor}
                                readOnly={!LoadSearchName ? true : null}
                                disabled={!LoadSearchNameMain ? true : null}
                              ></input>
                              <div
                                ref={ListSearchName}
                                remove=""
                                className="list-input-search"
                              >
                                {LoadSearchName ? (
                                  ListSelectName
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center"
                                    }}
                                  >
                                    <Loading
                                      size={"8vw"}
                                      border={"2vw"}
                                      color="green"
                                      animetion={true}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox">
                          <span>ชื่อสูตรปุ๋ย</span>
                          <div className="input-select-other">
                            <input
                              onChange={
                                LoadSearchNameMain
                                  ? SearchFactorNameOther
                                  : null
                              }
                              onMouseDown={
                                LoadSearchNameMain
                                  ? SearchFactorNameOther
                                  : null
                              }
                              ref={NameMainFactor}
                              type="text"
                              placeholder={
                                LoadSearchNameMain
                                  ? "กรอกสูตรปุ๋ย"
                                  : "กำลังโหลด"
                              }
                              readOnly={!LoadSearchNameMain ? true : null}
                              disabled={!LoadSearchNameMain ? true : null}
                            ></input>
                            <div
                              ref={ListSearchFactorNameMain}
                              remove=""
                              className="list-input-search"
                            >
                              {LoadSearchNameMain ? (
                                ListSelectNameMain
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center"
                                  }}
                                >
                                  <Loading
                                    size={"8vw"}
                                    border={"2vw"}
                                    color="green"
                                    animetion={true}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox colume">
                          <span className="full">วิธีการใช้</span>
                          <textarea
                            onChange={ChangeFerti}
                            className="content-colume-input"
                            style={{ textAlign: "left" }}
                            ref={Use}
                          ></textarea>
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox">
                          <span>ปริมาณที่ใช้</span>
                          <div className="input-row">
                            <input
                              onChange={ChangeFerti}
                              ref={Volume}
                              type="number"
                              placeholder="ตัวเลข"
                            ></input>
                            <select
                              onChange={ChangeFerti}
                              ref={Unit}
                              defaultValue={"ลิตร"}
                            >
                              <option value={"ลิตร"}>ลิตร</option>
                              <option value={"ก.ก"}>ก.ก</option>
                            </select>
                          </div>
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox">
                          <span>แหล่งที่ซื้อ</span>
                          {/* <input onChange={ChangeFerti} ref={Source} type="text" placeholder="กรอกข้อมูล"></input> */}
                          {DataSource ? (
                            <select
                              onChange={ChangeFerti}
                              ref={Source}
                              defaultValue={""}
                            >
                              <option value={""} disabled>
                                เลือก
                              </option>
                              {DataSource ? (
                                DataSource.map((val, key) => (
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
                          )}
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="row">
                        <label className="frame-textbox">
                          <span>ว/ด/ป ที่พ่นสาร</span>
                          <DatePickerThai
                            classNameMain="input-date"
                            defaultDate={DateNowOnForm}
                            refIn={DateUse}
                            onInputIn={() => {
                              ChangeChemi();
                            }}
                          />
                          {/* <input onChange={ChangeChemi} defaultValue={DateNowOnForm} onClick={()=>clickDate(DateUse)} ref={DateUse} type="date"></input> */}
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox colume">
                          <span className="full">
                            ชื่อสารเคมี (ชื่อการค้า, ตรา)
                          </span>
                          <div className="content-colume-input">
                            <div className="input-select-popup">
                              <input
                                onChange={(e) => {
                                  handleInputChange(e, "NameFactor");
                                  if (LoadSearchName) {
                                    SearchNameFactor(e);
                                  }
                                  
                                }}
                                onMouseDown={LoadSearchName ? SearchNameFactor : null}
                                placeholder={LoadSearchName ? "กรอกชื่อสารเคมี" : "กำลังโหลด"}
                                ref={NameFactor}
                                readOnly={!LoadSearchName ? true : null}
                                disabled={!LoadSearchName ? true : null}
                                onBlur={(e) => {
                                  ValidateChemicalAndPest()
                                  containsHidePopup(ListSearchName.current, e.target);
                                }}
                              />
                              <div
                                ref={ListSearchName}
                                remove=""
                                className="list-input-search"
                              >
                                {LoadSearchName ? (
                                  ListSelectName
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center"
                                    }}
                                  >
                                    <Loading
                                      size={"8vw"}
                                      border={"2vw"}
                                      color="green"
                                      animetion={true}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox">
                          <span>ชื่อสามัญสารเคมี</span>
                          <div className="input-select-other">
                          <input
                            onChange={(e) => {
                              handleInputChange(e, "NameMainFactor");
                              if (LoadSearchNameMain) {
                                SearchFactorNameOther(e);
                              }                              
                            }}
                            onMouseDown={LoadSearchNameMain ? SearchFactorNameOther : null}
                            ref={NameMainFactor}
                            type="text"
                            placeholder={LoadSearchNameMain ? "กรอกชื่อสามัญ" : "กำลังโหลด"}
                            readOnly={!LoadSearchNameMain ? true : null}
                            disabled={!LoadSearchNameMain ? true : null}
                            onBlur={(e) => {
                              containsHidePopup(ListSearchFactorNameMain.current, e.target);
                            }}
                          />
                            <div
                              ref={ListSearchFactorNameMain}
                              remove=""
                              className="list-input-search"
                            >
                              {LoadSearchNameMain ? (
                                ListSelectNameMain
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center"
                                  }}
                                >
                                  <Loading
                                    size={"8vw"}
                                    border={"2vw"}
                                    color="green"
                                    animetion={true}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox colume">
                          <span className="full">ศัตรูพืชหรือโรคที่พบ</span>
                          <div className="content-colume-input">
                            <div className="input-select-popup">
                            <input
                              onChange={(e) => {
                                handleInputChange(e, "NameInsect");
                                if (LoadSearchPests) {
                                  SearchPests(e);
                                }                                
                              }}
                              onMouseDown={LoadSearchPests ? SearchPests : null}
                              placeholder={LoadSearchPests ? "กรอกชื่อศัตรูพืช" : "กำลังโหลด"}
                              ref={NameInsect}
                              readOnly={!LoadSearchPests ? true : null}
                              disabled={!LoadSearchPests ? true : null}
                              onBlur={(e) => {
                                ValidateChemicalAndPest();
                                containsHidePopup(ListSearchPests.current, e.target);
                              }}
                            />
                              <div
                                ref={ListSearchPests}
                                remove=""
                                className="list-input-search"
                              >
                                {LoadSearchPests ? (
                                  ListSelectPests
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center"
                                    }}
                                  >
                                    <Loading
                                      size={"8vw"}
                                      border={"2vw"}
                                      color="green"
                                      animetion={true}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox colume">
                          <span className="full">วิธีการใช้</span>
                          <textarea
                            className="content-colume-input"
                            style={{ textAlign: "left" }}
                            ref={Use}
                          ></textarea>
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox">
                          <span>อัตราที่ผสม</span>
                          <div className="input-row">
                            <input
                              onChange={ChangeChemi}
                              ref={Rate}
                              type="number"
                              placeholder="cc."
                            ></input>
                            <div className="unit">/น้ำ20ล.</div>
                          </div>
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox">
                          <span>ปริมาณที่ใช้ทั้งหมด</span>
                          <div className="input-row">
                            <input
                              onChange={ChangeChemi}
                              ref={Volume}
                              type="number"
                              placeholder="ตัวเลข"
                            ></input>
                            <select
                              onChange={ChangeChemi}
                              ref={Unit}
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
                          <DatePickerThai
                            classNameMain="input-date"
                            defaultDate={getDateOut}
                            refIn={DateSafe}
                            onInputIn={ChangeChemi}
                          />
                          {/* <input onChange={ChangeChemi} onClick={()=>clickDate(DateSafe)} ref={DateSafe} type="date"></input> */}
                        </label>
                      </div>
                      <div className="row">
                        <label className="frame-textbox">
                          <span>แหล่งที่ซื้อ</span>
                          {/* <input onChange={ChangeChemi} ref={Source} type="text" placeholder="กรอกข้อมูล"></input> */}
                          {DataSource ? (
                            <select
                              key={0}
                              onChange={ChangeChemi}
                              ref={Source}
                              defaultValue={""}
                            >
                              <option value={""} disabled>
                                เลือก
                              </option>
                              {DataSource ? (
                                DataSource.map((val, key) => (
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
                          )}
                        </label>
                      </div>
                    </>
                  )}
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
          {getWait ? (
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
              ref={BTConfirm}
              no=""
              className="bt-confirm-factor"
              onClick={type_path === "z" ? ConfirmFerti : ConfirmChemi}
            >
              ยืนยัน
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default PopupInsertFactor;