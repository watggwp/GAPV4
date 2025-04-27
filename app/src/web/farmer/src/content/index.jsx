import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {clientMo}  from "../../../../assets/js/moduleClient";
import { CloseAccount } from "../method";
import { useFarmer } from "../main";
import { useParams } from "react-router";
import GreenhouseOutlet from "./outlet";

const GreenhouseContext = createContext({
    currentPage : "", 
    setCurrentPage : () => {}
})

export default function Greenhouse() {
    const { greenhouse_id } = useParams()
    const { uid , liff } = useFarmer()

    const [ currentPage , setCurrentPage ] = useState()
    const [ verifiedGreenhouse , setVerifiedGreenhouse ] = useState(false)

    const VerifiedGreenhouse = useCallback(async () => {

        if(!greenhouse_id) return

        const result = await clientMo.post('/api/farmer/farmhouse/select' , {
            id_farmhouse : greenhouse_id,
            uid : uid
        })

        switch(result) {
            case "access" :
                setVerifiedGreenhouse(true)
                break;
            default :
                CloseAccount("not line" , null , "ไม่พบโรงเรือนของท่าน")
        }
    } , [greenhouse_id, uid])

    // ไล่ให้เมนูเริ่มต้น เป็น List การปลูกเลย
    useEffect(()=>{
        VerifiedGreenhouse()
    } , [VerifiedGreenhouse])

    return(
        <GreenhouseContext.Provider 
            value={{
                currentPage , setCurrentPage
            }}
        >
            {
                verifiedGreenhouse && <GreenhouseOutlet/>
            }
        </GreenhouseContext.Provider>
    )
}

export function useGreenhouse() {
    return useContext(GreenhouseContext)
}