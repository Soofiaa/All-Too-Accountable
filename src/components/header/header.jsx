import React from "react";
import { useNavigate } from "react-router-dom";
import "./header.css";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/iniciar_sesion");
  };

  return (
    <header className="header-bar">
      <div className="header-content">
        <div className="header-logo-title">
          <div className="logo-circle">LOGO</div>
          <h1 className="header-title">All Too Accountable</h1>
        </div>
        <nav className="header-nav">
          <button className="nav-button">Inicio</button>
          <button className="nav-button">Transacciones</button>
          <button className="nav-button">Gastos mensuales</button>
          <button className="nav-button logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}
