import React, { useState } from "react";
import "./inicio.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardFinanciero() {
  const [salario, setSalario] = useState(600000);
  const [ahorros, setAhorros] = useState(150000);
  const [showModal, setShowModal] = useState(false);
  const [nuevoSalario, setNuevoSalario] = useState("");
  const [showAgregarAhorro, setShowAgregarAhorro] = useState(false);
  const [showQuitarAhorro, setShowQuitarAhorro] = useState(false);
  const [montoAhorro, setMontoAhorro] = useState("");

  const data = {
    labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"],
    datasets: [
      {
        label: "Ingresos",
        data: [1200000, 1250000, 1300000, 1280000, 1350000, 1400000],
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.2)",
        tension: 0.3,
      },
      {
        label: "Gastos",
        data: [900000, 950000, 1000000, 980000, 990000, 1010000],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.2)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Ingresos vs Gastos (Mensual)" },
    },
  };

  const handleSave = () => {
    if (nuevoSalario !== "") {
      setSalario(Number(nuevoSalario));
      setShowModal(false);
      setNuevoSalario("");
    }
  };

  const handleAgregarAhorro = () => {
    if (montoAhorro !== "") {
      setAhorros((prev) => prev + Number(montoAhorro));
      setShowAgregarAhorro(false);
      setMontoAhorro("");
    }
  };

  const handleQuitarAhorro = () => {
    if (montoAhorro !== "") {
      setAhorros((prev) => Math.max(0, prev - Number(montoAhorro)));
      setShowQuitarAhorro(false);
      setMontoAhorro("");
    }
  };

  return (
    <div className="page-layout">
    <Header />
    <div className="dashboard-container">
      <main className="dashboard-main">
        <aside className="dashboard-sidebar">
          <div className="dashboard-profile">
            <img src="/user-avatar.png" alt="Usuario" className="dashboard-avatar" />
            <p className="dashboard-frecuencia">Anual o mensual, deberia poder elegirse el modo de gráfico</p>
            <button>Cambiar foto de perfil</button>
            <button>Cambiar nombre de usuario</button>
          </div>

          <div className="dashboard-salario">
            <h3>Salario</h3>
            <div className="dashboard-box">${salario.toLocaleString()}</div>
            <button className="center-button" onClick={() => setShowModal(true)}>Editar salario</button>
          </div>

          <div className="dashboard-ahorros">
            <h3>Ahorros</h3>
            <div className="dashboard-box">$ {ahorros.toLocaleString()}</div>
            <div className="dashboard-ahorro-btns">
              <button className="center-button" onClick={() => setShowAgregarAhorro(true)}>Añadir monto</button>
              <button className="center-button" onClick={() => setShowQuitarAhorro(true)}>Descontar monto</button>
            </div>
          </div>

          <button className="dashboard-chatbot">Hablar con una inteligencia artificial</button>
        </aside>

        <section className="dashboard-grafico">
          <h3>Gráfico financiero anual (Ingresos - Gastos)</h3>
          <Line data={data} options={options} />
        </section>
      </main>
      <Footer />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Editar salario</h3>
            <div className="modal-input-container">
              <span>$</span>
              <input
                type="number"
                placeholder="Ingrese el salario sin puntos ni comas"
                min="0"
                value={nuevoSalario}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setNuevoSalario(value);
                  }
                }}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleSave}>Aceptar</button>
              <button onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {(showAgregarAhorro || showQuitarAhorro) && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{showAgregarAhorro ? "Agregar monto en ahorros" : "Eliminar monto en ahorros"}</h3>
            <div className="modal-input-container">
              <input
                type="number"
                placeholder={showAgregarAhorro ? "Escriba el monto a agregar" : "Escriba el monto a disminuir"}
                min="0"
                value={montoAhorro}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setMontoAhorro(value);
                  }
                }}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={showAgregarAhorro ? handleAgregarAhorro : handleQuitarAhorro}>Aceptar</button>
              <button onClick={() => {
                setShowAgregarAhorro(false);
                setShowQuitarAhorro(false);
                setMontoAhorro("");
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}