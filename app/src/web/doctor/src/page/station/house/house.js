import React, { useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../../../assets/js/moduleClient";
import { MapsJSX } from "../../../../../../assets/js/module";
import { Modal } from "react-bootstrap";

const House = ({stationid}) => {
    const [house, setHouse] = useState([]);
    const [openstation, setOpenstation] = useState({
        open:false,stationid:''
    });
    const stationlist = async () =>{
      const ObjectData = await clientMo.get(`/api/doctor/station/${stationid}/housefarm/`, {
          limit : 100,
          startRow : 1,
          type: "station",
          textSearch : "",
        });
        console.log(ObjectData)
        const list = JSON.parse(ObjectData)
        setHouse(list)
      
   }
 useEffect(()=>{
    stationlist()
 },[])

 return(
    stationid 
    // <div className="modal-content">
    //     <div className="modal-header">
    //       <h2 id="modal-title">
    //         {popupDataManage.type === "insert"
    //           ? "เพิ่มรายการจัดกลุ่มข้อมูล"
    //           : popupDataManage.type === "edit"
    //           ? "แก้ไขรายการจัดกลุ่มข้อมูล"
    //           : ""}
    //       </h2>
    //       <button
    //         type="button"
    //         className="btn-close"
    //         onClick={() =>
    //           setPopupDataManage((data) => ({
    //             ...data,
    //             open: false
    //           }))
    //         }
    //         aria-label="Close"
    //       />
    //     </div>
    //     {loading ? (
    //       <p>กำลังโหลดข้อมูล...</p>
    //     ) : (
    //       <div className="modal-body">
    //         <div className="table-section">
    //           <span className="table-title">ศัตรูพืช / โรคพืช</span>
    //           <Autocomplete
    //             disablePortal
    //             options={[
    //               { label: "โรคพืช", value: "โรคพืช" },
    //               { label: "ศัตรูพืช", value: "ศัตรูพืช" }
    //             ]}
    //             value={filterType ? { label: filterType, value: filterType } : null}
    //             onChange={(e, value) => setFilterType(value?.value || "")}
    //             renderInput={(params) => (
    //               <TextField
    //                 {...params}
    //                 slotProps={{ htmlInput: { ...params.inputProps, sx: { fontFamily: "Sans-font" } } }}
    //               />
    //             )}
    //           />
    //         </div>
    //         <div className="table-section">
    //           <span className="table-title">ชื่อโรคพืช / ศัตรูพืช</span>
    //           <Autocomplete
    //             disablePortal
    //             onChange={(e, value) => setPestID(value?.id || null)}
    //             value={PestValue}
    //             isOptionEqualToValue={(option, value) => option?.id === value.id}
    //             options={PestsData}
    //             renderInput={(params) => (
    //               <TextField
    //                 {...params}
    //                 slotProps={{ htmlInput: { ...params.inputProps, sx: { fontFamily: "Sans-font" } } }}
    //               />
    //             )}
    //           />
    //         </div>

    //         <div className="table-section">
    //           <span className="table-title">สารเคมี</span>
    //           <Autocomplete
    //             disablePortal
    //             onChange={(e, value) => {
    //               setChemicalID(value?.id || null);
    //               onGetDateSafe(value?.id, plantID);
    //             }}
    //             value={ChemicalValue}
    //             isOptionEqualToValue={(option, value) => option?.id === value.id}
    //             options={ChemicalsData}
    //             renderInput={(params) => (
    //               <TextField
    //                 {...params}
    //                 slotProps={{ htmlInput: { ...params.inputProps, sx: { fontFamily: "Sans-font" } } }}
    //               />
    //             )}
    //           />
    //         </div>

    //         <div className="table-section">
    //           <span className="table-title">ชนิดพืช</span>
    //           <Autocomplete
    //             disablePortal
    //             onChange={(e, value) => {
    //               setPlantID(value?.id || null);
    //               onGetDateSafe(chemicalID, value?.id);
    //             }}
    //             value={PlantValue}
    //             isOptionEqualToValue={(option, value) => option?.id === value.id}
    //             options={PlantsData}
    //             renderInput={(params) => (
    //               <TextField
    //                 {...params}
    //                 slotProps={{ htmlInput: { ...params.inputProps, sx: { fontFamily: "Sans-font" } } }}
    //               />
    //             )}
    //           />
    //         </div>

    //         <div className="table-section">
    //           <span className="table-title">วันที่ปลอดภัย</span>
    //           <input
    //             value={safeDays.data}
    //             onChange={(e) =>
    //               setSafeDays((data) => ({
    //                 ...data,
    //                 data: e.target.value
    //               }))
    //             }
    //             type="number"
    //             placeholder="เช่น 10 , 30"
    //             disabled={safeDays.status === "loading"}
    //           />
    //         </div>

    //         <div className="bt-submitgroup">
    //           <button className="cancel" onClick={Cancel}>
    //             ยกเลิก
    //           </button>
    //           <button className="submit" onClick={onSubmit} disabled={!stateOnBt}>
    //             {popupDataManage.type === "insert" ? "เพิ่มข้อมูล" : popupDataManage.type === "edit" ? "แก้ไขข้อมูล" : ""}
    //           </button>
    //         </div>
    //       </div>
    //     )}
    //   </div>
 )
};
 
export default House;