import React, { useState } from "react";
import "./registrarse.css";
import FooterPrelogin from "../../components/footer-prelogin/footer2";
import HeaderPrelogin from "../../components/header-prelogin/header2";

export default function RegistroUsuario() {
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date());

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
            <label>*Nombre de usuario</label>
            <input type="text" placeholder="Ingrese su nombre de usuario" />

            <label>*Correo electrónico</label>
            <input type="email" placeholder="Ingrese su correo electrónico" />

            <label>*Contraseña</label>
            <input type="password" placeholder="Ingrese su contraseña" />

            <label>*Re-ingrese su contraseña</label>
            <input type="password" placeholder="Ingrese su contraseña" />

            <label>*Ingrese su fecha de nacimiento</label>
            <input type="date" value={fechaNacimiento.toISOString().substr(0, 10)} onChange={(e) => setFechaNacimiento(new Date(e.target.value))} />

            <button type="submit">Crear una cuenta</button>
          </form>
          <p className="registro-link">¿Tienes una cuenta? Inicia sesión</p>
        </section>
      </main>

      <FooterPrelogin/>
    </div>
  );
}
