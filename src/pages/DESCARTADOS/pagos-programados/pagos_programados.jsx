import React, { useState, useEffect } from "react";
import Header from "../../../components/header/header";
import Footer from "../../../components/footer/footer";
import "../gastos-mensuales/gastos.css";
import "./pagos_programados.css";

export default function GastosProgramados() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [gastos, setGastos] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);


  const [nuevoGasto, setNuevoGasto] = useState({
    tipo_pago: "",
    fecha_emision: "",
    dias_cheque: "",
    monto: "",
    descripcion: ""
  });


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "monto") {
      const sinPuntos = value.replace(/\./g, "");
      if (!isNaN(sinPuntos)) {
        const formateado = Number(sinPuntos).toLocaleString("es-CL");
        setNuevoGasto((prev) => ({ ...prev, [name]: formateado }));
      }
    } else {
      setNuevoGasto((prev) => ({ ...prev, [name]: value }));
    }
  };


  const editarGasto = (gasto) => {
    setNuevoGasto({
      tipo_pago: gasto.tipo_pago,
      fecha_emision: gasto.fecha_emision,
      dias_cheque: gasto.dias_cheque || "",
      monto: Number(gasto.monto).toLocaleString("es-CL"),
      descripcion: gasto.descripcion
    });
    setIdEditando(gasto.id_gasto_programado);
    setModoEdicion(true);
    setMostrarFormulario(true);
  };


  const obtenerGastos = async () => {
    const id_usuario = localStorage.getItem("id_usuario");
    const res = await fetch(`http://localhost:5000/api/pagos_programados/${id_usuario}`);
    const data = await res.json();
    setGastos(data);
  };

  useEffect(() => {
    obtenerGastos();
  }, []);

  const enviarGasto = async () => {
    const payload = {
      ...nuevoGasto,
      id_usuario: parseInt(localStorage.getItem("id_usuario")),
      monto: parseFloat(nuevoGasto.monto.replace(/\./g, "")),
      dias_cheque: nuevoGasto.tipo_pago === "cheque" ? parseInt(nuevoGasto.dias_cheque) : null
    };

    const url = idEditando
      ? `http://localhost:5000/api/pagos_programados/${idEditando}`
      : "http://localhost:5000/api/pagos_programados/gastos_programados";

    const method = idEditando ? "PUT" : "POST";

    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(idEditando ? "✅ Gasto actualizado" : "✅ Gasto programado registrado");
      setNuevoGasto({
        tipo_pago: "",
        fecha_emision: "",
        dias_cheque: "",
        monto: "",
        descripcion: ""
      });
      setIdEditando(null);
      setModoEdicion(false);
      setMostrarFormulario(false);
      obtenerGastos();
    } else {
      alert("❌ Error al guardar gasto");
    }
  };


  return (
    <div className="page-layout">
      <Header />
      <div className="tabla-gastos-programados">
        <h3 className="titulo-tabla">Gastos Programados</h3>
        <div className="envoltorio-tabla">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Tipo de pago</th>
                <th>Fecha emisión</th>
                <th>Fecha transacción</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="sin-registros">No hay gastos programados</td>
                </tr>
              ) : (
                gastos.map((g) => (
                  <tr key={g.id_gasto_programado}>
                    <td>{g.descripcion}</td>
                    <td>{g.tipo_pago}</td>
                    <td>{new Date(g.fecha_emision).toLocaleDateString("es-CL")}</td>
                    <td>{new Date(g.fecha_transaccion).toLocaleDateString("es-CL")}</td>
                    <td>${Number(g.monto).toLocaleString("es-CL")}</td>
                    <td>
                      <button className="btn-editar" onClick={() => editarGasto(g)}>Editar</button>
                      <button className="btn-eliminar" onClick={() => eliminarGasto(g.id_gasto_programado)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
}