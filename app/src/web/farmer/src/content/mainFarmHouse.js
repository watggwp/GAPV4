import React, { useCallback, useEffect, useState } from "react";


import {clientMo}  from "../../../../assets/js/moduleClient";
import FarmBody from "./FarmBody";
import { CloseAccount, GetPath } from "../method";
import { useFarmer } from "../main";

const MenuMain = () => {
    const { liff , uid } = useFarmer()
    const [Body , setBody] = useState(<></>)

    const CheckFarm = useCallback(async () => {
        const result = await clientMo.post('/api/farmer/farmhouse/select' , {
            id_farmhouse : GetPath()[0],
            uid : uid
        })

        if(result === "access") setBody(<FarmBody id_farmhouse={GetPath()[0]}/>)
        else if (result === "not") CloseAccount("not line" , null , "ไม่พบโรงเรือนของท่าน")
    } , [liff, uid])

    // ไล่ให้เมนูเริ่มต้น เป็น List การปลูกเลย
    useEffect(()=>{
        CheckFarm()
    } , [CheckFarm])

    return (Body)
}

export default MenuMain