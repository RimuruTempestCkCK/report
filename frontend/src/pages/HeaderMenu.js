import React, { useState, useEffect, useRef } from "react"; 
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./HeaderMenu.css";

export default function HeaderMenu({ notifications = [] }) {
  const [showNotif, setShowNotif] = useState(false); 
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const notifRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    navigate("/login");
  }

  const toggleNotif = () => {
    setShowNotif(prev => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const removeNotification = (index) => {
    const newNotifications = [...localNotifications];
    newNotifications.splice(index, 1);
    setLocalNotifications(newNotifications);
  };

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      logout();
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const now = Date.now().valueOf() / 1000;
      if (decoded.exp < now) {
        logout();
      }
    } catch (e) {
      logout();
    }
  }, []);

  return (
    <>
      <header className="dashboard-header">
        <img src="/img/logo.png" alt="Logo Laporanku" className="logo-img" />
        
        <div className="header-right" ref={notifRef}>
          <div
            className="notif-icon-wrapper"
            onClick={toggleNotif} 
            style={{ cursor: "pointer", position: "relative" }}
          >
            <img src="/img/notif.svg" alt="Notifikasi" className="icon-svg" />
            {localNotifications.length > 0 && (
              <span className="notif-badge">{localNotifications.length}</span>
            )}
          </div>

          {showNotif && (
            <div className="toast-container position-static">
              {localNotifications.map((notif, index) => (
                <div key={index} className="toast" role="alert" aria-live="assertive" aria-atomic="true">
                  <div className="toast-header">
                    <strong className="me-auto">Notifikasi</strong>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => removeNotification(index)}></button>
                  </div>
                  <div className="toast-body">
                    {notif.message}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <img
            src="/img/keluar.svg"
            alt="Logout"
            className="icon-svg logout-icon"
            onClick={logout} 
            style={{ cursor: "pointer" }}
            title="Logout"
          />
        </div>
      </header>

      <nav className="dashboard-menu">
        <ul>
          <li className={location.pathname === "/dashboard" ? "active" : ""}>
            <Link to="/dashboard">
              <img src="/img/home.svg" alt="Dashboard" className="menu-icon" />
              Dashboard
            </Link>
          </li>
          <li className={location.pathname === "/add" ? "active" : ""}>
            <Link to="/add">
              <img src="/img/addm.svg" alt="Add" className="menu-icon" />
              Add
            </Link>
          </li>
          <li className={location.pathname === "/select" ? "active" : ""}>
            <Link to="/select">
              <img src="/img/pro.svg" alt="Select" className="menu-icon" />
              Select
            </Link>
          </li>
          <li className={location.pathname === "/report" ? "active" : ""}>
            <Link to="/report">
              <img src="/img/doc.svg" alt="Report" className="menu-icon" />
              Report
            </Link>
          </li>
          <li className={location.pathname === "/send" ? "active" : ""}>
            <Link to="/send">
              <img src="/img/kirim.svg" alt="Send" className="menu-icon" />
              Send
            </Link>
          </li>
          {/* <li className={location.pathname === "/pemasukan" ? "active" : ""}>
            <Link to="/pemasukan">
              <img src="/img/kirim.svg" alt="Send" className="menu-icon" />
              Pemasukan
            </Link>
          </li> */}
        </ul>
      </nav>
    </>
  );
}
