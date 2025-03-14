import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./registrarse.css";
import FooterPrelogin from "../../components/footer-prelogin/footer2";
import HeaderPrelogin from "../../components/header-prelogin/header2";

export default function RegistroUsuario() {
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
  const [showPopup, setShowPopup] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden. Por favor, verifica e intenta nuevamente.");
      return;
    }
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
      navigate('/');
    }, 3000);
  };

  return (
    <div className="registro-container">
      <HeaderPrelogin/>

      <main className="registro-main">
        <section className="registro-info">
          <h2 className="registro-titulo">¿Por qué registrarte en All Too Accountable?</h2>
          <p>
            En un mundo donde el control de las finanzas personales es clave para la estabilidad y el crecimiento, <i>All Too Accountable</i> se convierte en tu mejor aliado.
          </p>
          <ul>
            <li>Registra y clasifica tus transacciones en segundos</li>
            <li>Define presupuestos y evita gastos innecesarios</li>
            <li>Establece metas de ahorro y sigue tu progreso en tiempo real</li>
            <li>Visualiza tu situación financiera con gráficos intuitivos</li>
            <li>Recibe alertas cuando te acerques a tus límites de gasto</li>
            <li>Exporta reportes detallados en CSV o PDF</li>
          </ul>
          <p className="registro-frase">Tu dinero, tu control, tu tranquilidad.</p>
          <p>¡Regístrate gratis y empieza a gestionar tus finanzas de forma inteligente!</p>
        </section>

        <section className="registro-formulario">
          <h2 className="registro-subtitulo">Registrarse</h2>
          <form>
            <label className="required">Nombre de usuario</label>
            <input type="text" placeholder="Ingrese su nombre de usuario deseado, posteriormente puede cambiarlo" required />

            <label className="required">Correo electrónico</label>
            <input type="email" placeholder="Ingrese su correo electrónico" required />

            <label className="required">Contraseña</label>
            <input type="password" placeholder="Ingrese su contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />

            <label className="required">Re-ingrese su contraseña</label>
            <input type="password" placeholder="Re-ingrese su contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

            <label className="required">Ingrese su fecha de nacimiento</label>
            <input type="date" value={fechaNacimiento.toISOString().substr(0, 10)} onChange={(e) => setFechaNacimiento(new Date(e.target.value))} required />

            <button type="button" onClick={handleCreateAccount}>Crear una cuenta</button>
          </form>
          <p className="registro-link" onClick={() => navigate('/')}>¿Tienes una cuenta? Inicia sesión</p>
        </section>
      </main>

      {showPopup && (
        <div className="popup">
          <p>Su cuenta ha sido creada exitosamente, revise su correo electrónico</p>
        </div>
      )}

      <FooterPrelogin/>
    </div>
  );
}
