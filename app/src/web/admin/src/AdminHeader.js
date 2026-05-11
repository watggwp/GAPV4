import React, { useState, useRef } from "react";
import "./assets/style/AdminHeader.scss"; // Use the same style as Doctor or define new
import { clientMo } from "../../../assets/js/moduleClient";
import { PopupDom } from "../../../assets/js/module";
import ProfilePage from "./page/profile/Profile"; // Use the admin profile page

const AdminHeader = ({ setSession, isSidebarCollapsed, pageTitle, toggleSidebar }) => {
    // Profile States
    const RefPopup = useRef();
    const [BodyPopup, setBodyPopup] = useState(<></>);

    // --- Profile Logic ---
    const Home = (e) => {
        if (e) e.preventDefault();
        setBodyPopup(<></>); // Close popup
    };

    const Profile = (e) => {
        if (e) e.preventDefault();
        setBodyPopup(<ProfilePage RefPop={RefPopup} setPopup={setBodyPopup} session={setSession} returnToHome={Home} FetchProfileReload={() => { }} FetchNotify={() => {}} />);
    };

    const logout = () => {
        clientMo.LoadingPage();
        setTimeout(() => {
            clientMo.get('/api/logout')
                .then(() => {
                    setSession(true);
                    clientMo.unLoadingPage();
                })
                .catch(() => {
                    setSession(true);
                    clientMo.unLoadingPage();
                });
        }, 2000);
    };

    return (
        <div className="header-bar" style={{ width: '100%', marginBottom: '20px' }}>
            <PopupDom Ref={RefPopup} Body={BodyPopup} zIndex={999} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button className="mobile-menu-btn" onClick={toggleSidebar}>
                    ☰
                </button>
                <div className="page-title">
                    {pageTitle}
                </div>
            </div>

            <div className="header-actions">
                {/* Notifications are hidden for Admin currently */}
                
                <a href="#" className="profile-link" onClick={Profile}>
                    <span className="hide-mobile">โปรไฟล์</span>
                    <span className="show-mobile-icon">👤</span>
                </a>
                <div className="logout-btn" onClick={logout}>
                    <span className="hide-mobile">ออกจากระบบ</span>
                    <span className="show-mobile-icon">🚪</span>
                </div>
            </div>
        </div>
    );
};

export default AdminHeader;
