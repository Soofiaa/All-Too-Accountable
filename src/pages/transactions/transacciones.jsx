import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./Transacciones.css";

export default function Transacciones() {
  const [transacciones, setTransacciones] = useState([]);
  const [tipo, setTipo] = useState("gasto");
  const [editIndex, setEditIndex] = useState(null);
  const fileInputRef = useRef(null);
  const [showModal, setShowModal] = useState(null);
  const [camposInvalidos, setCamposInvalidos] = useState([]);
  const [transaccionEditada, setTransaccionEditada] = useState(null);
  const [eliminadas, setEliminadas] = useState([]);

  const getMesActual = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  const [nuevaTransaccion, setNuevaTransaccion] = useState({
    fecha: "",
    monto: "",
    categoria: "",
    descripcion: "",
    repetido: false,
    mesPago: getMesActual(),
    imagen: null,
    tipoPago: "",
    cuotas: "",
    interes: "",
    totalCredito: "",
    valorCuota: ""
  });

  useEffect(() => {
    fetch('http://localhost:5000/transacciones')
      .then(response => response.json())
      .then(data => {
        const activas = data.filter(tx => tx.visible === true);
        const eliminadas = data.filter(tx => tx.visible === false);
        setTransacciones(activas);
        setHistorial(eliminadas);
      });
  }, []);
  
  useEffect(() => {
    if (!nuevaTransaccion.mesPago) {
      setNuevaTransaccion((prev) => ({ ...prev, mesPago: getMesActual() }));
    }
  }, [tipo]);

  useEffect(() => {
    const rawMonto = parseFloat(nuevaTransaccion.monto.replace(/\./g, ""));
    const cuotas = parseInt(nuevaTransaccion.cuotas) || 1;
    const interes = parseFloat(nuevaTransaccion.interes) || 0;
    if (nuevaTransaccion.tipoPago === "credito" && rawMonto) {
      const total = rawMonto * Math.pow(1 + interes / 100, cuotas);
      const valorCuota = total / cuotas;
      setNuevaTransaccion((prev) => ({
        ...prev,
        totalCredito: total.toFixed(2),
        valorCuota: valorCuota.toFixed(2)
      }));
    }
  }, [nuevaTransaccion.monto, nuevaTransaccion.cuotas, nuevaTransaccion.interes, nuevaTransaccion.tipoPago]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setNuevaTransaccion({ ...nuevaTransaccion, imagen: files[0] });
    } else if (name === "monto") {
      const numericValue = value.replace(/[^\d]/g, "");
      const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      setNuevaTransaccion({ ...nuevaTransaccion, [name]: formattedValue });
    } else {
      setNuevaTransaccion({
        ...nuevaTransaccion,
        [name]: type === "checkbox" ? checked : value
      });
    }
  };

  const handleModalChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setTransaccionEditada({ ...transaccionEditada, imagen: files[0] });
    } else if (name === "monto") {
      const numericValue = value.replace(/[^\d]/g, "");
      const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      setTransaccionEditada({ ...transaccionEditada, [name]: formattedValue });
    } else {
      setTransaccionEditada({
        ...transaccionEditada,
        [name]: type === "checkbox" ? checked : value
      });
    }
  };

  /* AGREGADA 9-4-2025 */
  const agregarTransaccion = async () => {
    const camposFaltantes = [];
    if (!nuevaTransaccion.fecha) camposFaltantes.push("fecha");
    if (!nuevaTransaccion.monto) camposFaltantes.push("monto");
    if (!nuevaTransaccion.categoria) camposFaltantes.push("categoria");
    if (!nuevaTransaccion.descripcion) camposFaltantes.push("descripcion");
    if (!nuevaTransaccion.tipoPago) camposFaltantes.push("tipoPago");
  
    if (camposFaltantes.length > 0) {
      setCamposInvalidos(camposFaltantes);
      alert("Por favor completa todos los campos obligatorios antes de guardar la transacción.");
      return;
    }
  
    const transaccionAEnviar = {
      ...nuevaTransaccion,
      tipo, // gasto o ingreso
    };
  
    try {
      const respuesta = await fetch("http://localhost:5000/api/transacciones/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaccionAEnviar)
      });
  
      if (!respuesta.ok) throw new Error("Error al guardar");
  
      alert("Transacción guardada con éxito ✅");
  
      // Limpia el formulario
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
      alert("Error al guardar. Revisa la consola.");
    }
  };    

  const actualizarTransaccion = () => {
    const camposFaltantes = [];
    if (!transaccionEditada.fecha) camposFaltantes.push("fecha");
    if (!transaccionEditada.monto) camposFaltantes.push("monto");
    if (!transaccionEditada.categoria) camposFaltantes.push("categoria");
    if (!transaccionEditada.descripcion) camposFaltantes.push("descripcion");
    if (!transaccionEditada.tipoPago) camposFaltantes.push("tipoPago");
  
    if (camposFaltantes.length > 0) {
      setCamposInvalidos(camposFaltantes);
      alert("Por favor completa todos los campos obligatorios antes de guardar la transacción.");
      return;
    }
  
    setCamposInvalidos([]);
    const actualizadas = [...transacciones];
    actualizadas[editIndex] = transaccionEditada;
    setTransacciones(actualizadas);
    setEditIndex(null);
    setShowModal(null);
  };

  const eliminarTransaccion = (index) => {
    const transaccionEliminada = transacciones[index];
    const actualizadas = transacciones.filter((_, i) => i !== index);
    setTransacciones(actualizadas);
    setEliminadas([...eliminadas, transaccionEliminada]);
  };
  
  const restaurarTransaccion = (index) => {
    const transaccionRestaurada = eliminadas[index];
    setTransacciones([...transacciones, transaccionRestaurada]);
    setEliminadas(eliminadas.filter((_, i) => i !== index));
  };  

  const editarTransaccion = (index) => {
    setTransaccionEditada(transacciones[index]);
    setEditIndex(index);
    setShowModal(index);
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
                <option value="General">General</option>
                <option value="Costuras">Costuras</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Transporte">Transporte</option>
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
            <button className="btn-guardar" onClick={agregarTransaccion}>
              {editIndex !== null ? "Actualizar" : "Guardar"} {tipo}
            </button>
          </div>
        </div>

        <h3 className="titulo-secundario">Transacciones registradas</h3>
        <ul className="lista-transacciones">
        {transacciones.map((t, index) => (
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
            <button className="btn-editar" onClick={() => { editarTransaccion(index); setShowModal(index); }}>Editar</button>
            <button
              onClick={() => {
                fetch(`http://localhost:5000/transacciones/${tx.id}`, {
                  method: 'DELETE',
                }).then(() => {
                  setTransacciones(transacciones.filter(t => t.id !== tx.id));
                  setHistorial([...historial, { ...tx, visible: false }]);
                });
              }}
            >
              Eliminar
            </button>
            </div>
          </li>
        ))}
      </ul>
      
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
                fetch(`http://localhost:5000/transacciones/${tx.id}/recuperar`, {
                  method: 'PUT',
                }).then(() => {
                  setHistorial(historial.filter(t => t.id !== tx.id));
                  setTransacciones([...transacciones, { ...tx, visible: true }]);
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
                  <option value="General">General</option>
                  <option value="Costuras">Costuras</option>
                  <option value="Alimentación">Alimentación</option>
                  <option value="Transporte">Transporte</option>
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