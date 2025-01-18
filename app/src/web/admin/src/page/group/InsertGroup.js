import { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { PageTemplateContext } from "../PageTemplate";

const InsertGroup = () => {

    const { openInsert, setOpenInsert } = useContext(PageTemplateContext);
    const [chemicals, setChemicals] = useState([]);
    const [pests, setPests] = useState([]);
    const [plants, setPlants] = useState([]);

    const [ chemical , setChemical ] = useState("")
    const [ pest , setPest ] = useState("")
    const [ plant , setPlant ] = useState("")
    const [ safeDays , setSafeDays ] = useState(0)

    const [status, setStatus] = useState(0);
    const [stateOnBt, setStateOnBt] = useState(true);

    const ListGroup = useCallback(async () => {
        const listchemical = await clientMo.post("/api/admin/data/list", {
            type: "chemical", limit: 100, startRow: 0, textSearch: ""
        });
        const Listchemical = JSON.parse(listchemical);
        setChemicals(Listchemical);
    }, []);

    const Listpest = useCallback(async () => {
        const listchemical = await clientMo.post("/api/admin/data/list", {
            type: "pest", limit: 100, startRow: 0, textSearch: ""
        });
        const Listpest = JSON.parse(listchemical);
        setPests(Listpest);
    }, []);

    const Listplants = useCallback(async () => {
        const listplant = await clientMo.post("/api/admin/data/list", {
            type: "plant", limit: 100, startRow: 0, textSearch: ""
        });
        const Listplant = JSON.parse(listplant);
        setPlants(Listplant);
    }, []);

    const CheckEmply = () => {
        // ตรวจสอบข้อมูลว่าง
        // เพิ่มฟังก์ชันเพื่อตรวจสอบข้อมูลก่อนส่ง

        if(chemical && pest && plant && safeDays) {
            return {
                pest_id : chemical, 
                chemical_id : pest, 
                plant_id : plant,
                safe_days : safeDays
            }
        } else {
            return false
        }
    };

    const ClickAdd = async (e) => {
        const Data = CheckEmply();
        if (Data) {
            setOpenInsert(1);

            try {
                const result = await clientMo.post("/api/admin/group/insert", Data);
                console.log("Result:", result);
                // จัดการหลังการเพิ่มข้อมูลสำเร็จ
            } catch (error) {
                console.error("Error adding data:", error);
                // จัดการข้อผิดพลาด
            }
        }
    };

    const Cancel = () => {
        setOpenInsert(false);
        // เพิ่มการกระทำเพิ่มเติมถ้าจำเป็น
    };

    useEffect(() => {
        ListGroup();
        Listpest();
        Listplants();
    }, [ListGroup, Listpest, Listplants,]);

    return (
        <>
            <div className="modal-content">
                <div className="modal-header">
                    <h2 id="modal-title">เพิ่มรายการจัดกลุ่มข้อมูล</h2>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setOpenInsert(false)}
                        aria-label="Close"
                    />
                </div>
                <div className="modal-body">
                    {/* ตารางที่ 1: โรคพืช / ศัตรูพืช */}
                    <div className="table-section">
                        <span className="table-title">โรคพืช / ศัตรูพืช</span>
                        <select onChange={(e) => setPest(e.target.value)}>
                            <option value="">กรุณาเลือก</option>
                            {
                                pests.map((pest, index) => (
                                    <option key={index} value={pest.id}>
                                        {pest.pest_name}
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    {/* ตารางที่ 2: สารเคมี */}
                    <div className="table-section">
                        <span className="table-title">สารเคมี</span>
                        <select onChange={(e) => setChemical(e.target.value)}>
                            <option value="">กรุณาเลือก</option>
                            {
                                chemicals.map((chemical, index) => (
                                    <option key={index} value={chemical.id}>
                                        {chemical.name}
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    {/* ตารางที่ 3: พืช */}
                    <div className="table-section">
                        <span className="table-title">ชนิดพืช</span>
                        <select onChange={(e) => setPlant(e.target.value)}>
                            <option value="">กรุณาเลือก</option>
                            {
                                plants.map((plant, index) => (
                                    <option key={index} value={plant.id}>
                                        {plant.name}
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    <div className="table-section">
                        <span className="table-title">วันที่ปลอดภัย</span>
                        <input onChange={(e) => setSafeDays(e.target.value)} type="number"/>
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
