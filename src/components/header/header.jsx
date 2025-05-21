import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./header.css";
import { BookOpen } from "lucide-react";
import { cerrarSesion } from "../../utils/usuario";

export default function Header({ setShowCuaderno }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    const confirmLogout = window.confirm("¿Estás seguro de que quieres cerrar sesión?");
    if (confirmLogout) {
      cerrarSesion();
      navigate("/");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header-bar">
      <div className="header-content">
        <div className="header-logo-title">
          <div className="logo-circle">LOGO</div>
          <h1 className="header-title">All Too Accountable</h1>
        </div>
        <nav className={`header-nav ${isMenuOpen ? "open" : ""}`}>
          <button className="nav-button" onClick={() => navigate("/inicio")}>Inicio</button>
          <button className="nav-button" onClick={() => navigate("/transacciones")}>Transacciones</button>
          <button className="nav-button" onClick={() => navigate("/ver-categorias")}>Categorias</button>
          <button className="nav-button" onClick={() => navigate("/pagos-recurrentes")}>Gastos recurrentes</button>
          <button className="nav-button" onClick={() => navigate("/metas-ahorro")}>Metas de ahorro</button>
          <button className="btn-ayuda" onClick={() => setShowCuaderno(true)} title="Cuaderno de ayuda">
            <BookOpen size={24} strokeWidth={2.5} />
          </button>
          <button className="nav-button logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </nav>
        <button className="menu-button" onClick={toggleMenu}>
          &#9776;
        </button>
      </div>
    </header>
  );
}
