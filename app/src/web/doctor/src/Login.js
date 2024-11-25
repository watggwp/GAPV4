import React, { useEffect, useRef, useState } from "react";
import { PatternCheck, PopupDom, useLiff } from "../../../assets/js/module";
import { clientMo } from "../../../assets/js/moduleClient";
import env from "../../../env";
import Doctor from "./Doctor";
import './assets/style/Login.scss';
                                  
const Login = ({ setMain, socket, isClick = 0 }) => {
  const [inputUser, setInputUser] = useState("");
  const [getLoadUid, setLoadUid] = useState(false);
  const [getUidLine, setUidLine] = useState("");
  const [formPersonal, setFormPersonal] = useState(<></>);
  const [role, setRole] = useState("doctor");

  const personalRef = useRef();
  const bodyRef = useRef();

  const iconUserRef = useRef();
  const iconPwRef = useRef();
  const pwRef = useRef();
  const errorLoginRef = useRef();
  const formRef = useRef();

  let timeoutEmply = 0;

  const [init, liff] = useLiff("1661049098-dorebKYg");

  useEffect(() => {
    if (isClick) window.history.pushState({}, null, '/doctor');
    FetchProfile();

    if (navigator.platform === "Win32") {
      bodyRef.current.setAttribute("computer", "");
    } else {
      bodyRef.current.setAttribute("mobile", "");
    }
  }, []);

  const FetchProfile = () => {
    init.then(async () => {
      if (liff.isInClient()) {
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          if (profile.userId) {
            setUidLine(profile.userId);
            const Uid = await clientMo.post("/api/doctor/checkline", { id: profile.userId });
            setInputUser(Uid);
            setLoadUid(true);
          }
        }
      } else {
        setLoadUid(true);
      }
    }).catch(err => {});
  };

  const submitForm = (e) => {
    e.preventDefault();

    errorLoginRef.current.style.transform = `translateY(${(formRef.current.clientHeight / 2) + 30}px)`;
    errorLoginRef.current.removeAttribute("show");
    clearTimeout(timeoutEmply);

    if (e.target.username.value !== '' && e.target.password.value !== '') {
      setFormPersonal(<></>);
      clientMo.LoadingPage();

      const formData = {
        username: e.target.username.value,
        password: e.target.password.value,
        uid_line: getUidLine,
        role: role
      };

      setTimeout(() => {
        clientMo.postForm('/api/doctor/auth', formData).then((context) => {
          if (context === "pass") {
            setMain(<Doctor setMain={setMain} socket={socket} isClick={1} username={formData.username} password={formData.password} />);
          } else if (context === "account") {
            errorLoginRef.current.innerHTML = "บัญชีถูกระงับ กรุณาติดต่อผู้ดูแลระบบ";
            errorLoginRef.current.setAttribute("show", "");
            for (let x = 0; x < e.target.length - 1; x++) {
              let prevent = e.target[x].parentElement;
              prevent.classList.remove('empty');
              e.target[x].value = '';
            }
          } else if (context.indexOf("wait") >= 0) {
            let id = context.split(':');
            setFormPersonal(<FormPersonal id_doctor={id[1]} Ref={personalRef} setPopup={setFormPersonal} Err={errorLoginRef} main={{ setMain: setMain, socket: socket }} />);
            for (let x = 0; x < e.target.length - 1; x++) {
              let prevent = e.target[x].parentElement;
              e.target[x].blur();
              prevent.classList.remove('empty');
              e.target[x].value = '';
            }
          } else {
            errorLoginRef.current.innerHTML = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
            errorLoginRef.current.setAttribute("show", "");
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
        iconUserRef.current.removeAttribute("emply");
        iconPwRef.current.removeAttribute("emply");
      }, 400);
    }
  };

  return (
    <>
      <PopupDom Ref={personalRef} Body={formPersonal} zIndex={5} />
      <div style={{ backgroundImage: `url(${env.Background})` }} onLoad={() => clientMo.unLoadingPage()} ref={bodyRef} className="login-doctor">
        <form ref={formRef} autoComplete="off" onSubmit={submitForm}>
          <div className="Logo-App">
            <img src="/logo2.png" alt="Logo" />
            <span>เจ้าหน้าที่</span>
          </div>
          <div className="role-selection">
            <label>
              <input type="radio" name="role" value="doctor" checked={role === "doctor"} onChange={() => setRole("doctor")} />
              <span>Doctor</span>
            </label>
            <label>
              <input type="radio" name="role" value="analyst" checked={role === "analyst"} onChange={() => setRole("analyst")} />
              <span>Analyst</span>
            </label>
            <label>
              <input type="radio" name="role" value="consultant" checked={role === "consultant"} onChange={() => setRole("consultant")} />
              <span>Consultant</span>
            </label>
          </div>
          <label>
            <span>
              <svg ref={iconUserRef} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4Z" />
              </svg>
            </span>
            {getLoadUid ?
              <input defaultValue={inputUser} id="username-doctor-login" autoComplete="off" type="text" name="username" placeholder="รหัสประจำตัวเจ้าหน้าที่" /> :
              <input autoComplete="off" id="username-doctor-login" type="text" name="username" placeholder="รหัสประจำตัวเจ้าหน้าที่" />
            }
          </label>
          <label>
            <span>
              <svg ref={iconPwRef} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 17a2 2 0 0 0 2-2a2 2 0 0 0-2-2a2 2 0 0 0-2 2a2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 10 0v2h1m-3 0V6a3 3 0 0 0-6 0v2h6Z" />
              </svg>
            </span>
            <input ref={pwRef} id="password-doctor-login" autoComplete="off" type="password" name="password" placeholder="รหัสผ่าน" />
          </label>
          <button type="submit" className="bt-submit-form">เข้าสู่ระบบ</button>
        </form>
        <p ref={errorLoginRef} className="error-login"></p>
      </div>
    </>
  );
};

const FormPersonal = ({ main = { setMain: null, socket: null }, id_doctor, Ref, setPopup, Err }) => {
  const [listStation, setListStation] = useState(null);

  const firstnameRef = useRef();
  const lastnameRef = useRef();
  const stationRef = useRef();
  const passwordRef = useRef();

  const btConfirmRef = useRef();

  useEffect(() => {
    FetchStation();
  }, []);

  const FetchStation = async () => {
    const Data = await clientMo.post("/api/doctor/station/list");
    setListStation(
      JSON.parse(Data).map((val, key) => (
        <option key={key} value={val.id}>{val.name}</option>
      ))
    );
    Ref.current.style.opacity = "1";
    Ref.current.style.visibility = "visible";
  };

  const close = () => {
    Ref.current.style.opacity = "0";
    Ref.current.style.visibility = "hidden";
    setTimeout(() => {
      setPopup(<></>);
    }, 500);
  };

  const confirm = async () => {
    const first = firstnameRef.current;
    const last = lastnameRef.current;
    const sta = stationRef.current;
    const pw = passwordRef.current;

    if (first.value && last.value && sta.value && pw.value) {
      clientMo.LoadingPage();
      setTimeout(async () => {
        const result = await clientMo.post('/api/doctor/savePersonal', {
          firstname: first.value,
          lastname: last.value,
          station: sta.value,
          username: id_doctor,
          password: pw.value
        });
        if (result === "pass") {
          main.setMain(<Doctor isClick={1} setMain={main.setMain} socket={main.socket} username={id_doctor} password={pw.value} />);
        } else if (result === "password") {
          pw.setAttribute('err', "");
          pw.setAttribute('placeholder', "รหัสผ่านไม่ถูกต้อง");
          pw.value = "";
        } else if (result === "account") {
          Err.current.innerHTML = "บัญชีถูกระงับ กรุณาติดต่อผู้ดูแลระบบ";
          Err.current.setAttribute("show", "");
          close();
        }

        clientMo.unLoadingPage();
      }, 1000);
    }
  };

  const checkValue = () => {
    const first = firstnameRef.current;
    const last = lastnameRef.current;
    const sta = stationRef.current;
    const pw = passwordRef.current;

    if (first.value && PatternCheck(first.value).thaiName && last.value && PatternCheck(last.value).thaiName && sta.value && pw.value) 
      btConfirmRef.current.setAttribute("confirm", "");
    else 
      btConfirmRef.current.removeAttribute("confirm");
  };

  return (
    <section id="form-personal-doctor">
      <span className="head">ยืนยันตัวตนเจ้าหน้าที่</span>
      <div className="form">
        <div className="id">
          <span>รหัสประตัวเจ้าหน้าที่</span>
          <input readOnly value={id_doctor}></input>
        </div>
        <div className="profile">
          <div className="input-field">
            <span>ชื่อ</span>
            <input onChange={checkValue} ref={firstnameRef} placeholder="ภาษาไทย ไม่มีคำนำหน้า เช่น สมชาย"></input>
          </div>
          <div className="input-field">
            <span>นามสกุล</span>
            <input onChange={checkValue} ref={lastnameRef} placeholder="ภาษาไทย เช่น สุขใจ"></input>
          </div>
          <div className="input-field">
            <span>ศูนย์ปฏิบัติหน้าที่</span>
            <select onChange={checkValue} ref={stationRef} defaultValue={""}>
              <option value={""} disabled>เลือกศูนย์</option>
              {listStation}
            </select>
          </div>
        </div>
        <div className="password">
          <input onChange={checkValue} ref={passwordRef} autoComplete="off" type="password" placeholder="รหัสผ่าน"/>
        </div>
      </div>
      <div className="bt">
        <button onClick={close} className="cancel">ยกเลิก</button>
        <button ref={btConfirmRef} onClick={confirm} className="submit">ยืนยัน</button>
      </div>
    </section>
  );
};

export default Login;


    // componentDidMount() {
    //     let pathcheck = window.location.pathname.split("/").filter((val , index)=>(val != ""))
    //     // if(this.props.state && pathcheck[0] === "doctor" && pathcheck.length == 1) {
    //     //     window.history.replaceState({} , null , '/doctor')
    //     // }
    //     // else {
    //     //     window.history.pushState({} , null , '/doctor')
    //     // }
    //     // else window.history.replaceState({} , null , '/')
    // }
// const submitFrom = (e) => {
    //     if(e.target[0].value != '' && e.target[1].value != ''){
    //         this.setState({formPersonal : <></>})
    //         clientMo.rmAction('#loading' , 'hide' , 0)
    //         const formData = {
    //             username : e.target[0].value,
    //             password : e.target[1].value
    //         }

    //         setTimeout(()=>{
    //             clientMo.post('/api/doctor/auth' , formData).then((context)=>{
    //                 let errorLogin = document.querySelector('.error-login')
    //                 errorLogin.classList.add('hide')
    //                 errorLogin.innerHTML = ""
    //                 if(context == "pass") {
    //                     setMain(<Doctor type={1} socket={socket} main={setMain}/>)
                        
    //                 } else if (context == "account") {
    //                     errorLogin.classList.remove('hide')
    //                     errorLogin.innerHTML = "บัญชีถูกระงับ กรุณาติดต่อผู้ดูแลระบบ"
    //                     for(let x = 0; x < e.target.length-1; x++) {
    //                         e.target[x].removeAttribute('style')
    //                         document.querySelector('.content-user .label-login').classList.remove('moveOn')
    //                         document.querySelector('.content-pw .label-login').classList.remove('moveOn')
    //                         document.querySelector('.content-pw').removeAttribute('style')
    //                         e.target[x].value = ''
    //                     }
    //                 } else if (context.indexOf("wait") >= 0) {
    //                     let id = context.split(':')
    //                     document.querySelector("#box-login-doctor #form-personal").setAttribute("show" , "")
    //                     for(let x = 0; x < e.target.length-1; x++) {
    //                         e.target[x].removeAttribute('style')
    //                         document.querySelector('.content-user .label-login').classList.remove('moveOn')
    //                         document.querySelector('.content-pw .label-login').classList.remove('moveOn')
    //                         document.querySelector('.content-pw').removeAttribute('style')
    //                         e.target[x].value = ''
    //                     }
    //                     this.setState({
    //                         formPersonal : <FormPersonal id={id[1]} ele={this} main={this.props.main} socket={this.props.socket}/>
    //                     })
    //                 }
    //                 else {
    //                     errorLogin.classList.remove('hide')
    //                     errorLogin.innerHTML = "รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง."
    //                     for(let x = 0; x < e.target.length-1; x++) {
    //                         e.target[x].removeAttribute('style')
    //                         document.querySelector('.content-user .label-login').classList.remove('moveOn')
    //                         document.querySelector('.content-pw .label-login').classList.remove('moveOn')
    //                         document.querySelector('.content-pw').removeAttribute('style')
    //                         e.target[x].value = ''
    //                     }
    //                 }
    //                 clientMo.addAction('#loading' , 'hide' , 1500)
    //             })
    //         } , 1500)
    //     } else {
    //         for(let x = 0; x < e.target.length-1; x++) {
    //             (e.target[x].value == "") ? e.target[x].classList.add('empty') : e.target[x].classList.remove('empty');
    //         }
    //     }
    //     e.preventDefault()
    // }

    // return (
        // <div id="box-login-doctor">
        //     <div id="form-personal">{formPersonal}</div>
        //     <form autoComplete="off" onSubmit={submitFrom} className="content-login">
        //         <div className="Logo-App"><img width={150}  src="/logo2.png"></img></div>
        //         <label className="content-user">
        //             <span className="label-login">รหัสประจำตัวผู้ส่งเสริม</span>
        //             <input defaultValue={InputUser} autoComplete="off" onChange={changeValUs} className="inputForm" type="text" name="username" placeholder="รหัสประจำตัวผู้ส่งเสริม"/>
        //         </label>
        //         <label className="content-pw">
        //             <span className="label-login">รหัสผ่าน</span>
        //             <input autoComplete="off" onChange={changeValPw} className="inputForm" type="password" name="password" placeholder="รหัสผ่าน"/>
        //         </label>
        //         <button type="submit" className="bt-submit-form">เข้าสู่ระบบ</button>
        //         <p className="error-login hide"></p>
        //     </form>
        // </div>
    // )

    // class FormPersonal extends Component {
//     constructor(){
//         super();
//         this.state = {
//             error : <></>,
//             ListStation : <></>
//         }
//     }

//     componentDidMount(){
//         clientMo.post("/api/doctor/station/list").then((val)=>{
//             this.setState({
//                 ListStation : JSON.parse(val).map((val , key)=>(
//                     <option key={key} value={val.id}>{val.name_station}</option>
//                 ))
//             })
//         })
//     }

//     confirm = () => {
//         let firstname = document.querySelector("#box-login-doctor #form-personal #firstname")
//         let lastname = document.querySelector("#box-login-doctor #form-personal #lastname")
//         let station = document.querySelector("#box-login-doctor #form-personal #station")
//         let password = document.querySelector("#box-login-doctor #form-personal #password")

//         if(firstname.value && lastname.value && station.value && password.value) {
//             clientMo.rmAction('#loading' , 'hide' , 0)
//             document.querySelectorAll("#box-login-doctor #form-personal .field-personal").forEach((val , key) => {
//                 val.removeAttribute('request')
//             })
//             setTimeout(()=>{
//                 clientMo.post('/api/doctor/savePersonal' , {
//                     firstname:firstname.value,
//                     lastname:lastname.value,
//                     station:station.value,
//                     username:this.props.id,
//                     password:password.value
//                 }).then((result)=>{
//                     if(result === "pass"){
//                         this.props.main.setState({
//                             body : <Doctor type={1} main={this.props.main} socket={this.props.socket}/>
//                         })
//                     } else if(result === "password") {
//                         password.setAttribute('error' , "")
//                         password.setAttribute('placeholder' , "รหัสผ่านไม่ถูกต้อง")
//                         password.value = ""
//                     } else if (result === "account") {
//                         let eleError = document.querySelector('#box-login-doctor #form-personal #account-error')
//                         eleError.setAttribute("show" , "")
//                         this.setState({
//                             error : <ShowError ele={this}/>
//                         })
//                     }
    
//                     clientMo.unLoadingPage()
//                 })
//             } , 1500)
//         } else {
//             document.querySelectorAll("#box-login-doctor #form-personal .field-personal").forEach((val , key) => {
//                 (!val.value) ? val.setAttribute('request' , "") : val.removeAttribute('request')
//             })
//         }
//     }

//     cancel = () => {
//         document.querySelector("#box-login-doctor #form-personal").removeAttribute("show")
//         setTimeout(()=>{
//             this.props.ele.setState({
//                 formPersonal : <></>
//             })
//         } , 1000)
//     }

//     render(){
//         return(
//             <>
//             <div id="account-error">
//                 {this.state.error}
//             </div>
//             <div id="form">
//                 <div id="id-doctor">
//                     รหัสประจำตัว
//                     <input value={this.props.id} readOnly></input>
//                 </div>
//                 <div id="form-input">
//                     <div id="fullname">
//                         <div id="input-firstname">
//                             <span>ชื่อ</span>
//                             <input type="text" id="firstname" className="field-personal"></input>
//                         </div>
//                         <div id="input-lastname">
//                             <span>นามสกุล</span>
//                             <input type="text" id="lastname" className="field-personal"></input>
//                         </div>
//                     </div>
//                     <div id="station-farm">
//                         <span>ศูนย์ปฏิบัติหน้าที่</span>
//                         <select id="station" className="field-personal" defaultValue={0}>
//                             <option value={0}>เลือกศูนย์</option>
//                             {this.state.ListStation}
//                         </select>
//                         {/* <input type="text" id="station" className="field-personal"></input> */}
//                     </div>
//                 </div>
//                 <div id="field-password">
//                     <input id="password" placeholder="รหัสผ่าน" type="password" className="field-personal"></input>
//                 </div>
//                 <div id="confirm">
//                     <button id="bt-cancel" onClick={this.cancel}>ยกเลิก</button>
//                     <button id="bt-confirm" onClick={this.confirm}>บันทึกข้อมูล</button>
//                 </div>
//             </div>
//             </>
//         )
//     }
// }

// class ShowError extends Component {

//     confirm = () => {
//         document.querySelector("#box-login-doctor #form-personal").removeAttribute("show")
//         setTimeout(()=>{
//             this.props.ele.setState({
//                 formPersonal : <></>
//             })
//         } , 1000)
//     }

//     render() {
//         return(
//             <div id="error-account">
//                 <div>บัญชีถูกระงับ กรุณาติดต่อผู้ดูแลระบบ</div>
//                 <button onClick={this.confirm}>ตกลง</button>
//             </div>
//         )
//     }
// }