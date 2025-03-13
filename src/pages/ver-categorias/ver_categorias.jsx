import React, { useState } from "react";
import "./ver_categorias.css";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";

const Categorias = () => {
  const [categorias, setCategorias] = useState([
    { nombre: "General", tipo: "Ambos" },
    { nombre: "Costura", tipo: "Ingreso" },
    { nombre: "Tonteras", tipo: "Gasto" },
  ]);

  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", tipo: "" });
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  const handleEliminar = (index) => {
    const nuevasCategorias = categorias.filter((_, idx) => idx !== index);
    setCategorias(nuevasCategorias);
  };

  const handleEditar = (index) => {
    setCategoriaEditando(index);
    setNuevaCategoria(categorias[index]);
    setMostrarModalAgregar(true);
  };

  const handleAceptar = () => {
    if (nuevaCategoria.nombre && nuevaCategoria.tipo) {
      if (categoriaEditando !== null) {
        const nuevasCategorias = categorias.map((categoria, idx) =>
          idx === categoriaEditando ? nuevaCategoria : categoria
        );
        setCategorias(nuevasCategorias);
        setCategoriaEditando(null);
      } else {
        setCategorias([...categorias, nuevaCategoria]);
      }
      setMostrarModalAgregar(false);
      setNuevaCategoria({ nombre: "", tipo: "" });
    }
  };

  return (
    <div className="page-layout">
      <Header />
      <div className="categorias-container">
        <div className="contenido">
          <h2 className="titulo-categorias">Categorías</h2>
          <button
            className="btn-agregar"
            onClick={() => setMostrarModalAgregar(true)}
          >
            Agregar categoría
          </button>
          <table className="tabla-categorias">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria, idx) => (
                <tr key={idx} className="item-categoria">
                  <td>{categoria.nombre}</td>
                  <td>{categoria.tipo}</td>
                  <td className="acciones">
                    <button className="btn-editar" onClick={() => handleEditar(idx)}>Editar</button>
                    <button className="btn-eliminar" onClick={() => handleEliminar(idx)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {mostrarModalAgregar && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h3 className="modal-titulo">{categoriaEditando !== null ? "Editar categoría" : "Agregar categoría"}</h3>
                <label>
                  Nombre
                  <input
                    type="text"
                    placeholder="Ingrese nombre de la categoría"
                    value={nuevaCategoria.nombre}
                    onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })}
                  />
                </label>
                <label>
                  Tipo
                  <select
                    value={nuevaCategoria.tipo}
                    onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, tipo: e.target.value })}
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="Ingreso">Ingreso</option>
                    <option value="Gasto">Gasto</option>
                    <option value="Ambos">Ambos</option>
                  </select>
                </label>
                <div className="modal-acciones">
                  <button className="btn-aceptar" onClick={handleAceptar}>Aceptar</button>
                  <button
                    className="btn-cancelar"
                    onClick={() => {
                      setMostrarModalAgregar(false);
                      setCategoriaEditando(null);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Categorias;