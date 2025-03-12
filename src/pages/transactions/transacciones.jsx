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

  const exportarTransacciones = () => {
    if (transacciones.length === 0) {
      alert("No hay transacciones para exportar.");
      return;
    }

    const hojaDatos = transacciones.map((t) => ({
      Tipo: t.tipo,
      Fecha: t.fecha,
      Monto: t.monto,
      Categoría: t.categoria,
      Descripción: t.descripcion,
      "Tipo de Pago": t.tipoPago,
      "Mes de Inicio del Pago": t.mesPago || "-",
      Cuotas: t.cuotas || "-",
      Interés: t.interes || "-",
      "Total Crédito": t.totalCredito || "-",
      "Valor Cuota": t.valorCuota || "-"
    }));

    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(hojaDatos);
    XLSX.utils.book_append_sheet(libro, hoja, "Transacciones");
    XLSX.writeFile(libro, "transacciones.xlsx");

    const pdf = new jsPDF();
    pdf.text("Reporte de Transacciones", 14, 16);
    pdf.autoTable({
      startY: 20,
      head: [["Tipo", "Fecha", "Monto", "Categoría", "Descripción", "Tipo de Pago", "Mes Inicio", "Cuotas", "Interés", "Total", "Valor Cuota"]],
      body: transacciones.map((t) => [
        t.tipo,
        t.fecha,
        t.monto,
        t.categoria,
        t.descripcion,
        t.tipoPago,
        t.mesPago || "-",
        t.cuotas || "-",
        t.interes || "-",
        t.totalCredito || "-",
        t.valorCuota || "-"
      ])
    });
    pdf.save("transacciones.pdf");
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
    cuotas: "",
    interes: "",
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
    if (
      nuevaTransaccion.tipoPago === "credito" &&
      rawMonto &&
      nuevaTransaccion.cuotas &&
      nuevaTransaccion.interes
    ) {
      const cuotas = parseInt(nuevaTransaccion.cuotas);
      const interes = parseFloat(nuevaTransaccion.interes);
      const total = rawMonto * Math.pow(1 + interes / 100, cuotas);
      const valorCuota = total / cuotas;
      setNuevaTransaccion((prev) => ({
        ...prev,
        totalCredito: total.toFixed(2),
        valorCuota: valorCuota.toFixed(2)
      }));
    }
  }, [nuevaTransaccion.monto, nuevaTransaccion.cuotas, nuevaTransaccion.interes]);

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
    if (editIndex !== null) {
      const actualizadas = [...transacciones];
      actualizadas[editIndex] = { ...nuevaTransaccion, tipo };
      setTransacciones(actualizadas);
      setEditIndex(null);
    } else {
      setTransacciones([...transacciones, { ...nuevaTransaccion, tipo }]);
    }
    setNuevaTransaccion({
      fecha: "",
      monto: "",
      categoria: "",
      descripcion: "",
      repetido: false,
      mesPago: getMesActual(),
      imagen: null,
      tipoPago: "efectivo",
      cuotas: "",
      interes: "",
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
    <div className="transacciones-container">
      <Header />
      <h1 className="titulo">Gestión de Transacciones</h1>
      <div className="botones-agregar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <button className="btn-seleccion" onClick={() => setTipo("ingreso")}>Agregar ingreso</button>
          <button className="btn-seleccion" onClick={() => setTipo("gasto")}>Agregar gasto</button>
        </div>
        <div>
          <button className="btn-seleccion" onClick={exportarTransacciones}>Exportar PDF/Excel</button>
        </div>
      </div>
      <div className="formulario-transaccion extra-padding">
        <h2 className={`titulo-formulario ${tipo === "ingreso" ? "ingreso" : "gasto"}`}>{tipo.toUpperCase()}</h2>
        <div className="grid-formulario grid-espaciado">
          <div>
            <label>Fecha </label>
            <input type="date" name="fecha" value={nuevaTransaccion.fecha} onChange={handleChange} className="medio-ancho" required />
          </div>

          <div>
            <label>Monto </label>
            <input type="text" name="monto" value={nuevaTransaccion.monto} onChange={handleChange} inputMode="numeric" pattern="[0-9]*" className="medio-ancho" required />
          </div>

          <div>
            <label>Categoría </label>
            <select name="categoria" value={nuevaTransaccion.categoria} onChange={handleChange} required>
              <option value="">Seleccione una categoría</option>
              <option value="General">General</option>
              <option value="Costuras">Costuras</option>
              <option value="Alimentación">Alimentación</option>
              <option value="Transporte">Transporte</option>
            </select>
          </div>

          <div className="campo-descripcion">
            <label>Descripción </label>
            <input type="text" name="descripcion" value={nuevaTransaccion.descripcion} onChange={handleChange} required />
          </div>

          <div className="checkbox-group compacto">
            <label className="checkbox-inline">
              <input type="checkbox" name="repetido" checked={nuevaTransaccion.repetido} onChange={handleChange} /> ¿Este {tipo} se suele repetir?
            </label>
          </div>

          {tipo === "gasto" && (
            <>
              <div className="tipo-pago-group">
                <label>Tipo de pago</label>
                <select name="tipoPago" value={nuevaTransaccion.tipoPago} onChange={handleChange} className="medio-ancho" required>
                  <option value="efectivo">Efectivo</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
              {nuevaTransaccion.tipoPago === "credito" && (
                <div>
                  <label>Mes de inicio del pago *</label>
                  <input type="month" name="mesPago" value={nuevaTransaccion.mesPago} onChange={handleChange} className="medio-ancho" required />
                </div>
              )}
            </>
          )}

          {nuevaTransaccion.tipoPago === "credito" && (
            <>
              <div className="cuotas-group">
                <label>Cantidad de cuotas </label>
                <input type="number" name="cuotas" min="1" max="36" value={nuevaTransaccion.cuotas} onChange={handleChange} className="medio-ancho" required />
              </div>

              <div className="cuotas-group">
                <label>Interés (%) </label>
                <input type="number" name="interes" value={nuevaTransaccion.interes} onChange={handleChange} className="medio-ancho" required />
              </div>

              {nuevaTransaccion.totalCredito && (
                <div className="cuotas-group">
                  <label>Total a pagar (estimado)</label>
                  <input type="text" value={`$${nuevaTransaccion.totalCredito}`} readOnly className="medio-ancho" />
                </div>
              )}

              {nuevaTransaccion.valorCuota && (
                <div className="cuotas-group">
                  <label>Valor estimado por cuota</label>
                  <input type="text" value={`$${nuevaTransaccion.valorCuota}`} readOnly className="medio-ancho" />
                </div>
              )}
            </>
          )}

          <div className="adjuntar-imagen">
            <label>Adjuntar imagen
              <input type="file" ref={fileInputRef} onChange={handleChange} name="imagen" accept="image/*" className="input-imagen" />
            </label>
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
            <strong>{t.tipo.toUpperCase()}</strong>: {t.fecha} - ${t.monto} - {t.categoria} - {t.descripcion} - {t.tipoPago}
            {t.tipoPago === "credito" && ` - ${t.cuotas} cuotas (Inicio: ${t.mesPago}) - Interés: ${t.interes}% - Total: $${t.totalCredito} - Valor por cuota: $${t.valorCuota}`}
            <div className="acciones-transaccion">
              <button onClick={() => editarTransaccion(index)}>✏️</button>
              <button onClick={() => eliminarTransaccion(index)}>🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    <Footer />
    </div>
  );
}