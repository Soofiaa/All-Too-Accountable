import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./transacciones.css";


const MESES_NOMBRES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

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
  const [transaccionEditada, setTransaccionEditada] = useState({});
  const [camposInvalidos, setCamposInvalidos] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const fileInputRef = useRef(null);
  const formularioRef = useRef(null);
  const [formatoExportar, setFormatoExportar] = useState("excel");
  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1);
  const anioActual = String(hoy.getFullYear()); 
  const [imagenModal, setImagenModal] = useState(null);
  const [showModalImagen, setShowModalImagen] = useState(false);
  const [mesFiltrado, setMesFiltrado] = useState(String(hoy.getMonth() + 1));
  const [anioFiltrado, setAnioFiltrado] = useState(String(hoy.getFullYear())); 
  const [mostrarMenuFormato, setMostrarMenuFormato] = useState(false);


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
  
    if (!id_usuario) {
      console.error("ID de usuario no encontrado en localStorage");
      return;
    }
  
    fetch(`http://localhost:5000/api/transacciones/${id_usuario}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error al cargar transacciones: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setTransacciones(data.filter(t => t.visible !== false));
        setEliminadas(data.filter(t => t.visible === false));
      })
      .catch(error => {
        console.error("Error al cargar transacciones:", error);
      });
  }, []);
  
  useEffect(() => {
    console.log("💬 Eliminadas:", eliminadas);
  }, [eliminadas]);  
  
  useEffect(() => {
    if (nuevaTransaccion.tipoPago !== "credito") return;
  
    const monto = parseFloat((nuevaTransaccion.monto || "0").replace(/\./g, "").replace(",", ".")) || 0;
    const cuotas = parseInt(nuevaTransaccion.cuotas) || 1;
    const interes = parseFloat(nuevaTransaccion.interes) || 0;
  
    let totalCredito = monto;
    if (interes > 0) {
      totalCredito = monto * Math.pow(1 + interes / 100, cuotas);
    }
  
    const valorCuota = totalCredito / cuotas;
  
    setNuevaTransaccion(prev => ({
      ...prev,
      totalCredito: totalCredito.toFixed(0),
      valorCuota: valorCuota.toFixed(0)
    }));
  }, [
    nuevaTransaccion.monto,
    nuevaTransaccion.cuotas,
    nuevaTransaccion.interes,
    nuevaTransaccion.tipoPago
  ]);
  
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
    else if (type === "file") {
      newValue = files[0];
      setTransaccionEditada((prev) => ({ ...prev, imagen: newValue }));
    }    
    else if (name === "monto") newValue = formatearConPuntos(value);
    else newValue = value;
  
    setNuevaTransaccion((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };  

  const transaccionesFiltradas = transacciones.filter((t) => {
    const fuente = t.mesPago || t.fecha;
    if (!fuente || !fuente.includes("-")) return false;
  
    const partes = fuente.split("-");
    const anio = partes[0];
    const mes = partes[1]; // corregido
  
    const coincideMes = !mesFiltrado || mes === mesFiltrado.padStart(2, "0");
    const coincideAnio = !anioFiltrado || anio === anioFiltrado;
    return t.visible !== false && coincideMes && coincideAnio;
  });    
  
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
    const trans = transacciones[index];
    setEditIndex(index);
  
    setNuevaTransaccion({
      fecha: trans.fecha,
      monto: formatearConPuntos(trans.monto.toString()),
      categoria: trans.categoria,
      descripcion: trans.descripcion,
      repetido: trans.repetido || false,
      mesPago: trans.mesPago || getMesActual(),
      imagen: trans.imagen || null,
      tipoPago: trans.tipoPago,
      cuotas: trans.cuotas?.toString() || "1",
      interes: trans.interes?.toString() || "0",
      totalCredito: trans.totalCredito?.toString() || "",
      valorCuota: trans.valorCuota?.toString() || ""
    });
  
    if (fileInputRef.current) fileInputRef.current.value = "";
  
    if (formularioRef.current) {
      formularioRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
  
    const origen = nuevaTransaccion;
    const esEdicion = editIndex !== null;
  
    const camposObligatorios = ["fecha", "monto", "categoria", "descripcion", "tipoPago"];
    const faltantes = camposObligatorios.filter((campo) => !origen[campo]);
    if (faltantes.length > 0) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }
  
    // Comprobación de límite mensual por categoría
    const categoriaSeleccionada = categorias.find(cat => cat.nombre === origen.categoria);
  
    if (categoriaSeleccionada && categoriaSeleccionada.monto_limite && categoriaSeleccionada.monto_limite !== 0) {
      const montoNuevo = parseFloat((origen.monto || "0").toString().replace(/\./g, "").replace(",", ".")) || 0;
  
      const transaccionesMismoMesYCategoria = transacciones.filter(t => {
        const fechaT = new Date(t.fecha);
        const fechaNueva = new Date(origen.fecha);
        return (
          t.categoria === origen.categoria &&
          fechaT.getMonth() === fechaNueva.getMonth() &&
          fechaT.getFullYear() === fechaNueva.getFullYear()
        );
      });
  
      const montoAcumulado = transaccionesMismoMesYCategoria.reduce((total, t) => {
        return total + parseFloat(t.monto.toString().replace(/\./g, "").replace(",", "."));
      }, 0);
  
      if ((montoAcumulado + montoNuevo) > categoriaSeleccionada.monto_limite) {
        alert("🚨 Atención: El monto ingresado supera el límite mensual para esta categoría.");
      }
    }
  
    let imagenBase64 = null;
    if (origen.imagen instanceof File) {
      imagenBase64 = await convertirA_base64(origen.imagen);
    } else if (origen.imagen === null || origen.imagen === "") {
      imagenBase64 = null;
    }
  
    const montoNumerico = typeof origen.monto === "string"
      ? parseFloat(origen.monto.replace(/\./g, "").replace(",", "."))
      : parseFloat(origen.monto);
  
      const transaccionAEnviar = {
        id_usuario,
        tipo, // 👈 Añadido aquí
        fecha: origen.fecha,
        monto: montoNumerico,
        categoria: origen.categoria,
        descripcion: origen.descripcion,
        tipoPago: origen.tipoPago,
        cuotas: parseInt(origen.cuotas || 1),
        interes: parseFloat(origen.interes || 0),
        valorCuota: parseFloat(origen.valorCuota || 0),
        totalCredito: parseFloat(origen.totalCredito || 0),
        repetido: origen.repetido,
        imagen: imagenBase64,
        nombre_archivo: origen.imagen?.name || null
      };      
  
    try {
      if (esEdicion) {
        const id_transaccion = transacciones[editIndex].id;
        if (!id_transaccion) {
          console.error("❌ id_transaccion no encontrado para editar:", transacciones[editIndex]);
          alert("No se pudo actualizar la transacción. Intenta de nuevo.");
          return;
        }
  
        await fetch(`http://localhost:5000/api/transacciones/${id_transaccion}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaccionAEnviar)
        });
  
        // 🔥 ACTUALIZAR LOCALMENTE
        const nuevasTransacciones = [...transacciones];
        nuevasTransacciones[editIndex] = {
          ...transacciones[editIndex],
          ...transaccionAEnviar
        };
        setTransacciones(nuevasTransacciones);
  
      } else {
        await fetch(`http://localhost:5000/api/transacciones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaccionAEnviar)
        });
  
        const respuesta = await fetch(`http://localhost:5000/api/transacciones/${id_usuario}`);
        const data = await respuesta.json();
        setTransacciones(data.filter(t => t.visible !== false));
        setEliminadas(data.filter(t => t.visible === false));
      }
  
      // 🔵 Limpiar formulario
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
  
    } catch (error) {
      console.error("Error al guardar transacción:", error);
      alert("❌ Error al guardar la transacción");
    }
  };
  

  const formatearFechaBonita = (fechaISO) => {
    const [año, mes, dia] = fechaISO.split("-");
    return `${dia}-${mes}-${año}`;
  };
  

  const urlImagenEditada =
    transaccionEditada.imagen &&
    typeof transaccionEditada.imagen === "string"
      ? `http://localhost:5000${transaccionEditada.imagen}`
      : null;


  const eliminarTransaccion = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/transacciones/${id}/eliminar`, {
        method: "PUT",
      });
  
      const id_usuario = localStorage.getItem("id_usuario");
  
      // Recargar transacciones
      const respuesta = await fetch(`http://localhost:5000/api/transacciones/${id_usuario}`);
      const data = await respuesta.json();
  
      // Separar visibles y eliminadas
      setTransacciones(data.filter(t => t.visible === true || t.visible === 1));
      setEliminadas(data.filter(t => t.visible === false));
  
    } catch (error) {
      console.error("Error al eliminar transacción:", error);
      alert("❌ Error al eliminar la transacción");
    }
  };
  
  const exportarTransacciones = (mesExportar, anioExportar, formato) => {
    const filtradas = transacciones.filter((t) => {
      const fuente = t.mesPago || t.fecha; // usar fecha si mesPago no existe
      if (!fuente || !fuente.includes("-")) return false;
    
      const [anio, mes] = fuente.split("-");
      return anio === anioExportar && mes === mesExportar.padStart(2, "0");
    });       
  
    if (filtradas.length === 0) {
      alert("No hay transacciones para ese mes y año.");
      return;
    }
  
    const nombreMes = MESES_NOMBRES[parseInt(mesExportar) - 1];
  
    if (formato === "excel") {
      const hojaDatos = filtradas.map(t => ({
        Fecha: t.fecha,
        Monto: t.monto,
        Categoría: t.categoria,
        Descripción: t.descripcion,
        Tipo: t.tipo.toUpperCase(),
        TipoPago: t.tipoPago
      }));
  
      const hoja = XLSX.utils.json_to_sheet(hojaDatos, { origin: "A1" });
  
      const totalIngresos = filtradas
        .filter(t => t.tipo === "ingreso")
        .reduce((acc, curr) => acc + Number(curr.monto), 0);
      const totalGastos = filtradas
        .filter(t => t.tipo === "gasto")
        .reduce((acc, curr) => acc + Number(curr.monto), 0);
      const balance = totalIngresos - totalGastos;
  
      const resumenInicioFila = hojaDatos.length + 3;
  
      XLSX.utils.sheet_add_aoa(hoja, [
        ["Resumen"],
        ["Total ingresos", `$${totalIngresos.toLocaleString("es-CL")}`],
        ["Total gastos", `$${totalGastos.toLocaleString("es-CL")}`],
        ["Balance", `$${balance.toLocaleString("es-CL")}`]
      ], { origin: `A${resumenInicioFila}` });
  
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Transacciones");
      XLSX.writeFile(libro, `Transacciones_${nombreMes}_${anioExportar}.xlsx`);
    } else {
      const doc = new jsPDF();
        doc.setFontSize(12);
        doc.text(`Transacciones de ${nombreMes} ${anioExportar}`, 14, 10);
        
        const filas = filtradas.map(t => [
          t.fecha,
          `$${t.monto}`,
          t.categoria,
          t.descripcion,
          t.tipo.toUpperCase(),
          t.tipoPago
        ]);

        autoTable(doc, {
          startY: 20,
          head: [["Fecha", "Monto", "Categoría", "Descripción", "Tipo", "Tipo de Pago"]],
          body: filas
        });        
  
      const totalIngresos = filtradas
        .filter(t => t.tipo === "ingreso")
        .reduce((acc, curr) => acc + Number(curr.monto), 0);

      const totalGastos = filtradas
        .filter(t => t.tipo === "gasto")
        .reduce((acc, curr) => acc + Number(curr.monto), 0);

      const balance = totalIngresos - totalGastos;

      doc.setFontSize(11);
      doc.text(`Resumen`, 14, doc.lastAutoTable.finalY + 10);
      doc.text(`Total ingresos: $${totalIngresos.toLocaleString("es-CL")}`, 14, doc.lastAutoTable.finalY + 18);
      doc.text(`Total gastos: $${totalGastos.toLocaleString("es-CL")}`, 14, doc.lastAutoTable.finalY + 26);
      doc.text(`Balance: $${balance.toLocaleString("es-CL")}`, 14, doc.lastAutoTable.finalY + 34);
  
      doc.save(`Transacciones_${nombreMes}_${anioExportar}.pdf`);
    }
  };     

  const exportarMesActual = (formato) => {
    const hoy = new Date();
    const mesActual = String(hoy.getMonth() + 1);
    const anioActual = String(hoy.getFullYear());
  
    setFormatoExportar(formato);
    exportarTransacciones(mesActual, anioActual, formato);
  };
  
  
  const recuperarTransaccion = async (id) => {
    try {
      const respuesta = await fetch(`http://localhost:5000/api/transacciones/${id}/recuperar`, {
        method: "PUT"
      });
  
      if (!respuesta.ok) {
        throw new Error("Error al recuperar");
      }
  
      const id_usuario = localStorage.getItem("id_usuario");
      const resp = await fetch(`http://localhost:5000/api/transacciones/${id_usuario}`);
      const data = await resp.json();
  
      setTransacciones(data.filter(t => t.visible !== false));
      setEliminadas(data.filter(t => t.visible === false));
  
    } catch (error) {
      console.error("Error al recuperar transacción:", error);
      alert("❌ No se pudo recuperar la transacción");
    }
  };
  
  
  return (
    <div className="page-layout">
      <Header />
      <main className="transacciones-container">
        <h1 className="titulo-transacciones">Gestión de Transacciones</h1>

        <div className="botones-agregar-contenedor">
          <div className="botones-izquierda">
            <button className="btn-seleccion" onClick={() => setTipo("ingreso")}>Agregar ingreso</button>
            <button className="btn-seleccion" onClick={() => setTipo("gasto")}>Agregar gasto</button>
          </div>

          <div className="menu-exportar-wrapper">
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div className="menu-exportar-wrapper">
                <button className="btn-exportar-trigger" onClick={() => setMostrarMenuFormato(!mostrarMenuFormato)}>
                  Exportar mes actual
                </button>

                {mostrarMenuFormato && (
                  <div className="menu-exportar">
                    <label>Elegir formato:</label>
                    <button
                      className="btn-exportar-confirmar"
                      onClick={() => {
                        exportarMesActual("excel");
                        setMostrarMenuFormato(false);
                      }}
                    >
                      Excel (.xlsx)
                    </button>

                    <button
                      className="btn-exportar-confirmar"
                      onClick={() => {
                        exportarMesActual("pdf");
                        setMostrarMenuFormato(false);
                      }}
                    >
                      PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        <div className="formulario-transaccion" ref={formularioRef}>
          <h2 className={`titulo-formulario ${tipo}`}>{tipo.toUpperCase()}</h2>
          {editIndex !== null && (
          <div className="aviso-edicion">
            <strong>Estás editando una transacción.</strong> No olvides guardar o cancelar los cambios.
          </div>
        )}
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

                {/* Mostrar la categoría seleccionada si no está en la lista */}
                {!categorias.some(cat => cat.nombre === nuevaTransaccion.categoria) &&
                  nuevaTransaccion.categoria && (
                    <option value={nuevaTransaccion.categoria} hidden>
                      {nuevaTransaccion.categoria} (no disponible)
                    </option>
                )}

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
                accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls,.csv,.doc,.docx,.txt"
              />

              {nuevaTransaccion.imagen && typeof nuevaTransaccion.imagen === "string" && (
                <div style={{ marginTop: "8px" }}>
                  📎 Ya hay un comprobante guardado:
                  <span
                    style={{ color: "#3b82f6", cursor: "pointer", marginLeft: "8px" }}
                    onClick={() => {
                      const url = nuevaTransaccion.imagen.startsWith("http")
                        ? nuevaTransaccion.imagen
                        : `http://localhost:5000${nuevaTransaccion.imagen}`;
                      setImagenModal(url);
                      setShowModalImagen(true);
                    }}
                  >
                    Ver comprobante
                  </span>

                  <span
                    style={{ color: "#ef4444", cursor: "pointer", marginLeft: "20px" }}
                    onClick={() => {
                      setNuevaTransaccion(prev => ({ ...prev, imagen: null }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    ❌ Eliminar comprobante
                  </span>
                </div>
              )}
            </div>

          </div>

          <div className="acciones">
            <button className="btn-guardar" onClick={enviarTransaccion}>
              {editIndex !== null ? "Actualizar" : "Guardar"} {tipo}
            </button>

            {editIndex !== null && (
              <button
                className="btn-cancelar"
                onClick={() => {
                  setEditIndex(null);
                  setTransaccionEditada({});
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
                }}
              >
                Cancelar edición
              </button>
            )}
          </div>

        </div>
        
        <div className="filtro-botonera">
          <div className="boton-campo">
            <label htmlFor="mesFiltrado">Mes</label>
            <select
              id="mesFiltrado"
              value={mesFiltrado}
              onChange={(e) => setMesFiltrado(e.target.value)}
            >
              {[
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
              ].map((mes, i) => (
                <option key={i} value={String(i + 1)}>{mes}</option>
              ))}
            </select>
          </div>

          <div className="boton-campo">
            <label htmlFor="anioFiltrado">Año</label>
            <input
              id="anioFiltrado"
              type="number"
              value={anioFiltrado}
              onChange={(e) => setAnioFiltrado(e.target.value)}
              placeholder="Ej: 2025"
            />
          </div>
        </div>
        
        <div className="limites-categorias">
          <h3>Control de límites por categoría (mes actual)</h3>
          <table className="tabla-limites">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Gasto actual</th>
                <th>Monto límite</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat, idx) => {
                const transaccionesCategoria = transaccionesFiltradas.filter(t => t.categoria === cat.nombre);
                const gastoActual = transaccionesCategoria.reduce((acc, t) => acc + parseFloat(t.monto.toString().replace(/\./g, "").replace(",", ".")), 0);
                
                return (
                  <tr key={idx}>
                    <td>{cat.nombre}</td>
                    <td>${gastoActual.toLocaleString("es-CL")}</td>
                    <td>{cat.monto_limite && cat.monto_limite !== 0 ? `$${cat.monto_limite.toLocaleString("es-CL")}` : "Sin límite"}</td>
                    <td>
                      {cat.monto_limite && cat.monto_limite !== 0
                        ? (gastoActual > cat.monto_limite ? "🚨 Sobrepasado" : "✅ Dentro del límite")
                        : "♾️"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h3 className="titulo-secundario">Transacciones registradas</h3>
          <div className="lista-transacciones">
          {transaccionesFiltradas.map((t, index) => (
            <div className="tarjeta-minimal" key={index}>
              <div className="fila-superior">
                <div className={`tag ${t.tipo === "ingreso" ? "ingreso" : ""}`}>{t.tipo.toUpperCase()}</div>
                <div className="fecha">{formatearFechaBonita(t.fecha)}</div>
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
              {t.imagen && (
              <button
              className="btn-ver-comprobante"
              onClick={() => {
                const imagen = t.imagen;
                if (!imagen) {
                  alert("Esta transacción no tiene comprobante adjunto.");
                  return;
                }
                const url = imagen.startsWith("http")
                  ? imagen
                  : `http://localhost:5000/imagenes/${imagen}`;
                setImagenModal(url);
                setShowModalImagen(true);
              }}
            >
              Ver comprobante
            </button>                                  
            )}

              <div className="acciones">
              <button className="texto-boton editar" onClick={() => editarTransaccion(index)}>
                Editar
              </button>
              <button className="texto-boton eliminar" onClick={() => eliminarTransaccion(t.id)}>
                Eliminar
              </button>
              </div>
            </div>
          ))}
        </div>

      <h3 className="titulo-secundario">Transacciones eliminadas</h3>
      <ul className="lista-transacciones historial-eliminadas">
        {eliminadas.map((t, index) => (
          <li key={index} className={`item-transaccion eliminada ${t.tipo === "gasto" ? "gasto" : "ingreso"}`}>
            <div className="contenido-eliminada">
              <div className="texto-eliminada">
                <p><strong>{t.tipo.toUpperCase()}</strong> | {formatearFechaBonita(t.fecha)}</p>
                <p><strong>Monto:</strong> ${Number(t.monto).toLocaleString("es-CL")}</p>
                <p><strong>Categoría:</strong> {t.categoria}</p>
                <p><strong>Descripción:</strong> {t.descripcion}</p>
                <p><strong>Tipo de pago:</strong> {t.tipoPago}</p>
                  {t.imagen && (
                  <button
                  className="btn-ver-comprobante"
                  onClick={() => {
                    const imagen = t.imagen;
                    if (!imagen) {
                      alert("Esta transacción no tiene comprobante adjunto.");
                      return;
                    }
                    const url = imagen.startsWith("http")
                      ? imagen
                      : `http://localhost:5000/imagenes/${imagen}`;
                    setImagenModal(url);
                    setShowModalImagen(true);
                  }}
                >
                  Ver comprobante
                </button>                
                )}
          
                <div className="boton-inferior">
                  <button className="btn-recuperar" onClick={() => recuperarTransaccion(t.id)}>Recuperar</button>
                </div>
              </div>
            </div>
          </li>        
        ))}
      </ul>

      </main>
      {showModalImagen && (
      <div className="modal-overlay" onClick={() => setShowModalImagen(false)}>
        <div className="modal-imagen" onClick={(e) => e.stopPropagation()}>
          {imagenModal ? (
            <img
              src={imagenModal}
              alt="Comprobante"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                const fallback = document.createElement("div");
                fallback.innerText = "No se pudo cargar el comprobante.";
                fallback.style.padding = "1rem";
                fallback.style.color = "#ef4444";
                e.target.parentNode.appendChild(fallback);
              }}
            />
          ) : (
            <p style={{ padding: "1rem", color: "#ef4444" }}>
              No hay comprobante disponible.
            </p>
          )}
          <button className="btn-cerrar-modal" onClick={() => setShowModalImagen(false)}>
            Cerrar
          </button>
        </div>
      </div>
    )}
    <Footer />
  </div>
);
}