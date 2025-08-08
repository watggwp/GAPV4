import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import MainFarmer from "./src/main";

import SignUp from "./src/singupFile/Signup";
import House from "./src/houseFile/House";
import HouseList from "./src/HouseList";
import WeatherStation from "./src/weather-station";
import GreenhouseIndex, { Greenhouse } from "./src/content";
import Gaps from "./src/content/Gaps";
import MenuPlant from "./src/content/Gaps/MenuPlant";
import GreenhouseWrapper from "./src/content/warpperPage";
import ListFactor from "./src/content/Factor/ListFactor";
import DataForm from "./src/content/DataForm/DataForm";
import Report from "./src/content/Report/Report";
import Success from "./src/content/Success/Success";
import EcphForm from "./src/content/EcphForm/EcphForm";
import InformationReport from "./src/content/InformationReport";
import Sensor from "./src/content/Sensor";
import SensorGreenhouse from "./src/content/Sensor/sensor";
import PumpControlPage from "./src/content/Pump";
import Houses from "./src/HouseList/houses";
import HouseSetup from "./src/HouseList/setup";

export default function Router() {
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/farmer" element={<MainFarmer/>}>
                    <Route path="signup" element={<SignUp/>} />
                    <Route path="house" element={<House/>} />
                    <Route path="houses" element={<HouseList/>}>
                        <Route index element={<Houses/>} />
                        <Route path=":greenhouse_id" element={<HouseSetup/>} />
                    </Route>
                    <Route path="weather-station" element={<WeatherStation/>} />
                    <Route path="form" element={<GreenhouseIndex/>}>
                        <Route path=":greenhouse_id" element={<Greenhouse/>}>
                            <Route index element={
                                <GreenhouseWrapper element={<Gaps/>} namepage={"gap-greenhouse"} />
                            }/>
                            <Route path="information" element={
                                <GreenhouseWrapper element={<InformationReport/>} namepage={"gap-information"} />
                            }/>

                            <Route path=":gap_id/p" element={
                                <GreenhouseWrapper element={<MenuPlant/>} namepage={"gap-greenhouse-plant"} />
                            }/>
                            <Route path=":gap_id/z" element={
                                <GreenhouseWrapper element={<ListFactor type_path_factor={"z"}/>} namepage={"gap-greenhouse-fertilizer"} />
                            }/>
                            <Route path=":gap_id/c" element={
                                <GreenhouseWrapper element={<ListFactor type_path_factor={"c"}/>} namepage={"gap-greenhouse-chemical"} />
                            }/>
                            <Route path=":gap_id/d" element={
                                <GreenhouseWrapper element={<DataForm/>} namepage={"gap-greenhouse-dataform"} />
                            }/>

                            <Route path=":gap_id/s/h" element={
                                <GreenhouseWrapper element={<Success type_page={"h"}/>} namepage={"gap-greenhouse-success-h"} />
                            }/>
                            <Route path=":gap_id/s/cf" element={
                                <GreenhouseWrapper element={<Success type_page={"cf"}/>} namepage={"gap-greenhouse-success-cf"} />
                            }/>
                            <Route path=":gap_id/s/cp" element={
                                <GreenhouseWrapper element={<Success type_page={"cp"}/>} namepage={"gap-greenhouse-success-cp"} />
                            }/>

                            <Route path=":gap_id/ec-ph" element={
                                <GreenhouseWrapper element={<EcphForm/>} namepage={"gap-greenhouse-ec-ph"} />
                            }/>
                            <Route path=":gap_id/pump" element={
                                <GreenhouseWrapper element={<PumpControlPage/>} namepage={"gap-greenhouse-pump"} />
                            }/>

                            <Route path=":gap_id/sensor" element={
                                <GreenhouseWrapper element={<Sensor/>} namepage={"gap-greenhouse-sensor"} />
                            }/>
                            <Route path=":gap_id/sensor/:device_id" element={
                                <GreenhouseWrapper element={<SensorGreenhouse/>} namepage={"gap-greenhouse-sensor-device"} />
                            }/>

                            <Route path=":gap_id/r" element={
                                <GreenhouseWrapper element={<Report/>} namepage={"gap-greenhouse-report"} />
                            }/>
                            {/* <Route path="/farmer/form/:greenhouse_id/:menu/:gap_id" element={children}/> */}
                        </Route>
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}