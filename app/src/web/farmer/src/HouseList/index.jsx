import React from "react";
import "./HouseList.scss";
import { Outlet } from "react-router";

const HouseList = () => {
    return (
        <div className="House-List">
            <Outlet/>
        </div>
    );
};

export default HouseList;
