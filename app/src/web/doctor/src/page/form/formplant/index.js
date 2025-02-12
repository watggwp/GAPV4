import { useCallback, useEffect } from "react";
import { DayJSX, MapsJSX } from "../../../../../../assets/js/module";

export default function FormPlant({
    data,
    mode,
    setMode,
    setEditValue,
    getResize,
}) {

    const onEdit = useCallback((name , data) => {
        setEditValue(editValue => {
            editValue[name] = data
            return {...editValue}
        })
    } , [setEditValue])

    useEffect(() => {
        setMode("view")
        setEditValue({})
    } , [setMode , setEditValue])

    return(
        <section className="detail-main-form">
            <div className="content-data">
                <div className="number">1.</div>
                <div className="data-row">
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ชนิดพืช</span>
                            {/* <span className="data-show">{data.type_main}</span> */}
                            <input className="data-show" value={data.type_main} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ชื่อพืช</span>
                            <input className="data-show" value={data.name_plant} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                    </div>
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่เพาะกล้า</span>
                            <DayJSX TYPE="small" TEXT="วันที่" DATE={data.date_glow}/>
                        </div>
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่ปลูก</span>
                            <DayJSX TYPE="small" TEXT="วันที่" DATE={data.date_plant}/>
                        </div>
                    </div>
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่คาดว่าจะเก็บเกี่ยว</span>
                            <DayJSX TYPE="small" TEXT="วันที่" DATE={data.date_harvest}/>
                        </div>
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">วันที่เก็บเกี่ยว</span>
                            { data.date_success ? 
                                <DayJSX TYPE="small" TEXT="วันที่" DATE={data.date_success}/> 
                                : <span className="data-show">ยังไม่เก็บเกี่ยว</span>}
                        </div>
                    </div>
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            {/* มีตรงนี้ไม่รู้ต้องเขียนยังไงครับพี่ */}
                            <span className="head-data">พื้นที่</span>
                            <span className="data-show">
                                {data.area}
                                <div className="unit">
                                    {data.unit}
                                </div>
                            </span>
                        </div>
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">จำนวนต้น</span>
                            {/* <span className="data-show">{data.qty}</span> */}
                            <input className="data-show" value={data.qty} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                    </div>
                    <div className="row">
                        <span className="head-text">ระยะการปลูก</span>
                        <div className="text-body">
                            <div className={`data-main ${getResize >= 450 ? "in-2 column" : "in-1 screen-small"}`}>
                                <span className="head-data">ระหว่างต้น</span>
                                {/* <span className="data-show">{data.posi_w}</span> */}
                                <input className="data-show" value={data.posi_w} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                            </div>
                            <div className={`data-main ${getResize >= 450 ? "in-2 column" : "in-1 screen-small"}`}>
                                <span className="head-data">ระหว่างแถว</span>
                                {/* <span className="data-show">{data.posi_h}</span> */}
                                <input className="data-show" value={data.posi_h} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">รุ่นที่ปลูก</span>
                            {/* <span className="data-show">{data.generation}</span> */}
                            <input className="data-show" value={data.generation} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="content-data">
                <div className="number">2.</div>
                <div className="data-row">
                    <div className="row">
                        <div className={`data-main in-1 column ${getResize < 450 ? "screen-small" : ""}`}>
                            <span className="head-data" style={{width : "110px"}}>รูปแบบการปลูก</span>
                            {/* <span className="data-show">{data.system_glow}</span> */}
                            <input className="data-show" value={data.system_glow} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="content-data">
                <div className="number">3.</div>
                <div className="data-row">
                    <div className="row">
                        <div className={`data-main in-1 ${getResize < 450 ? "screen-small" : ""}`}>
                            <span className="head-data" style={{width : "110px"}}>แหล่งน้ำ</span>
                            {/* <span className="data-show">{data.water}</span> */}
                            <input className="data-show" value={data.water} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="content-data">
                <div className="number">4.</div>
                <div className="data-row">
                    <div className="row">
                        <div className={`data-main in-1 ${getResize < 450 ? "screen-small" : ""}`}>
                            <span className="head-data" style={{width : "110px"}}>วิธีการให้น้ำ</span>
                            {/* <span className="data-show">{data.water_flow}</span> */}
                            <input className="data-show" value={data.water_flow} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="content-data">
                <div className="number">5.</div>
                <div className="data-row">
                    <div className="row">
                        <div className={`data-main in-1 ${getResize < 450 ? "screen-small" : ""}`}>
                            <span style={{width : "100%"}} className="head-data">ประวัติการใช้พื้นที่และการเกิดโรค</span>
                        </div>
                    </div>
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ชนิดพืชก่อนหน้า</span>
                            {/* <span className="data-show">{data.history ? data.history : "ไม่ระบุ"}</span> */}
                            <input className="data-show" value={data.history ? data.history : "ไม่ระบุ"} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">โรค/แมลงที่พบ</span>
                            {/* <span className="data-show">{data.insect ? data.insect : "ไม่ระบุ"}</span> */}
                            <input className="data-show" value={data.insect ? data.insect : "ไม่ระบุ"} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                    </div>
                    <div className="row">
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">ปริมาณการเกิด</span>
                            {/* <span className="data-show">{data.qtyInsect ? data.qtyInsect : "ไม่ระบุ"}</span> */}
                            <input className="data-show" value={data.qtyInsect ? data.qtyInsect : "ไม่ระบุ"} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                        <div className={`data-main ${getResize >= 450 ? "in-2" : "in-1 screen-small"}`}>
                            <span className="head-data">การป้องกันกำจัด</span>
                            {/* <span className="data-show">{data.seft ? data.seft : "ไม่ระบุ"}</span> */}
                            <input className="data-show" value={data.seft ? data.seft : "ไม่ระบุ"} readOnly={mode==="view"} onChange={(event) => onEdit("name_plant" , event.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
            { 
                data.location_house ?
                    data.location_house.x && data.location_house.x ?
                    <div className="content-data">
                        <div className="data-row">
                            <div className="row">
                                <div className="data-main in-1 column">
                                    <span className="head-data">ตำแหน่งที่ทำการเกษตรกร</span>
                                    <MapsJSX lat={data.location_house.x} lng={data.location_house.y}/>
                                </div>
                            </div>
                        </div>
                    </div> : <></> 
                : <></>
            }
        </section>
    )
}