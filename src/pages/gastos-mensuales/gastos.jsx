import React, { useState } from "react";
import "./gastos.css";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";

const GastosMensuales = () => {
  const [gastos, setGastos] = useState([
    { nombre: "Arriendo", descripcion: "Dirección xyz", monto: 300000 },
    { nombre: "Internet - Televisión", descripcion: "Empresa X", monto: 40000 },
    { nombre: "Telefonía", descripcion: "Empresa Y", monto: 30000 }
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState({ nombre: "", descripcion: "", monto: "" });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [indiceEditar, setIndiceEditar] = useState(null);

  const handleGuardarGasto = () => {
    if (nuevoGasto.nombre && nuevoGasto.monto) {
      if (modoEdicion) {
        const actualizados = [...gastos];
        actualizados[indiceEditar] = { ...nuevoGasto, monto: Number(nuevoGasto.monto) };
        setGastos(actualizados);
        setModoEdicion(false);
        setIndiceEditar(null);
      } else {
        setGastos([...gastos, { ...nuevoGasto, monto: Number(nuevoGasto.monto) }]);
      }
      setNuevoGasto({ nombre: "", descripcion: "", monto: "" });
      setMostrarModal(false);
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
    const actualizados = gastos.filter((_, i) => i !== index);
    setGastos(actualizados);
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
                    <button className="btn btn-editar" onClick={() => handleEditarGasto(index)}>Editar</button>
                    <button className="btn btn-eliminar" onClick={() => handleEliminarGasto(index)}>Eliminar</button>
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
      <Footer />
    </div>
  );
};

export default GastosMensuales;
