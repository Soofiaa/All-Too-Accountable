import React, { useState, useEffect } from "react";
import "./gastos.css";
import Header from "../../../components/header/header";
import Footer from "../../../components/footer/footer";

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

  return (
    <div className="page-layout">
      <Header />
      <div className="categorias-container">
        <div className="contenido">
          <h2 className="titulo-categorias">Gastos mensuales</h2>
          <button className="btn-agregar" onClick={() => setMostrarModal(true)}>Agregar gasto</button>

          <table className="tabla-categorias">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Día de pago</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto, index) => (
                <tr key={index} className="item-categoria">
                  <td>{gasto.nombre}</td>
                  <td>{gasto.descripcion}</td>
                  <td>{gasto.dia_pago}</td>
                  <td>${Number(gasto.monto).toLocaleString("es-CL")}</td>
                  <td className="acciones">
                    <button className="btn-editar" onClick={() => handleEditarGasto(index)}>Editar</button>
                    <button className="btn-eliminar" onClick={() => handleEliminarGasto(index)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GastosMensuales;
