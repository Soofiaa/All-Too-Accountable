import React, { useState } from "react";
import "./metas.css";
import Footer from "../../components/footer/footer";
import Header from "../../components/header/header";

export default function MetasAhorro() {
  const [metas, setMetas] = useState([
    { titulo: "Ir a Japón", fecha: "2025-12-31", monto: 3500000 },
    { titulo: "Comprar un auto", fecha: "2026-12-31", monto: 20000000 }
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [indiceEditar, setIndiceEditar] = useState(null);
  const [nuevaMeta, setNuevaMeta] = useState({ titulo: "", fecha: "", monto: "" });

  const handleGuardar = () => {
    if (!nuevaMeta.titulo || !nuevaMeta.fecha || !nuevaMeta.monto) return;
    if (modoEdicion) {
      const actualizadas = [...metas];
      actualizadas[indiceEditar] = { ...nuevaMeta, monto: Number(nuevaMeta.monto) };
      setMetas(actualizadas);
    } else {
      setMetas([...metas, { ...nuevaMeta, monto: Number(nuevaMeta.monto) }]);
    }
    setNuevaMeta({ titulo: "", fecha: "", monto: "" });
    setModoEdicion(false);
    setMostrarModal(false);
  };

  const handleCancelar = () => {
    setNuevaMeta({ titulo: "", fecha: "", monto: "" });
    setModoEdicion(false);
    setMostrarModal(false);
  };

  const handleEditar = (index) => {
    setNuevaMeta(metas[index]);
    setIndiceEditar(index);
    setModoEdicion(true);
    setMostrarModal(true);
  };

  const handleEliminar = (index) => {
    const actualizadas = metas.filter((_, i) => i !== index);
    setMetas(actualizadas);
  };

  return (
    <div className="page-layout">
      <Header />
      <div className="metas-ahorro-container">
        <div className="contenido">
          <h2 className="titulo">Ver metas de ahorro</h2>

          <button className="btn-agregar" onClick={() => setMostrarModal(true)}>
            Agregar meta de ahorro
          </button>

          <table className="tabla-metas">
            <thead>
              <tr>
                <th>Título</th>
                <th>Fecha límite</th>
                <th>Monto meta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {metas.map((meta, index) => (
                <tr key={index}>
                  <td>{meta.titulo}</td>
                  <td>{meta.fecha}</td>
                  <td>${meta.monto.toLocaleString()}</td>
                  <td className="acciones">
                    <button className="btn-editar" onClick={() => handleEditar(index)}>Editar</button>
                    <button className="btn-eliminar" onClick={() => handleEliminar(index)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mostrarModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>{modoEdicion ? "Editar meta de ahorro" : "Agregar meta de ahorro"}</h3>
              <label>
                Título
                <input
                  type="text"
                  value={nuevaMeta.titulo}
                  onChange={(e) => setNuevaMeta({ ...nuevaMeta, titulo: e.target.value })}
                />
              </label>
              <label>
                Fecha límite
                <input
                  type="date"
                  value={nuevaMeta.fecha}
                  onChange={(e) => setNuevaMeta({ ...nuevaMeta, fecha: e.target.value })}
                />
              </label>
              <label>
                Monto meta
                <input
                  type="number"
                  value={nuevaMeta.monto}
                  onChange={(e) => setNuevaMeta({ ...nuevaMeta, monto: e.target.value })}
                />
              </label>
              <div className="modal-buttons">
                <button onClick={handleGuardar}>{modoEdicion ? "Guardar" : "Aceptar"}</button>
                <button onClick={handleCancelar}>Cancelar</button>
              </div>
            </div>
          </div>
        )}


      </div>
      <Footer />
    </div>
  );
}