import React, { useState } from "react";
import "./gastos.css";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import { useEffect } from "react";

const GastosMensuales = () => {
  const [gastos, setGastos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState({ nombre: "", descripcion: "", monto: "" });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [indiceEditar, setIndiceEditar] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [indiceEliminar, setIndiceEliminar] = useState(null);

  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    fetch(`http://localhost:5000/api/gastos?id_usuario=${id_usuario}`)
      .then((res) => res.json())
      .then((data) => setGastos(data));
  }, []);

  const handleGuardarGasto = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    const payload = {
      ...nuevoGasto,
      id_usuario,
      monto: Number(nuevoGasto.monto)
    };
  
    if (modoEdicion) {
      const idGasto = gastos[indiceEditar].id_gasto;
      fetch(`http://localhost:5000/api/gastos/${idGasto}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((editado) => {
          const actualizados = [...gastos];
          actualizados[indiceEditar] = editado;
          setGastos(actualizados);
          cerrarModal();
        });
    } else {
      fetch("http://localhost:5000/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((nuevo) => {
          setGastos((prev) => [...prev, nuevo]);
          cerrarModal();
        });
    }
  };  

  const handleCancelarGasto = () => {
    setNuevoGasto({ nombre: "", descripcion: "", monto: "" });
    setMostrarModal(false);
    setModoEdicion(false);
    setIndiceEditar(null);
  };

  const handleEditarGasto = (index) => {
    setNuevoGasto(gastos[index]);
    setIndiceEditar(index);
    setModoEdicion(true);
    setMostrarModal(true);
  };

  const handleEliminarGasto = (index) => {
    setIndiceEliminar(index);
    setMostrarConfirmacion(true);
  };
  
  const confirmarEliminacion = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    const idGasto = gastos[indiceEliminar].id_gasto;
  
    fetch(`http://localhost:5000/api/gastos/${idGasto}?id_usuario=${id_usuario}`, {
      method: "DELETE"
    }).then(() => {
      setGastos((prev) => prev.filter((_, i) => i !== indiceEliminar));
      setMostrarConfirmacion(false);
      setIndiceEliminar(null);
    });
  };
  
  const cancelarEliminacion = () => {
    setMostrarConfirmacion(false);
    setIndiceEliminar(null);
  };  
  
  const cerrarModal = () => {
    setNuevoGasto({ nombre: "", descripcion: "", monto: "" });
    setMostrarModal(false);
    setModoEdicion(false);
    setIndiceEditar(null);
  };  

  return (
    <div className="page-layout">
      <Header />
      <div className="gastos-mensuales-container">
        <main className="contenido">
          <h2 className="titulo">Gastos mensuales</h2>
          <button className="btn-agregar" onClick={() => setMostrarModal(true)}>Agregar gasto mensual</button>

          <table className="tabla-gastos">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto, index) => (
                <tr key={index}>
                  <td>{gasto.nombre}</td>
                  <td>{gasto.descripcion}</td>
                  <td>${gasto.monto.toLocaleString()}</td>
                  <td className="acciones">
                    <button className="btn-editar" onClick={() => handleEditarGasto(index)}>Editar</button>
                    <button className="btn-eliminar" onClick={() => handleEliminarGasto(index)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>

        {mostrarModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>{modoEdicion ? "Editar gasto mensual" : "Agregar gasto mensual"}</h3>
              <label>
                Nombre
                <input
                  type="text"
                  value={nuevoGasto.nombre}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, nombre: e.target.value })}
                  placeholder="Nombre del gasto"
                />
              </label>
              <label>
                Descripción
                <input
                  type="text"
                  value={nuevoGasto.descripcion}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
                  placeholder="Descripción del gasto"
                />
              </label>
              <label>
                Monto
                <input
                  type="number"
                  value={nuevoGasto.monto}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
                  placeholder="Monto"
                />
              </label>
              <div className="modal-buttons">
                <button onClick={handleGuardarGasto}>{modoEdicion ? "Guardar" : "Aceptar"}</button>
                <button onClick={handleCancelarGasto}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {mostrarConfirmacion && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>¿Estás seguro de que deseas eliminar este gasto?</h3>
            <div className="modal-buttons">
              <button onClick={confirmarEliminacion}>Sí, eliminar</button>
              <button onClick={cancelarEliminacion}>No, cancelar</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default GastosMensuales;
