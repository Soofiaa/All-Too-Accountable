import React, { useState } from "react";
import "./olvide_password.css";
import FooterPrelogin from "../../components/footer-prelogin/footer2";
import HeaderPrelogin from "../../components/header-prelogin/header2";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

export default function OlvidoContrasena() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const response = await fetch(`${API_URL}/recuperar_contrasena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setMensaje("Instrucciones enviadas. Revisa tu correo.");
        console.log("Enlace de recuperación:", data.enlace);
      } else {
        setMensaje(data.error || "Error al procesar la solicitud.");
      }
    } catch (error) {
      console.error("Error de red:", error);
      setMensaje("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="olvido-container">
      <HeaderPrelogin />

      <main className="olvido-main">
        <section className="olvido-card">
          <h2 className="olvido-title">¿Olvidaste tu contraseña?</h2>
          <p className="olvido-text">
            No te preocupes. Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
          <form className="olvido-form" onSubmit={handleSubmit}>
            <label htmlFor="email">*Correo electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="Ingrese su correo electrónico"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Enviar instrucciones</button>
          </form>

          {mensaje && <p className="olvido-text">{mensaje}</p>}

          <p className="olvido-link">
            ¿Recordaste tu contraseña?{" "}
            <span onClick={() => navigate("/")}>Inicia sesión</span>
          </p>
        </section>
      </main>
      <FooterPrelogin />
    </div>
  );
}
