import React, { useState } from "react";
import "./gastos.css";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import { useEffect } from "react";

const GastosMensuales = () => {
  const [gastos, setGastos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState({
    nombre: "",
    descripcion: "",
    monto: "",
    dia_pago: ""
  });  
  const [modoEdicion, setModoEdicion] = useState(false);
  const [indiceEditar, setIndiceEditar] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [indiceEliminar, setIndiceEliminar] = useState(null);

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";
    const [año, mes, dia] = fechaISO.split("T")[0].split("-");
    return `${dia}-${mes}-${año}`;
  };  

  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    fetch(`http://localhost:5000/api/gastos?id_usuario=${id_usuario}`)
      .then((res) => res.json())
      .then((data) => setGastos(data));
  }, []);

  const handleEditarGasto = (index) => {
    const gasto = gastos[index];
    setNuevoGasto({
      nombre: gasto.nombre,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      dia_pago: gasto.dia_pago || "",
    });
    setModoEdicion(true);
    setIndiceEditar(index);
    setMostrarModal(true);
  };
  
  const handleGuardarGasto = () => {
    if (nuevoGasto.nombre && nuevoGasto.monto) {
      const id_usuario = parseInt(localStorage.getItem("id_usuario"));
  
      const actualizado = {
        nombre: nuevoGasto.nombre,
        descripcion: nuevoGasto.descripcion,
        monto: Number(nuevoGasto.monto),
        dia_pago: Number(nuevoGasto.dia_pago),
        id_usuario: id_usuario
      };
  
      const url = modoEdicion
        ? `http://localhost:5000/api/gastos/${gastos[indiceEditar].id_gasto}`
        : "http://localhost:5000/api/gastos";
  
      const method = modoEdicion ? "PUT" : "POST";
  
      fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(actualizado)
      })
        .then((res) => res.json())
        .then((data) => {
          const nuevosGastos = [...gastos];
          if (modoEdicion) {
            nuevosGastos[indiceEditar] = data;
          } else {
            nuevosGastos.push(data);
          }
          setGastos(nuevosGastos);
          setNuevoGasto({ nombre: "", descripcion: "", monto: "", dia_pago: "" });
          setModoEdicion(false);
          setIndiceEditar(null);
          setMostrarModal(false);
        })
        .catch((err) => {
          console.error("Error al guardar el gasto:", err);
          alert("Ocurrió un error al guardar el gasto");
        });
    }
  };     

  const handleCancelarGasto = () => {
    setNuevoGasto({ nombre: "", descripcion: "", monto: "", dia_pago: "" });
    setMostrarModal(false);
    setModoEdicion(false);
    setIndiceEditar(null);
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
          <h2 className="titulo-gm">Gastos mensuales</h2>
          <button className="btn-agregar" onClick={() => setMostrarModal(true)}>Agregar gasto mensual</button>

          <table className="tabla-gastos">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Día de pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto, index) => (
                <tr key={index}>
                  <td>{gasto.nombre}</td>
                  <td>{gasto.descripcion}</td>
                  <td>${gasto.monto.toLocaleString()}</td>
                  <td>{gasto.dia_pago}</td>
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
              <label>
                Día de pago (1 a 31) para cada mes
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={nuevoGasto.dia_pago}
                  onChange={(e) =>
                    setNuevoGasto({ ...nuevoGasto, dia_pago: e.target.value })
                  }
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
