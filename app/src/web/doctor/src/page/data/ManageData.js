import React, { useEffect, useRef, useState } from "react";
import "../../assets/style/page/data/ManageData.scss"
import { GetLinkUrlOfSearch, MapsJSX } from "../../../../../assets/js/module";
import { clientMo } from "../../../../../assets/js/moduleClient";
import { Stack } from "@mui/material";
import { Modal } from "react-bootstrap";
import DataHistoryModal from "./DataHistoryModal";

const ManageData = ({ Ref, setPopup, DataOfPage, Type, Fetch, RowPresent, session }) => {
    const StatusRef = useRef()
    const Password = useRef()
    const DeletePasswordRef = useRef()

    const [Data, setData] = useState({
        id: Type === "pest" ? DataOfPage.pest_id : DataOfPage.id,
        ...DataOfPage
    })
    const [StateEdit, setStateEdit] = useState(false)
    const [StateDelete, setStateDelete] = useState(false)
    const [DataEdit, setDataEdit] = useState(new Map())
    const [Status, setStatus] = useState(DataOfPage.is_use)
    const [BtSubmit, setBtSubmit] = useState("")
    const [DeletePassword, setDeletePassword] = useState("")

    const [ErrReport, setErrReport] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [because, setBecause] = useState("")
    const [StateConfirmDiscard, setStateConfirmDiscard] = useState(false)

    useEffect(() => {
        Ref.current.style.opacity = 1
        Ref.current.style.visibility = "visible"
    }, [])

    useEffect(() => {
        const overlay = Ref.current
        const handleClick = (e) => {
            if (e.target === overlay) tryClose()
        }
        overlay.addEventListener('click', handleClick)
        return () => overlay.removeEventListener('click', handleClick)
    }, [StateEdit, StateDelete])

    const CheckEdit = (value, key) => {
        const data = new Map([...DataEdit])

        if (Data[key] != value && value) data.set(key, value)
        else data.delete(key)

        if (data.size > 1 && data.has("password")) setBtSubmit(null)
        else setBtSubmit("")
        setDataEdit(data)
    }

    const Submit = async () => {
        if (DataEdit.size > 1 && DataEdit.has("password")) {
            console.log(DataEdit)
            const JsonData = {}
            JsonData.check = {}
            JsonData.data = {}

            // revise code
            const check = (
                Type === "plant" ? ["name"] :
                    Type === "fertilizer" ? ["name", "name_formula"] :
                        Type === "chemical" ? ["name", "name_formula"] :
                            Type === "pest" ? ["pest_name"] :
                                Type === "source" ? ["name"] : []
            )

            DataEdit.forEach((data, column) => {
                column = (Type === "pest" && column === "name") ? "pest_name" : column
                if (check.filter(valfilter => valfilter == column).length)
                    JsonData.check[column] = data

                if (column != "password") JsonData.data[column] = data
                else JsonData["password"] = data
            })

            JsonData["type"] = Type
            JsonData["id_list"] = Data.id
            JsonData["because"] = because

            const newData = await clientMo.post("/api/doctor/data/edit", JsonData)

            Password.current.value = ""
            const setdata = new Map([...DataEdit])
            setdata.delete("password")
            setDataEdit(setdata)
            try {
                const dataJson = JSON.parse(newData)
                if (dataJson.result === "pass") {
                    setData(dataJson.data[0])
                    setStateEdit(false)
                    ResetDataEdit()

                    Fetch(0, RowPresent)
                } else if (dataJson.result === "over") {
                    setErrReport(true)
                    setBtSubmit("")
                } else if (dataJson.result === "password") {
                    Password.current.setAttribute("placeholder", "รหัสผ่านไม่ถูกต้อง")
                } else session()
            } catch (e) {
                console.log(e)
                session()
            }
        }
    }

    //state list
    const ChangeStatusUSE = async (state) => {
        const DataIN = {
            type: Type,
            id_list: Data.id,
            state: state ? 0 : 1
        }
        const fetchChange = await clientMo.post("/api/doctor/data/change", DataIN)
        if (fetchChange === "113") {
            setStatus(DataIN.state)
            Fetch(0, RowPresent)
        } else if (fetchChange === "over") {
            Fetch(0, RowPresent)
            close()
        }
        else if (fetchChange === "error") { }
        else session()
    }

    const close = () => {
        Ref.current.style.opacity = 0
        Ref.current.style.visibility = "hidden"
        setTimeout(() => {
            setPopup(<></>)
        }, 500)
    }

    const ResetDataEdit = () => {
        setBtSubmit("")
        setErrReport(false)
        setDataEdit(new Map())
        setBecause("")
    }

    const tryClose = () => {
        if (StateEdit || StateDelete) {
            setStateConfirmDiscard(true)
        } else {
            close()
        }
    }

    const confirmDiscard = () => {
        setStateConfirmDiscard(false)
        setStateEdit(false)
        setStateDelete(false)
        ResetDataEdit()
        setDeletePassword("")
        if (Password.current) Password.current.value = ""
        if (DeletePasswordRef.current) DeletePasswordRef.current.value = ""
        close()
    }

    const SubmitDelete = async () => {
        if (!DeletePassword) return
        const JsonData = {
            type: Type,
            id_list: Data.id,
            password: DeletePassword
        }
        const result = await clientMo.post("/api/doctor/data/delete", JsonData)
        try {
            const dataJson = JSON.parse(result)
            if (dataJson.result === "pass") {
                Fetch(0, RowPresent)
                close()
            } else if (dataJson.result === "password") {
                DeletePasswordRef.current.setAttribute("placeholder", "รหัสผ่านไม่ถูกต้อง")
                DeletePasswordRef.current.value = ""
                setDeletePassword("")
            } else session()
        } catch (e) {
            console.log(e)
            session()
        }
    }

    return (
        <>
            <section className="manage-data-popup">
                <div className="head-form">
                    <div className="head-title-row">
                        {!StateEdit && !StateDelete && (
                            <button className="icon-btn edit" onClick={() => {
                                setStateEdit(1)
                                ResetDataEdit()
                            }} title="แก้ไข">
                                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                        )}
                        <div className="head-text">
                            <span>
                                {StateEdit ? "แก้ไข" : StateDelete ? "ลบ" : "ข้อมูล"}
                                {
                                    Type === "plant" ? "พืช" :
                                        Type === "pest" ? "โรคพืช / ศัตรูพืช" :
                                            Type === "fertilizer" ? "ปุ๋ย" :
                                                Type === "chemical" ? "สารเคมี" :
                                                    Type === "source" ? "แหล่งที่ซื้อ" : ""
                                }
                            </span>
                        </div>
                        {!StateEdit && !StateDelete && (
                            <div className="head-right-actions">
                                <button className="icon-btn history" onClick={() => setHistoryOpen(true)} title="ดูประวัติการแก้ไข">
                                    <svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                                </button>
                                <button className="icon-btn delete" onClick={() => setStateDelete(true)} title="ลบข้อมูล">
                                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                            </div>
                        )}
                    </div>
                    {!StateEdit && (
                        <div className="manage-menu">
                            <a className="status-frame" onClick={() => ChangeStatusUSE(Status)} status={Status}>
                                <div ref={StatusRef} className="status">
                                    <span>เปิด</span>
                                    <div className="dot-status"></div>
                                    <span>ปิด</span>
                                </div>
                            </a>
                        </div>
                    )}
                </div>
                <Stack className="detail" state={StateEdit ? "1" : "0"} alignItems={"center"} padding={0.5}>
                    {
                        Type === 'plant' ?
                            !StateEdit ?
                                <DetailPlant Data={Data} /> :
                                <EditPlant CheckEdit={CheckEdit} Data={Data} ErrReport={ErrReport} setBecause={setBecause} /> :
                            Type === 'pest' ?
                                !StateEdit ?
                                    <Detailpest Data={Data} /> :
                                    <Editpest CheckEdit={CheckEdit} Data={Data} ErrReport={ErrReport} setBecause={setBecause} /> :
                                Type === 'fertilizer' ?
                                    !StateEdit ?
                                        <DetailFertilizer Data={Data} /> :
                                        <EditFertilizer CheckEdit={CheckEdit} Data={Data} ErrReport={ErrReport} setBecause={setBecause} /> :
                                    Type === 'chemical' ?
                                        !StateEdit ?
                                            <DetailChemical Data={Data} /> :
                                            <EditChemical CheckEdit={CheckEdit} Data={Data} ErrReport={ErrReport} setBecause={setBecause} /> :
                                        Type === 'source' ?
                                            !StateEdit ?
                                                <DetailSource Data={Data} /> :
                                                <EditSource CheckEdit={CheckEdit} Data={Data} ErrReport={ErrReport} setBecause={setBecause} />
                                            : <></>
                    }
                </Stack>
                {/* <div className="detail" state={StateEdit ? "1" : "0"}>
                
            </div> */}
                {StateEdit &&
                    <div className="bt-manage">
                        <div className="password">
                            <input placeholder="รหัสผ่านเจ้าหน้าที่" type="password" autoComplete="new-password" ref={Password} onChange={(e) => CheckEdit(e.target.value, "password")}></input>
                        </div>
                        <div className="bt">
                            <button onClick={() => {
                                setStateEdit(false)
                                ResetDataEdit()
                            }} className="cancel">ยกเลิก</button>
                            <button onClick={Submit} className="submit" on={BtSubmit}>ยืนยัน</button>
                        </div>
                    </div>
                }
                {StateDelete &&
                    <div className="bt-manage bt-delete-confirm">
                        <div className="delete-warning">
                            <span>ยืนยันการลบข้อมูลนี้?</span>
                            <span className="delete-name">{Type === "pest" ? Data.pest_name : Data.name}</span>
                        </div>
                        <div className="password">
                            <input placeholder="รหัสผ่านเจ้าหน้าที่" type="password" autoComplete="new-password" ref={DeletePasswordRef}
                                onChange={(e) => setDeletePassword(e.target.value)}></input>
                        </div>
                        <div className="bt">
                            <button onClick={() => {
                                setStateDelete(false)
                                setDeletePassword("")
                            }} className="cancel">ยกเลิก</button>
                            <button onClick={SubmitDelete} className="submit delete-btn" on={DeletePassword ? null : ""}>ยืนยันลบ</button>
                        </div>
                    </div>
                }
                {StateConfirmDiscard && (
                    <div className="discard-overlay">
                        <div className="discard-dialog">
                            <span>ต้องการละทิ้งข้อมูลที่กรอก?</span>
                            <div className="discard-bt">
                                <button className="cancel" onClick={() => setStateConfirmDiscard(false)}>ยกเลิก</button>
                                <button className="confirm" onClick={confirmDiscard}>ละทิ้ง</button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
            <Modal show={historyOpen} onHide={() => setHistoryOpen(false)} centered size="xl">
                {historyOpen && (
                    <DataHistoryModal
                        dataId={Data.id}
                        dataType={Type}
                        dataLabel={Type === "pest" ? Data.pest_name : Data.name}
                        onClose={() => setHistoryOpen(false)}
                    />
                )}
            </Modal>
        </>
    )
}

const DetailPlant = ({ Data }) => {
    return (
        <div className="body">
            <div className="row">
                <label className="field-select">
                    <span>
                        <span>ชื่อชนิดพืช</span>
                    </span>
                    <input readOnly defaultValue={Data.name}></input>
                </label>
                <label className="field-select">
                    <span>ประเภท</span>
                    <select disabled defaultValue={Data.type_plant}>
                        <option disabled value={""}>เลือกประเภท</option>
                        <option value={"พืชผัก"}>พืชผัก</option>
                        <option value={"ผลไม้"}>ผลไม้</option>
                        <option value={"สมุนไพร"}>สมุนไพร</option>
                        <option value={"ไม้ดอก"}>ไม้ดอก</option>
                        <option value={"ไม้ผล"}>ไม้ผล</option>
                        <option value={"กัญชง"}>กัญชง</option>
                        <option value={"กัญชา"}>กัญชา</option>
                    </select>
                </label>
                <label className="field-select">
                    <span>
                        <span>ชื่อสายพันธุ์พืช</span>
                    </span>
                    <input readOnly defaultValue={Data.variety_name}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span className="important">จำนวนวันที่คาดว่าจะเก็บเกี่ยว</span>
                    <input readOnly defaultValue={Data.qty_harvest}></input>
                </label>
            </div>
        </div>
    )
}
const EditPlant = ({ CheckEdit, Data, ErrReport, setBecause }) => {
    const typeInsert = useRef()
    const DateQtyInsert = useRef()

    const SelectElementNext = (next = false) => {
        if (next) next.focus()
    }

    return (
        <div className="body">
            <div className="row">
                <label className="field-select">
                    <span>
                        <span className="important">ชื่อชนิดพืช</span>
                        {ErrReport ?
                            <span className="err-text-overlape">พืชซ้ำ</span>
                            : <></>
                        }
                    </span>
                    <input onChange={(e) => CheckEdit(e.target.value, "name")}
                        onKeyDown={(e) => InputKeyDownNext(e, typeInsert.current)}
                        placeholder="เช่น เมล่อน" defaultValue={Data.name}></input>
                </label>
                <label className="field-select">
                    <span className="important">ประเภท</span>
                    <select ref={typeInsert} onChange={(e) => {
                        CheckEdit(e.target.value, "type_plant")
                        SelectElementNext(DateQtyInsert.current)
                    }
                    } defaultValue={Data.type_plant}>
                        <option disabled value={""}>เลือกประเภท</option>
                        <option value={"พืชผัก"}>พืชผัก</option>
                        <option value={"ผลไม้"}>ผลไม้</option>
                        <option value={"สมุนไพร"}>สมุนไพร</option>
                        <option value={"ไม้ดอก"}>ไม้ดอก</option>
                        <option value={"ไม้ผล"}>ไม้ผล</option>
                        <option value={"กัญชง"}>กัญชง</option>
                        <option value={"กัญชา"}>กัญชา</option>
                    </select>
                </label>
                <label className="field-select">
                    <span>
                        <span className="important">ชื่อชนิดพืช</span>
                        {ErrReport ?
                            <span className="err-text-overlape">พืชซ้ำ</span>
                            : <></>
                        }
                    </span>
                    <input onChange={(e) => CheckEdit(e.target.value, "variety_name")}
                        onKeyDown={(e) => InputKeyDownNext(e, typeInsert.current)}
                        placeholder="เช่น เมล่อน" defaultValue={Data.variety_name}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span className="important">จำนวนวันที่คาดว่าจะเก็บเกี่ยว</span>
                    <input onInput={(e) => parseInt(e.target.value) <= 0 ? e.target.value = "" : null}
                        ref={DateQtyInsert} defaultValue={Data.qty_harvest}
                        onChange={(e) => CheckEdit(e.target.value, "qty_harvest")} placeholder="เช่น 10 30" type="number"></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span>เหตุผลที่แก้ไข</span>
                    <input placeholder="ระบุเหตุผล (ถ้ามี)" type="text" autoComplete="off" onChange={(e) => setBecause(e.target.value)} />
                </label>
            </div>
        </div>
    )
}

//
const Detailpest = ({ Data }) => {
    return (
        <div className="body">
            <div className="row">
                <label className="field-select">
                    <span>
                        <span>ชื่อโรคพืช / ศัตรูพืช</span>
                    </span>
                    <input readOnly defaultValue={Data.pest_name}></input>
                </label>
                <label className="field-select">
                    <span>ประเภท</span>
                    <select disabled defaultValue={Data.type_pest}>
                        <option disabled value={""}>เลือกประเภท</option>
                        <option value={"โรคพืช"}>โรคพืช</option>
                        <option value={"ศัตรูพืช"}>ศัตรูพืช</option>
                    </select>
                </label>
            </div>
        </div>
    )
}

const Editpest = ({ CheckEdit, Data, ErrReport, setBecause }) => {
    const typeInsert = useRef()
    const DateQtyInsert = useRef()

    const SelectElementNext = (next = false) => {
        if (next) next.focus()
    }

    return (
        <div className="body">
            <div className="row">
                <label className="field-select">
                    <span>
                        <span className="important">ชื่อชนิดพืช</span>
                        {ErrReport ?
                            <span className="err-text-overlape">พืชซ้ำ</span>
                            : <></>
                        }
                    </span>
                    <input onChange={(e) => CheckEdit(e.target.value, "name")}
                        onKeyDown={(e) => InputKeyDownNext(e, typeInsert.current)}
                        placeholder="เช่น เมล่อน" defaultValue={Data.pest_name}></input>
                </label>
                <label className="field-select">
                    <span className="important">ประเภท</span>
                    <select ref={typeInsert} onChange={(e) => {
                        CheckEdit(e.target.value, "type_pest")
                        SelectElementNext(DateQtyInsert.current)
                    }
                    } defaultValue={Data.type_pest}>
                        <option disabled value={""}>เลือกประเภท</option>
                        <option value={"โรคพืช"}>โรคพืช</option>
                        <option value={"ศัตรูพืช"}>ศัตรูพืช</option>
                    </select>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span>เหตุผลที่แก้ไข</span>
                    <input placeholder="ระบุเหตุผล (ถ้ามี)" type="text" autoComplete="off" onChange={(e) => setBecause(e.target.value)} />
                </label>
            </div>
        </div>
    )
}

//
const DetailFertilizer = ({ Data }) => {
    return (
        <div className="body">
            <div className="row">
                <label className="field-select">
                    <span>
                        <span>ชื่อปัจจัยการผลิต/ตรา</span>
                    </span>
                    <input readOnly defaultValue={Data.name}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span>สูตรปุ๋ย</span>
                    <div className="box-input-number">
                        <input readOnly defaultValue={Data.name_formula.split("-")[0]}></input>
                        <span>-</span>
                        <input readOnly defaultValue={Data.name_formula.split("-")[1]}></input>
                        <span>-</span>
                        <input readOnly defaultValue={Data.name_formula.split("-")[2]}></input>
                    </div>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span>วิธีการใช้</span>
                    <input readOnly defaultValue={Data.how_use}></input>
                </label>
            </div>
        </div>
    )
}
const EditFertilizer = ({ CheckEdit, Data, ErrReport, setBecause }) => {
    const formulaFertilizer = [useRef(), useRef(), useRef()]
    const UseText = useRef()

    const setMaxText = (e, max, typeElementNext = "") => {
        e.target.value = e.target.value.slice(0, max)
        if (typeElementNext) {
            if (e.target.value.length === max) {
                let next = e.target.nextElementSibling
                if (next) {
                    while (next.tagName != typeElementNext) {
                        next = next.nextElementSibling
                    }
                    next.focus()
                }
            }
        }
    }

    const ConvertFormula = () => {
        const formula = `${formulaFertilizer[0].current.value}-${formulaFertilizer[1].current.value}-${formulaFertilizer[2].current.value}`
        if (formulaFertilizer[0].current.value && formulaFertilizer[1].current.value && formulaFertilizer[2].current.value)
            CheckEdit(formula, "name_formula")
        else CheckEdit("", "name_formula")
    }

    return (
        <div className="body">
            <div className="row">
                <label className="field-select">
                    <span>
                        <span className="important">ชื่อปัจจัยการผลิต/ตรา</span>
                        {ErrReport ?
                            <span className="err-text-overlape">ปุ๋ยซ้ำ</span>
                            : <></>
                        }
                    </span>
                    <input onChange={(e) => CheckEdit(e.target.value, "name")}
                        onKeyDown={(e) => InputKeyDownNext(e, formulaFertilizer[0].current)}
                        placeholder="เช่น กระต่าย" defaultValue={Data.name}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span className="important">สูตรปุ๋ย</span>
                    <div className="box-input-number">
                        <input ref={formulaFertilizer[0]} defaultValue={Data.name_formula.split("-")[0]} onKeyDown={(e) => InputKeyDownNext(e, formulaFertilizer[1].current)} onChange={ConvertFormula} placeholder="ตัวเลข" onInput={(e) => setMaxText(e, 2, "INPUT")} type="number"></input>
                        <span>-</span>
                        <input ref={formulaFertilizer[1]} defaultValue={Data.name_formula.split("-")[1]} onKeyDown={(e) => InputKeyDownNext(e, formulaFertilizer[2].current, formulaFertilizer[0].current)} onChange={ConvertFormula} placeholder="ตัวเลข" onInput={(e) => setMaxText(e, 2, "INPUT")} type="number"></input>
                        <span>-</span>
                        <input ref={formulaFertilizer[2]} defaultValue={Data.name_formula.split("-")[2]} onKeyDown={(e) => InputKeyDownNext(e, UseText.current, formulaFertilizer[1].current)} onChange={ConvertFormula} placeholder="ตัวเลข" onInput={(e) => setMaxText(e, 2, "INPUT")} type="number"></input>
                    </div>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span className="important">วิธีการใช้</span>
                    <input ref={UseText} onChange={(e) => CheckEdit(e.target.value, "how_use")} placeholder="เช่น หว่านโคนต้น" defaultValue={Data.how_use}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span>เหตุผลที่แก้ไข</span>
                    <input placeholder="ระบุเหตุผล (ถ้ามี)" type="text" autoComplete="off" onChange={(e) => setBecause(e.target.value)} />
                </label>
            </div>
        </div>
    )
}

const DetailChemical = ({ Data }) => {
    return (
        <div className="body">
            <div className="row">
                <label className="field-select">
                    <span>
                        <span>ชื่อสารเคมี</span>
                    </span>
                    <input readOnly defaultValue={Data.name}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span>ชื่อสามัญสารเคมี</span>
                    <input readOnly defaultValue={Data.name_formula}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select not1">
                    <span>วิธีการใช้</span>
                    <input readOnly defaultValue={Data.how_use}></input>
                </label>
                <label className="field-select not1">
                    <span className="important ab">จำนวนวันปลอดภัย</span>
                    <input readOnly defaultValue={Data.date_safe_list}></input>
                </label>
            </div>
        </div>
    )
}

const EditChemical = ({ CheckEdit, Data, ErrReport, setBecause }) => {
    const formulaChemical = useRef()
    const UseText = useRef()
    const DateQtyInsert = useRef()

    return (
        <div className="body">
            <div className="row">
                <label className="field-select">
                    <span>
                        <span className="important">ชื่อสารเคมี</span>
                        {ErrReport ?
                            <span className="err-text-overlape">สารเคมีซ้ำ</span>
                            : <></>
                        }
                    </span>
                    <input onChange={(e) => CheckEdit(e.target.value, "name")}
                        onKeyDown={(e) => InputKeyDownNext(e, formulaChemical.current)}
                        placeholder="เช่น พรีวาธอน" defaultValue={Data.name}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span className="important">ชื่อสามัญสารเคมี</span>
                    <input ref={formulaChemical} onChange={(e) => CheckEdit(e.target.value, "name_formula")} onKeyDown={(e) => InputKeyDownNext(e, UseText.current)} placeholder="เช่น " defaultValue={Data.name_formula}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select not1">
                    <span className="important">วิธีการใช้</span>
                    <input ref={UseText} onChange={(e) => CheckEdit(e.target.value, "how_use")} onKeyDown={(e) => InputKeyDownNext(e, DateQtyInsert.current)} placeholder="เช่น ฉีดพ้น" defaultValue={Data.how_use}></input>
                </label>
                <label className="field-select not1">
                    <span className="important ab">จำนวนวันปลอดภัย</span>
                    <input onInput={(e) => parseInt(e.target.value) <= 0 ? e.target.value = "" : null}
                        ref={DateQtyInsert}
                        onChange={(e) => CheckEdit(e.target.value, "date_safe_list")} placeholder="เช่น 10 30" type="number" defaultValue={Data.date_safe_list}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span>เหตุผลที่แก้ไข</span>
                    <input placeholder="ระบุเหตุผล (ถ้ามี)" type="text" autoComplete="off" onChange={(e) => setBecause(e.target.value)} />
                </label>
            </div>
        </div>
    )
}


const DetailSource = ({ Data }) => {
    return (
        <div className="body">
            <div className="row">
                <label className="field-select">
                    <span>
                        <span>ชื่อแหล่งที่ซื้อ</span>
                    </span>
                    <input readOnly defaultValue={Data.name}></input>
                </label>
            </div>
            {Data.location != null ?
                <div className="row">
                    <label className="field-select">
                        <MapsJSX lat={Data.location.x} lng={Data.location.y} w={"100%"} h={"150px"} />
                    </label>
                </div> : <></>
            }
        </div>
    )
}
const EditSource = ({ CheckEdit, Data, ErrReport, setBecause }) => {
    const [Lag, setLag] = useState(Data.location ? Data.location.x : 0)
    const [Lng, setLng] = useState(Data.location ? Data.location.y : 0)

    const nameInsert = useRef()
    const InputUrl = useRef()

    const GenerateMap = async (e) => {
        let valueLocation = await GetLinkUrlOfSearch(e.target.value, "doctor")

        if (!isNaN(valueLocation[0]) && !isNaN(valueLocation[1])) {
            setLag(valueLocation[0])
            setLng(valueLocation[1])
            ConvertLocation(valueLocation[0], valueLocation[1])
        } else {
            setLag(0)
            setLng(0)
            ConvertLocation(0, 0)
        }

        // let Location = valueLocation.split("/").filter((val)=>val.indexOf("data") >= 0)
        // if(Location[0]) {
        //     Location = Location[0].split("!").filter((val)=>val.indexOf("3d") >= 0 || val.indexOf("4d") >= 0).reverse().slice(0 , 2)
        // }
        // if(Location.length == 2) {
        //     let lag = Location[1].split(".")
        //     lag[0] = lag[0].replace("3d" , "")
        //     for(let x=7; x>=4 ; x--) {
        //         lag[1] = lag[1].slice(0 , x)
        //         if(!isNaN(lag[1])) break
        //     }

        //     let lng = Location[0].split(".")
        //     lng[0] = lng[0].replace("4d" , "")
        //     for(let x=7; x>=4 ; x--) {
        //         lng[1] = lng[1].slice(0 , x)
        //         if(!isNaN(lng[1])) break
        //     }

        //     const Lagitude = lag.join(".")
        //     const Longitude = lng.join(".")
        //     if(!isNaN(Lagitude) && !isNaN(Longitude)) {
        //         setLag(Lagitude)
        //         setLng(Longitude)
        //         ConvertLocation(Lagitude , Longitude)
        //     }
        // } else {
        //     setLag(0)
        //     setLng(0)
        //     ConvertLocation(0 , 0)
        // }
    }

    const ConvertLocation = (lag, lng) => {
        if (lag && lng)
            CheckEdit(`POINT(${lag} ${lng})`, "location")
        else CheckEdit("0", "location")
    }

    return (
        <div className="body">
            <div className="row">
                <label className="field-select">
                    <span>
                        <span className="important">ชื่อแหล่งที่ซื้อ</span>
                        {ErrReport ?
                            <span className="err-text-overlape">แหล่งซื้อซ้ำ</span>
                            : <></>
                        }
                    </span>
                    <input ref={nameInsert} onChange={(e) => CheckEdit(e.target.value, "name")}
                        onKeyDown={(e) => InputKeyDownNext(e, "")}
                        placeholder="เช่น สหกรณ์แม่เตียน" defaultValue={Data.name}></input>
                </label>
            </div>
            <div className="row">
                <label className="field-select">
                    <span>ตำแหน่งใน Google Map</span>
                    <input ref={InputUrl} placeholder="url/แชร์จาก google map" onInput={GenerateMap} type="search"
                        defaultValue={Lag && Lng ? `https://www.google.co.th/maps/place/${Lag.toString().split(".")[0]}%C2%B002'14.2%22N+${Lng.toString().split(".")[0]}%C2%B043'36.0%22E/@${Lag},${Lng},17z/data=!3m1!4b1!4m4!3m3!8m2!3d${Lag}!4d${Lng}?entry=ttu` : ""}></input>
                </label>
            </div>
            {Lag && Lng ?
                <div className="row">
                    <label className="field-select">
                        <MapsJSX lat={Lag} lng={Lng} w={"100%"} h={"150px"} />
                    </label>
                </div> : <></>
            }
            <div className="row">
                <label className="field-select">
                    <span>เหตุผลที่แก้ไข</span>
                    <input placeholder="ระบุเหตุผล (ถ้ามี)" type="text" autoComplete="off" onChange={(e) => setBecause(e.target.value)} />
                </label>
            </div>
        </div>
    )
}

const InputKeyDownNext = (e, next = false, previous = false) => {
    if (e.keyCode === 13 && next && e.target.value) next.focus()
    else if (e.keyCode === 8 && previous && !e.target.value) {
        e.preventDefault();
        previous.focus()
    }
}

export default ManageData