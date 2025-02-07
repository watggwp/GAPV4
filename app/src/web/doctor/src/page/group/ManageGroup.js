import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { Autocomplete, TextField } from "@mui/material";
import { PageDataContext } from "../data/PageData";
 
const ManageGroup = ({ fetchGroups }) => {
    const { popupDataManage , setPopupDataManage } = useContext(PageDataContext);
    const [ chemicals, setChemicals ] = useState([]);
    const [ pests, setPests ] = useState([]);
    const [ plants, setPlants ] = useState([]);
 
    const [ safeDays, setSafeDays ] = useState({
        data : 0,
        status : "finish"
    });
    const [ foundCurrentSafeDate , setFoundCurrentSafeDate ] = useState(false)
 
    const [ filterType, setFilterType ] = useState("");
    const [ pestID, setPestID ] = useState("");
    const [ chemicalID, setChemicalID ] = useState("");
    const [ plantID, setPlantID ] = useState("");
 
    const [ loading, setLoading ] = useState(popupDataManage.type === "edit");
    const [ stateOnBt, setStateOnBt ] = useState(true);
 
    const requestGroup = useCallback(async () => {
        try {
            const response = await clientMo.post("/api/doctor/group/get", { id: popupDataManage.metadata?.id });
            const result = JSON.parse(response)[0];
 
            setPestID(result.pest_id)
            setChemicalID(result.chemical_id)
            setPlantID(result.plant_id)
            setSafeDays({
                data : result.safe_days,
                status : "finish"
            })
            setFilterType(result.type_pest)
 
            setLoading(false);
        } catch (error) {
            console.error("Error fetching group data:", error);
            setLoading(false);
        }
    } , [popupDataManage.metadata?.id])
 
    const requestChemecals = useCallback(async () => {
        const listchemical = await clientMo.post("/api/doctor/data/list", {
            type: "chemical", limit: 100, startRow: 0, textSearch: ""
        });
        const Listchemical = JSON.parse(listchemical);
        setChemicals(Listchemical);
    }, []);
 
    const requestPests = useCallback(async () => {
        const listchemical = await clientMo.post("/api/doctor/data/list", {
            type: "pest", limit: 100, startRow: 0, textSearch: ""
        });
        const requestPests = JSON.parse(listchemical);
        setPests(requestPests);
    }, []);
 
    const requestPlants = useCallback(async () => {
        const listplant = await clientMo.post("/api/doctor/data/list", {
            type: "plant", limit: 100, startRow: 0, textSearch: ""
        });
        const Listplant = JSON.parse(listplant);
        setPlants(Listplant);
    }, []);
 
    const CheckEmply = useCallback(() => {
 
        setStateOnBt(false)
        if (chemicalID && pestID && plantID && safeDays.data) {
            setStateOnBt(true)
            return {
                pest_id: pestID,
                chemical_id: chemicalID,
                plant_id: plantID,
                safe_days: safeDays.data
            };
        } else {
            return false;
        }
    } , [ safeDays.data , chemicalID , pestID , plantID])
 
    const onSubmit = async (e) => {
        const Data = CheckEmply();
        setStateOnBt(false)
        if (Data) {
            switch(popupDataManage.type) {
                case "insert" :
                    try {
                        const result = await clientMo.post("/api/doctor/group/insert", Data);
                        console.log("Result:", result);
       
                        const { status } = JSON.parse(result);
                        switch (status) {
                            case 200:
                                alert("เพิ่มการจัดกลุ่มสำเร็จ");
                                fetchGroups()
                                Cancel();
                                break;
                            case 409 :
                                alert("พบการขัดกลุ่มนี้ในระบบแล้ว");
                                fetchGroups()
                                Cancel();
                                break;
                            default:
                                alert("พบปัญหาการ เพิ่มการจัดกลุ่ม");
                                break;
                        }
                    } catch (error) {
                        console.error("Error adding data:", error);
                    }
                    break
                case "edit" :
                    try {
                        const response = await clientMo.post("/api/doctor/group/edit", {
                            id : popupDataManage.metadata?.id,
                            ...Data
                        });
 
                        const { status } = JSON.parse(response)
 
                        switch(status) {
                            case 200 :
                                alert("บันทึกข้อมูลสำเร็จ");
                                fetchGroups();
                                Cancel();
                                break;
                            case 409 :
                                alert("พบการขัดกลุ่มนี้ในระบบแล้ว");
                                fetchGroups()
                                Cancel();
                                break;
                            default :
                                alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
                                break
                        }
                    } catch (error) {
                        console.error("Error saving group data:", error);
                        alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
                    }
                    break
                default :
                    break
            }
        }
 
        setStateOnBt(true)
    };
 
    const Cancel = () => {
        setPopupDataManage((data) => ({
            ...data,
            open : false
        }))
    };
 
    const onGetDateSafe = useCallback( async (chemical_id , plant_id) => {
        setSafeDays((data) => ({
            ...data,
            status : "loading"
        }))
 
        let newDateSafe = 0
        if(plant_id && chemical_id) {
            const response = await clientMo.post("/api/doctor/group/search/safedate", {
                chemical_id,
                plant_id
            });
 
            try {
                const { status , data } = JSON.parse(response)
   
                switch(status) {
                    case 200 :
                        newDateSafe = data[0]["safe_days"]
                        setFoundCurrentSafeDate(true)
                        break;
                    default :
                        break
                }
            } catch(err) {
                console.log(err)
            }
        }
 
        setSafeDays({
            data : newDateSafe,
            status : "finish"
        })
    } , [])
 
    useEffect(() => {
        popupDataManage.type === "edit" && requestGroup()
 
        requestChemecals()
        requestPests()
        requestPlants()
    }, [popupDataManage.type , requestChemecals , requestPests , requestPlants , requestGroup]);
 
    const debounceInput = useRef(0)
    useEffect(() => {
        clearTimeout(debounceInput.current)
        debounceInput.current = setTimeout(CheckEmply , 10)
    } , [CheckEmply])
 
    const PlantsData = useMemo(() =>
        plants
            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
            .map(({ id , name }) => ({ id , label : name }))
    , [plants])
 
    const PlantValue = useMemo(() => PlantsData.find(({ id }) => id === plantID) || null , [PlantsData , plantID])
   
    const ChemicalsData = useMemo(() =>
        chemicals
            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
            .map(({ id , name }) => ({ id , label : name }))
    , [chemicals])
 
    const ChemicalValue = useMemo(() => ChemicalsData.find(({ id }) => id === chemicalID) || null , [ChemicalsData , chemicalID])
   
    const PestsData = useMemo(() =>
        pests
            .filter((pest) => (filterType === "" || pest.type_pest === filterType))
            .sort((a, b) => a.pest_name.localeCompare(b.pest_name, 'th'))
            .map(({ pest_id , pest_name }) => ({ id : pest_id , label : pest_name }))
    , [pests , filterType])
 
    const PestValue = useMemo(() =>
        PestsData.find(({ id }) => id === pestID) || null , [PestsData , pestID]
    )
 
    return (
        <>
            <div className="modal-content">
                <div className="modal-header">
                    <h2 id="modal-title">
                        {
                            popupDataManage.type === "insert" ?
                                "เพิ่มรายการจัดกลุ่มข้อมูล" :
                            popupDataManage.type === "edit" ?
                                "แก้ไขรายการจัดกลุ่มข้อมูล" : ""
                        }
                    </h2>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setPopupDataManage((data) => ({
                            ...data,
                            open : false
                        }))}
                        aria-label="Close"
                    />
                </div>
                {
                    loading ? (
                        <p>กำลังโหลดข้อมูล...</p>
                    ) : (
                        <div className="modal-body">
                            <div className="table-section">
                                <span className="table-title">ศัตรูพืช / โรคพืช</span>
                                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                    <option value="">กรุณาเลือก</option>
                                    <option value="โรคพืช">โรคพืช</option>
                                    <option value="ศัตรูพืช">ศัตรูพืช</option>
                                </select>
                            </div>
 
                            <div className="table-section">
                                <span className="table-title">ชื่อโรคพืช / ศัตรูพืช</span>
                                <Autocomplete
                                    disablePortal
                                    onChange={(e , value) => setPestID(value?.id || null)}
                                    value={PestValue}
                                    isOptionEqualToValue={(options , value) => options?.id === value.id}
                                    options={PestsData}
                                    renderInput={(params) => <TextField {...params} slotProps={{ htmlInput : { ...params.inputProps ,  sx : { fontFamily: "Sans-font" } } }}/>}
                                />
                               
                                {/* <input
                                    type="text"
                                    placeholder="ค้นหา..."
                                    value={pestID}
                                    onChange={(e) => setPestID(e.target.value)}
                                    list="pest-options"
                                />
                                <datalist id="pest-options">
                                    {
                                        pests
                                            .filter((pest) => (filterType === "" || pest.type_pest === filterType))
                                            .filter((pest) => pest.pest_name.includes(pestID))
                                            .sort((a, b) => a.pest_name.localeCompare(b.pest_name, 'th'))
                                            .map((pest, index) => (
                                                <option key={index} value={pest.pest_name}>
                                                    {pest.pest_name}
                                                </option>
                                            ))
                                    }
                                </datalist> */}
                            </div>
 
 
                            <div className="table-section">
                                <span className="table-title">สารเคมี</span>
                                <Autocomplete
                                    disablePortal
                                    onChange={(e , value) => {
                                        setChemicalID(value?.id || null)
                                        onGetDateSafe(value?.id , plantID)
                                    }}
                                    value={ChemicalValue}
                                    isOptionEqualToValue={(options , value) => options?.id === value.id}
                                    options={ChemicalsData}
                                    renderInput={(params) => <TextField {...params} slotProps={{ htmlInput : { ...params.inputProps ,  sx : {fontFamily: "Sans-font"  } } }}/>}
                                />
                                {/* <input
                                    type="text"
                                    placeholder="ค้นหา..."
                                    value={chemicalID}
                                    onChange={(e) => setChemicalID(e.target.value)}
                                    list="chemical-options"
                                />
                                <datalist id="chemical-options">
                                    {
                                        chemicals
                                            .filter((chemical) => chemical.name.includes(chemicalID))
                                            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                            .map((chemical, index) => (
                                                <option key={index} value={chemical.name}>
                                                    {chemical.name}
                                                </option>
                                            ))
                                    }
                                </datalist> */}
                            </div>
 
                            <div className="table-section">
                                <span className="table-title">ชนิดพืช</span>
                                <Autocomplete
                                    disablePortal
                                    onChange={(e , value) => {
                                        setPlantID(value?.id || null)
                                        onGetDateSafe(chemicalID , value?.id)
                                    }}
                                    value={PlantValue}
                                    isOptionEqualToValue={(options , value) => options?.id === value.id}
                                    options={PlantsData}
                                    renderInput={(params) => <TextField {...params} slotProps={{ htmlInput : { ...params.inputProps ,  sx : {fontFamily: "Sans-font" } } }}/>}
                                />
                                {/* <input
                                    type="text"
                                    placeholder="ค้นหา..."
                                    value={plantID}
                                    onChange={(e) => setPlantID(e.target.value)}
                                    list="plant-options"
                                />
                                <datalist id="plant-options">
                                    {
                                        plants
                                            .filter((plant) => plant.name.includes(plantID))
                                            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                            .map((plant, index) => (
                                                <option key={index} value={plant.name}>
                                                    {plant.name}
                                                </option>
                                            ))
                                    }
                                </datalist> */}
                            </div>
 
                            <div className="table-section">
                                <span className="table-title">วันที่ปลอดภัย</span>
                                <input
                                    value={safeDays.data}
                                    onChange={(e) => setSafeDays((data) => ({
                                        ...data,
                                        data : e.target.value
                                    }))}
                                    type="number"
                                    placeholder="เช่น 10 , 30"
                                    disabled={safeDays.status === "loading"}
                                />
                            </div>
 
                            <div className="bt-submitgroup">
                                <button className="cancel" onClick={Cancel}>
                                    ยกเลิก
                                </button>
                                <button
                                    className="submit"
                                    onClick={onSubmit}
                                    disabled={!stateOnBt}
                                >
                                    {
                                        popupDataManage.type === "insert" ?
                                            "เพิ่มข้อมูล" :
                                        popupDataManage.type === "edit" ?
                                            "แก้ไขข้อมูล" : ""
                                    }
                                </button>
                            </div>
                        </div>
                    )
                }
            </div>
        </>
    );
};
 
export default ManageGroup;