import React, { useContext, useEffect, useRef, useState } from "react";
import { clientMo } from "../../../../assets/js/moduleClient";

import {
  GetLinkUrlOfSearch,
  LoadOtherOffset,
  MapsJSX,
  ReportAction,
  TimeDiff
} from "../../../../assets/js/module";

import ShowBecause from "./doctor/ShowBecause";
import ShowBecauseAdmin from "./admin/ShowBecause";

import EditPage from "./data/EditPage";
import ManageDataPage from "./data/ManagePage";
import ManageDoctorPage from "./doctor/ManagePage";
import ManageAdminPage from "./admin/ManagePage";
import { PageTemplateContext } from "./PageTemplate";
import InsertReport from "./report/InsertReport";
import InsertGraph from "./report/InsertGraph";
import InsertStatistics from "./report/statistics/InsertStatistics";
import PageGroup from "./group/PageGroup";

const ListData = ({
  socket,
  status,
  auth,
  session,
  TabOn,
  HrefPage,
  setStateOnPage,
  modify,
  textSearch
}) => {
  // const [Body , setBody] = useState(<></>)
  // const [List , setList] = useState(<></>)

  const [DataFetch, setDataFetch] = useState([]);
  const [Because, setBecause] = useState(<></>);
  // const [ShBecause , setShBecause] = useState(<></>)

  const [ListCount, setListCount] = useState(0);
  const [getVerifyStart, setVerifyStart] = useState(false);
  const [RowList, setRowList] = useState(5);
  const [getInterval, setIntervalTime] = useState(0);

  const RefBe = useRef();
  // const ShowBecause = useRef()

  useEffect(() => {
    if (status.changePath)
      window.history.pushState(
        {},
        "",
        `/admin/${HrefPage.get().split("?")[0]}?${status.status}`
      );

    removePopup();
    fetchDataList(0, 5);
    setVerifyStart(true);

    return () => {
      socket.emit("unconnect-doctor-list");
      socket.removeListener("update-online");
    };
  }, [status]);

  useEffect(() => {
    if (getVerifyStart) {
      fetchDataList(0, RowList, textSearch);
    }
  }, [textSearch]);

  const removePopup = () => {
    if (RefBe.current) {
      RefBe.current.removeAttribute("style");
      setTimeout(() => {
        setBecause(<></>);
      }, 500);
    }
  };

  const fetchDataList = async (StartRow, Limit, textSearch = "") => {
    socket.emit("unconnect-doctor-list");
    socket.removeListener("update-online");
    clearInterval(getInterval);
    setStateOnPage({ status: status?.status })

    const primaryMenu = (
      HrefPage.get().split("?")[0] === "list" ? (
        ["default" , "delete"].includes(HrefPage.get().split("?")[1])
          ? "บัญชีเจ้าหน้าที่ส่งเสริม" : 
        ["admin" , "deleteAdmin"].includes(HrefPage.get().split("?")[1])
          ? "บัญชีผู้ดูแลระบบ" : ""
      ) :
      HrefPage.get().split("?")[0] === "data"
        ? "ข้อมูลเพิ่มเติม" : 
      HrefPage.get().split("?")[0] === "group"
        ? "จัดกลุ่มข้อมูล" : 
      HrefPage.get().split("?")[0] === "report"
        ? "รายงานข้อมูล" : ""
    )

    const secondaryMenu = (
      HrefPage.get().split("?")[0] === "list" ? (
        ["delete"].includes(HrefPage.get().split("?")[1])
          ? "บัญชีเจ้าหน้าที่ส่งเสริมที่ถูกลบ" : 
        ["deleteAdmin"].includes(HrefPage.get().split("?")[1])
          ? "บัญชีผู้ดูแลระบบที่ถูกลบ" : ""
      ) : 
      HrefPage.get().indexOf("plant") >= 0
        ? "ชนิดพืช" : 
      HrefPage.get().indexOf("station") >= 0
        ? "ศูนย์ส่งเสริม" : 
      HrefPage.get().indexOf("group") >= 0
        ? "รายการจัดกลุ่มข้อมูล" : 
      HrefPage.get().indexOf("chemical") >= 0
        ? "สารเคมี" : 
      HrefPage.get().indexOf("pest") >= 0
        ? "โรคพืช / ศัตรูพืช" : 
      HrefPage.get().indexOf("listlocation") >= 0
        ? "รายชื่อหมอพืชและที่ปรึกษาเกษตรกร" : 
      HrefPage.get().indexOf("graph") >= 0
        ? "จำนวนเกษตรกรและพืชที่เพาะปลูก" : 
      HrefPage.get().indexOf("statistics") >= 0
        ? "สถิติโรคพืช" : ""
    )

    modify(70, 30, [
      "หน้าแรก",
      primaryMenu,
      secondaryMenu
    ]);

    let ObjectData;
    if (HrefPage.get().split("?")[0] === "list") {
      switch (status.status) {
        case "default": {
          ObjectData = await clientMo.post("/api/admin/doctor/list", {
            typeDelete:
              status.status === "default"
                ? 0
                : status.status === "delete"
                ? 1
                : -1,
            limit: Limit || 10,
            startRow: StartRow,
            textSearch: textSearch
          });
          break;
        }
        case "admin": {
          ObjectData = await clientMo.post("/api/admin/admin/list", {
            typeDelete:
              status.status === "admin"
                ? 0
                : status.status === "deleteAdmin"
                ? 1
                : -1,
            limit: Limit || 10,
            startRow: StartRow,
            textSearch: textSearch
          });
          break;
        }
        case "delete": {
          ObjectData = await clientMo.post("/api/admin/doctor/list", {
            typeDelete: status.status === "delete" ? 1 : -1,
            limit: Limit || 10,
            startRow: StartRow,
            textSearch: textSearch
          });
          break;
        }
        case "deleteAdmin": {
          ObjectData = await clientMo.post("/api/admin/admin/list", {
            typeDelete:
              status.status === "admin"
                ? 0
                : status.status === "deleteAdmin"
                ? 1
                : -1,
            limit: Limit || 10,
            startRow: StartRow,
            textSearch: textSearch
          });
          break;
        }
        default :
          break;
      }
    } else if (HrefPage.get().split("?")[0] === "data") {
      ObjectData = await clientMo.post("/api/admin/data/list", {
        type: status.status,
        limit: Limit || 10,
        startRow: StartRow,
        textSearch: textSearch
      });
    } else if (HrefPage.get().split("?")[0] === "group") {
      // ObjectData = await clientMo.post("/api/admin/group/get", {
      //   type: status.status,
      //   limit: Limit || 10,
      //   startRow: StartRow,
      //   textSearch: textSearch
      // });
    }

    if (ObjectData) {
      const List = JSON.parse(ObjectData);
      let DataSocket = [];
      // console.log(List)
      if (StartRow != 0) {
        setDataFetch([...DataFetch, ...List]);
        setRowList([...DataFetch, ...List].length);
        DataSocket = [...DataFetch, ...List];
      } else {
        setDataFetch(List);
        DataSocket = List;
      }

      if (["list", "listadmin"].includes(HrefPage.get().split("?")[0])) {
        const isListAdmin = HrefPage.get().split("?")[0] === "listadmin";
        const emitEvent = isListAdmin
          ? "connect-admin-list"
          : "connect-doctor-list";
        const idField = isListAdmin ? "id" : "id_table_doctor";

        if (
          (isListAdmin && status.status === "admin") ||
          (!isListAdmin && status.status === "default")
        ) {
          socket.emit(emitEvent);
          socket.on("update-online", (id_table, newTimeSocket) => {
            const newList = DataSocket.map((DataList) => {
              if (DataList[idField] == id_table) {
                DataList.time_online = isNaN(newTimeSocket)
                  ? newTimeSocket
                  : "offline";
              }
              return DataList;
            });
            setDataFetch(newList);
          });
          return List;
        } else {
          // session();
          return 0;
        }
      } else {
        // session();
        return 0;
      }
    }
  }

  return (
    <section className="body-list-manage">
      {status.status === "default" ||
      status.status === "admin" ||
      status.status === "plant" ||
      status.status === "station" ||
      status.status === "group" ||
      status.status === "chemical" ||
      status.status === "pest" ||
      status.status === "listlocation" ||
      status.status === "graph" ||
      status.status === "statistics" ? (
        <InsertPage
          ReloadAccount={() => fetchDataList(0, DataFetch.length)}
          type={status.status}
        />
      ) : (
        <></>
      )}
      <div className="List-data">
        {
          
          status.status === "listlocation" ? 
            <InsertReport/> :
          status.status === "graph" ? 
            <InsertGraph/> : 
          status.status === "statistics" ? 
            <InsertStatistics/> : 
          status.status === "group" ? 
            <PageGroup/> : 
            <ManageList
              socket={socket}
              Data={DataFetch}
              setBecause={setBecause}
              ListCount={ListCount}
              setListCount={setListCount}
              TabOn={TabOn}
              HrefPage={HrefPage}
              status={status}
              auth={auth}
              session={session}
              RefBe={RefBe}
              Fetch={() => fetchDataList(0, DataFetch.length)}
            />
        }
      </div>
      <div
        className="load-other"
        style={{
          padding: "5px 0px"
        }}
      >
        {
          status.status !== "group" && status.status !== "statistics" && status.status !== "listlocation" && status.status !== "graph" &&
            <LoadOtherOffset
              Fetch={fetchDataList}
              Data={DataFetch}
              setRow={setRowList}
              Limit={5}
              style={{
                backgroundColor: "#22C7A9"
              }}
            />
        }
      </div>
      <div ref={RefBe} className="page-because-popup">
        {Because}
      </div>
    </section>
  );
};

const ManageList = ({
  socket,
  Data,
  setBecause,
  ListCount,
  setListCount,
  TabOn,
  HrefPage,
  status,
  auth,
  RefBe,
  session,
  Fetch
}) => {
  const [List, setList] = useState(<></>);

  useEffect(() => {
    setList(<></>);

    manageList();
    // LoadPageData()

    window.removeEventListener("resize", sizeScreen);
    window.addEventListener("resize", sizeScreen);

    return () => {
      window.removeEventListener("resize", sizeScreen);
    };
  }, [Data]);

  const sizeScreen = () => {
    if (window.innerWidth < 820) {
      setBodyFromData(1);
    } else if (window.innerWidth < 1100) {
      setBodyFromData(2);
    } else if (window.innerWidth >= 1100) {
      setBodyFromData(3);
    }
  };

  const setBodyFromData = async (maxC) => {
    TabOn.addTimeOut(TabOn.end());
    manageList(maxC);
  };

  const OpenConfirmDoctor = async (id_table_doctor, typeStatus) => {
    if (await auth(true)) {
      const status = parseInt(
        document
          .querySelector(
            `#data-list-content-${id_table_doctor} action-bt bt-status .frame`
          )
          .getAttribute("status")
      );
      setBecause(
        <ManageDoctorPage
          RefOnPage={RefBe}
          id_table={id_table_doctor}
          type={typeStatus}
          status={status}
          setBecause={setBecause}
          TabOn={TabOn}
          session={session}
          ReloadFetch={Fetch}
        />
      );
    }
  };

  const OpenConfirmAdmin = async (id, typeStatus) => {
    if (await auth(true)) {
      const status = parseInt(
        document
          .querySelector(`#data-list-content-${id} action-bt bt-status .frame`)
          .getAttribute("status")
      );
      setBecause(
        <ManageAdminPage
          RefOnPage={RefBe}
          id_table={id}
          type={typeStatus}
          status={status}
          setBecause={setBecause}
          TabOn={TabOn}
          session={session}
          ReloadFetch={Fetch}
        />
      );
    }
  };

  const OpenConfirmData = async (id, typeStatus) => {
    if (await auth(true)) {
      const status = parseInt(
        document
          .querySelector(`#data-list-content-${id} action-bt bt-status .frame`)
          .getAttribute("status")
      );
      setBecause(
        <ManageDataPage
          RefOnPage={RefBe}
          id_table={id}
          type={typeStatus}
          status={status}
          setBecause={setBecause}
          TabOn={TabOn}
          session={session}
          ReloadData={Fetch}
        />
      );
    }
  };

  const OpenEditData = async (id, typeStatus) => {
    if (await auth(true)) {
      const status = parseInt(
        document
          .querySelector(`#data-list-content-${id} action-bt bt-status .frame`)
          .getAttribute("status")
      );
      setBecause(
        <EditPage
          RefOnPage={RefBe}
          id_table={id}
          type={typeStatus}
          setBecause={setBecause}
          TabOn={TabOn}
          session={session}
          ReloadData={Fetch}
        />
      );
    }
  };

  const OpenDetailManage = async (id_table_doctor, typeStatus) => {
    if (await auth(true)) {
      setBecause(
        <ShowBecause
          RefOnPage={RefBe}
          id_table={id_table_doctor}
          type={typeStatus}
          TabOn={TabOn}
          setBecause={setBecause}
        />
      );
    }
  };

  const OpenDetailManageAdmin = async (id, typeStatus) => {
    if (await auth(true)) {
      setBecause(
        <ShowBecauseAdmin
          RefOnPage={RefBe}
          id_table={id}
          type={typeStatus}
          TabOn={TabOn}
          setBecause={setBecause}
        />
      );
    }
  };

  const manageList = () => {
    console.log(Data)
      const doctorList = Data.map((data, key) => (
  <list-data-body
    key={key}
    id={`data-list-content-${
      HrefPage.get().split("?")[0] === "list"
        ? status.status === "default"
          ? data.id_table_doctor
          : status.status === "admin"
            ? data.id
          : ""
        : HrefPage.get().split("?")[0] === "data"
          ? status.status === "pest" ? data.pest_id : data.id
        : ""
    }`}
    status={
      status.status === "delete" || status.status === "deleteAdmin" ?
        "delete" : status.status
    }
  >
    {HrefPage.get().split("?")[0] === "list" ? (
      status.status === "default" || status.status === "delete" ? (
        <>
          {status.status === "default" ? (
            <div className="status-online">
              <div
                className="text-online"
                style={
                  data.time_online == "online"
                    ? { backgroundColor: "#00ff3c" }
                    : {}
                }
              >
                {data.time_online ? (
                  data.time_online == "online" ? (
                    "กำลังใช้งาน"
                  ) : data.time_online == "offline" ? (
                    "ปิดใช้งาน"
                  ) : (
                    <TimeDiff
                      DATE={parseInt(data.time_online)}
                      DivInput={false}
                      textPresent="ใช้งานเมื่อ "
                    />
                  )
                ) : (
                  "ยังไม่ทำการเข้าระบบ"
                )}
              </div>
            </div>
          ) : (
            <></>
          )}
          <detail-data-main>
            <detail-Image>
              <img
                src={
                  data.img_doctor
                    ? data.img_doctor
                    : "/doctor-svgrepo-com.svg"
                }
              ></img>
            </detail-Image>
            <detail-data>
              <detail-in-fullname>
                <span>
                  {data.fullname_doctor
                    ? data.fullname_doctor
                    : "เจ้าหน้าที่ส่งเสริมยังไม่ทำการระบุชื่อ"}
                </span>
              </detail-in-fullname>
              <detail-in>
                <span className="head-data">รหัสประจำตัว</span>
                <div className="text-data">{data.id_doctor}</div>
              </detail-in>
              <detail-in>
                <span className="head-data">ศูนย์</span>
                <div className="text-data">
                  {data.station
                    ? data.station
                    : "เจ้าหน้าที่ส่งเสริมยังไม่ระบุ"}
                </div>
              </detail-in>
            </detail-data>
          </detail-data-main>
          <action-bt>
            {status.status === "default" ? (
              <>
                <content-status because={1}>
                  <bt-because>
                    <button
                      onClick={() =>
                        OpenDetailManage(
                          data.id_table_doctor,
                          "status_account"
                        )
                      }
                    >
                      เหตุผล
                    </button>
                  </bt-because>
                  <bt-status
                    onClick={() =>
                      OpenConfirmDoctor(
                        data.id_table_doctor,
                        "status_account"
                      )
                    }
                  >
                    <div
                      className="frame"
                      status={data.status_account ? "1" : "0"}
                    >
                      <span>ON</span>
                      <span className="dot"></span>
                      <span>OFF</span>
                    </div>
                  </bt-status>
                </content-status>
                <bt-delete>
                  <button
                    onClick={() =>
                      OpenConfirmDoctor(
                        data.id_table_doctor,
                        "status_delete"
                      )
                    }
                  >
                    ลบบัญชี
                  </button>
                </bt-delete>
              </>
            ) : status.status === "delete" ? (
              <content-status because={0} delete="">
                <bt-because>
                  <button
                    onClick={() =>
                      OpenDetailManage(
                        data.id_table_doctor,
                        "status_delete"
                      )
                    }
                  >
                    เหตุผล
                  </button>
                </bt-because>
              </content-status>
            ) : (
              <></>
            )}
          </action-bt>
        </>
      ) : status.status === "admin" || status.status === "deleteAdmin" ? (
        <>
          {status.status === "admin" ? (
            <div className="status-online">
              <div
                className="text-online"
                style={
                  data.time_online == "online"
                    ? { backgroundColor: "#00ff3c" }
                    : {}
                }
              >
                {data.time_online ? (
                  data.time_online == "online" ? (
                    "กำลังใช้งาน"
                  ) : data.time_online == "offline" ? (
                    "ปิดใช้งาน"
                  ) : (
                    <TimeDiff
                      DATE={parseInt(data.time_online)}
                      DivInput={false}
                      textPresent="ใช้งานเมื่อ "
                    />
                  )
                ) : (
                  "ยังไม่ทำการเข้าระบบ"
                )}
              </div>
            </div>
          ) : (
            <></>
          )}
          <detail-data-main>
            <detail-Image>
              <img
                src={
                  data.img_admin ? data.img_admin : "/admin-svgrepo-com.svg"
                }
              ></img>
            </detail-Image>
            <detail-data>
              <detail-in-fullname>
                <span>
                  {data.fullname_admin
                    ? data.fullname_admin
                    : "ผู้ดูแลระบบยังไม่ทำการระบุชื่อ"}
                </span>
              </detail-in-fullname>
              <detail-in>
                <span className="head-data">รหัสประจำตัว</span>
                <div className="text-data">{data.username}</div>
              </detail-in>
              <detail-in>
                <span className="head-data">ศูนย์</span>
                <div className="text-data">
                  {data.station ? data.station : "ผู้ดูแลระบบยังไม่ระบุ"}
                </div>
              </detail-in>
            </detail-data>
          </detail-data-main>
          <action-bt>
            {status.status === "admin" ? (
              <>
                <content-status because={1}>
                  <bt-because>
                    <button
                      onClick={() =>
                        OpenDetailManageAdmin(data.id, "status_account")
                      }
                    >
                      เหตุผล
                    </button>
                  </bt-because>
                  <bt-status
                    onClick={() =>
                      OpenConfirmAdmin(data.id, "status_account")
                    }
                  >
                    <div
                      className="frame"
                      status={data.status_account ? "1" : "0"}
                    >
                      <span>ON</span>
                      <span className="dot"></span>
                      <span>OFF</span>
                    </div>
                  </bt-status>
                </content-status>
                <bt-delete>
                  <button
                    onClick={() =>
                      OpenConfirmAdmin(data.id, "status_delete")
                    }
                  >
                    ลบบัญชี
                  </button>
                </bt-delete>
              </>
            ) : status.status === "deleteAdmin" ? (
              <content-status because={0} delete="">
                <bt-because>
                  <button
                    onClick={() =>
                      OpenDetailManageAdmin(data.id, "status_delete")
                    }
                  >
                    เหตุผล
                  </button>
                </bt-because>
              </content-status>
            ) : (
              <></>
            )}
          </action-bt>
        </>
      ) : undefined
    ) : HrefPage.get().split("?")[0] === "data" ? (
      <>
        <detail-data-main column="">
          <detail-data maxsize="" flex={status.status}>
            <div className= "name" w={status.status === "plant" ? "name" : ""}>
              {status.status === "plant" && (
                <>
                  <span>ชื่อพืช</span>
                  <div className="text-data">{data.name}</div>
                </>
              )}
            </div>

            <div
              className={
                status.status === "plant" ? "type_plant" : "location"
              }
            >
              {status.status === "plant" ? <span>ประเภท</span> : <></>}
              {status.status === "plant" ? (
                <div className="text-data">{data.type_plant}</div>
              ) : status.status === "station" ? (
                <MapsJSX
                  lat={data.location.x}
                  lng={data.location.y}
                  w={"300vw"}
                  h={"100vw"}
                />
              ) : (
                ""
              )}
            </div>
            <div
              className={
              status.status === "plant" ? "variety_name" : ""
              }
                >
              {status.status === "plant" ? <span>สายพันธุ์พืช</span> : <></>}
              {status.status === "plant" ? (
              <div className="text-data">{data.variety_name}</div>
              ) : (
                <></>
              )}
            </div>

            <div className={status.status}>
            {status.status === "chemical" && (
              <> 
                <span className={status.status}>ชื่อสารเคมี</span>
                {/* แสดงชื่อสารเคมีเฉพาะที่นี่ */}
                <div className="text-data">{data.name}</div>
              </>
            )}
          </div>

          <div className= "chemical" w={status.status === "chemical" ? "name_formula" : ""}>
            {status.status === "chemical" && (
              <>
                <span>ชื่อสามัญสารเคมี</span>
                <div className="text-data">{data.name_formula}</div>
              </>
            )}
          </div>

          <div className={status.status === "chemical" ? "how_use" : ""}>
            {status.status === "chemical" && (
              <>
                <span>วิธีการใช้</span>
                <div className="text-data">{data.how_use}</div>
              </>
            )}
          </div>


            <div className="name" w={status.status}>
              {status.status === "pest" ? (
                <span className={status.status}>
                  {data.type_pest === "ศัตรูพืช" ? "ศัตรูพืช" : "โรคพืช"}
                </span>
              ) : (
                <></>
              )}
              <div className={`text-data ${status.status}`}>
                {data.pest_name}
              </div>
            </div>

          </detail-data>

          {status.status === "plant" ? (
            <detail-data maxsize="">
              <div className="name">
                <span className={status.status}>
                  จำนวนวันที่จะเก็บเกี่ยว
                </span>
                <div
                  className={`text-data`}
                >{`${data.qty_harvest} วัน`}</div>
              </div>
            </detail-data>
          ) : (
            <></>
          )}

          {status.status === "chemical" ? (
            <detail-data maxsize="">
              <div className="name">
                <span className={status.status}>
                  จำนวนวันที่ปลอดภัย
                </span>
                <div
                  className={`text-data`}
                >{`${data.date_safe_list} วัน`}</div>
              </div>
            </detail-data>
          ) : (
            <></>
          )}

            <div 
              className={
              status.status === "station" ? "id_station" : "" 
              }
                >
              {status.status === "station" ? <span>รหัสศูนย์ส่งเสริม</span> : <></>}
              {status.status === "station" ? (
              <div className="text-data">{data.id_station}</div>
              ) : (
              <></>
              )}
            </div>

        </detail-data-main>
        <action-bt>
          <content-status because={0}>
            {status.status === "station" ? (
              <div
                className="edit-bt"
                onClick={() => OpenEditData(data.id, status.status)}
              >
                แก้ไข
              </div>
            ) : (
              <></>
            )}
            <bt-status
              onClick={() => OpenConfirmData(
                status.status === "pest" ? data.pest_id : data.id, 
                status.status
              )}
            >
              <div className="frame" status={data.is_use}>
                <span>ON</span>
                <span className="dot"></span>
                <span>OFF</span>
              </div>
            </bt-status>
          </content-status>
        </action-bt>
      </>
    ) : (

      <></>
    )}
  </list-data-body>
));

TabOn.addTimeOut(TabOn.end());
setList(
  doctorList.length ? (
    doctorList
  ) : (
    <div style={{ font: "900 18px Sans-font" }}>ไม่พบข้อมูล</div>
  )
);

    

    
  };

  return List;
};

const InsertPage = ({ ReloadAccount, type }) => {
  const { popupDataManage, setPopupDataManage } = useContext(PageTemplateContext);

  const [step, setStep] = useState(1);
  const [Open, setOpen] = useState(0);
  const [Text, setText] = useState("");
  const [Status, setStatus] = useState(0);

  const [sizeReport, setSize] = useState(0);

  const pwAdmin = useRef();

  const [Lag, setLag] = useState(0);
  const [Lng, setLng] = useState(0);
  const InputMap = useRef();



  const RefData = {
    Data1: useRef(),
    Data2: useRef(),
    Data3: useRef(),
    Data4: useRef()
  };
  const QtyDate = useRef();
  const [stateOnBt, setstateOnBt] = useState(true);

  useEffect(() => {
    if (type === "station") GenerateMapAuto();
  }, []);


  

  const CheckEmply = (roles = {}) => {
    const RefIsCheck =
        type === "default" ? [
          RefData.Data1.current.value, RefData.Data2.current.value , Object.entries(roles).some(([role , status]) => status)
        ] : 
        type === "admin" ? [RefData.Data1.current.value, RefData.Data2.current.value] : 
        type === "station" ? [
            RefData.Data1.current.value,
            RefData.Data2.current.value,
            RefData.Data3.current.value,
            RefData.Data4.current.value,
        ] : 
        type === "plant" ? [
            RefData.Data1.current.value,
            RefData.Data2.current.value,
            RefData.Data3.current.value,
            QtyDate.current.value,
        ] :
        type === "chemical" ? [
            RefData.Data1.current.value,
            RefData.Data2.current.value,
            RefData.Data3.current.value,
            QtyDate.current.value,
        ] :
        type === "pest" ? [
            RefData.Data1.current.value,
            RefData.Data2.current.value,
        ] :
        type === "group" ? [
          RefData.Data1.current.value,
          RefData.Data2.current.value,
      ]
        : 
        [];

    if (RefIsCheck.filter((val) => !val).length == 0 && pwAdmin.current.value) {
      setstateOnBt(false);
      return type === "station" ? {
            name: RefData.Data1.current.value,
            lat: RefData.Data2.current.value,
            lng: RefData.Data3.current.value,
            id_station: RefData.Data4.current.value,
            type: type,
            passwordAd: pwAdmin.current.value
        } : 
          type === "default" ? 
            {
              id_doctor: RefData.Data1.current.value,
              ...roles,
              passwordDT: RefData.Data2.current.value,
              passwordAd: pwAdmin.current.value
            } :
          type === "admin" ?
            {
              id: RefData.Data1.current.value,
              passwordAdNew: RefData.Data2.current.value,
              passwordAd: pwAdmin.current.value
            }
        : type === "plant" ? {
            name: RefData.Data1.current.value,
            type_plant: RefData.Data2.current.value,
            variety_name: RefData.Data3.current.value,
            qtyDate: QtyDate.current.value,
            type: type,
            passwordAd: pwAdmin.current.value
        }
        : type === "chemical" ? {
            name: RefData.Data1.current.value,
            name_formula: RefData.Data2.current.value,
            how_use: RefData.Data3.current.value,
            date_safe: QtyDate.current.value,
            type: type,
            passwordAd: pwAdmin.current.value
        }
        : type === "pest" ? {
          name: RefData.Data1.current.value,
          type_pest: RefData.Data2.current.value,
          type: type,
          passwordAd: pwAdmin.current.value,
          
        }
        : type === "group" ? {
          name: RefData.Data1.current.value,
          pest_name: RefData.Data2.current.value,
          type: type,
          passwordAd: pwAdmin.current.value
      }


        : {};
    } else {
      setstateOnBt(true);
      return false;
    }
  };

  const ClickAdd = async (e , roles) => {
    const Data = CheckEmply(roles);
    console.log(Data)
    if (Data) {
      setOpen(1);
      setText("");
      setStatus(0);
      let result =
            type === "default"
          ? await clientMo.post("/api/admin/add/doctor", Data)
          : type === "admin"
          ? await clientMo.post("/api/admin/add", Data)
          : type === "plant" ||
            type === "station" ||
            type === "chemical" ||
            type === "pest"
          ? await clientMo.post("/api/admin/data/insert", Data)
          : type === "group"
          ? await clientMo.post("/api/admin/group/insert", Data)
          : type === "report"
          ? await clientMo.post("/api/admin/report/insert", Data)


          : "";
      if (result === "1") {
        setText(
          `เพิ่ม${
            type === "default"
              ? "บัญชีเจ้าหน้าที่ส่งเสริม"
              : type === "admin"
              ? "บัญชีผู้ดูแลระบบ"
              : type === "plant"
              ? "ชนิดพืช"
              : type === "station"
              ? "ศูนย์ส่งเสริม"
              : type === "gruop"
              ? "จัดกลุ่มข้อมูล"
              : type === "chemical"
              ? "สารเคมี"
              : type === "pest"
              ? "ศัตรูพืช"
              : type === "listlocation"
              ? "รายชื่อหมอพืชและที่ปรึกษาเกษตรกร"
              : type === "graph"
              ? "จำนวนเกษตรกรและพืช"
              : type === "statistics"
              ? "สถิติโรคพืช / ศัตรูพืช"
              : ""
          }สำเร็จ`
        );
        setStatus(1);
        Cancel();
        setTimeout(() => {
          ReloadAccount();
        }, 100);
      } else if (result === "incorrect") {
        setText("รหัสผู้ดูแลไม่ถูกต้อง");
        setStatus(2);
        pwAdmin.current.value = "";
      } else if (result === "overflow") {
        setText(
          `มี${
            type === "default"
              ? "บัญชีเจ้าหน้าที่ส่งเสริม"
              : type === "admin"
              ? "บัญชีผู้ดูแลระบบ"
              : type === "plant"
              ? "ชนิดพืช"
              : type === "station"
              ? "ศูนย์ส่งเสริม"
              : type === "gruop"
              ? "จัดกลุ่มข้อมูล"
              : type === "chemical"
              ? "สารเคมี"
              : type === "pest"
              ? "ศัตรูพืช"
              : type === "listlocation"
              ? "รายชื่อหมอพืชและที่ปรึกษาเกษตรกร"
              : type === "graph"
              ? "จำนวนเกษตรกรและพืช"
              : type === "statistics"
              ? "สถิติโรคพืช / ศัตรูพืช"
              : ""
          }นี้แล้ว`
        );
        setStatus(2);
        Cancel();
        setTimeout(() => {
          ReloadAccount();
        }, 100);
      } else {
        setText(`มีปัญหาในการเพิ่มข้อมูล`);
        setStatus(2);
      }
    }
    setstateOnBt(true);
    e.preventDefault();
  };

  const Cancel = (e) => {
    let Data1 = RefData.Data1.current;
    let Data2 = RefData.Data2.current;
    let Data3 = RefData.Data3.current;
    let Qty = QtyDate.current;
    let PWadmin = pwAdmin.current;

    Data1 && (Data1.value = "");
    Data2 && (Data2.value = "");
    Data3 && (Data3.value = "");
    Qty && (Qty.value = "");
    PWadmin.value = "";
    if (type === "station") {
      InputMap.current.value = "";
      setLag(0);
      setLng(0);
    }

    setStep(1); // กลับไปยังเมนูเริ่มต้น

    if (e) setPopupDataManage({
      open : false
    });
  };

  const GenerateMap = async (e) => {
    let valueLocation = await GetLinkUrlOfSearch(e.target.value, "admin");
    if (!isNaN(valueLocation[0]) && !isNaN(valueLocation[1])) {
      setLag(valueLocation[0]);
      setLng(valueLocation[1]);
    }
  };

  const GenerateMapAuto = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLag(0);
        setLng(0);
        setTimeout(() => {
          setLag(position.coords.latitude);
          setLng(position.coords.longitude);
        }, 1000);
      });
    }
  };

  return (
    <section className="page-insert" show={popupDataManage.open && ""}>
      {type === "default" || type === "admin" ? (
        <BodyDetailInsert
          type={type}
          Open={Open}
          setOpen={setOpen}
          Status={Status}
          setStatus={setStatus}
          Text={Text}
          setText={setText}
          CheckEmply={CheckEmply}
          ClickAdd={ClickAdd}
          RefData={RefData}
          QtyDate={QtyDate}
          InputMap={InputMap}
          GenerateMap={GenerateMap}
          GenerateMapAuto={GenerateMapAuto}
          Lag={Lag}
          Lng={Lng}
          pwAdmin={pwAdmin}
          Cancel={Cancel}
          stateOnBt={stateOnBt}
        />
      ) : type === "group" ? (<></>) : (
        (type === "plant" ||
          type === "station" ||
          type === "chemical" ||
          type === "pest") && (
          <BodyDetailInsert
            type={type}
            Open={Open}
            setOpen={setOpen}
            Status={Status}
            setStatus={setStatus}
            Text={Text}
            setText={setText}
            CheckEmply={CheckEmply}
            ClickAdd={ClickAdd}
            RefData={RefData}
            QtyDate={QtyDate}
            InputMap={InputMap}
            GenerateMap={GenerateMap}
            GenerateMapAuto={GenerateMapAuto}
            Lag={Lag}
            Lng={Lng}
            pwAdmin={pwAdmin}
            Cancel={Cancel}
            stateOnBt={stateOnBt}
          />
        )
      )}
    </section>
);
};

const BodyDetailInsert = ({
  type,
  Open,
  setOpen,
  Status,
  setStatus,
  Text,
  setText,
  CheckEmply,
  ClickAdd,
  RefData,
  QtyDate,
  InputMap,
  GenerateMap,
  GenerateMapAuto,
  Lag,
  Lng,
  pwAdmin,
  Cancel,
  stateOnBt,

}) => {
  const [checkboxState, setCheckboxState] = useState({
    role1: false,
    role2: false,
    role3: false,
    role4: false
  });

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setCheckboxState((prevState) => ({
      ...prevState,
      [name]: checked
    }));
  };
  return (
    <>
      <div className="Load-insert">
        <ReportAction
          Open={Open}
          Text={Text}
          Status={Status}
          setOpen={setOpen}
          setStatus={setStatus}
          setText={setText}
          sizeLoad={73}
          BorderLoad={8}
          color={"white"}
        />
      </div>
      <div className="body-page">
        <span className="head">
          {   
            type === "default" ? "บัญชีเจ้าหน้าที่ส่งเสริม" : 
            type === "admin" ? "บัญชีผู้ดูแลระบบ" : 
            type === "plant" ? "เพิ่มรายการชนิดพืช"  : 
            type === "station" ? "เพิ่มรายการศูนย์" : 
            type === "chemical" ? "เพิ่มรายการสารเคมี" : 
            type === "pest" ? "เพิ่มรายการโรคพืช / ศัตรูพืช" : 
            type === "gruop" ? "เพิ่มรายการจัดกลุ่มข้อมูล" : ""
          }
        </span>
        <div className="detail-data">
          <label className={type === "plant" ? "two-box" : null}>
            <div className="field-text">
              <span className="head-text">
                {
                  type === "default" ? "บัญชีเจ้าหน้าที่ส่งเสริม" :
                  type === "admin" ? "บัญชีผู้ดูแลระบบ" : 
                  type === "plant" ? "ชื่อพืช" : 
                  type === "station" ? "ชื่อศูนย์ส่งเสริม" : 
                  type === "chemical" ? "ชื่อสารเคมี" : 
                  type === "pest" ? "โรคพืช / ศัตรูพืช" : ""
                }
              </span>
              {type === "pest" ? (
                <select
                  onChange={CheckEmply}
                  ref={RefData.Data2}
                  defaultValue={""}
                  style={{ width: "100%" }}
                >
                  <option value={""} disabled>
                    เลือก
                  </option>
                  <option value={"โรคพืช"}>โรคพืช</option>
                  <option value={"ศัตรูพืช"}>ศัตรูพืช</option>
                </select>
              ) : (
                <input
                  onChange={CheckEmply}
                  ref={RefData.Data1}
                  placeholder={
                    type === "default" ? "บัญชีเจ้าหน้าที่ส่งเสริม" : 
                    type === "admin" ? "บัญชีผู้ดูแลระบบ" : 
                    type === "plant" ? "เช่น มะเขือเทศ" : 
                    type === "station" ? "เช่น ศูนย์โครงการหลวง" : 
                    type === "chemical" ? "เช่น พรีวาธอน" : ""
                  }                  
                />
              )}
            </div>
            {type === "plant" && (
              <div className="field-text">
                <span className="head-text">ประเภทพืช</span>
                <select
                  onChange={CheckEmply}
                  ref={RefData.Data2}
                  defaultValue={""}
                  style={{ width: "100%" }}
                >
                  <option value={""} disabled>
                    เลือกชนิดพืช
                  </option>
                  <option value={"พืชผัก"}>พืชผัก</option>
                  <option value={"ผลไม้"}>ผลไม้</option>
                  <option value={"สมุนไพร"}>สมุนไพร</option>
                  <option value={"ไม้ดอก"}>ไม้ดอก</option>
                  <option value={"ไม้ผล"}>ไม้ผล</option>
                  <option value={"กัญชง"}>กัญชง</option>
                  <option value={"กัญชา"}>กัญชา</option>

                </select>
              </div>
            )}

            {type === "plant" && (
              <div className="field-text">
                <span className="head-text">สายพันธุ์พืช</span>
                <input 
                    onChange={CheckEmply}
                    ref={RefData.Data3}
                    placeholder="เช่น เชอร์รี่แดง"
                ></input>
              </div>
            )}

            {type === "station" && (
              <div className="field-text">
                <span className="head-text">รหัสศูนย์ส่งเสริม</span>
                <input 
                    onChange={CheckEmply}
                    ref={RefData.Data4}
                    placeholder="เช่น 12345"
                ></input>
              </div>
            )}

            {type === "chemical" && (
              <>
                <div className="field-text">
                    <span className="head-text">ชื่อสามัญสารเคมี</span>
                    <input 
                        onChange={CheckEmply}
                        ref={RefData.Data2}
                        placeholder="เช่น เเมนโคเซบ"
                    ></input>
                </div>
                <div className="field-text">
                    <span className="head-text">วิธีการใช้</span>
                    <input ref={RefData.Data3} placeholder="เช่น ฉีดพ่น"></input>
                </div>
              </>
            )}
            {type === "pest" && (
              <div className="field-text">
                <span className="head-text">ชื่อโรคพืช / ศัตรูพืช</span>
                <input ref={RefData.Data1} placeholder="เช่น หนอนใบจุด"></input>
              </div>
            )}
          </label>
          {type === "default" ? (
            <label>
              <div className="field-text">
                <span className="head-text">รหัสผ่านบัญชีเจ้าหน้าที่ส่งเสริม</span>
                <input
                  onChange={CheckEmply}
                  ref={RefData.Data2}
                  placeholder="กรอกรหัสผ่าน"
                  type="password"
                />
              </div>
              <div className="field-text">
                <span className="head-text">สิทธิ์การใช้งาน</span>
                <div className="checkbox-group">
                  <label className="checkbox-item">
                    <span>หมอพืช</span>
                    <input
                      type="checkbox"
                      name="role2"
                      checked={checkboxState.role2}
                      onChange={handleCheckboxChange}
                    />
                  </label>
                  <label className="checkbox-item">
                    <span>ที่ปรึกษาเกษตรกร</span>
                    <input
                      type="checkbox"
                      name="role3"
                      checked={checkboxState.role3}
                      onChange={handleCheckboxChange}
                    />
                  </label>
                  <label className="checkbox-item">
                    <span>นักวิเคราะห์สาร</span>
                    <input
                      type="checkbox"
                      name="role4"
                      checked={checkboxState.role4}
                      onChange={handleCheckboxChange}
                    />
                  </label>
                </div>
              </div>
            </label>
          ) : type === "admin" ? (
            <label>
              <div className="field-text">
                <span className="head-text">รหัสผ่านบัญชีผู้ดูแลระบบ</span>
                <input
                  onChange={CheckEmply}
                  ref={RefData.Data2}
                  placeholder="กรอกรหัสผ่าน"
                  type="password"
                />
              </div>
            </label>
          ) : type === "plant" ? (
            <label>
              <div className="field-text">
                <span className="head-text">จำนวนวันที่จะเก็บเกี่ยว</span>
                <input
                  onChange={CheckEmply}
                  ref={QtyDate}
                  placeholder="เช่น 10 , 30"
                  type="number"
                />
              </div>
            </label>
          ) : type === "chemical" ? (
            <label>
              <div className="field-text">
                <span className="head-text">จำนวนวันปลอดภัย</span>
                <input
                  onChange={CheckEmply}
                  ref={QtyDate}
                  placeholder="เช่น 10 , 30"
                  type="number"
                />
              </div>
            </label>
          ) : type === "station" ? (
            <>
              <label>
                <div className="field-text">
                  <span className="head-text">ลิ้งค์ปักหมุดจาก Google Map</span>
                  <input
                    ref={InputMap}
                    placeholder="URL ที่ทำการปักหมุดสีแดง"
                    type="text"
                    onChange={CheckEmply}
                    onInput={GenerateMap}
                  />
                </div>
              </label>
              <label className="station">
                <div className="field-text">
                  <input
                    style={{ display: "none" }}
                    readOnly
                    ref={RefData.Data2}
                    value={Lag}
                  />
                  <input
                    style={{ display: "none" }}
                    readOnly
                    ref={RefData.Data3}
                    value={Lng}
                  />
                  <MapsJSX lat={Lag} lng={Lng} w={"100%"} />
                  <button onClick={GenerateMapAuto}>รีโหลดพิกัด</button>
                </div>
              </label>
            </>
          ) : (
            <></>
          )}
        </div>
        <label className="admin-confirm">
          <input
            ref={pwAdmin}
            onChange={CheckEmply}
            placeholder="รหัสผ่านผู้ดูแลระบบ"
            type="password"
          ></input>
        </label>
        <div className="bt-submit">
          <button className="cancel" onClick={Cancel}>
            ยกเลิก
          </button>
          <button
            className="submit"
            onClick={(e) => ClickAdd(e , checkboxState)}
            no={stateOnBt ? "" : null}
          >
            เพิ่มข้อมูล
          </button>
        </div>
      </div>
    </>
  );
};

export default ListData;
