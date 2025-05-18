import React from "react";  
import { Outlet } from "react-router-dom";
import Header from "../components/header/header";
import Footer from "../components/footer/footer";
import { useState } from "react";
import Cuaderno from "../components/cuaderno-ayuda/cuaderno";

export default function AppLayout() {
  const [showCuaderno, setShowCuaderno] = useState(false);

  return (
    <>
      <Header setShowCuaderno={setShowCuaderno} />
      {showCuaderno && <Cuaderno onClose={() => setShowCuaderno(false)} />}
      <main>
        <Outlet />
      </main>
      <Footer/>
    </>
  );
}
