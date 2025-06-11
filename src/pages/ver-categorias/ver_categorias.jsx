import "./ver_categorias.css";
import React, { useState, useEffect } from "react";
import { getIdUsuario } from "../../utils/usuario";

const API_URL = import.meta.env.VITE_API_URL;

const Categorias = () => {

  const idUsuario = getIdUsuario();
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", tipo: "", monto_limite: 0 });
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [filaOcultando, setFilaOcultando] = useState(null);

  if (!idUsuario) {
    alert("No se encontró el ID del usuario. Por favor, inicia sesión.");
    return null; // detiene la carga del componente
  }
  
  const [categorias, setCategorias] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/categorias/${idUsuario}`)
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


  const handleEliminar = (index) => {
      setCategoriaAEliminar(index);
      setMostrarConfirmacion(true);
    };  
    
    const confirmarEliminar = async () => {
      const categoria = categorias[categoriaAEliminar];
      const id = categoria.id_categoria;

      setFilaOcultando(id); // activa clase de ocultar

      setTimeout(async () => {
        try {
          const respuesta = await fetch(`${API_URL}/categorias/${id}`, {
            method: "DELETE",
          });

          if (!respuesta.ok) {
            const data = await respuesta.json();
            alert(data.error || "No se pudo eliminar la categoría.");
            setFilaOcultando(null);
            return;
          }

          const nuevas = categorias.filter(c => c.id_categoria !== id);
          setCategorias(nuevas);
        } catch (error) {
          console.error("Error eliminando categoría:", error);
          alert("Error de red al eliminar.");
        }

        setMostrarConfirmacion(false);
        setCategoriaAEliminar(null);
        setFilaOcultando(null);
      }, 500); // tiempo igual al CSS (0.5s)
    };
  
  const cancelarEliminar = () => {
    setMostrarConfirmacion(false);
    setCategoriaAEliminar(null);
  };  


  const handleEditar = (index) => {
    const categoria = categorias[index];
    const tipoCapitalizado = categoria.tipo.charAt(0).toUpperCase() + categoria.tipo.slice(1);

    setNuevaCategoria({
      nombre: categoria.nombre,
      tipo: tipoCapitalizado,
      monto_limite: categoria.monto_limite
        ? categoria.monto_limite.toLocaleString("es-CL")
        : ""
    });

    setCategoriaEditando(index);
    setMostrarModalAgregar(true);
  }; 

  
  const handleAceptar = async () => {
    if (!nuevaCategoria.nombre.trim() || !nuevaCategoria.tipo.trim()) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    const idUsuario = getIdUsuario();
    
    const montoLimpio = 
      nuevaCategoria.tipo === "Ingreso" || nuevaCategoria.monto_limite === "" 
        ? 0 
        : parseInt(nuevaCategoria.monto_limite.replace(/\./g, ""));

    if (categoriaEditando !== null) {
      const categoriaAEditar = categorias[categoriaEditando];

      if (!categoriaAEditar?.id_categoria) {
        alert("No se encontró el ID de la categoría a editar.");
        return;
      }

      try {
        const respuesta = await fetch(`${API_URL}/categorias/${categoriaAEditar.id_categoria}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nuevaCategoria.nombre.trim(),
            tipo: nuevaCategoria.tipo.trim().toLowerCase(),
            monto_limite: montoLimpio,
            id_usuario: parseInt(idUsuario)
          }),
        });

        if (!respuesta.ok) {
          const errorText = await respuesta.text();
          console.error("Error al editar categoría:", errorText);
          alert("No se pudo editar la categoría.");
          return;
        }

        const nuevasCategorias = [...categorias];
        nuevasCategorias[categoriaEditando] = {
          ...nuevasCategorias[categoriaEditando],
          nombre: nuevaCategoria.nombre,
          tipo: nuevaCategoria.tipo,
          monto_limite: montoLimpio
        };
        setCategorias(nuevasCategorias);

      } catch (error) {
        console.error("Error de red al editar:", error);
        alert("Error de red al editar");
      }

    } else {
      const nueva = {
        nombre: nuevaCategoria.nombre.trim(),
        tipo: nuevaCategoria.tipo.trim().toLowerCase(),
        monto_limite: montoLimpio,
        id_usuario: parseInt(idUsuario)
      };

      try {
        const respuesta = await fetch(`${API_URL}/categorias/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nueva)
        });

        if (!respuesta.ok) {
          const errorText = await respuesta.text();
          console.error("Error al crear categoría:", errorText);
          alert("No se pudo crear la categoría.");
          return;
        }

        const creada = await respuesta.json();
        setCategorias(prev => [...prev, { ...creada, editable: true }]);

        setCategorias(prev => [...prev, nuevaCategoriaConEditable]);

      } catch (error) {
        console.error("Error de red al crear:", error);
        alert("Error de red al crear");
      }
    }

    setMostrarModalAgregar(false);
    setCategoriaEditando(null);
    setNuevaCategoria({ nombre: "", tipo: "", monto_limite: "" });
  };


  return (
    <div className="page-layout">
      <div className="categorias-container">
        <div className="contenido">
          <h2 className="titulo-categorias">Gestión de Categorías</h2>
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
                <th>Monto Límite</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria, idx) => (
                <tr
                  key={idx}
                  className={`item-categoria fila-categoria ${filaOcultando === categoria.id_categoria ? "fila-oculta" : ""}`}
                >
                  <td>{categoria.nombre}</td>
                  <td>{categoria.tipo.charAt(0).toUpperCase() + categoria.tipo.slice(1)}</td>
                  <td>
                    {categoria.monto_limite ? `$${categoria.monto_limite.toLocaleString("es-CL")}` : "Sin límite"}
                  </td>
                  <td className="acciones">
                    {["General"].includes(categoria.nombre) ? (
                      <span style={{ opacity: 0.5 }}>–</span>
                    ) : (
                      <>
                        <button className="btn-editar" onClick={() => handleEditar(idx)}>Editar</button>
                        <button className="btn-eliminar" onClick={() => handleEliminar(idx)}>Eliminar</button>
                      </>
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
                <label>
                  Monto límite
                  <input
                    type="text"
                    placeholder="Ingrese monto límite"
                    value={nuevaCategoria.monto_limite}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\./g, "");
                      if (value === "") {
                        setNuevaCategoria({ ...nuevaCategoria, monto_limite: "" });
                      } else if (/^\d+$/.test(value)) {
                        const numeroConPuntos = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                        setNuevaCategoria({ ...nuevaCategoria, monto_limite: numeroConPuntos });
                      }
                    }}
                    disabled={nuevaCategoria.nombre === "General" || nuevaCategoria.tipo === "Ingreso"}
                  />
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
    </div>
  );
};

export default Categorias;