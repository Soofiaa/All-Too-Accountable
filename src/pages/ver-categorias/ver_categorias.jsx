import "./ver_categorias.css";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import React, { useState, useEffect } from "react";

const idUsuario = localStorage.getItem("id_usuario");

// 9-4-2024 - Se agrega la función Categorias para manejar la vista de categorías
const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  useEffect(() => {
    fetch(`http://localhost:5000/api/categorias/${idUsuario}`)
      .then(res => res.json())
      .then(data => {
        const ordenadas = [...data].sort((a, b) => {
          if (a.nombre === "General") return -1;
          if (b.nombre === "General") return 1;
          return 0;
        });
        setCategorias(ordenadas);
      })      
      .catch(err => console.error("Error al cargar categorías:", err));
}, []);

  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", tipo: "" });
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

  // 9-4-2024 - Se agrega la función handleEliminar para manejar la eliminación de categorías
  const handleEliminar = (index) => {
    setCategoriaAEliminar(index);
    setMostrarConfirmacion(true);
  };  
  
  const confirmarEliminar = async () => {
    const id = categorias[categoriaAEliminar].id;
  
    await fetch(`http://localhost:5000/api/categorias/${id}`, {
      method: "DELETE",
    });
  
    // Elimina localmente sin alterar el orden
    const nuevas = [...categorias];
    nuevas.splice(categoriaAEliminar, 1);
    setCategorias(nuevas);
  
    setMostrarConfirmacion(false);
    setCategoriaAEliminar(null);
  };  
  
  const cancelarEliminar = () => {
    setMostrarConfirmacion(false);
    setCategoriaAEliminar(null);
  };  

  const handleEditar = (index) => {
    setCategoriaEditando(index);
    setNuevaCategoria(categorias[index]);
    setMostrarModalAgregar(true);
  };

  // 9-4-2024 - Se agrega la función handleAceptar para manejar la creación y edición de categorías
  const handleAceptar = async () => {
    if (!nuevaCategoria.nombre.trim() || !nuevaCategoria.tipo.trim()) {
      alert("Todos los campos son obligatorios.");
      return;
    }    
  
    const idUsuario = localStorage.getItem("id_usuario");
  
    if (categoriaEditando !== null) {
      const categoriaAEditar = categorias[categoriaEditando];
  
      try {
        const respuesta = await fetch(
          `http://localhost:5000/api/categorias/${categoriaAEditar.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre: nuevaCategoria.nombre.trim(),
              tipo: nuevaCategoria.tipo.trim(),
              id_usuario: parseInt(idUsuario)
            }),
          }
        );
  
        if (!respuesta.ok) {
          const errorText = await respuesta.text();
          console.error("Error al editar categoría:", errorText);
          alert("No se pudo editar la categoría.");
          return;
        }
  
        // Actualizar la lista local
        const nuevasCategorias = [...categorias];
        nuevasCategorias[categoriaEditando].nombre = nuevaCategoria.nombre;
        nuevasCategorias[categoriaEditando].tipo = nuevaCategoria.tipo;
        setCategorias(nuevasCategorias);
  
      } catch (error) {
        console.error("Error de red al editar:", error);
        alert("Error de red al editar");
      }
  
    } else {
      const idUsuario = parseInt(localStorage.getItem("id_usuario"));

      const nueva = {
        nombre: nuevaCategoria.nombre.trim(),
        tipo: nuevaCategoria.tipo.trim(),
        id_usuario: idUsuario
      };

      try {
        const respuesta = await fetch("http://localhost:5000/api/categorias/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(nueva)
        });
  
        if (!respuesta.ok) {
          const errorText = await respuesta.text();
          console.error("Error al crear categoría:", errorText);
          alert("No se pudo crear la categoría.");
          return;
        }
  
        const nuevaCategoriaConEditable = {
          ...nueva,
          editable: true
        };
        setCategorias(prev => [...prev, nuevaCategoriaConEditable]);
  
      } catch (error) {
        console.error("Error de red al crear:", error);
        alert("Error de red al crear");
      }
    }
  
    // Al final: limpiar y cerrar modal
    setMostrarModalAgregar(false);
    setCategoriaEditando(null);
    setNuevaCategoria({ nombre: "", tipo: "" });
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
                    {categoria.editable !== false ? (
                      <>
                        <button className="btn-editar" onClick={() => handleEditar(idx)}>Editar</button>
                        <button className="btn-eliminar" onClick={() => handleEliminar(idx)}>Eliminar</button>
                      </>
                    ) : (
                      <span style={{ opacity: 0.5 }}>–</span>  // ← para mantener el espacio y el balance
                    )}
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
      {mostrarConfirmacion && (
      <div className="modal-overlay">
        <div className="modal-box">
          <h3 className="modal-titulo">
            ¿Estás segura de que deseas eliminar esta categoría?
          </h3>
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
      <Footer />
    </div>
  );
};

export default Categorias;