import React, { useState } from "react";
import "./ver_categorias.css";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";

const Categorias = () => {
  const [categorias, setCategorias] = useState([
    { nombre: "General", tipo: "" },
    { nombre: "Costura", tipo: "Ingreso" },
    { nombre: "Tonteras", tipo: "Gasto" },
  ]);

  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", tipo: "" });

  return (
    <div className="categorias-container">
      <Header />
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
                  <button className="btn-editar">Editar</button>
                  <button className="btn-eliminar">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {mostrarModalAgregar && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3 className="modal-titulo">Agregar categoría</h3>
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
                </select>
              </label>
              <div className="modal-acciones">
                <button className="btn-aceptar" onClick={() => {
                  if(nuevaCategoria.nombre && nuevaCategoria.tipo){
                    setCategorias([...categorias, nuevaCategoria]);
                    setMostrarModalAgregar(false);
                    setNuevaCategoria({nombre: "", tipo: ""});
                  }
                }}>Aceptar</button>
                <button
                  className="btn-cancelar"
                  onClick={() => setMostrarModalAgregar(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Categorias;
