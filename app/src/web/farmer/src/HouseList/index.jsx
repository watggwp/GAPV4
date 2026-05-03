import React from "react";
import "./HouseList.scss";
import { Outlet } from "react-router";

const HouseList = () => {
    return (
        <div className="House-List">
            <div className="title">ตั้งค่าโรงเรือน</div>
            {/* <div className="sub-title">เปิด / ปิด</div> */}
            <Outlet/>
        </div>
    );
};

export default HouseList;
