import React, { createContext, useContext, useEffect, useState } from "react";
import {clientMo}  from "../../../assets/js/moduleClient";
import {useLiff} from "../../../assets/js/module";
import MenuMain from "../src/content/mainFarmHouse";
import House from "../src/houseFile/House";
import Signup from "../src/singupFile/Signup"
import { CloseAccount } from "./method";
import HouseList from "./HouseList/HouseList";
import liff from "@line/liff";
import WeatherStation from "./weather-station";

const FarmerContext = createContext({
    liff : liff,
    uid : ""
})

const MainFarmer = ({socket , idLiff , Path}) => {
    const [body , setBody] = useState(<></>)
    const [init , Liff] = useLiff(idLiff)
    const [ uid , setUid ] = useState("")

    useEffect(()=>{
        init.then(()=>{
            if(Liff.isInClient()) {
                if(Liff.isLoggedIn()) {
                    Liff.getProfile().then((profile)=>{
                        // สมัครเข้าต้องค้นหาบัญชีโดยไม่ตรง status ยกเลิกบัญชี
                        if(profile.userId) {
                            LoadPage(profile.userId , Liff)
                        }
                    })
                } else {
                    Liff.login()
                }
            } else {
                let UID = "U915317b45fea27966b03ff8e47960321"
                LoadPage(UID , Liff)
                // CloseAccount("not line" , null , "กรุณาเข้าผ่านไลน์แอปพลิเคชั่น")
            }
        }).catch(err=>{
            console.log(err)
            CloseAccount("not line" , null , "พบปัญหาจากระบบ")
        })

    } , [])

    const LoadPage = async (uid, Liff) => {
        const result = await clientMo.post("/api/farmer/sign", { uid: uid, page: Path });
        console.log(Path)
        setUid(uid)
        if (Path === "signup" && result !== "error auth") {
            if (result === "close" || result === "no account") setBody(<Signup liff={Liff} uid={uid} />);
            else if (result === "search") CloseAccount("not line", null, "บัญชีลงทะเบียนแล้ว");

        } else if (Path === "houses" && result !== "error auth") {
            if (result === "close" || result === "no account") CloseAccount("not line", null, "ไม่พบบัญชี");
            else if (result === "search") setBody(<HouseList liff={Liff} uid={uid} />);

        } else if (Path === "house" && result !== "error auth") {
            if (result === "close" || result === "no account") CloseAccount("not line", null, "ไม่พบบัญชี");
            else if (result === "search") setBody(<House liff={Liff} uid={uid} />);

        } else if (Path === "weather-station" && result !== "error auth") {
            if (result === "close" || result === "no account") CloseAccount("not line", null, "ไม่พบบัญชี");
            else if (result === "search") setBody(<WeatherStation/>);

        } else if (Path === "form" && result !== "error auth") {
            const auth = window.location.pathname.split("/")[3];
            if (auth && result !== "close") {
                setBody(<MenuMain liff={Liff} uid={uid} />);
            } else CloseAccount("not line", null, "ไม่พบบัญชี");
        } else {
            CloseAccount("not line", null, "พบปัญหาจากระบบ");
        }
    };

    return(
        <FarmerContext.Provider
            value={{
                liff : Liff,
                uid
            }}
        >
            {body}
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