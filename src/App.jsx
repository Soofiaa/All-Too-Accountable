import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login/iniciar_sesion";
import DashboardPage from "./pages/dashboard/inicio";
import ForgotPasswordPage from "./pages/forgot-pw/olvide_password";
import RegisterPage from "./pages/register/registrarse";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/inicio" element={<DashboardPage />} />
        <Route path="/olvide_password" element={<ForgotPasswordPage />} />
        <Route path="/registrarse" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
}

export default App;
