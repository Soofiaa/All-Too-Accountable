import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HeaderPrelogin from "../../components/header-prelogin/header2";
import FooterPrelogin from "../../components/footer-prelogin/footer2";
import "../forgot-pw/olvide_password.css";


export default function RestablecerContrasena() {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState("formulario");

  // Obtener token desde URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenURL = params.get("token");
    setToken(tokenURL || "");
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nuevaContrasena !== confirmarContrasena) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/restablecer_contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          nueva_contrasena: nuevaContrasena
        })
      });

      const data = await response.json();
      if (response.ok) {
        setEstado("éxito");
        setTimeout(() => navigate("/"), 3000);
      } else {
        setMensaje(data.error || "Error al restablecer contraseña");
        setEstado("error");
      }
    } catch (error) {
      console.error("Error al conectar:", error);
      setMensaje("No se pudo conectar al servidor.");
      setEstado("error");
    }
  };

  return (
    <div className="olvido-container">
      <HeaderPrelogin />

      <main className="olvido-main">
        <section className="olvido-card">
          {estado === "formulario" && (
            <>
              <h2 className="olvido-title">Restablecer contraseña</h2>
              <form className="olvido-form" onSubmit={handleSubmit}>
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  required
                />

                <label>Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  required
                />

                <button type="submit">Restablecer contraseña</button>
              </form>
              {mensaje && <p className="olvido-text">{mensaje}</p>}
            </>
          )}

          {estado === "éxito" && (
            <p className="olvido-text">
              ✅ Tu contraseña ha sido actualizada. Serás redirigido en unos segundos.
            </p>
          )}

          {estado === "error" && (
            <>
              <p className="olvido-text">{mensaje}</p>
              <p className="olvido-link"><span onClick={() => window.location.reload()}>Volver a intentar</span></p>
            </>
          )}
        </section>
      </main>

      <FooterPrelogin />
    </div>
  );
}
