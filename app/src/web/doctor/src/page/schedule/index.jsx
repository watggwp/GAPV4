import { Outlet } from "react-router";
import { useDoctor } from "../../Doctor";
import { useEffect } from "react";
import { clientMo } from "../../../../../assets/js/moduleClient";

export default function ScheduleIndex() {
    const { bannerCoverRef , contentRef , setTextPage } = useDoctor()
    
    useEffect(() => {
        bannerCoverRef.current.style.height = "30%"
        contentRef.current.style.height = "70%"

        setTextPage([
            "หน้าหลัก",
            "กำหนดการปลูก"
        ])

        clientMo.unLoadingPage()
    } , [bannerCoverRef, contentRef, setTextPage])

    return(
        <Outlet/>
    )
}