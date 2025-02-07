import { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { PageDataContext } from "../data/PageData";
 
const InsertGroup = () => {
 
    const { popupDataManage, setPopupDataManage } = useContext(PageDataContext);
    const [chemicals, setChemicals] = useState([]);
    const [pests, setPests] = useState([]);
    const [plants, setPlants] = useState([]);
 
    const [chemical, setChemical] = useState("");
    const [pest, setPest] = useState("");
    const [plant, setPlant] = useState("");
    const [safeDays, setSafeDays] = useState(0);
    const [filterType, setFilterType] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchChemical, setSearchChemical] = useState("");
    const [searchPlant, setSearchPlant] = useState("");
 
 
    const [status, setStatus] = useState(0);
    const [stateOnBt, setStateOnBt] = useState(true);
 
    const ListGroup = useCallback(async () => {
        const listchemical = await clientMo.post("/api/doctor/data/list", {
            type: "chemical", limit: 100, startRow: 0, textSearch: ""
        });
        const Listchemical = JSON.parse(listchemical);
        setChemicals(Listchemical);
    }, []);
 
    const Listpest = useCallback(async () => {
        const listchemical = await clientMo.post("/api/doctor/data/list", {
            type: "pest", limit: 100, startRow: 0, textSearch: ""
        });
        const Listpest = JSON.parse(listchemical);
        setPests(Listpest);
    }, []);
 
    const Listplants = useCallback(async () => {
        const listplant = await clientMo.post("/api/doctor/data/list", {
            type: "plant", limit: 100, startRow: 0, textSearch: ""
        });
        const Listplant = JSON.parse(listplant);
        setPlants(Listplant);
    }, []);
 
    const CheckEmply = () => {
        if (chemical && pest && plant && safeDays) {
            return {
                pest_id: pest,
                chemical_id: chemical,
                plant_id: plant,
                safe_days: safeDays
            };
        } else {
            return false;
        }
    };
 
    const ClickAdd = async (e) => {
        const Data = CheckEmply();
        if (Data) {
            setPopupDataManage({
                open : true,
                type : "insert"
            });
 
            try {
                const result = await clientMo.post("/api/doctor/group/insert", Data);
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
        }
    };
 
    const Cancel = () => {
        setPopupDataManage((data) => ({
            ...data,
            open : false
        }))
    };
 
    useEffect(() => {
        ListGroup();
        Listpest();
        Listplants();
    }, [ListGroup, Listpest, Listplants]);
 
    return (
        <>
            <div className="modal-content">
                <div className="modal-header">
                    <h2 id="modal-title">เพิ่มรายการจัดกลุ่มข้อมูล</h2>
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            list="pest-options"
                        />
                        <datalist  id="pest-options">
                            {
                                pests
                                    .filter((pest) => (filterType === "" || pest.type_pest === filterType))
                                    .filter((pest) => pest.pest_name.includes(searchTerm))
                                    .sort((a, b) => a.pest_name.localeCompare(b.pest_name, 'th'))
                                    .map((pest, index) => (
                                        <option  key={index} value={pest.pest_name}>
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
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={searchPlant}
                            onChange={(e) => setSearchPlant(e.target.value)}
                            list="plant-options"
                        />
                        <datalist id="plant-options">
                            {
                                plants
                                    .filter((plant) => plant.name.includes(searchPlant))
                                    .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                    .map((plant, index) => (
                                        <option key={index} value={plant.name}>
                                            {plant.name}
                                        </option>
                                    ))
                            }
                        </datalist>
                    </div>
 
                    <div className="table-section">
                        <span className="table-title">วันที่ปลอดภัย</span>
                        <input
                            onChange={(e) => setSafeDays(e.target.value)}
                            type="number"
                            placeholder="เช่น 10 , 30"
                        />
                    </div>
 
                    <div className="bt-submitgroup">
                        <button className="cancel" onClick={Cancel}>
                            ยกเลิก
                        </button>
                        <button
                            className="submit"
                            onClick={ClickAdd}
                            disabled={!stateOnBt}
                        >
                            เพิ่มข้อมูล
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
 
export default InsertGroup;