import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/header/header";
import Footer from "../components/footer/footer";
import Cuaderno from "../components/cuaderno-ayuda/cuaderno";

export default function AppLayout() {
  const [showCuaderno, setShowCuaderno] = useState(false);

  return (
    <div className="page-layout">
      <Header setShowCuaderno={setShowCuaderno} />
      {showCuaderno && <Cuaderno onClose={() => setShowCuaderno(false)} />}

      <div className="main-contenido">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}