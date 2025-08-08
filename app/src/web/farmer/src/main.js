import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {clientMo}  from "../../../assets/js/moduleClient";
import {useLiff} from "../../../assets/js/module";
import { CloseAccount } from "./method";
import liff from "@line/liff";
import { Outlet, useLocation } from "react-router";

const FarmerContext = createContext({
    liff : liff,
    uid : ""
})

const liff_id_mapping = {
    "signup" : process.env.REACT_APP_LINE_SIGNUP ,
    "house" : process.env.REACT_APP_LINE_HOUSE ,
    "form" : process.env.REACT_APP_LINE_FORM ,
    "houses" : process.env.REACT_APP_LINE_HOUSELIST,
    "weather-station" : process.env.REACT_APP_WEATHER_STATION,
}

const MainFarmer = () => {
    const location = useLocation();
    const page = location.pathname.split("/")[2];

    const [ init , Liff ] = useLiff(liff_id_mapping[page])
    const [ uid , setUid ] = useState("")
    const [ verified , setVerified ] = useState(false)

    const RouterPage = useCallback(async (uid) => {
        const result = await clientMo.post("/api/farmer/sign", { uid: uid, page: page });
        setUid(uid)

        switch(result) {
            case "error auth" :
                CloseAccount("not line", null, "พบปัญหาจากระบบ")
                break
            default :
                switch(page) {
                    case "signup" :
                        switch(result) {
                            case "search" :
                                CloseAccount("not line", null, "บัญชีลงทะเบียนแล้ว")
                                break;
                            default :
                                setVerified(true)
                                break;
                        }
                        break;
                    case "form" :
                    case "weather-station" :
                    case "house" :
                    case "houses" :
                        switch(result) {
                            case "search" :
                                setVerified(true)
                                break;
                            default :
                                CloseAccount("not line", null, "ไม่พบบัญชี")
                                break;
                        }
                        break;
                    default :
                        CloseAccount("not line", null, "URL ไม่ถูกต้อง")
                        break;
                }
                break;
        }
    } , [page])

    const LineInit = useCallback( async () => {
        try {
            await init

            if(!Liff.isInClient()) {
                if(process.env.NODE_ENV !== "development") {
                    CloseAccount("not line" , null , "โปรดเข้าระบบด้วยไลน์")
                    return
                }
                let UID = "U915317b45fea27966b03ff8e47960321"
                RouterPage(UID , Liff)
                return
            }

            if(!Liff.isLoggedIn()) {
                Liff.login()
                return
            }

            const profile = await Liff.getProfile()
            profile.userId && RouterPage(profile.userId , Liff)
        } catch(err) {
            CloseAccount("not line" , null , "พบปัญหาจากระบบ")
        }
    } , [Liff, RouterPage, init])

    useEffect(()=>{
        LineInit()
    } , [LineInit])

    return(
        <FarmerContext.Provider
            value={{
                liff : Liff,
                uid
            }}
        >
            {
                verified && <Outlet/>
            }
            <section style={{
                display : "flex",
                position : "fixed",
                justifyContent : "center",
                alignItems : "center",
                top : "0",
                left : "0",
                width : "100vw",
                height : "100vh",
                backgroundColor : "transparent",
                backdropFilter : "blur(8px)",
                opacity : "0",
                visibility : "hidden",
                transition : "0.5s opacity , 0.5s visibility",
                zIndex : "999",
                padding : "8px"
            }} id="session-farmer">
                <div className="body" style={{
                    display : "flex",
                    justifyContent : "center",
                    alignItems : "center",
                    flexDirection : "column",
                    backgroundColor : "white",
                    boxShadow : "0px 4px 4px gray",
                    borderRadius : "18px",
                    padding : "6px 14px"
                }}>
                    <div id="session-text" style={{
                        font : "20px Sans-font",
                        textAlign : "center",
                        // fontFamily : "Sans-font",
                        // fontSize : "20px",
                        marginBottom : "11px"
                    }}></div>
                    <button onClick={()=>Liff.closeWindow()} style={{
                        fontFamily : "Sans-font",
                        fontSize : "20px",
                        borderRadius : "18px",
                        border : "0",
                        outline : "0",
                        padding : "0 14px",
                        backgroundColor : "red",
                        fontWeight : "900",
                        color : "white"
                    }}>ตกลง</button>
                </div>
            </section>
        </FarmerContext.Provider>
    )
}

export function useFarmer() {
    return useContext(FarmerContext)
}

export default MainFarmer