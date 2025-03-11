import React from "react";
import "./olvide_password.css";
import FooterPrelogin from "../../components/footer-prelogin/footer2";
import HeaderPrelogin from "../../components/header-prelogin/header2";
import { useNavigate } from "react-router-dom";

export default function OlvidoContrasena() {
  const navigate = useNavigate();

  return (
    <div className="olvido-container">
      <HeaderPrelogin/>

      <main className="olvido-main">
        <section className="olvido-card">
          <h2 className="olvido-title">¿Olvidaste tu contraseña?</h2>
          <p className="olvido-text">
            No te preocupes. Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
          <form className="olvido-form">
            <label htmlFor="email">*Correo electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="Ingrese su correo electrónico"
              required
            />
            <button type="submit">Enviar instrucciones</button>
          </form>
          <p className="olvido-link">¿Recordaste tu contraseña? <span onClick={() => navigate('/')}>Inicia sesión</span></p>
        </section>
      </main>

      <FooterPrelogin/>
    </div>
  );
}