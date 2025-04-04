import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './iniciar_sesion.css';
import FooterPrelogin from "../../components/footer-prelogin/footer2";
import HeaderPrelogin from "../../components/header-prelogin/header2";

export default function IniciarSesion() {
  const navigate = useNavigate();

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (usuario) {
      navigate("/inicio");
    }
  }, []);


  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        alert("Inicio de sesión exitoso");
        console.log(result.usuario);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Error al conectar con el servidor");
      console.error(error);
    }
  };  

  const handleCreateAccount = () => {
    // Lógica para crear una cuenta
    console.log("Crear una cuenta");
    navigate('/registrarse');
  };

  const handleForgotPassword = () => {
    // Lógica para olvido de contraseña
    console.log("Olvidé mi contraseña");
    navigate('/olvide_password');
  };

  return (
    <div className="main-wrapper">
      <div className="app-window">
        <HeaderPrelogin/>

        {/* CONTENIDO CENTRAL */}
        <div className="content-area">
          {/* Caja izquierda - presentación */}
          <div className="presentation-box">
            <p>
              Tomar el control de tus finanzas personales nunca ha sido tan fácil. <strong>All Too Accountable</strong> es la plataforma diseñada para ayudarte a gestionar tus ingresos, gastos y ahorros de manera inteligente y eficiente.
            </p>
            <p>
              Sabemos que mantener un equilibrio financiero es clave para tu bienestar y estabilidad a largo plazo. Por eso, te ofrecemos herramientas intuitivas para registrar transacciones, establecer presupuestos personalizados, definir metas de ahorro y visualizar tu situación financiera con gráficos dinámicos.
            </p>
            <ul>
              <li>Registra tus ingresos y gastos en segundos</li>
              <li>Controla tu presupuesto y evita gastos innecesarios</li>
              <li>Establece metas de ahorro y sigue tu progreso</li>
              <li>Genera reportes detallados y exporta tu información</li>
              <li>Recibe alertas y notificaciones para mantenerte en control</li>
            </ul>
            <em>Tu dinero, tu futuro, tu control.</em>
          </div>

          {/* Caja derecha - login */}
          <div className="login-box">
            <div className="login-container">
              <div className="login-title">Iniciar sesión</div>
              <form onSubmit={handleLogin}>
                <label>Correo electrónico</label>
                <input type="email" name="email" placeholder="Ingrese su correo electrónico" required />
                <label>Contraseña</label>
                <input type="password" name="password" placeholder="Ingrese su contraseña" required />
                <button type="submit">Iniciar Sesión</button>
                <a href="#" onClick={handleForgotPassword}>He olvidado mi contraseña</a>
                <hr />
                <button type="button" onClick={handleCreateAccount}>Crear una cuenta</button>
              </form>
            </div>
          </div>
        </div>
        <FooterPrelogin/>
      </div>
    </div>
    );
  }
