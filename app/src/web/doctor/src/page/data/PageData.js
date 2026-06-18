import React, { createContext, useEffect, useRef, useState } from "react"; import { clientMo } from "../../../../../assets/js/moduleClient";
import "../../assets/style/TemplantList.scss"
import "../../assets/style/page/data/PageData.scss"
import { DayJSX, LoadOtherDom, LoadOtherOffset, Loading, MapsJSX, PopupDom } from "../../../../../assets/js/module";
import { InsertChemical, InsertFertilizer, InsertPlant, InsertSource, InsertPest } from "./Insert/InsertPage";
import { SearchChemical, SearchFertilizer, SearchPlant, SearchPest } from "./search/SearchPage";
import PopupConfirm from "./Insert/ConfirmInsert";
import ManageData from "./ManageData";
import InsertGroup from "../group/InsertGroup";
import InsertReport from "../report/InsertReport";
import PageGroup from "../group/PageGroup";
import InsertGraph from "../report/InsertGraph";
import InsertStatistics, { InsertStatisticsProvider } from "../report/statistics/InsertStatistics";
import ReportListLocation from "../report/report";

const MaxLimit = 5

export const PageDataContext = createContext({
    popupDataManage: {
        open: false,
        type: "",
        metadata: {
            id: ""
        }
    },
    setPopupDataManage: () => ({ open: false, type: "" }),
    ChangeStatus: (status) => { },
    textSearch: ""
})

const PageData = ({ setMain, session, socket, type = false, eleImageCover, LoadType, eleBody, setTextStatus }) => {
    // const [Body , setBody] = useState(<></>)
    const [Loading, setLoading] = useState(false)
    // const [statusPage , setStatus] = useState({
    //     status : LoadType.split(":")[0],
    //     open : type
    // })

    const [popupDataManage, setPopupDataManage] = useState({
        open: false,
        type: "",
        metadata: {
            id: ""
        }
    })

    const [TypeSelectMenu, setTypeSelectMenu] = useState(0)
    const [DataProcess, setDataProcess] = useState(new Map([
        ["type", LoadType.split(":")[0]], //Loadtype 0 : plant , 1 : ferti , 2 : chemi , 3 : source
        // ["search" , ""] ,
        ["statusClick", type]
    ]))
    const [ErrReport, setErrReport] = useState(false)
    const [StateOnInsert, setStateOnInsert] = useState(false)

    const [StartData, setStartData] = useState(0)
    const [Limit, setLimit] = useState(MaxLimit)
    const [Reload, setReload] = useState(2)
    const [viewMode, setViewMode] = useState("card") // "card" | "table"


    const Search = useRef()
    const SearchInput = useRef()
    const [textSearch, setTextSearch] = useState("")
    const [textSearchValue, setTextSearchValue] = useState("")
    const TextSearchRef = useRef()
    const SelectType = useRef()
    const Other = useRef()

    const nameInsert = useRef()
    const typeInsert = useRef()
    const speciesInsert = useRef()
    const DateQtyInsert = useRef()

    const formulaFertilizer = [useRef(), useRef(), useRef()]
    const formulaChemical = useRef()

    const position = [useRef(), useRef()]

    const UseText = useRef()
    const SubmitInsert = useRef()

    //popup
    const RefPopup = useRef()
    const [BodyPopup, setBodyPopup] = useState(<></>)

    useEffect(() => {
        eleImageCover.current.style.height = "30%"
        eleBody.current.style.height = "70%"
        clientMo.unLoadingPage()

        setDataProcess(new Map([
            ["type", LoadType.split(":")[0]],
            ["statusClick", LoadType.split(":")[1] === "pop" ? false : type]
        ]))
    }, [LoadType])

    const OpenOption = (Ref, option, isSearchButton = false) => {
        setTypeSelectMenu(prev => {
            const isSameOption = prev === option;

            // ไม่เรียก setPopupDataManage ถ้าเป็นปุ่มค้นหา
            if (!isSearchButton) {
                setPopupDataManage({ open: true, type: "insert" });
            }

            // ตรวจสอบ Ref ก่อนเรียก toggleAttribute
            if (Ref?.current) {
                if (isSameOption) {
                    Ref.current.toggleAttribute("show");
                } else if (!Ref.current.hasAttribute("show")) {
                    Ref.current.setAttribute("show", "");
                }
            }

            return option;
        });
    };


    const searchList = (target, value, keyMap) => {
        const DataSelect = new Map([...DataProcess])
        // if(target === SelectType.current) SelectType.current.value = 
        DataSelect.set(keyMap, value)
        if (!value) DataSelect.delete(keyMap)

        setTextSearch(value)
        if (target === SelectType.current) {
            DataSelect.set("statusClick", true)
            if (!TypeSelectMenu) {
                setTextSearch("")
            }
            else {
                SubmitInsert.current.setAttribute("no", "")
            }
            setStartData(0)
            setErrReport(false)
            DataSelect.forEach((val, key) => {
                if (key != "statusClick" && key != "type") DataSelect.delete(key)
            })
        }
        else DataSelect.set("statusClick", false)
        console.log(DataSelect)
        setDataProcess(new Map([
            ...DataSelect
        ]))
    }

    // insert
    const CheckInsert = () => {
        const value = DataProcess.get("type") === "plant" ?
            [nameInsert.current.value, typeInsert.current.value, DateQtyInsert.current.value, speciesInsert.current.value] :
            DataProcess.get("type") === "fertilizer" ?
                [
                    nameInsert.current.value,
                    formulaFertilizer[0].current.value,
                    formulaFertilizer[1].current.value,
                    formulaFertilizer[2].current.value,
                    UseText.current.value
                ] :
                DataProcess.get("type") === "chemical" ?
                    [
                        nameInsert.current.value,
                        formulaChemical.current.value,
                        UseText.current.value,
                        DateQtyInsert.current.value
                    ] :
                    DataProcess.get("type") === "source" ?
                        [
                            nameInsert.current.value
                        ] :
                        DataProcess.get("type") === "pest" ?
                            [
                                nameInsert.current.value,
                                typeInsert.current.value
                            ] : []

        if (value.filter(val => !val).length == 0) {
            SubmitInsert.current.removeAttribute("no")
            return (
                DataProcess.get("type") === "plant" ?
                    {
                        data:
                        {
                            name: nameInsert.current.value,
                            type_plant: typeInsert.current.value,
                            varietie: {
                                name: speciesInsert.current.value,
                                qty_harvest: parseInt(DateQtyInsert.current.value)
                            },
                            qty_harvest: parseInt(DateQtyInsert.current.value)
                        },
                        check: {
                            name: nameInsert.current.value,
                            variety_name: speciesInsert.current.value
                        },
                        type: "plant"
                    } :
                    DataProcess.get("type") === "fertilizer" ?
                        {
                            data:
                            {
                                name: nameInsert.current.value,
                                name_formula: `${formulaFertilizer[0].current.value}-${formulaFertilizer[1].current.value}-${formulaFertilizer[2].current.value}`,
                                how_use: UseText.current.value
                            },
                            check: {
                                name: nameInsert.current.value,
                                name_formula: `${formulaFertilizer[0].current.value}-${formulaFertilizer[1].current.value}-${formulaFertilizer[2].current.value}`
                            },
                            type: "fertilizer"
                        } :
                        DataProcess.get("type") === "chemical" ?
                            {
                                data:
                                {
                                    name: nameInsert.current.value,
                                    name_formula: formulaChemical.current.value,
                                    how_use: UseText.current.value,
                                    date_safe_list: DateQtyInsert.current.value
                                },
                                check: {
                                    name: nameInsert.current.value,
                                    name_formula: formulaChemical.current.value
                                },
                                type: "chemical"
                            } :
                            DataProcess.get("type") === "source" ?
                                {
                                    data:
                                    {
                                        name: nameInsert.current.value,
                                        location: position[0].current.value != 0 && position[1].current.value != 0 ? `POINT(${position[0].current.value} ${position[1].current.value})` : null
                                    },
                                    check: {
                                        name: nameInsert.current.value
                                    },
                                    type: "source"
                                } :
                                DataProcess.get("type") === "pest" ?
                                    {
                                        data:
                                        {
                                            pest_name: nameInsert.current.value,
                                            type_pest: typeInsert.current.value,

                                        },
                                        check: {
                                            pest_name: nameInsert.current.value
                                        },
                                        type: "pest"
                                    } : []
            )
        } else {
            SubmitInsert.current.setAttribute("no", "")
            return false
        }
    }

    const SubmitConfirmInsert = async () => {
        const Data = CheckInsert()
        if (Data) {
            const result = await clientMo.post(`/api/doctor/data/check/overlape`, Data)
            if (parseInt(result) === 0) {
                setBodyPopup(<PopupConfirm Ref={RefPopup} setPopup={setBodyPopup} session={session} Data={Data} RowPresent={StartData} setLimit={setLimit} Reload={Reload} setReload={setReload} setCloseInsert={CancelInsert} />)
                setErrReport(false)
            } else if (parseInt(result) === 1) {
                setStateOnInsert(!StateOnInsert)
                setErrReport(true)
            } else session()
        }
    }

    const CancelInsert = () => {
        setStateOnInsert(!StateOnInsert)
        SubmitInsert.current.setAttribute("no", "")
        Search.current.removeAttribute("show")
    }

    // const searchRef = DataProcess.get("type") !== "group" ? Search : null;

    console.log("Current type:", DataProcess.get("type"));

    return (
        <PageDataContext.Provider
            value={{
                setPopupDataManage,
                popupDataManage,
                textSearch
            }}
        >
            <section className="data-list-content-page data-page">

                {(DataProcess.get("type") === "report" || DataProcess.get("type") === "listlocation" || DataProcess.get("type") === "graph" || DataProcess.get("type") === "statistics") && (
                    <div className="report-header-bar">
                        <select className="report-menu"
                            onChange={(e) => { searchList(e.target, e.target.value, "type"); }} ref={SelectType} value={DataProcess.get("type")}>
                            <option value="listlocation">รายชื่อหมอพืชและที่ปรึกษาเกษตรกร</option>
                            <option value="graph">จำนวนเกษตรกรและพืชที่เพาะปลูกในพื้นที่</option>
                            <option value="statistics">สถิติโรคพืช / ศัตรูพืช</option>
                        </select>
                        <div className="search">
                            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
                                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                                    <path d="m11.25 11.25l3 3"/>
                                    <circle cx="7.5" cy="7.5" r="4.75"/>
                                </g>
                            </svg>
                            <input
                                value={textSearchValue}
                                autoComplete="none"
                                ref={TextSearchRef}
                                onChange={(e) => setTextSearchValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setTextSearch(e.target.value);
                                    }
                                }}
                                type="text"
                                placeholder="Search"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" onClick={() => {
                                setTextSearch("");
                                setTextSearchValue("");
                                if (TextSearchRef.current) TextSearchRef.current.value = "";
                            }} width="1em" height="1em" viewBox="0 0 32 32">
                                <path fill="currentColor" d="M16 2C8.2 2 2 8.2 2 16s6.2 14 14 14s14-6.2 14-14S23.8 2 16 2zm5.4 21L16 17.6L10.6 23L9 21.4l5.4-5.4L9 10.6L10.6 9l5.4 5.4L21.4 9l1.6 1.6l-5.4 5.4l5.4 5.4l-1.6 1.6z"/>
                            </svg>
                        </div>
                    </div>
                )}

                {
                    !(["report", "listlocation", "graph", "statistics"].includes(DataProcess.get("type"))) && (
                    <div className="search-form" ref={Search}>
                        <div className="bt-select-option">
                            {
                                (DataProcess.get("type") !== "report" && DataProcess.get("type") !== "listlocation" && DataProcess.get("type") !== "graph" && DataProcess.get("type") !== "statistics" && DataProcess.get("type") !== "group") &&
                                <a title={viewMode === "card" ? "แสดงแบบตาราง" : "แสดงแบบการ์ด"} className="bt-search-show" onClick={() => setViewMode(prev => prev === "card" ? "table" : "card")}>
                                    {viewMode === "card" ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                                            <path d="M3 9h18M3 15h18M9 3v18"/>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="7" height="7" rx="1"/>
                                            <rect x="14" y="3" width="7" height="7" rx="1"/>
                                            <rect x="3" y="14" width="7" height="7" rx="1"/>
                                            <rect x="14" y="14" width="7" height="7" rx="1"/>
                                        </svg>
                                    )}
                                </a>
                            }
                            {
                                (DataProcess.get("type") !== "report" && DataProcess.get("type") !== "listlocation" && DataProcess.get("type") !== "graph" && DataProcess.get("type") !== "statistics" && DataProcess.get("type") !== "group") &&
                                <a title="เพิ่มข้อมูล" className="bt-search-show" onClick={() => OpenOption(Search, 1)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 8v8M8 12h8"/>
                                    </svg>
                                </a>
                            }
                            {
                                (DataProcess.get("type") === "group") &&
                                <a title="เพิ่มข้อมูล" className="bt-search-show" onClick={() => OpenOption()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 8v8M8 12h8"/>
                                    </svg>
                                </a>
                            }
                            <a title="ค้นหา" className="bt-search-show" onClick={() => { OpenOption(Search, 0, true); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="7"/>
                                    <path d="m21 21-4.35-4.35"/>
                                </svg>
                            </a>
                        </div>

                        <div className="content-option">
                            <div className="field-option">
                                {
                                    DataProcess.get("type") !== "group" && DataProcess.get("type") !== "report" && DataProcess.get("type") !== "listlocation" && DataProcess.get("type") !== "graph" && DataProcess.get("type") !== "statistics" &&
                                    <div className="row head-row">
                                        <label className="field-select">
                                            <span>ชนิดข้อมูล</span>
                                            <select onChange={(e) => {
                                                searchList(e.target, e.target.value, "type")
                                                e.target.value = SelectType.current.value
                                            }} ref={SelectType} value={DataProcess.get("type")}>
                                                <option value={"plant"}>ชนิดพืช</option>
                                                <option value={"pest"}>โรคพืช / ศัตรูพืช</option>
                                                <option value={"fertilizer"}>ปัจจัยการผลิต</option>
                                                <option value={"chemical"}>สารเคมี</option>
                                                <option value={"source"}>แหล่งที่ซื้อ</option>
                                            </select>
                                        </label>
                                    </div>
                                }
                                {!TypeSelectMenu ?
                                    <>
                                        <span className="head">
                                            ค้นหา{
                                                DataProcess.get("type") === "plant" ? "พืช" :
                                                    DataProcess.get("type") === "pest" ? "โรคพืช / ศัตรูพืช" :
                                                        DataProcess.get("type") === "fertilizer" ? "ปัจจัยการผลิต" :
                                                            DataProcess.get("type") === "chemical" ? "สารเคมี" :
                                                                DataProcess.get("type") === "source" ? "แหล่งที่ซื้อ" : ""
                                            }</span>
                                        <div className="row">
                                            <input
                                                onChange={(e) =>
                                                    searchList(e.target, e.target.value,
                                                        DataProcess.get("type") === "pest" ?
                                                            "pest_name" :
                                                            "name"
                                                    )
                                                }
                                                type="search"
                                                value={textSearch}
                                                placeholder={
                                                    DataProcess.get("type") === "plant" ? "ชื่อพืช เช่น เมล่อน" :
                                                        DataProcess.get("type") === "pest" ? "โรคพืช / ศัตรูพืช" :
                                                            DataProcess.get("type") === "fertilizer" ? "ชื่อปุ๋ย/ตรา เช่น กระต่าย" :
                                                                DataProcess.get("type") === "chemical" ? "ชื่อสารเคมี เช่น พรีวาธอน" :
                                                                    DataProcess.get("type") === "source" ? "แหล่งที่ซื่อ เช่น สหกรณ์แม่เตียน" : ""
                                                }
                                                defaultValue={DataProcess.get("name")}
                                            />
                                        </div>
                                        {
                                            DataProcess.get("type") === "plant" ?
                                                <SearchPlant searchList={searchList} DataProcess={DataProcess} />
                                                :
                                                DataProcess.get("type") === "pest" ?
                                                    <SearchPest searchList={searchList} DataProcess={DataProcess} />
                                                    :
                                                    DataProcess.get("type") === "fertilizer" ?
                                                        <SearchFertilizer searchList={searchList} DataProcess={DataProcess} />
                                                        :
                                                        DataProcess.get("type") === "chemical" ?
                                                            <SearchChemical searchList={searchList} DataProcess={DataProcess} />
                                                            : <></>
                                        }
                                    </>
                                    :
                                    <>
                                        {
                                            DataProcess.get("type") !== "group" &&
                                            <span className="head">
                                                เพิ่ม{
                                                    DataProcess.get("type") === "plant" ? "ชนิดพืช" :
                                                        DataProcess.get("type") === "pest" ? "โรคพืช / ศัตรูพืช" :
                                                            DataProcess.get("type") === "fertilizer" ? "ปัจจัยการผลิต" :
                                                                DataProcess.get("type") === "chemical" ? "สารเคมี" :
                                                                    DataProcess.get("type") === "source" ? "แหล่งที่ซื้อ" : ""
                                                }
                                            </span>
                                        }
                                        {
                                            DataProcess.get("type") === "plant" ?
                                                <InsertPlant nameInsert={nameInsert} typeInsert={typeInsert} speciesInsert={speciesInsert} DateQtyInsert={DateQtyInsert} ErrReport={ErrReport} CheckInsert={CheckInsert} stateOn={StateOnInsert} />
                                                :
                                                DataProcess.get("type") === "pest" ?
                                                    <InsertPest nameInsert={nameInsert} typeInsert={typeInsert} ErrReport={ErrReport} CheckInsert={CheckInsert} stateOn={StateOnInsert} />
                                                    :
                                                    DataProcess.get("type") === "fertilizer" ?
                                                        <InsertFertilizer nameInsert={nameInsert} formulaFertilizer={formulaFertilizer} UseText={UseText} ErrReport={ErrReport} CheckInsert={CheckInsert} stateOn={StateOnInsert} />
                                                        :
                                                        DataProcess.get("type") === "chemical" ?
                                                            <InsertChemical nameInsert={nameInsert} formulaChemical={formulaChemical} UseText={UseText} DateQtyInsert={DateQtyInsert} ErrReport={ErrReport} CheckInsert={CheckInsert} stateOn={StateOnInsert} />
                                                            :
                                                            DataProcess.get("type") === "source" ?
                                                                <InsertSource nameInsert={nameInsert} position={position} ErrReport={ErrReport} CheckInsert={CheckInsert} stateOn={StateOnInsert} />
                                                                :
                                                                // DataProcess.get("type") === "group" ?
                                                                //         <Modal
                                                                //             show={popupDataManage.open}s
                                                                //             onHide={() => setPopupDataManage({
                                                                //                 open : false
                                                                //             })}
                                                                //             aria-labelledby="modal-title"
                                                                //             aria-describedby="modal-description"
                                                                //             centered
                                                                //             size="lg"
                                                                //         >
                                                                //             <InsertGroup/>
                                                                //         </Modal>
                                                                // :
                                                                <></>
                                        }
                                        {
                                            DataProcess.get("type") !== "group" &&
                                            <div className="bt-insert">
                                                <button className="cancel" onClick={CancelInsert}>ยกเลิก</button>
                                                <button className="submit" no="" ref={SubmitInsert} onClick={SubmitConfirmInsert}>ยืนยัน</button>
                                            </div>
                                        }
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                )}
                <div className="data-list-content">
                    {
                        DataProcess.get("type") === "group" ?
                            <PageGroup /> :
                            DataProcess.get("type") === "report" ?
                                <InsertReport /> :
                                DataProcess.get("type") === "graph" ?
                                    <InsertGraph /> :
                                    DataProcess.get("type") === "statistics" ?
                                        <InsertStatisticsProvider>
                                            <InsertStatistics />
                                        </InsertStatisticsProvider> :
                                        DataProcess.get("type") === "listlocation" ?
                                            <ReportListLocation /> :
                                            <List session={session} socket={socket} DataFillter={DataProcess} setTextStatus={setTextStatus} StartData={StartData} setStartData={setStartData} Limit={Limit} setLimit={setLimit} Reload={Reload} viewMode={viewMode} />
                    }
                    {
                        TypeSelectMenu ? <PopupDom Ref={RefPopup} Body={BodyPopup} zIndex={1001} /> : <></>
                    }
                </div>
            </section>
        </PageDataContext.Provider>
    )
}

const List = ({ session, socket, DataFillter, setTextStatus, StartData, setStartData, Limit, setLimit, Reload, viewMode }) => {
    const [Data, setData] = useState([])
    const [timeOut, setTimeOut] = useState()
    const [LoadingList, setLoadList] = useState(true)

    useEffect(() => {
        setLoadList(true)
        clearTimeout(timeOut)
        setTimeOut(setTimeout(() => {
            FetchList(0, Limit)
            setLimit(MaxLimit)
        }, 1500))
    }, [DataFillter, Reload])

    const FetchList = async (StartRow, Limit) => {
        try {
            let JsonData = {}
            let JsonCheck = {}
            DataFillter.forEach((data, key) => {
                if (key != "statusClick") {
                    if (key != "type") JsonCheck[key] = data
                    else JsonData[key] = data
                }
            })
            JsonData["check"] = JsonCheck
            JsonData["StartRow"] = StartRow
            JsonData["Limit"] = Limit ? Limit : MaxLimit;

            if (DataFillter.get("statusClick")) window.history.pushState({}, "", `/doctor/data${JsonData["type"] ? `?type=${JsonData["type"]}` : ""}`)

            const list = await clientMo.post(`/api/doctor/data/get`, JsonData)
            const data = JSON.parse(list)
            console.log(data, StartRow, Limit)

            if (StartRow !== 0) {
                setData([...Data, ...data])
                setStartData([...Data, ...data].length)
            } else {
                setData(data)
            }

            setLoadList(false)
            setTextStatus(["หน้าหลัก", "ข้อมูล",
                DataFillter.get("type") === "plant" ? "รายการชนิดพืช" :
                    DataFillter.get("type") === "fertilizer" ? "รายการปุ๋ย" :
                        DataFillter.get("type") === "chemical" ? "รายการสารเคมี" :
                            DataFillter.get("type") === "source" ? "รายการแหล่งที่ซื้อ" :
                                DataFillter.get("type") === "pest" ? "รายการโรคพืช / ศัตรูพืช" : ""
            ])
            return data
        } catch (e) {
            session()
        }
    }

    return (LoadingList ?
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
        }}>
            <Loading size={"45px"} border={"5px"} color="rgb(24 157 133)" animetion={true} />
        </div>
        :
        <ManageList Data={Data} session={session} fetch={FetchList} setRow={setStartData} Limit={Limit} Type={DataFillter.get("type")} viewMode={viewMode} />)
}

const ManageList = ({ Data, session, fetch, setRow, Limit, Type, variety, viewMode }) => {
    const [Body, setBody] = useState(<></>)
    const RefPop = useRef()
    const [PopBody, setPop] = useState(<></>)

    let refData = Data.map(() => React.createRef());

    useEffect(() => {
        refData = Data.map(() => React.createRef());
        ManageShow(Data)

        // window.addEventListener("resize" , Resize)

        // return () => {
        //     window.removeEventListener("resize" , Resize)
        // }
    }, [Data])

    // const Resize = () => ManageShow(Data)

    const ManageShow = (Data) => {
        if (Data.length !== 0) {
            const body = Data.map((DataIn, keyRow) => {
                const Ref = refData[keyRow]
                return (
                    <div key={keyRow} className="list-some-data-on-page"
                        ref={Ref} status={DataIn.is_use}
                    >
                        <div className="frame-data-list">
                            <div className="row">
                                <div className={`field-text ${Type === "source" ? "ell" : ""}`}>
                                    <span>
                                        {
                                            Type === "plant" ? "ชนิดพืช" :
                                                Type === "pest" ? <div className="field-text">
                                                    <span><div>ชื่อ {DataIn.type_pest}</div></span>
                                                    <div className="data-text">{DataIn.pest_name}</div>
                                                </div> :
                                                    Type === "fertilizer" ? "ชื่อปุ๋ย" :
                                                        Type === "chemical" ? "ชื่อสารเคมี" :
                                                            Type === "source" ? "แหล่งที่ซื้อ" : ""
                                        }
                                    </span>
                                    <div className="data-text">{DataIn.name}</div>
                                </div>
                                {
                                    Type === "plant" ?
                                        <div className="field-text">
                                            <span>ประเภท</span>
                                            <div className="data-text">{DataIn.type_plant}</div>
                                        </div>
                                        :
                                        Type === "pest" ?
                                            <>
                                                <div className="field-text">
                                                    <span></span>
                                                    <div className="data-text"></div>
                                                </div>
                                                <div className="field-text">
                                                    <span></span>
                                                    <div className="data-text"></div>
                                                </div>
                                            </> :
                                            Type === "fertilizer" ?
                                                <div className="field-text">
                                                    <span>สูตรปุ๋ย</span>
                                                    <div className="data-text">{DataIn.name_formula}</div>
                                                </div> :
                                                Type === "chemical" ?
                                                    <div className="field-text">
                                                        <span>วิธีการใช้</span>
                                                        <div className="data-text">{DataIn.how_use}</div>
                                                    </div> : <></>
                                }
                            </div>
                            {
                                Type === "plant" ?
                                    <div className="row">
                                        <div className="field-text max-box row-text">
                                            <span>สายพันธุ์พืช</span>
                                            <div className="data-text">{DataIn.variety_name || "ยังไม่ระบุ"}</div>
                                        </div>
                                        <div className="field-text max-box row-text">
                                            <span>จำนวนวันที่จะเก็บเกี่ยว</span>
                                            <div className="data-text">{DataIn.qty_harvest} วัน</div>
                                        </div>
                                        <a onClick={() => OpenManageData(DataIn)} className="frame-manage-list" title="จัดการข้อมูล">
                                            <svg viewBox="0 0 20 20">
                                                <path d="M19 4a1 1 0 01-1 1H2a1 1 0 010-2h16a1 1 0 011 1zm0 6a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-1 7a1 1 0 100-2H2a1 1 0 100 2h16z" />
                                            </svg>
                                        </a>
                                    </div> :
                                    Type === "pest" ?
                                        <div className="row">
                                            <div className="field-text max-box row-text">
                                                <span><br></br></span>
                                                <div className="data-text"></div>
                                            </div>
                                            <a onClick={() => OpenManageData(DataIn)} className="frame-manage-list position bottom" title="จัดการข้อมูล">
                                                <svg viewBox="0 0 20 20">
                                                    <path d="M19 4a1 1 0 01-1 1H2a1 1 0 010-2h16a1 1 0 011 1zm0 6a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-1 7a1 1 0 100-2H2a1 1 0 100 2h16z" />
                                                </svg>
                                            </a>
                                        </div> :
                                        Type === "fertilizer" ?
                                            <div className="row">
                                                <div className="field-text">
                                                    <span>วิธีการใช้</span>
                                                    <div className="data-text">{DataIn.how_use}</div>
                                                </div>
                                                <a onClick={() => OpenManageData(DataIn)} className="frame-manage-list position bottom" title="จัดการข้อมูล">
                                                    <svg viewBox="0 0 20 20">
                                                        <path d="M19 4a1 1 0 01-1 1H2a1 1 0 010-2h16a1 1 0 011 1zm0 6a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-1 7a1 1 0 100-2H2a1 1 0 100 2h16z" />
                                                    </svg>
                                                </a>
                                            </div> :
                                            Type === "chemical" ?
                                                <>
                                                    <div className="row">
                                                        <div className="field-text">
                                                            <span>ชื่อสามัญสารเคมี</span>
                                                            <div className="data-text">{DataIn.name_formula}</div>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="field-text row-text">
                                                            <span>จำนวนวันปลอดภัย</span>
                                                            <div className="data-text">{DataIn.date_safe_list} วัน</div>
                                                        </div>
                                                        <a onClick={() => OpenManageData(DataIn)} className="frame-manage-list position bottom" title="จัดการข้อมูล">
                                                            <svg viewBox="0 0 20 20">
                                                                <path d="M19 4a1 1 0 01-1 1H2a1 1 0 010-2h16a1 1 0 011 1zm0 6a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-1 7a1 1 0 100-2H2a1 1 0 100 2h16z" />
                                                            </svg>
                                                        </a>
                                                    </div>
                                                </>
                                                :
                                                Type === "source" ?
                                                    <div className="row">
                                                        {
                                                            DataIn.location ?
                                                                <div className="field-text">
                                                                    <MapsJSX lat={DataIn.location.x} lng={DataIn.location.y} w={"100%"} h={"80px"} />
                                                                </div> : <div className="not-map">ไม่พบตำแหน่ง</div>
                                                        }
                                                        <a onClick={() => OpenManageData(DataIn)} className="frame-manage-list position top" title="จัดการข้อมูล">
                                                            <svg viewBox="0 0 20 20">
                                                                <path d="M19 4a1 1 0 01-1 1H2a1 1 0 010-2h16a1 1 0 011 1zm0 6a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-1 7a1 1 0 100-2H2a1 1 0 100 2h16z" />
                                                            </svg>
                                                        </a>
                                                    </div> : <></>
                            }
                        </div>
                    </div>
                )
            })
            setBody(body)
        } else {
            setBody(
                <section>
                    <div>ไม่พบข้อมูล</div>
                </section>
            )
        }
    }

    const OpenManageData = async (DataIn) => {
        const context = await clientMo.post('/api/doctor/check')
        if (context)
            setPop(<ManageData Ref={RefPop} setPopup={setPop} DataOfPage={DataIn} Type={Type} Fetch={fetch} RowPresent={Data.length} session={session} />)
        else session()
    }

    return (
        <>
            <div className="body-page-content">
                {viewMode === "table" ? (
                    <>
                        <style>{`
                            .table-row-hover:hover {
                                background-color: #f5fbf9;
                            }
                            table th, table td {
                                text-align: center !important;
                                vertical-align: middle !important;
                            }
                            .manage-btn {
                                background-color: #F5E642;
                                color: #333;
                                border: none;
                                border-radius: 20px;
                                padding: 6px 14px;
                                font-family: "Sans-font";
                                font-size: 15px;
                                font-weight: 700;
                                cursor: pointer;
                                white-space: nowrap;
                            }
                            .manage-btn:hover {
                                background-color: #e0d13b;
                            }
                        `}</style>
                        <div className="table-responsive" style={{ width: "100%", overflowX: "auto", marginTop: "10px", padding: "0 10px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#189D85", color: "white", textAlign: "center", fontSize: "17px" }}>
                                        {Type === "plant" && (
                                            <>
                                                <th style={{ padding: "16px 20px" }}>ชนิดพืช</th>
                                                <th style={{ padding: "16px 20px" }}>ประเภท</th>
                                                <th style={{ padding: "16px 20px" }}>สายพันธุ์พืช</th>
                                                <th style={{ padding: "16px 20px" }}>จำนวนวันที่จะเก็บเกี่ยว</th>
                                                <th style={{ padding: "16px 20px" }}>จัดการข้อมูล</th>
                                            </>
                                        )}
                                        {Type === "pest" && (
                                            <>
                                                <th style={{ padding: "16px 20px" }}>ชื่อโรคพืช / ศัตรูพืช</th>
                                                <th style={{ padding: "16px 20px" }}>ประเภท</th>
                                                <th style={{ padding: "16px 20px" }}>จัดการข้อมูล</th>
                                            </>
                                        )}
                                        {Type === "fertilizer" && (
                                            <>
                                                <th style={{ padding: "16px 20px" }}>ชื่อปุ๋ย</th>
                                                <th style={{ padding: "16px 20px" }}>สูตรปุ๋ย</th>
                                                <th style={{ padding: "16px 20px" }}>วิธีการใช้</th>
                                                <th style={{ padding: "16px 20px" }}>จัดการข้อมูล</th>
                                            </>
                                        )}
                                        {Type === "chemical" && (
                                            <>
                                                <th style={{ padding: "16px 20px" }}>ชื่อสารเคมี</th>
                                                <th style={{ padding: "16px 20px" }}>ชื่อสามัญสารเคมี</th>
                                                <th style={{ padding: "16px 20px" }}>วิธีการใช้</th>
                                                <th style={{ padding: "16px 20px" }}>จำนวนวันปลอดภัย</th>
                                                <th style={{ padding: "16px 20px" }}>จัดการข้อมูล</th>
                                            </>
                                        )}
                                        {Type === "source" && (
                                            <>
                                                <th style={{ padding: "16px 20px" }}>แหล่งที่ซื้อ</th>
                                                <th style={{ padding: "16px 20px" }}>ตำแหน่งที่ตั้ง</th>
                                                <th style={{ padding: "16px 20px" }}>จัดการข้อมูล</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody style={{ fontSize: "16px", color: "#333" }}>
                                    {Data.length > 0 ? Data.map((item, index) => {
                                        return (
                                            <tr key={index}
                                                className="table-row-hover"
                                                style={{
                                                    borderBottom: "1px solid #eef2f0",
                                                    transition: "background-color 0.2s"
                                                }}
                                            >
                                                {Type === "plant" && (
                                                    <>
                                                        <td style={{ padding: "14px 16px", fontWeight: "500" }}>{item.name || "-"}</td>
                                                        <td style={{ padding: "16px 20px" }}>{item.type_plant || "-"}</td>
                                                        <td style={{ padding: "16px 20px" }}>{item.variety_name || "ยังไม่ระบุ"}</td>
                                                        <td style={{ padding: "16px 20px" }}>{item.qty_harvest ? `${item.qty_harvest} วัน` : "-"}</td>
                                                    </>
                                                )}
                                                {Type === "pest" && (
                                                    <>
                                                        <td style={{ padding: "14px 16px", fontWeight: "500" }}>{item.pest_name || "-"}</td>
                                                        <td style={{ padding: "16px 20px" }}>{item.type_pest || "-"}</td>
                                                    </>
                                                )}
                                                {Type === "fertilizer" && (
                                                    <>
                                                        <td style={{ padding: "14px 16px", fontWeight: "500" }}>{item.name || "-"}</td>
                                                        <td style={{ padding: "16px 20px" }}>{item.name_formula || "-"}</td>
                                                        <td style={{ padding: "16px 20px" }}>{item.how_use || "-"}</td>
                                                    </>
                                                )}
                                                {Type === "chemical" && (
                                                    <>
                                                        <td style={{ padding: "14px 16px", fontWeight: "500" }}>{item.name || "-"}</td>
                                                        <td style={{ padding: "16px 20px" }}>{item.name_formula || "-"}</td>
                                                        <td style={{ padding: "16px 20px" }}>{item.how_use || "-"}</td>
                                                        <td style={{ padding: "16px 20px" }}>{item.date_safe_list ? `${item.date_safe_list} วัน` : "-"}</td>
                                                    </>
                                                )}
                                                {Type === "source" && (
                                                    <>
                                                        <td style={{ padding: "14px 16px", fontWeight: "500" }}>{item.name || "-"}</td>
                                                        <td style={{ padding: "14px 16px", minWidth: "200px" }}>
                                                            {item.location ? (
                                                                <div style={{ display: "inline-block", width: "100%", maxWidth: "250px" }}>
                                                                    <MapsJSX lat={item.location.x} lng={item.location.y} w={"100%"} h={"80px"} />
                                                                </div>
                                                            ) : (
                                                                "ไม่พบตำแหน่ง"
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            OpenManageData(item);
                                                        }}
                                                        className="manage-btn"
                                                    >
                                                        จัดการข้อมูล
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={Type === "plant" ? 5 : Type === "chemical" ? 5 : Type === "fertilizer" ? 4 : Type === "pest" ? 3 : Type === "source" ? 3 : 5} style={{ padding: "20px", textAlign: "center", color: "#666" }}>ไม่พบข้อมูล</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : Body}
            </div>
            <div className="footer">
                <LoadOtherOffset Fetch={fetch} Data={Data} setRow={setRow} Limit={Limit}
                    style={{ backgroundColor: "rgb(24 157 133)" }} />
                <div id="popup-detail-form">
                    <PopupDom Ref={RefPop} Body={PopBody} zIndex={1001} />
                </div>
            </div>
        </>
    )
}

export default PageData
