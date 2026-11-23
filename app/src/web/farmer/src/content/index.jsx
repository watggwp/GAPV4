import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clientMo } from "../../../../assets/js/moduleClient";
import { CloseAccount } from "../method";
import { useFarmer } from "../main";
import { Outlet, useParams } from "react-router";
import GreenhouseOutlet from "./outlet";

const GreenhouseContext = createContext({
    currentPage: "",
    setCurrentPage: () => { }
})

export default function GreenhouseIndex() {
    return (<Outlet />)
}

export function Greenhouse() {
    const { greenhouse_id } = useParams()
    const { uid, liff } = useFarmer()

    const [currentPage, setCurrentPage] = useState()
    const [verifiedGreenhouse, setVerifiedGreenhouse] = useState(false)

    const VerifiedGreenhouse = useCallback(async (isActive) => {

        if (!greenhouse_id) return
        if (!uid) return // รอให้ uid พร้อมก่อน ไม่งั้น API จะ fail แล้วขึ้น popup

        const select = () => clientMo.post('/api/farmer/farmhouse/select', {
            id_farmhouse: greenhouse_id,
            uid: uid
        })

        // ได้ค่าว่าง = request ไม่ถึง/ถูกตัด (เน็ตมือถือหลุด เปลี่ยนหน้า) ลองใหม่ 1 ครั้งก่อน
        let result = await select()
        if (result === "" && isActive()) result = await select()
        if (!isActive()) return // ออกจากหน้านี้ไปแล้ว ไม่ต้องแจ้ง error ของหน้าเก่า

        switch (result) {
            case "access":
                setVerifiedGreenhouse(true)
                break;
            case "close":
            case "error auth":
                CloseAccount(result, null)
                break;
            case "not":
                CloseAccount("not line", null, "ไม่พบโรงเรือนของท่าน")
                break;
            case "":
                CloseAccount("not line", null, "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่")
                break;
            default:
                CloseAccount("not line", null, "พบปัญหาจากระบบ")
        }
    }, [greenhouse_id, uid])

    // ไล่ให้เมนูเริ่มต้น เป็น List การปลูกเลย
    useEffect(() => {
        let active = true
        VerifiedGreenhouse(() => active)
        return () => { active = false }
    }, [VerifiedGreenhouse])

    return (
        <GreenhouseContext.Provider
            value={{
                currentPage, setCurrentPage
            }}
        >
            {
                verifiedGreenhouse && <GreenhouseOutlet />
            }
        </GreenhouseContext.Provider>
    )
}

export function useGreenhouse() {
    return useContext(GreenhouseContext)
}