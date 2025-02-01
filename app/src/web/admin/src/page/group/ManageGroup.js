import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { PageTemplateContext } from "../PageTemplate";
import { Autocomplete, TextField } from "@mui/material";

const ManageGroup = ({ fetchGroups }) => {
    const { popupDataManage , setPopupDataManage } = useContext(PageTemplateContext);
    const [ chemicals, setChemicals ] = useState([]);
    const [ pests, setPests ] = useState([]);
    const [ plants, setPlants ] = useState([]);

    const [ safeDays, setSafeDays ] = useState({
        data : 0,
        status : "finish"
    });
    const [ foundCurrentSafeDate , setFoundCurrentSafeDate ] = useState(false)

    const [ filterType, setFilterType ] = useState("");
    const [ searchPest, setSearchPest ] = useState("");
    const [ searchChemical, setSearchChemical ] = useState("");
    const [ plantID, setPlantID ] = useState("");

    const [ loading, setLoading ] = useState(popupDataManage.type === "edit");
    const [ stateOnBt, setStateOnBt ] = useState(true);

    const requestGroup = useCallback(async () => {
        try {
            const response = await clientMo.post("/api/admin/group/get", { id: popupDataManage.metadata?.id });
            const result = JSON.parse(response)[0];

            setSearchPest(result.pest_name)
            setSearchChemical(result.chemical_name)
            setPlantID(result.plant_id)
            setSafeDays({
                data : result.safe_days,
                status : "finish"
            })

            setLoading(false);
        } catch (error) {
            console.error("Error fetching group data:", error);
            setLoading(false);
        }
    } , [popupDataManage.metadata?.id])

    const requestChemecals = useCallback(async () => {
        const listchemical = await clientMo.post("/api/admin/data/list", {
            type: "chemical", limit: 100, startRow: 0, textSearch: ""
        });
        const Listchemical = JSON.parse(listchemical);
        setChemicals(Listchemical);
    }, []);

    const requestPests = useCallback(async () => {
        const listchemical = await clientMo.post("/api/admin/data/list", {
            type: "pest", limit: 100, startRow: 0, textSearch: ""
        });
        const requestPests = JSON.parse(listchemical);
        setPests(requestPests);
    }, []);

    const requestPlants = useCallback(async () => {
        const listplant = await clientMo.post("/api/admin/data/list", {
            type: "plant", limit: 100, startRow: 0, textSearch: ""
        });
        const Listplant = JSON.parse(listplant);
        setPlants(Listplant);
    }, []);

    const CheckEmply = useCallback(() => {
        const chemical_id = chemicals.find(chemical => chemical.name === searchChemical)?.id
        const pest_id = pests.find(pest => pest.pest_name === searchPest)?.pest_id

        setStateOnBt(false)
        if (chemical_id && pest_id && plantID && safeDays.data) {
            setStateOnBt(true)
            return {
                pest_id: pest_id,
                chemical_id: chemical_id,
                plant_id: plantID,
                safe_days: safeDays.data
            };
        } else {
            return false;
        }
    } , [chemicals , pests , safeDays.data , searchChemical , searchPest , plantID])

    const onSubmit = async (e) => {
        const Data = CheckEmply();
        setStateOnBt(false)
        if (Data) {
            switch(popupDataManage.type) {
                case "insert" :
                    try {
                        const result = await clientMo.post("/api/admin/group/insert", Data);
                        console.log("Result:", result);
        
                        const { status } = JSON.parse(result);
                        switch (status) {
                            case 200:
                                alert("เพิ่มการจัดกลุ่มสำเร็จ");
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
                        const response = await clientMo.post("/api/admin/group/edit", {
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

    const onGetDateSafe = useCallback( async () => {
        const chemical_id = chemicals.find(chemical => chemical.name === searchChemical)?.id
        setSafeDays((data) => ({
            ...data,
            status : "loading"
        }))

        const response = await clientMo.post("/api/admin/group/search/safedate", {
            chemical_id,
            plantID
        });

        let newDateSafe = 0
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

        setSafeDays({
            data : newDateSafe,
            status : "finish"
        })
    } , [chemicals , searchChemical , plantID])

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

    const debounceDateSafe = useRef(0)
    useEffect(() => {
        clearTimeout(debounceDateSafe.current)
        debounceInput.current = setTimeout(onGetDateSafe , 10)
    } , [onGetDateSafe])

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
                                <select onChange={(e) => setFilterType(e.target.value)}>
                                    <option value="">กรุณาเลือก</option>
                                    <option value="โรคพืช">โรคพืช</option>
                                    <option value="ศัตรูพืช">ศัตรูพืช</option>
                                </select>
                            </div>

                            <div className="table-section">
                                <span className="table-title">ชื่อโรคพืช / ศัตรูพืช</span>
                                <input
                                    type="text"
                                    placeholder="ค้นหา..."
                                    value={searchPest}
                                    onChange={(e) => setSearchPest(e.target.value)}
                                    list="pest-options"
                                />
                                <datalist id="pest-options">
                                    {
                                        pests
                                            .filter((pest) => (filterType === "" || pest.type_pest === filterType))
                                            .filter((pest) => pest.pest_name.includes(searchPest))
                                            .sort((a, b) => a.pest_name.localeCompare(b.pest_name, 'th'))
                                            .map((pest, index) => (
                                                <option key={index} value={pest.pest_name}>
                                                    {pest.pest_name}
                                                </option>
                                            ))
                                    }
                                </datalist>
                            </div>


                            <div className="table-section">
                                <span className="table-title">สารเคมี</span>
                                <input
                                    type="text"
                                    placeholder="ค้นหา..."
                                    value={searchChemical}
                                    onChange={(e) => setSearchChemical(e.target.value)}
                                    list="chemical-options"
                                />
                                <datalist id="chemical-options">
                                    {
                                        chemicals
                                            .filter((chemical) => chemical.name.includes(searchChemical))
                                            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                            .map((chemical, index) => (
                                                <option key={index} value={chemical.name}>
                                                    {chemical.name}
                                                </option>
                                            ))
                                    }
                                </datalist>
                            </div>

                            <div className="table-section">
                                <span className="table-title">ชนิดพืช</span>
                                <Autocomplete
                                    disablePortal
                                    onChange={(e , value) => setPlantID(value.id)}
                                    value={plantID}
                                    isOptionEqualToValue={({ id_op } , { id }) => id_op === id}
                                    options={
                                        plants
                                            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                            .map(({ id , name }) => ({ id , label : name }))
                                    }
                                    renderInput={(params) => <TextField {...params} />}
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
