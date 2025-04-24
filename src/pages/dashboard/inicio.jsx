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
import { useEffect } from "react";
import axios from "axios";

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
  const [salario, setSalario] = useState(0);
  const [ahorros, setAhorros] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [nuevoSalario, setNuevoSalario] = useState("");
  const [showAgregarAhorro, setShowAgregarAhorro] = useState(false);
  const [showQuitarAhorro, setShowQuitarAhorro] = useState(false);
  const [montoAhorro, setMontoAhorro] = useState("");
  const [diaFacturacion, setDiaFacturacion] = useState(1);
  const [mostrarModalFacturacion, setMostrarModalFacturacion] = useState(false);
  const [nuevoDiaFacturacion, setNuevoDiaFacturacion] = useState(diaFacturacion);
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [nuevoNombreUsuario, setNuevoNombreUsuario] = useState("");
  const [mostrarModalNombre, setMostrarModalNombre] = useState(false);


  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (id_usuario) {
      axios.get(`http://localhost:5000/api/detalles_usuario?id_usuario=${id_usuario}`)
        .then(res => {
          const { salario, ahorros, nombre_usuario, dia_facturacion } = res.data;
          setSalario(salario);
          setAhorros(ahorros);
          setNombreUsuario(nombre_usuario);
          setDiaFacturacion(dia_facturacion);
        })
        .catch(err => console.error("Error cargando detalles:", err));
    }
  }, []);

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

  const handleActualizarNombre = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (nuevoNombreUsuario && id_usuario) {
      axios.post("http://localhost:5000/api/actualizar_nombre", {
        id_usuario: parseInt(id_usuario),
        nombre_usuario: nuevoNombreUsuario
      })
      .then(() => {
        setNombreUsuario(nuevoNombreUsuario);
        setMostrarModalNombre(false);
        setNuevoNombreUsuario("");
      })
      .catch(err => {
        console.error("Error al actualizar nombre:", err);
        alert("No se pudo actualizar el nombre.");
      });
    }
  };
  
  const handleActualizarFacturacion = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (nuevoDiaFacturacion && id_usuario) {
      axios.post("http://localhost:5000/api/actualizar_facturacion", {
        id_usuario: parseInt(id_usuario),
        dia_facturacion: parseInt(nuevoDiaFacturacion)
      })
      .then(() => {
        setDiaFacturacion(parseInt(nuevoDiaFacturacion));
        setMostrarModalFacturacion(false);
      })
      .catch(err => {
        console.error("Error al actualizar día de facturación:", err);
        alert("No se pudo actualizar el día.");
      });
    }
  };
  
  const handleSave = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (nuevoSalario !== "" && id_usuario) {
      axios.post("http://localhost:5000/api/actualizar_salario", {
        id_usuario: parseInt(id_usuario),
        salario: parseInt(nuevoSalario)
      })
      .then(() => {
        setSalario(parseInt(nuevoSalario));
        setShowModal(false);
        setNuevoSalario("");
      })
      .catch(err => {
        console.error("Error al actualizar salario:", err);
        alert("No se pudo actualizar el salario.");
      });
    }
  };  

  const handleAgregarAhorro = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (montoAhorro !== "" && id_usuario) {
      const nuevo = ahorros + parseInt(montoAhorro);
      axios.post("http://localhost:5000/api/actualizar_ahorros", {
        id_usuario: parseInt(id_usuario),
        ahorros: nuevo
      })
      .then(() => {
        setAhorros(nuevo);
        setShowAgregarAhorro(false);
        setMontoAhorro("");
      })
      .catch(err => {
        console.error("Error al agregar ahorro:", err);
        alert("No se pudo agregar el monto.");
      });
    }
  };  

  const handleQuitarAhorro = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (montoAhorro !== "" && id_usuario) {
      const nuevo = Math.max(0, ahorros - parseInt(montoAhorro));
      axios.post("http://localhost:5000/api/actualizar_ahorros", {
        id_usuario: parseInt(id_usuario),
        ahorros: nuevo
      })
      .then(() => {
        setAhorros(nuevo);
        setShowQuitarAhorro(false);
        setMontoAhorro("");
      })
      .catch(err => {
        console.error("Error al descontar ahorro:", err);
        alert("No se pudo descontar el monto.");
      });
    }
  };


  return (
    <div className="page-layout">
    <Header />
    <div className="dashboard-container">
      <main className="dashboard-main">
        <aside className="dashboard-sidebar">

          <div className="dashboard-profile dashboard-card">
            <h3 className="dashboard-nombre">Bienvenido, {nombreUsuario}</h3>
            <button onClick={() => setMostrarModalNombre(true)}>Cambiar nombre</button>
            {mostrarModalNombre && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <h3>Cambiar nombre de usuario</h3>
                  <input
                    type="text"
                    placeholder="Nuevo nombre"
                    value={nuevoNombreUsuario}
                    onChange={(e) => setNuevoNombreUsuario(e.target.value)}
                  />
                  <div className="modal-buttons">
                    <button onClick={handleActualizarNombre}>Aceptar</button>
                    <button onClick={() => {
                      setMostrarModalNombre(false);
                      setNuevoNombreUsuario("");
                    }}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="dashboard-dia-facturacion dashboard-card">
            <h3>Fecha de facturación</h3>
            <div className="dashboard-box">Día {diaFacturacion}</div>
            <button className="center-button" onClick={() => setMostrarModalFacturacion(true)}>
              Editar día
            </button>
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