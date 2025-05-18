import React, { useState, useEffect } from "react";
import "./metas.css";

const idUsuario = localStorage.getItem("id_usuario");
const API_URL = "http://localhost:5000/api/metas";

const obtenerMetasUsuario = async (id_usuario) => {
  const res = await fetch(`${API_URL}/${id_usuario}`);
  return res.json();
};

const crearMeta = async (meta) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meta),
  });
  return res.json();
};

const actualizarMeta = async (id_meta, meta) => {
  const res = await fetch(`${API_URL}/${id_meta}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meta),
  });
  return res.json();
};

const eliminarMeta = async (id_meta) => {
  const res = await fetch(`${API_URL}/${id_meta}`, {
    method: "DELETE",
  });
  return res.json();
};

export default function MetasAhorro() {
  const id_usuario = parseInt(localStorage.getItem("id_usuario"));
  const [metas, setMetas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idMetaEditar, setIdMetaEditar] = useState(null);
  const [nuevaMeta, setNuevaMeta] = useState({ titulo: "", fecha_limite: "", monto_meta: "" });
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [metaAEliminar, setMetaAEliminar] = useState(null);

  const formatearFecha = (fechaISO) => {
    const [año, mes, dia] = fechaISO.split("T")[0].split("-");
    return `${dia}-${mes}-${año}`;
  };
  
  // Al cargar, obtener metas del backend
  useEffect(() => {
    const cargarMetas = async () => {
      if (!id_usuario) return;
      const datos = await obtenerMetasUsuario(id_usuario);
      setMetas(datos);
    };
    cargarMetas();
  }, [id_usuario]);

  const handleGuardar = async () => {
    if (!nuevaMeta.titulo.trim() || !nuevaMeta.fecha_limite || !nuevaMeta.monto_meta) {
      alert("Todos los campos son obligatorios.");
      return;
    }    
  
    if (modoEdicion) {
      await actualizarMeta(idMetaEditar, {
        titulo: nuevaMeta.titulo,
        fecha_limite: nuevaMeta.fecha_limite.split("-").reverse().join("-"),
        monto_meta: parseInt(nuevaMeta.monto_meta.replace(/\./g, ""))
      });
    } else {
      await crearMeta({
        ...nuevaMeta,
        fecha_limite: nuevaMeta.fecha_limite.split("-").reverse().join("-"),
        monto_meta: parseInt(nuevaMeta.monto_meta.replace(/\./g, "")),
        id_usuario: id_usuario,
      });      
    }
  
    // Recarga la lista actualizada desde la base de datos
    const datos = await obtenerMetasUsuario(id_usuario);
    setMetas(datos);
  
    // Reset de estado del formulario y cierre de modal
    setNuevaMeta({ titulo: "", fecha_limite: "", monto_meta: "" });
    setModoEdicion(false);
    setIdMetaEditar(null);
    setMostrarModal(false);
  };
  

  const handleCancelar = () => {
    setNuevaMeta({ titulo: "", fecha_limite: "", monto_meta: "" });
    setModoEdicion(false);
    setMostrarModal(false);
    setIdMetaEditar(null);
  };

  const handleEditar = (meta) => {
    setNuevaMeta({
      titulo: meta.titulo,
      fecha_limite: meta.fecha_limite,
      monto_meta: meta.monto_meta,
    });
    setIdMetaEditar(meta.id_meta);
    setModoEdicion(true);
    setMostrarModal(true);
  };

  const handleEliminar = (id_meta) => {
    setMetaAEliminar(id_meta);
    setMostrarConfirmacion(true);
  };
      
  const confirmarEliminar = async () => {
    await eliminarMeta(metaAEliminar);
    const datos = await obtenerMetasUsuario(id_usuario);
    setMetas(datos);
  
    setMostrarConfirmacion(false);
    setMetaAEliminar(null);
  };
  
  const cancelarEliminar = () => {
    setMostrarConfirmacion(false);
    setMetaAEliminar(null);
  };
  

  return (
    <div className="page-layout">
      <div className="metas-ahorro-container">
        <div className="contenido">
          <h2 className="titulo">Gestión de metas de ahorro</h2>

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
            {metas.map((meta) => (
              <tr key={meta.id_meta}>
                <td>{meta.titulo}</td>
                <td>{formatearFecha(meta.fecha_limite)}</td>
                <td>${meta.monto_meta.toLocaleString()}</td>
                <td className="acciones">
                  <button className="btn-editar" onClick={() => handleEditar(meta)}>Editar</button>
                  <button className="btn-eliminar" onClick={() => handleEliminar(meta.id_meta)}>Eliminar</button>
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
                  value={nuevaMeta.fecha_limite}
                  onChange={(e) => setNuevaMeta({ ...nuevaMeta, fecha_limite: e.target.value })}
                />
              </label>

              <label>
                Monto meta
                <input
                  type="text"
                  value={nuevaMeta.monto_meta}
                  onChange={(e) => {
                    const sinPuntos = e.target.value.replace(/\./g, '');
                    if (!isNaN(sinPuntos)) {
                      const formateado = Number(sinPuntos).toLocaleString("es-CL");
                      setNuevaMeta({ ...nuevaMeta, monto_meta: formateado });
                    }
                  }}
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
      {mostrarConfirmacion && (
      <div className="modal-overlay">
        <div className="modal-box">
          <h3 className="modal-titulo">¿Estás segura de que deseas eliminar esta meta de ahorro?</h3>
          <div className="modal-acciones">
            <button className="btn-aceptar" onClick={confirmarEliminar}>
              Sí, eliminar
            </button>
            <button className="btn-cancelar" onClick={cancelarEliminar}>
              No, cancelar
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}