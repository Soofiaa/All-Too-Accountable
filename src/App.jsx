import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login/iniciar_sesion";
import DashboardPage from "./pages/dashboard/inicio";
import ForgotPasswordPage from "./pages/forgot-pw/olvide_password";
import RegisterPage from "./pages/register/registrarse";
import TransaccionesPage from "./pages/transactions/transacciones";
import GastosMensuales from "./pages/gastos-mensuales/gastos";
import Categorias from "./pages/ver-categorias/ver_categorias";
import MetasAhorro from "./pages/metas-ahorro/metas";
import RestablecerContrasena from "./pages/recuperar_pw/recuperar_contrasena";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/inicio" element={<DashboardPage />} />
        <Route path="/olvide_password" element={<ForgotPasswordPage />} />
        <Route path="/registrarse" element={<RegisterPage />} />
        <Route path="/transacciones" element={<TransaccionesPage />} />
        <Route path="/gastos-mensuales" element={<GastosMensuales />} />
        <Route path="/ver-categorias" element={<Categorias />} />
        <Route path="/metas-ahorro" element={<MetasAhorro />} />
        <Route path="/restablecer_contrasena" element={<RestablecerContrasena />} />
      </Routes>
    </Router>
  );
}

export default App;
