import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./Transacciones.css";

export default function Transacciones() {
  
  const [nuevaTransaccion, setNuevaTransaccion] = useState({
    fecha: "",
    monto: "",
    categoria: "",
    descripcion: "",
    repetido: false,
    mesPago: "",
    imagen: null,
    tipoPago: "efectivo",
    cuotas: "1",
    interes: "0",
    totalCredito: "",
    valorCuota: ""
  });
  
  const [tipo, setTipo] = useState("gasto");
  const [categorias, setCategorias] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [eliminadas, setEliminadas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [transaccionEditada, setTransaccionEditada] = useState({});
  const [camposInvalidos, setCamposInvalidos] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (!nuevaTransaccion.mesPago) {
      setNuevaTransaccion((prev) => ({ ...prev, mesPago: getMesActual() }));
    }
  }, [tipo]);
  
  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (!id_usuario) return;
  
    fetch(`http://localhost:5000/api/transacciones/categorias/${id_usuario}`)
      .then(res => res.json())
      .then(data => {
        setCategorias(data);
      })
      .catch(err => {
        console.error("Error al cargar categorías:", err);
      });
  }, []);

  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (!id_usuario) return;
  
    fetch(`http://localhost:5000/api/transacciones/${id_usuario}`)
      .then(res => res.json())
      .then(data => {
        setTransacciones(data);
      })
      .catch(err => {
        console.error("Error al cargar transacciones:", err);
      });
  }, []);  
  
  const getMesActual = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, "0");
    return `${año}-${mes}`;
  };
  
  const formatearConPuntos = (valor) => {
    const soloNumeros = valor.replace(/\D/g, "");
    return soloNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let newValue;
  
    if (type === "checkbox") newValue = checked;
    else if (type === "file") newValue = files[0];
    else if (name === "monto") newValue = formatearConPuntos(value);
    else newValue = value;
  
    setNuevaTransaccion((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };  

  const handleModalChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let newValue;
  
    if (type === "checkbox") newValue = checked;
    else if (type === "file") newValue = files[0];
    else if (name === "monto") newValue = formatearConPuntos(value);
    else newValue = value;
  
    setTransaccionEditada((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };  
  
  const editarTransaccion = (index) => {
    setEditIndex(index);
    setTransaccionEditada({ ...transacciones[index] });
  };
  
  const actualizarTransaccion = () => {
    const nuevas = [...transacciones];
    nuevas[editIndex] = transaccionEditada;
    setTransacciones(nuevas);
    setShowModal(null);
  };
  
  const convertirA_base64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const enviarTransaccion = async () => {
    const id_usuario = parseInt(localStorage.getItem("id_usuario"));
    if (!id_usuario) {
      alert("Usuario no autenticado");
      return;
    }
  
    const camposObligatorios = ["fecha", "monto", "categoria", "descripcion", "tipoPago"];
    const faltantes = camposObligatorios.filter((campo) => !nuevaTransaccion[campo]);
    if (faltantes.length > 0) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }
  
    let imagenBase64 = null;
    if (nuevaTransaccion.imagen) {
      imagenBase64 = await convertirA_base64(nuevaTransaccion.imagen);
    }
  
    const montoNumerico = parseFloat(nuevaTransaccion.monto.replace(/\./g, "").replace(",", "."));
  
    const transaccionAEnviar = {
      id_usuario,
      tipo,
      fecha: nuevaTransaccion.fecha,
      monto: montoNumerico,
      categoria: nuevaTransaccion.categoria,
      descripcion: nuevaTransaccion.descripcion,
      tipoPago: nuevaTransaccion.tipoPago,
      cuotas: parseInt(nuevaTransaccion.cuotas || 1),
      interes: parseFloat(nuevaTransaccion.interes || 0),
      valorCuota: parseFloat(nuevaTransaccion.valorCuota || 0),
      totalCredito: parseFloat(nuevaTransaccion.totalCredito || 0),
      repetido: nuevaTransaccion.repetido,
      imagen: imagenBase64
    };
    
    console.log("Transacción que se va a enviar:", transaccionAEnviar); // ✅ AHORA SÍ    
  
    try {
      const respuesta = await fetch("http://localhost:5000/api/transacciones/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaccionAEnviar)
      });
  
      if (!respuesta.ok) throw new Error("Error al guardar");
  
      alert("✅ Transacción guardada con éxito");
  
      setNuevaTransaccion({
        fecha: "",
        monto: "",
        categoria: "",
        descripcion: "",
        repetido: false,
        mesPago: getMesActual(),
        imagen: null,
        tipoPago: "efectivo",
        cuotas: "1",
        interes: "0",
        totalCredito: "",
        valorCuota: ""
      });
  
      if (fileInputRef.current) fileInputRef.current.value = "";
  
    } catch (error) {
      console.error("Error al guardar transacción:", error);
      alert("❌ Error al guardar. Revisa la consola.");
    }
  };    

  return (
    <div className="page-layout">
      <Header />
      <div className="transacciones-container">
        <h1 className="titulo">Gestión de Transacciones</h1>

        <div className="botones-agregar">
          <button className="btn-seleccion" onClick={() => setTipo("ingreso")}>Agregar ingreso</button>
          <button className="btn-seleccion" onClick={() => setTipo("gasto")}>Agregar gasto</button>
        </div>

        <div className="formulario-transaccion">
          <h2 className={`titulo-formulario ${tipo}`}>{tipo.toUpperCase()}</h2>
          <div className="grid-formulario">

            <div className="campo-fecha">
              <label className="required">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={nuevaTransaccion.fecha}
                onChange={handleChange}
                required
                className={'form-input ${camposInvalidos.includes("fecha") ? "input-error" : ""}'}
              />
            </div>

            <div className="campo-monto">
              <label className="required">Monto</label>
              <input
                type="text"
                name="monto"
                value={nuevaTransaccion.monto}
                onChange={handleChange}
                required
                className={camposInvalidos.includes("monto") ? "input-error" : ""}
              />
            </div>

            <div className="campo-categoria">
              <label className="required">Categoría</label>
              <select
                name="categoria"
                value={nuevaTransaccion.categoria}
                onChange={handleChange}
                required
                className={camposInvalidos.includes("categoria") ? "input-error" : ""}
              >
                <option value="" disabled hidden>Seleccione una</option>
                {categorias.map((cat, index) => (
                  <option key={index} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div className="campo-descripcion">
              <label className="required">Descripción</label>
              <input
                type="text"
                name="descripcion"
                value={nuevaTransaccion.descripcion}
                onChange={handleChange}
              />
            </div>

            <div className="campo-tipopago">
              <label className="required">Tipo de pago</label>
              <select
                name="tipoPago"
                value={nuevaTransaccion.tipoPago}
                onChange={handleChange}
                required
                className={camposInvalidos.includes("tipoPago") ? "input-error" : ""}
              >
                <option value="" disabled hidden>Seleccione uno</option>

                {tipo === "ingreso" ? (
                  <>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="deposito">Depósito</option>
                  </>
                ) : (
                  <>
                    <option value="efectivo">Efectivo</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                  </>
                )}
              </select>
            </div>

            {nuevaTransaccion.tipoPago === "credito" && (
              <>
                <div className="campo-cuotas">
                  <label className="required">Número de cuotas</label>
                  <input
                    type="number"
                    name="cuotas"
                    value={nuevaTransaccion.cuotas}
                    onChange={handleChange}
                    min="1"
                    required
                    className={`required ${camposInvalidos.includes("cuotas") ? "input-error" : ""}`}
                  />
                </div>

                <div className="campo-interes">
                  <label>Interés (%)</label>
                  <input
                    type="number"
                    name="interes"
                    value={nuevaTransaccion.interes}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    className={camposInvalidos.includes("interes") ? "input-error" : ""}
                  />
                </div>

                <div className="campo-valor-cuota">
                  <label>Valor estimado de cuota</label>
                  <input type="text" value={nuevaTransaccion.valorCuota} disabled />
                </div>

                <div className="campo-total-credito">
                  <label>Total estimado a pagar</label>
                  <input type="text" value={nuevaTransaccion.totalCredito} disabled />
                </div>
              </>
            )}

            <div className="campo-imagen">
              <label>Adjuntar imagen</label>
              <input
                type="file"
                ref={fileInputRef}
                name="imagen"
                onChange={handleChange}
              />
            </div>


          </div>

          <div className="acciones">
            <button className="btn-guardar" onClick={enviarTransaccion}>
              {editIndex !== null ? "Actualizar" : "Guardar"} {tipo}
            </button>
          </div>
        </div>

        <h3 className="titulo-secundario">Transacciones registradas</h3>
          <div className="lista-transacciones">
          {transacciones.map((t, index) => (
            <div className="tarjeta-minimal" key={index}>
              <div className="fila-superior">
                <div className={`tag ${t.tipo === "ingreso" ? "ingreso" : ""}`}>{t.tipo.toUpperCase()}</div>
                <div className="fecha">{t.fecha}</div>
              </div>

              <div className="contenido-horizontal">
                <div className="item">
                  <span>Monto:</span>
                  <div className="monto">
                    ${Number(t.monto).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="item">
                  <span>Categoría:</span>
                  <div>{t.categoria}</div>
                </div>
                <div className="item">
                  <span>Descripción:</span>
                  <div>{t.descripcion}</div>
                </div>
                <div className="item">
                  <span>Tipo de pago:</span>
                  <div>{t.tipoPago}</div>
                </div>
              </div>

              <div className="acciones">
                <button className="texto-boton editar" onClick={() => editarTransaccion(t)}>Editar</button>
                <button className="texto-boton eliminar" onClick={() => eliminarTransaccion(t.id_transaccion)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>

      <h3 className="titulo-secundario">Transacciones eliminadas</h3>
      <ul className="lista-transacciones historial-eliminadas">
        {eliminadas.map((t, index) => (
          <li key={index} className="item-transaccion">
            <div className="resumen-transaccion solo-texto">
              <div className="info-columna">
                <div><strong>Tipo:</strong><br /> {t.tipo.toUpperCase()}</div>
                <div><strong>Fecha:</strong><br /> {t.fecha}</div>
                <div><strong>Descripción:</strong><br /> {t.descripcion}</div>
                <div><strong>Tipo de pago:</strong><br /> {t.tipoPago}</div>
              </div>
            </div>
            <div className="acciones-transaccion">
            <button
              onClick={() => {
                fetch(`http://localhost:5000/transacciones/${t.id}/recuperar`, {
                  method: 'PUT',
                }).then(() => {
                  setHistorial(historial.filter(item => item.id !== t.id));
                  setTransacciones([...transacciones, { ...t, visible: true }]);
                });
              }}              
            >
              Recuperar
            </button>
            </div>
          </li>
        ))}
      </ul>
      {showModal !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editar transacción</h3>
            <div className="grid-formulario">

              <div className="campo-fecha">
                <label className="required">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={transaccionEditada.fecha}
                  onChange={handleModalChange}
                  required
                  className={camposInvalidos.includes("fecha") ? "input-error" : ""}
                />
              </div>

              <div className="campo-monto">
                <label className="required">Monto</label>
                <input
                  type="text"
                  name="monto"
                  value={transaccionEditada.monto}
                  onChange={handleModalChange}
                  required
                  className={camposInvalidos.includes("monto") ? "input-error" : ""}
                />
              </div>

              <div className="campo-categoria">
                <label className="required">Categoría</label>
                <select
                  name="categoria"
                  value={transaccionEditada.categoria}
                  onChange={handleModalChange}
                  required
                  className={camposInvalidos.includes("categoria") ? "input-error" : ""}
                >
                  <option value="" disabled hidden>Seleccione una</option>
                  {categorias.map((cat, index) => (
                    <option key={index} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="campo-descripcion">
                <label className="required">Descripción</label>
                <input
                  type="text"
                  name="descripcion"
                  value={transaccionEditada.descripcion}
                  onChange={handleModalChange}
                  required
                  className={camposInvalidos.includes("descripcion") ? "input-error" : ""}
                />
              </div>

              <div className="campo-tipopago">
                <label className="required">Tipo de pago</label>
                <select
                  name="tipoPago"
                  value={transaccionEditada.tipoPago}
                  onChange={handleModalChange}
                  required
                  className={camposInvalidos.includes("tipoPago") ? "input-error" : ""}
                >
                  <option value="" disabled hidden>Seleccione uno</option>

                  {tipo === "ingreso" ? (
                    <>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="deposito">Depósito</option>
                    </>
                  ) : (
                    <>
                      <option value="efectivo">Efectivo</option>
                      <option value="debito">Débito</option>
                      <option value="credito">Crédito</option>
                    </>
                  )}
                </select>
              </div>

              {transaccionEditada.tipoPago === "credito" && (
                <>
                  <div className="campo-cuotas">
                    <label className="required">Número de cuotas</label>
                    <input
                      type="number"
                      name="cuotas"
                      value={transaccionEditada.cuotas}
                      onChange={handleModalChange}
                      min="1"
                      required
                      className={`required ${camposInvalidos.includes("cuotas") ? "input-error" : ""}`}
                    />
                  </div>

                  <div className="campo-interes">
                    <label>Interés (%)</label>
                    <input
                      type="number"
                      name="interes"
                      value={transaccionEditada.interes}
                      onChange={handleModalChange}
                      step="0.1"
                      min="0"
                      className={camposInvalidos.includes("interes") ? "input-error" : ""}
                    />
                  </div>

                  <div className="campo-valor-cuota">
                    <label>Valor estimado de cuota</label>
                    <input type="text" value={transaccionEditada.valorCuota} disabled />
                  </div>

                  <div className="campo-total-credito">
                    <label>Total estimado a pagar</label>
                    <input type="text" value={transaccionEditada.totalCredito} disabled />
                  </div>
                </>
              )}
            </div>

            <div className="acciones-transaccion">
              <button className="btn-guardar" onClick={actualizarTransaccion}>
                Guardar
              </button>
              <button className="btn-cerrar" onClick={() => setShowModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
    <Footer />
  </div>
  );
  }