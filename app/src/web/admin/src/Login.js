import React, { useEffect, useRef, useState } from "react";
import { clientMo } from "../../../assets/js/moduleClient";
import './assets/style/Login.scss';

import env from "../../../env";
import Admin from "./Admin";

const Login = ({ setBodyFileMain, state = false, socket }) => {
    const Body = useRef();
    const IconUser = useRef();
    const IconPw = useRef();
    const pw = useRef();
    const ErrorLogin = useRef();
    const Form = useRef();

    const [errorMessage, setErrorMessage] = useState(""); // ใช้ state สำหรับแสดงข้อความข้อผิดพลาด

    let timeoutEmply = 0;

    useEffect(() => {
        let path = window.location.pathname.split("/").filter((path) => path);
        if (state && path.length !== 1) window.history.pushState({}, null, '/admin');

        if (navigator.platform === "Win32") {
            Body.current.setAttribute("computer", "");
        } else {
            Body.current.setAttribute("mobile", "");
        }

        // ซ่อน #loading splash screen ทันทีที่ Login mount (onLoad บน <div> ไม่ทำงาน)
        clientMo.unLoadingPage();
    }, [state]);

    const submitFrom = (e) => {
        e.preventDefault();
        
        ErrorLogin.current.style.transform = `translateY(${(Form.current.clientHeight / 2) + 30}px)`;
        ErrorLogin.current.removeAttribute("show");
        clearTimeout(timeoutEmply);
        setErrorMessage(""); // ล้างข้อความ error ก่อนส่งข้อมูล

        if (e.target[0].value !== '' && e.target[1].value !== '') {
            clientMo.LoadingPage();
            const formData = {
                username: e.target[0].value,
                password: e.target[1].value
            };

            setTimeout(() => {
                console.log("login")
                clientMo.post('/api/admin/auth', formData).then((context) => {
                    if (context === "1") {
                        // เข้าสู่ระบบสำเร็จ
                        setBodyFileMain(<Admin setBodyFileMain={setBodyFileMain} socket={socket} />);
                    } else if (context === "account_disabled") {
                        setErrorMessage("ผู้ใช้บัญชีนี้ถูกปิดใช้งาน");
                        ErrorLogin.current.setAttribute("show", "");
                    } else if (context === "account_deleted") {
                        setErrorMessage("ผู้ใช้บัญชีนี้ถูกลบ");
                        ErrorLogin.current.setAttribute("show", "");
                    } else {
                        setErrorMessage("รหัสประจำตัวผู้ดูแลระบบหรือรหัสผ่านไม่ถูกต้อง");
                        ErrorLogin.current.setAttribute("show", "");
                        for (let x = 0; x < e.target.length - 1; x++) {
                            let prevent = e.target[x].parentElement;
                            e.target[x].blur();
                            prevent.classList.remove('empty');
                            e.target[x].value = '';
                        }
                    }
                    clientMo.unLoadingPage();
                });
            }, 1500);
        } else {
            let focus = true;
            for (let x = 0; x < e.target.length - 1; x++) {
                let prevent = e.target[x].parentElement;
                if (e.target[x].value === "") {
                    if (focus) {
                        focus = false;
                        prevent.focus();
                    }
                    prevent.classList.add('empty');
                    e.target[x].previousElementSibling.children[0].setAttribute("emply", "");
                } else {
                    prevent.classList.remove('empty');
                    e.target[x].previousElementSibling.children[0].removeAttribute("emply");
                }
            }
            timeoutEmply = setTimeout(() => {
                IconUser.current.removeAttribute("emply");
                IconPw.current.removeAttribute("emply");
            }, 400);
        }
    };

    return (
        <div style={{ backgroundImage: `url(${env.Background})` }} ref={Body} className="login-admin">
            <form ref={Form} autoComplete="off" onSubmit={submitFrom}>
                <div className="Logo-App">
                    <img src={`${env.subpath_server}/logo2.png`} alt="Logo"></img>
                    <span>Admin</span>
                </div>
                <label>
                    <span>
                        <svg ref={IconUser} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4Z"/>
                        </svg>
                    </span>
                    <input autoComplete="off" id="username-admin-login" type="text" name="username" placeholder="รหัสประจำตัวผู้ดูแลระบบ" />
                </label>
                <label>
                    <span>
                        <svg ref={IconPw} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 17a2 2 0 0 0 2-2a2 2 0 0 0-2-2a2 2 0 0 0-2 2a2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5a5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3Z"/>
                        </svg>
                    </span>
                    <input ref={pw} autoComplete="off" type="password" name="password" placeholder="รหัสผ่าน" id="password-admin-login" />
                </label>
                <button type="submit" className="bt-submit-form">เข้าสู่ระบบ</button>
            </form>
            <p ref={ErrorLogin} className="error-login">{errorMessage}</p>
        </div>
    );
};

export default Login;
