import { Outlet } from "react-router";
import { useEffect } from "react";
import { useAdminContext } from "../../Admin";
import { clientMo } from "../../../../../assets/js/moduleClient";

export default function ScheduleIndex() {
    const { TabOn , titlePageNested } = useAdminContext()
    
    useEffect(() => {
        titlePageNested(70, 30, [
            "หน้าหลัก",
            "แผนการปลูก"
        ])

        clientMo.unLoadingPage()
    } , [titlePageNested])

    useEffect(() => {
        TabOn.addTimeOut(TabOn.end());
    } , [TabOn])

    return(
        <Outlet/>
    )
}