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
    tipoPago: "efectivo",
    cuotas: "1",
    interes: "0",
    totalCredito: "",
    valorCuota: ""
  });

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

  const agregarTransaccion = () => {
    const nueva = { ...nuevaTransaccion, tipo };
    const actualizadas = editIndex !== null ? [...transacciones] : [...transacciones, nueva];
    if (editIndex !== null) actualizadas[editIndex] = nueva;
    setTransacciones(actualizadas);
    setEditIndex(null);
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
  };

  const eliminarTransaccion = (index) => {
    const actualizadas = transacciones.filter((_, i) => i !== index);
    setTransacciones(actualizadas);
  };

  const editarTransaccion = (index) => {
    setNuevaTransaccion(transacciones[index]);
    setEditIndex(index);
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
              <label>Fecha</label>
              <input type="date" name="fecha" value={nuevaTransaccion.fecha} onChange={handleChange} />
            </div>

            <div className="campo-monto">
              <label>Monto</label>
              <input type="text" name="monto" value={nuevaTransaccion.monto} onChange={handleChange} />
            </div>

            <div className="campo-categoria">
              <label>Categoría</label>
              <select name="categoria" value={nuevaTransaccion.categoria} onChange={handleChange}>
                <option value="">Seleccione una</option>
                <option value="General">General</option>
                <option value="Costuras">Costuras</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Transporte">Transporte</option>
              </select>
            </div>

            <div className="campo-descripcion">
              <label>Descripción</label>
              <input type="text" name="descripcion" value={nuevaTransaccion.descripcion} onChange={handleChange} />
              <div className="campo-repetido">
                <label style={{ fontSize: "0.875rem", color: "#fffff" }}>
                  <input type="checkbox" name="repetido" checked={nuevaTransaccion.repetido} onChange={handleChange} style={{ width: "16px", height: "16px" }} /> ¿Suele repetirse?
                </label>
              </div>
            </div>

            <div className="campo-tipopago">
              <label>Tipo de pago</label>
              <select name="tipoPago" value={nuevaTransaccion.tipoPago} onChange={handleChange}>
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
            </div>

            <div className="campo-imagen">
              <label>Adjuntar imagen
                <input type="file" ref={fileInputRef} name="imagen" onChange={handleChange} />
              </label>
            </div>

            {nuevaTransaccion.tipoPago === "credito" && (
              <>
                <div className="campo-cuotas">
                  <label>Número de cuotas</label>
                  <input type="number" name="cuotas" value={nuevaTransaccion.cuotas} onChange={handleChange} min="1" />
                </div>

                <div className="campo-interes">
                  <label>Interés (%)</label>
                  <input type="number" name="interes" value={nuevaTransaccion.interes} onChange={handleChange} step="0.1" min="0" />
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
          </div>

          <div className="acciones">
            <button className="btn-guardar" onClick={agregarTransaccion}>{editIndex !== null ? "Actualizar" : "Guardar"} {tipo}</button>
          </div>
        </div>

        <h3 className="titulo-secundario">Transacciones registradas</h3>
        <ul className="lista-transacciones">
          {transacciones.map((t, index) => (
            <li key={index} className="item-transaccion">
              <strong>{t.tipo.toUpperCase()}</strong>: {t.fecha} - ${t.monto} - {t.categoria} - {t.descripcion} - {t.tipoPago}
              {t.tipoPago === "credito" && (
                <span> - {t.cuotas} cuotas - Total estimado: ${t.totalCredito}</span>
              )}
              <div className="acciones-transaccion">
                <button onClick={() => editarTransaccion(index)}>✏️</button>
                <button onClick={() => eliminarTransaccion(index)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Footer />
    </div>
  );
}
