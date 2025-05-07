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
    mesPago: "",
    imagen: null,
    tipoPago: "efectivo",
    tipoPago2: "",
    monto2: "",
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
  const hoy = new Date();
  const [imagenModal, setImagenModal] = useState(null);
  const [showModalImagen, setShowModalImagen] = useState(false);
  const [mesFiltrado, setMesFiltrado] = useState(String(hoy.getMonth() + 1));
  const [anioFiltrado, setAnioFiltrado] = useState(String(hoy.getFullYear())); 
  const [mostrarMenuFormato, setMostrarMenuFormato] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [montoPagado, setMontoPagado] = useState("");
  const [gastosMensuales, setGastosMensuales] = useState([]);
  const [showSelectorTipo, setShowSelectorTipo] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [usarSegundoMetodo, setUsarSegundoMetodo] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [usarSegundoMetodoEditar, setUsarSegundoMetodoEditar] = useState(false);


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
  
    fetch(`http://localhost:5000/api/transacciones/${id_usuario}/todas`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error al cargar transacciones: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setTransacciones(data.filter(t => t.visible === true || t.visible === 1));
        setEliminadas(data.filter(t => t.visible === false || t.visible === 0));
        console.log("🗑️ Eliminadas:", data.filter(t => t.visible === 0 || t.visible === false));
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
  

  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (!id_usuario) return;
  
    fetch(`http://localhost:5000/api/gastos_mensuales?id_usuario=${id_usuario}`)
      .then(res => res.json())
      .then(data => {
        const mesF = parseInt(mesFiltrado);
        const anioF = parseInt(anioFiltrado);
  
        const gastosFiltrados = data
          .filter(gasto => {
            if (!gasto.fecha_creacion || !gasto.dia_pago) return false;
  
            const [anioCreado, mesCreado] = gasto.fecha_creacion.split("-").map(Number);
  
            // Mostrar el gasto si el mes filtrado es igual o posterior al mes de creación
            return anioF > anioCreado || (anioF === anioCreado && mesF >= mesCreado);
          })
          .map(gasto => {
            const fechaCobro = `${anioFiltrado}-${String(mesFiltrado).padStart(2, "0")}-${String(gasto.dia_pago).padStart(2, "0")}`;
            return {
              id_transaccion: `gm-${gasto.id_gasto}`,
              fecha: fechaCobro,
              monto: gasto.monto,
              categoria: "Gasto mensual",
              descripcion: `${gasto.nombre}${gasto.descripcion ? " – " + gasto.descripcion : ""}`,
              tipo: "gasto",
              tipoPago: "automático",
              visible: true,
              imagen: null,
              esMensual: true
            };
          });
  
        setGastosMensuales(gastosFiltrados);
      })
      .catch(error => {
        console.error("Error al cargar gastos mensuales:", error);
      });
  }, [mesFiltrado, anioFiltrado]);    


  const scrollToForm = () => {
    if (formularioRef.current) {
      formularioRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };


  const toggleMenu = (i) => {
    setMenuAbierto(menuAbierto === i ? null : i);
  };
  

  // Cierra el menú si se hace clic fuera
  useEffect(() => {
    const cerrar = (e) => {
      if (!e.target.closest(".menu-transaccion")) {
        setMenuAbierto(null);
      }
    };
    document.addEventListener("click", cerrar);
    return () => document.removeEventListener("click", cerrar);
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

  const todas = [...transacciones, ...gastosMensuales];

  const transaccionesFiltradas = todas.filter((t) => {
    const fuente = t.mesPago || t.fecha;
    if (!fuente || !fuente.includes("-")) return false;
    const [anio, mes] = fuente.split("-");
    const coincideMes = !mesFiltrado || mes === mesFiltrado.padStart(2, "0");
    const coincideAnio = !anioFiltrado || anio === anioFiltrado;
    return t.visible == 1 && coincideMes && coincideAnio;
  });
  
  // Ordenar fuera del .filter
  transaccionesFiltradas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
  
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
  
  
  const editarTransaccion = (id) => {
    const trans = transacciones.find((t) => t.id_transaccion === id);
    if (!trans) return;
  
    setNuevaTransaccion({
      id_transaccion: trans.id_transaccion,
      fecha: trans.fecha,
      monto: trans.monto,
      descripcion: trans.descripcion || "",
      categoria: trans.categoria || "",
      tipoPago: trans.tipoPago || "",
      tipo: trans.tipo || "gasto",
      imagen: trans.imagen || "",
      cuotas: trans.cuotas || 1,
      valorCuota: trans.valorCuota || "",
      totalCredito: trans.totalCredito || "",
      interes: trans.interes || "",
      mesPago: trans.mesPago || "",
    });

    setUsarSegundoMetodoEditar(!!trans.tipoPago2);
    setTipo(trans.tipo);
    setEditIndex(id);
    setShowModalEditar(true); // abre el modal
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

      if (usarSegundoMetodo || usarSegundoMetodoEditar) {
        const monto1 = origen.monto;
        const monto2 = origen.monto2 || "0";
      
        const montoNum1 = parseFloat((monto1 || "0").toString().replace(/\./g, "").replace(",", "."));
        const montoNum2 = parseFloat((monto2 || "0").toString().replace(/\./g, "").replace(",", "."));
      
        const suma = montoNum1 + montoNum2;
      
        if (Math.abs(suma - montoNum1) > 0.01 && Math.abs(suma - montoNum2) > 0.01) {
          alert("❗ La suma del monto 1 y monto 2 no coincide con el monto total ingresado.");
          return;
        }
      }
      
      const transaccionAEnviar = {
        id_usuario,
        tipo,
        fecha: origen.fecha,
        monto: montoNumerico,
        categoria: origen.categoria,
        descripcion: origen.descripcion,
        tipoPago: origen.tipoPago,
        tipoPago2: usarSegundoMetodo || usarSegundoMetodoEditar ? origen.tipoPago2 : null,
        monto2: usarSegundoMetodo || usarSegundoMetodoEditar
          ? parseFloat((origen.monto2 || "0").toString().replace(/\./g, "").replace(",", "."))
          : null,
        cuotas: parseInt(origen.cuotas || 1),
        interes: parseFloat(origen.interes || 0),
        valorCuota: parseFloat(origen.valorCuota || 0),
        totalCredito: parseFloat(origen.totalCredito || 0),
        imagen: imagenBase64,
        nombre_archivo: origen.imagen?.name || null
      };      
  
    try {
      if (esEdicion) {
        const id_transaccion = editIndex; // ✅ porque ahora editIndex ES el ID
      
        await fetch(`http://localhost:5000/api/transacciones/${id_transaccion}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaccionAEnviar)
        });
      
        // ACTUALIZAR LOCALMENTE por ID
        const nuevasTransacciones = transacciones.map((t) =>
          t.id_transaccion === id_transaccion
            ? { ...t, ...transaccionAEnviar }
            : t
        );
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
        setEliminadas(data.filter(t => t.visible === 0 || t.visible === false));
        console.log("🗑️ Eliminadas:", data.filter(t => t.visible === 0 || t.visible === false));
      }
  
      // 🔵 Limpiar formulario
      setEditIndex(null);
      setNuevaTransaccion({
        fecha: "",
        monto: "",
        categoria: "",
        descripcion: "",
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
      const respuesta = await fetch(`http://localhost:5000/api/transacciones/${id_usuario}`);
      const data = await respuesta.json();
  
      setTransacciones(data.filter(t => t.visible));
      setEliminadas(data.filter(t => t.visible === 0 || t.visible === false));
      console.log("🗑️ Eliminadas:", data.filter(t => t.visible === 0 || t.visible === false));
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
  
      if (!respuesta.ok) throw new Error("Error al recuperar");
  
      const id_usuario = localStorage.getItem("id_usuario");
      const resp = await fetch(`http://localhost:5000/api/transacciones/${id_usuario}`);
      const data = await resp.json();
  
      setTransacciones(data.filter(t => t.visible !== false));
      setEliminadas(data.filter(t => t.visible === 0 || t.visible === false));
      console.log("🗑️ Eliminadas:", data.filter(t => t.visible === 0 || t.visible === false));
    } catch (error) {
      console.error("Error al recuperar transacción:", error);
      alert("❌ No se pudo recuperar la transacción");
    }
  };
  
  const eliminadasFiltradas = eliminadas.filter((t) => {
    const fuente = t.mesPago || t.fecha;
    if (!fuente || !fuente.includes("-")) return false;
  
    const partes = fuente.split("-");
    const anio = partes[0];
    const mes = partes[1];
  
    const coincideMes = !mesFiltrado || mes === mesFiltrado.padStart(2, "0");
    const coincideAnio = !anioFiltrado || anio === anioFiltrado;
  
    return coincideMes && coincideAnio;
  });   

  console.log("🧪 eliminadasFiltradas:", eliminadasFiltradas);

  return (
    <div className="page-layout">
      <Header />
      <main className="transacciones-container">
        <h1 className="titulo-transacciones">Gestión de Transacciones</h1>

        <div className="botones-agregar-contenedor">

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
                const transaccionesCategoria = transaccionesFiltradas.filter(t =>
                  t.tipo === "gasto" &&
                  t.visible !== false &&
                  t.tipoPago !== "credito" &&
                  t.categoria === cat.nombre
                );                              

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
      )
      
      <h3 className="titulo-secundario">Transacciones eliminadas</h3>

        <div className="lista-transacciones">
        {(() => {
          const filas = [];
          for (let i = 0; i < transaccionesFiltradas.length; i += 2) {
            const fila = transaccionesFiltradas.slice(i, i + 2);

            fila.forEach((t, index) => {
              filas.push(
                <div className={`tarjeta-minimal ${t.esMensual ? "gasto-mensual" : ""} ${t.tipoPago === "credito" ? "transaccion-credito" : ""}`} key={i + index}>
                  <div className="fila-superior">
                    <div className={`tag ${t.categoria === "Gasto mensual" ? "gasto-mensual" : t.tipo}`}>
                      {t.categoria === "Gasto mensual" ? "GASTO MENSUAL" : t.tipo.toUpperCase()}
                    </div>
                    <div className="fecha">{formatearFechaBonita(t.fecha)}</div>
                  </div>

                  <div className="contenido-horizontal">
                    <div className="item"><span>Monto:</span><div className="monto">${Number(t.monto).toLocaleString("es-CL")}</div></div>
                    <div className="item"><span>Categoría:</span><div>{t.categoria}</div></div>
                    <div className="item"><span>Descripción:</span><div>{t.descripcion}</div></div>
                    <div className="item"><span>Tipo de pago:</span><div>{t.tipoPago}</div></div>
                  </div>

                  {t.imagen && (
                    <button className="btn-ver-comprobante" onClick={() => {
                      const url = t.imagen.startsWith("http") ? t.imagen : `http://localhost:5000/imagenes/${t.imagen}`;
                      setImagenModal(url);
                      setShowModalImagen(true);
                    }}>
                      Ver comprobante
                    </button>
                  )}

                  {!t.protegida && (
                    <div className="menu-transaccion">
                      <button className="boton-menu" onClick={() => toggleMenu(t.id_transaccion)}>⋯</button>
                      {menuAbierto === t.id_transaccion && (
                        <div className="menu-opciones">
                          <button onClick={() => editarTransaccion(t.id_transaccion)}>Editar</button>
                          <button onClick={() => eliminarTransaccion(t.id || t.id_transaccion)}>Eliminar</button>
                        </div>
                    )}
                  </div>                  
                  )}
                </div>
              );
            });

            // ⬇️ Si hay solo una tarjeta en esta fila, el "+" va a la derecha
            if (fila.length === 1 && i + 1 >= transaccionesFiltradas.length) {
              filas.push(
                <div key="mas-derecha" className="col-der">
                  {showSelectorTipo ? (
                    <div className="selector-tipo-popup">
                      <p>¿Qué deseas agregar?</p>
                      <div className="botones-selector">
                        <button
                          className="btn-ingresogasto"
                          onClick={() => {
                            setTipo("ingreso");
                            setShowSelectorTipo(false);
                            setMostrarFormulario(true);
                            scrollToForm();
                          }}
                        >
                          Ingreso
                        </button>

                        <button
                          className="btn-ingresogasto"
                          onClick={() => {
                            setTipo("gasto");
                            setShowSelectorTipo(false);
                            setMostrarFormulario(true);
                            scrollToForm();
                          }}
                        >
                          Gasto
                        </button>

                        <button className="btn-rojo" onClick={() => setShowSelectorTipo(false)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="boton-agregar" onClick={() => setShowSelectorTipo(true)}>＋</button>
                  )}
                </div>
              );
            }
          }

          // ⬇️ Si la última fila tiene 2 tarjetas, el "+" va abajo a la izquierda
          if (transaccionesFiltradas.length % 2 === 0) {
            filas.push(
              <div key="mas-izquierda" className="col-izq">
                {showSelectorTipo ? (
                  <div className="selector-tipo-popup">
                    <p>¿Qué deseas agregar?</p>
                    <div className="botones-selector">
                      <button
                        className="btn-ingresogasto"
                        onClick={() => {
                          setTipo("ingreso");
                          setShowSelectorTipo(false);
                          setMostrarFormulario(true);
                          scrollToForm();
                        }}
                      >
                        Ingreso
                      </button>

                      <button
                        className="btn-ingresogasto"
                        onClick={() => {
                          setTipo("gasto");
                          setShowSelectorTipo(false);
                          setMostrarFormulario(true);
                          scrollToForm();
                        }}
                      >
                        Gasto
                      </button>

                      <button className="btn-rojo" onClick={() => setShowSelectorTipo(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="boton-agregar" onClick={() => setShowSelectorTipo(true)}>＋</button>
                )}
              </div>
            );
          }

          return filas;
        })()}

        </div>
      
        {mostrarFormulario && (
          <div className="modal-overlay" onClick={() => setMostrarFormulario(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Nueva transacción: {tipo === "gasto" ? "Gasto" : "Ingreso"}</h3>

              <div className="grid-formulario">
                {/* Fecha */}
                <div>
                  <label>Fecha:</label>
                  <input
                    type="date"
                    name="fecha"
                    value={nuevaTransaccion.fecha}
                    onChange={handleChange}
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label>Categoría:</label>
                  <select
                    name="categoria"
                    value={nuevaTransaccion.categoria}
                    onChange={handleChange}
                  >
                    {categorias.map((c, i) => (
                      <option key={i} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div>
                  <label>Descripción:</label>
                  <input
                    type="text"
                    name="descripcion"
                    value={nuevaTransaccion.descripcion}
                    onChange={handleChange}
                  />
                </div>

                {/* Checkbox para usar segundo método */}
                <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    id="checkbox-doble-pago"
                    checked={usarSegundoMetodo}
                    onChange={(e) => {
                      const activo = e.target.checked;
                      setUsarSegundoMetodo(activo);
                      if (!activo) {
                        setNuevaTransaccion(prev => ({
                          ...prev,
                          tipoPago2: "",
                          monto2: ""
                        }));
                      }
                    }}
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer"
                    }}
                  />
                  <label htmlFor="checkbox-doble-pago" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                    ¿Pagar con dos métodos?
                  </label>
                </div>

                {/* Métodos de pago */}
                <div className="fila-metodos-pago">
                  {/* Tipo de pago principal */}
                  <div className="campo-tipopago">
                    <label>Tipo de pago</label>
                    <select
                      name="tipoPago"
                      value={nuevaTransaccion.tipoPago}
                      onChange={handleChange}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="debito">Débito</option>
                      <option value="credito">Crédito</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>

                  {/* Monto principal */}
                  <div className="campo-monto">
                    <label>Monto total</label>
                    <input
                      type="text"
                      name="monto"
                      value={nuevaTransaccion.monto}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Segundo método de pago (si aplica) */}
                  {usarSegundoMetodo && (
                    <>
                      <div className="campo-tipopago">
                        <label>Segundo tipo de pago</label>
                        <select
                          name="tipoPago2"
                          value={nuevaTransaccion.tipoPago2}
                          onChange={handleChange}
                        >
                          <option value="">Selecciona</option>
                          <option value="efectivo">Efectivo</option>
                          <option value="debito">Débito</option>
                          <option value="credito">Crédito</option>
                          <option value="transferencia">Transferencia</option>
                        </select>
                      </div>

                      <div className="campo-monto">
                        <label>Monto 2</label>
                        <input
                          type="text"
                          name="monto2"
                          value={nuevaTransaccion.monto2}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Comprobante opcional */}
                <div>
                  <label>Comprobante (opcional):</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    ref={fileInputRef}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="acciones-transaccion">
                <button className="btn-guardar" onClick={enviarTransaccion}>Guardar</button>
                <button className="btn-cancelar" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

      <h3 className="titulo-secundario">Transacciones eliminadas</h3>
      <ul className="lista-transacciones historial-eliminadas">
      {eliminadasFiltradas.map((t, index) => (
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
                <button className="btn-recuperar" onClick={() => recuperarTransaccion(t.id || t.id_transaccion)}>
                  Recuperar
                </button>
                </div>
              </div>
            </div>
          </li>        
        ))}
      </ul>

      {showModalEditar && (
        <div className="modal-overlay" onClick={() => setShowModalEditar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Editar transacción</h3>
            <div className="grid-formulario">
              <div>
                <label>Fecha:</label>
                <input type="date" name="fecha" value={nuevaTransaccion.fecha} onChange={handleModalChange} />
              </div>
              <div>
                <label>Categoría:</label>
                <select name="categoria" value={nuevaTransaccion.categoria} onChange={handleModalChange}>
                  {categorias.map((c, i) => (
                    <option key={i} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Descripción:</label>
                <input type="text" name="descripcion" value={nuevaTransaccion.descripcion} onChange={handleModalChange} />
              </div>

              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="checkbox-editar-doble"
                  checked={usarSegundoMetodoEditar}
                  onChange={(e) => {
                    const activo = e.target.checked;
                    setUsarSegundoMetodoEditar(activo);
                    if (!activo) {
                      setNuevaTransaccion(prev => ({
                        ...prev,
                        tipoPago2: "",
                        monto2: ""
                      }));
                    }
                  }}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer"
                  }}
                />
                <label htmlFor="checkbox-editar-doble" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                  ¿Editar con dos métodos de pago?
                </label>
              </div>

              <div className="fila-metodos-pago">
                {/* Tipo de pago 1 */}
                <div className="campo-tipopago">
                  <label htmlFor="tipoPago">Tipo de pago</label>
                  <select
                    name="tipoPago"
                    id="tipoPago"
                    value={nuevaTransaccion.tipoPago}
                    onChange={handleChange}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>

                {/* Monto total */}
                <div className="campo-monto">
                  <label htmlFor="monto">Monto total</label>
                  <input
                    type="text"
                    name="monto"
                    id="monto"
                    value={nuevaTransaccion.monto}
                    onChange={handleChange}
                  />
                </div>

                {usarSegundoMetodoEditar && (
                <>
                  <div className="campo-tipopago">
                    <label htmlFor="tipoPago2">Segundo tipo de pago</label>
                    <select
                      name="tipoPago2"
                      id="tipoPago2"
                      value={nuevaTransaccion.tipoPago2}
                      onChange={handleChange}
                    >
                      <option value="">Selecciona</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="debito">Débito</option>
                      <option value="credito">Crédito</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>

                  <div className="campo-monto">
                    <label htmlFor="monto2">Monto 2</label>
                    <input
                      type="text"
                      name="monto2"
                      id="monto2"
                      value={nuevaTransaccion.monto2}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
              </div>
            </div>

            <div className="acciones-transaccion">
              <button className="btn-guardar" onClick={enviarTransaccion}>Guardar cambios</button>
              <button className="btn-cancelar" onClick={() => setShowModalEditar(false)}>Cancelar</button>
            </div>
          </div>
          
        </div>
      )}
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
              </main>
        <Footer />
      </div>
  );
}
