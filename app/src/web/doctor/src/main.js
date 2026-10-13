import React, { useEffect, useState } from "react";
import liff from "@line/liff";
import { clientMo } from "../../../assets/js/moduleClient";
import { initLiff } from "../../../assets/js/module";

import Login from "./Login";
import Doctor from "./Doctor";

import './assets/style/main.scss'

// เปิดจากแอป LINE (กดปุ่มในการแจ้งเตือน) → เข้าระบบด้วยบัญชี LINE ที่ผูกกับบัญชีหมอไว้แล้ว
const LIFF_DOCTOR = process.env.REACT_APP_LIFF_DOCTOR
const openedFromLine = () =>
    /Line\//i.test(navigator.userAgent) || window.location.search.includes("liff.state")

const loginWithLine = async () => {
    if (!LIFF_DOCTOR || !openedFromLine()) return false
    try {
        // liff.init พาไปหน้าที่ลิงก์ระบุ (liff.state) ให้เอง
        await initLiff(LIFF_DOCTOR)
        if (!liff.isLoggedIn()) return false
        const profile = await liff.getProfile().catch(() => ({}))
        const result = await clientMo.post("/api/doctor/line/login", {
            accessToken: liff.getAccessToken(),
            uid: profile.userId
        })
        return result === "pass"
    } catch (e) {
        return false
    }
}

const MainDoctor = ({ socket }) => {
    const [Body, setBody] = useState()

    useEffect(() => {
        FetchCheck()
    }, [])

    const FetchCheck = async () => {
        if (window.location.href.indexOf("/doctor/logout") >= 0) {
            window.history.replaceState({}, "", "/doctor")
            await clientMo.get('/api/logout')
            setBody(<Login socket={socket} setMain={setBody} />)
        } else {
            const context = await clientMo.post('/api/doctor/check')
            if (context) {
                // มี session แล้ว แต่ถ้าเปิดผ่านลิงก์ LIFF ต้อง init ก่อนเพื่อไปหน้าที่ลิงก์ระบุ
                if (LIFF_DOCTOR && window.location.search.includes("liff.state")) await initLiff(LIFF_DOCTOR).catch(() => { })
                setBody(<Doctor setMain={setBody} socket={socket} />)
            }
            else if (await loginWithLine()) {
                socket.disconnect().connect()
                setBody(<Doctor setMain={setBody} socket={socket} />)
            }
            else setBody(<Login socket={socket} setMain={setBody} />)
        }
    }

    return (Body)
}

export default MainDoctor
