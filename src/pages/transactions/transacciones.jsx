import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./transacciones.css";
import {
  inicializarReconocimiento,
  iniciarDictadoPaso,
  pasosDictado
} from "../../utils/dictado_transaccion";
import { getIdUsuario } from "../../utils/usuario";

const API_URL = import.meta.env.VITE_API_URL;

const MESES_NOMBRES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function Transacciones() {
  
  const [nuevaTransaccion, setNuevaTransaccion] = useState({
    fecha: "",
    monto: "",
    id_categoria: "",
    descripcion: "",
    imagen: null,
    tipoPago: "efectivo",
    tipoPago2: "",
    monto2: "",
    cuotas: "1",
    interes: "0",
    totalCredito: "",
    valorCuota: ""
  });

  const idUsuario = localStorage.getItem("idUsuario");
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
  const [showSelectorTipo, setShowSelectorTipo] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [usarSegundoMetodo, setUsarSegundoMetodo] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [usarSegundoMetodoEditar, setUsarSegundoMetodoEditar] = useState(false);
  const [archivoExcel, setArchivoExcel] = useState(null);
  const [mensajeImportacion, setMensajeImportacion] = useState("");
  const [previaOCR, setPreviaOCR] = useState(null);
  const [imagenVistaPrevia, setImagenVistaPrevia] = useState(null);
  const [mostrarModalImagen, setMostrarModalImagen] = useState(false);
  const [modoDictado, setModoDictado] = useState(false);
  const [pasoDictado, setPasoDictado] = useState(0);
  const recognition = inicializarReconocimiento();
  const [dictadoFinalizado, setDictadoFinalizado] = useState(false);
  const id_usuario = getIdUsuario();
  
  useEffect(() => {
    // Expone esta función para que otro archivo pueda activarla
    window.setDictadoFinalizado = setDictadoFinalizado;

    // Limpieza: borra la referencia si el componente se desmonta
    return () => { window.setDictadoFinalizado = null };
  }, []);


  const metodosIngreso = [
    { valor: "efectivo", label: "Efectivo" },
    { valor: "transferencia", label: "Transferencia" },
    { valor: "deposito", label: "Depósito bancario" },
    { valor: "automatico", label: "Pago automático" },
    { valor: "cheque", label: "Cheque" },
    { valor: "otro", label: "Otro" }
  ];

  const metodosGasto = [
    { valor: "efectivo", label: "Efectivo" },
    { valor: "debito", label: "Débito" },
    { valor: "credito", label: "Crédito" },
    { valor: "transferencia", label: "Transferencia" },
    { valor: "automatico", label: "Pago automático" },
    { valor: "cheque", label: "Cheque" },
    { valor: "otro", label: "Otro" }
  ];

  const metodosMostrar = tipo === "ingreso" ? metodosIngreso : metodosGasto;


  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".csv"))) {
      setArchivoExcel(file);
      setMensajeImportacion("");
    } else {
      setArchivoExcel(null);
      setMensajeImportacion("Solo se permiten archivos .xlsx o .csv");
    }
  };

  const handleSubirArchivo = async () => {
    if (!archivoExcel) {
      setMensajeImportacion("Debes seleccionar un archivo válido");
      return;
    }

    const formData = new FormData();
    formData.append("archivo", archivoExcel);

    try {
      const respuesta = await fetch(`${API_URL}/importar_movimientos`, {
        method: "POST",
        body: formData,
      });

      const data = await respuesta.json();
      if (respuesta.ok) {
        setMensajeImportacion(`${data.mensaje}`);
        cargarTodasTransacciones();
      }
      else {
        setMensajeImportacion(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      setMensajeImportacion("Error al conectar con el servidor");
    }
  };


  const cargarTodasTransacciones = async () => {
    if (!id_usuario) return;

    try {
      const respuesta = await fetch(`${API_URL}/transacciones_completas?id_usuario=${id_usuario}&mes=${mesFiltrado}&anio=${anioFiltrado}`);
      const normales = await respuesta.json();

      const eliminadasDebug = normales.filter(t => !t.visible);

      const visibles = normales.filter(t => t.visible);
      visibles.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setTransacciones(visibles);
      setEliminadas(eliminadasDebug);
    } catch (error) {
      console.error("Error al cargar transacciones:", error);
    }
  };
  

  useEffect(() => {
    if (!id_usuario) return;

    fetch(`${API_URL}/categorias/${id_usuario}`)
      .then(res => res.json())
      .then(data => {
        setCategorias(data);
      })
      .catch(err => {
        console.error("Error al cargar categorías:", err);
      });
  }, []);


  useEffect(() => {
    if (!id_usuario) return;

    const generarTransaccionesRecurrentes = async () => {
      try {
        await fetch(`${API_URL}/transacciones/generar_mes_actual?id_usuario=${id_usuario}`, {
          method: "POST"
        });
      } catch (error) {
        console.warn("No se pudo generar transacciones recurrentes:", error);
      }
    };

    const cargarTodo = async () => {
      await generarTransaccionesRecurrentes();
      await cargarTodasTransacciones();
    };

    cargarTodo();
  }, [mesFiltrado, anioFiltrado]);  
  

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


  const scrollToForm = () => {
    if (formularioRef.current) {
      formularioRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };


  const limpiarFormulario = () => {
    setNuevaTransaccion({
      fecha: "",
      monto: "",
      id_categoria: "",
      descripcion: "",
      imagen: null,
      tipoPago: "efectivo",
      tipoPago2: "",
      monto2: "",
      cuotas: "1",
      interes: "0",
      totalCredito: "",
      valorCuota: ""
    });
    setUsarSegundoMetodo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const toggleMenu = (i) => {
    setMenuAbierto(menuAbierto === i ? null : i);
  };
  
  useEffect(() => {
    if (!idUsuario) return;

    fetch(`${API_URL}/categorias?id_usuario=${idUsuario}`)
      .then(res => res.json())
      .then(data => {
        setCategorias(data);
      })
      .catch(err => console.error("Error al cargar categorías:", err));
  }, [idUsuario]);


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


  useEffect(() => {
    if (modoDictado && pasoDictado < pasosDictado.length) {
      iniciarDictadoPaso({
        pasoActual: pasoDictado,
        pasos: pasosDictado,
        nuevaTransaccion,
        setNuevaTransaccion,
        setPasoActual: setPasoDictado,
        categorias,
        metodosMostrar,
        setUsarSegundoMetodo,
        setModoDictado,
        formatearConPuntos,
        formatearFechaOCR
      });
    }
  }, [pasoDictado]);


  const getMesActual = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, "0");
    return `${año}-${mes}`;
  };
  
  const obtenerSemana = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const dia = fecha.getDate();
    if (dia <= 7) return "Semana 1";
    if (dia <= 14) return "Semana 2";
    if (dia <= 21) return "Semana 3";
    return "Semana 4";
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
      setNuevaTransaccion((prev) => ({ ...prev, imagen: newValue }));
    }
    else if (name === "monto") newValue = formatearConPuntos(value);
    else newValue = value;
  
    setNuevaTransaccion((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };  


  const leerBoleta = async () => {
    if (!nuevaTransaccion.imagen) {
      alert("Debes seleccionar primero una imagen de boleta en el campo 'Comprobante'.");
      return;
    }

    const formData = new FormData();
    formData.append("imagen", nuevaTransaccion.imagen);

    try {
      const respuesta = await fetch(`${API_URL}/leer_boleta`, {
        method: "POST",
        body: formData
      });
      const data = await respuesta.json();
      if (!respuesta.ok) {
        alert("Error al leer la boleta: " + data.error);
        return;
      }

      const texto = data.texto.split("\n").map(l => l.trim()).filter(l => l);
      console.log("📄 Texto extraído:", texto);

      // 1) Intentar extraer fecha en líneas que mencionen Fecha o Emisión
      const regexFechaLine = /(fecha(?:\s+de)?\s*emisi[oó]n?|fecha)\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i;
      let fechaRaw = "";
      for (let line of texto) {
        const m = line.match(regexFechaLine);
        if (m) { fechaRaw = m[2]; break; }
      }
      // 2) Si no hay, buscar la primera fecha genérica
      if (!fechaRaw) {
        const regexFechaAny = /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/;
        const m = texto.join(" ").match(regexFechaAny);
        fechaRaw = m?.[1] || "";
      }
      const fechaFormateada = formatearFechaOCR(fechaRaw);

      // 3) Extraer todos los montos válidos y escoger el más alto
      const regexMontos = /(?:\$|\s)\s*([\d]{1,3}(?:[\.,]\d{3})*(?:,\d{2})?)/g;
      const montos = [];
      let match;
      for (let line of texto) {
        while ((match = regexMontos.exec(line)) !== null) {
          const num = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
          if (!isNaN(num)) montos.push(num);
        }
      }
      const montoMasAlto = montos.length ? Math.max(...montos) : "";

      // 4) Actualizar estado
      setNuevaTransaccion(prev => ({
        ...prev,
        fecha: prev.fecha || fechaFormateada,
        monto: prev.monto || (montoMasAlto.toString())
      }));

      alert(`✅ Boleta leída correctamente:\n\nFecha: ${fechaFormateada || "no detectada"}\n💲Monto total: ${montoMasAlto || "no detectado"}`);

    } catch (error) {
      console.error("Error al conectar con el servidor OCR:", error);
      alert("Error al conectar con el servidor.");
    }
  };


  const probarMicrofono = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      alert("🎉 Micrófono detectado y funcionando.");
      stream.getTracks().forEach(track => track.stop()); // Detiene la grabación de prueba
    } catch (err) {
      alert("No se pudo acceder al micrófono. Verifica los permisos en el navegador.");
      console.error("Error al acceder al micrófono:", err);
    }
  };


  const testReconocimientoBasico = () => {
    const r = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    r.lang = "es-CL";
    r.start();

    r.onresult = (e) => {
      const texto = e.results[0][0].transcript;
      console.log("🔊 Se captó:", texto);
      alert("Se escuchó: " + texto);
    };

    r.onerror = (e) => {
      console.error("Error básico:", e.error);
      alert("Error: " + e.error);
    };
  };


  const formatearFechaOCR = (texto) => {
    if (!texto) return "";

    const meses = {
      enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06",
      julio: "07", agosto: "08", septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12"
    };

    // Convertir tildes, normalizar y eliminar "del", "de"
    texto = texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quitar tildes
      .replace(/\bdel?\b/g, "") // quitar 'de' y 'del'
      .trim();

    // Detectar patrones como "25 mayo 2025" o "25 5 2025"
    const partes = texto.split(/\s+/);
    if (partes.length < 2) return "";

    const dia = partes[0].padStart(2, "0");
    const mesEntrada = partes[1];
    const anioEntrada = partes[2] || new Date().getFullYear();

    let mes = "01";

    if (isNaN(mesEntrada)) {
      mes = meses[mesEntrada] || "01";
    } else {
      mes = mesEntrada.padStart(2, "0");
    }

    return `${anioEntrada}-${mes}-${dia}`;
  };

  const todas = [...transacciones];

  const transaccionesFiltradas = todas.filter((t) => {
    const fuente = t.fecha;
    if (!fuente || !fuente.includes("-")) return false;
    const [anio, mes] = fuente.split("-");
    const coincideMes = !mesFiltrado || mes === mesFiltrado.padStart(2, "0");
    const coincideAnio = !anioFiltrado || anio === anioFiltrado;
    return coincideMes && coincideAnio;
  });
  
  // Ordenar fuera del .filter
  transaccionesFiltradas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const transaccionesPorSemana = transaccionesFiltradas.reduce((grupo, trans) => {
    const semana = obtenerSemana(trans.fecha);
    if (!grupo[semana]) grupo[semana] = [];
    grupo[semana].push(trans);
    return grupo;
  }, {});
    
  
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
      id_categoria: trans.id_categoria || "",
      tipoPago: trans.tipoPago || "",
      tipo: trans.tipo || "gasto",
      imagen: trans.imagen || "",
      cuotas: trans.cuotas || 1,
      valorCuota: trans.valorCuota || "",
      totalCredito: trans.totalCredito || "",
      interes: trans.interes || "",
      tipoPago2: trans.tipoPago2 || "",
      monto2: trans.monto2 || "",
      id_gasto_mensual: trans.id_gasto_mensual || null,
      id_gasto_programado: trans.id_gasto_programado || null,
    });

    setUsarSegundoMetodoEditar(!!trans.tipoPago2);
    setTipo(trans.tipo);
    setEditIndex(id);
    setShowModalEditar(true);
  };
  
  
  const actualizarTransaccion = async () => {
    const id_usuario = parseInt(localStorage.getItem("id_usuario"));
    if (!id_usuario) return;

    try {
      const montoNumerico = typeof nuevaTransaccion.monto === "string"
        ? parseFloat(nuevaTransaccion.monto.replace(/\./g, "").replace(",", "."))
        : parseFloat(nuevaTransaccion.monto);

      const transaccionAEnviar = {
        id_usuario,
        tipo: nuevaTransaccion.tipo || tipo,
        fecha: nuevaTransaccion.fecha,
        monto: montoNumerico,
        id_categoria: nuevaTransaccion.id_categoria,
        descripcion: nuevaTransaccion.descripcion,
        tipoPago: nuevaTransaccion.tipoPago,
        tipoPago2: usarSegundoMetodoEditar ? nuevaTransaccion.tipoPago2 : null,
        monto2: usarSegundoMetodoEditar
          ? parseFloat((nuevaTransaccion.monto2 || "0").toString().replace(/\./g, "").replace(",", "."))
          : null,
        cuotas: parseInt(nuevaTransaccion.cuotas || 1),
        interes: parseFloat(nuevaTransaccion.interes || 0),
        valorCuota: parseFloat(nuevaTransaccion.valorCuota || 0),
        totalCredito: parseFloat(nuevaTransaccion.totalCredito || 0),
        imagen: null,
        nombre_archivo: nuevaTransaccion.imagen?.name || null,
        id_gasto_mensual: nuevaTransaccion.id_gasto_mensual || null,
        id_gasto_programado: nuevaTransaccion.id_gasto_programado || null
      };

      await fetch(`${API_URL}/transacciones/${editIndex}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaccionAEnviar)
      });

      await cargarTodasTransacciones(); // recarga después de actualizar

      // Reset
      setEditIndex(null);
      setShowModalEditar(false);
      setNuevaTransaccion({
        fecha: "",
        monto: "",
        id_categoria: "",
        descripcion: "",
        imagen: null,
        tipoPago: "efectivo",
        cuotas: "1",
        interes: "0",
        totalCredito: "",
        valorCuota: ""
      });

    } catch (error) {
      console.error("Error al actualizar transacción:", error);
      alert("No se pudo actualizar la transacción.");
    }
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

    const camposObligatorios = ["fecha", "monto", "id_categoria", "descripcion", "tipoPago", "tipo"];
    const faltantes = camposObligatorios.filter((campo) => !origen[campo]);
    if (faltantes.length > 0) {
      alert("Por favor completa todos los campos obligatorios.");
      console.warn("Campos faltantes:", faltantes);
      return;
    }

    const categoriaSeleccionada = categorias.find(cat => Number(cat.id_categoria) === Number(origen.id_categoria));
    if (categoriaSeleccionada && categoriaSeleccionada.monto_limite && categoriaSeleccionada.monto_limite !== 0) {
      const montoNuevo = parseFloat((origen.monto || "0").toString().replace(/\./g, "").replace(",", "."));
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

    const usar2 = usarSegundoMetodo || usarSegundoMetodoEditar;

    if (usar2) {
      const monto1 = origen.monto;
      const monto2 = origen.monto2 || "0";

      const montoNum1 = parseFloat((monto1 || "0").toString().replace(/\./g, "").replace(",", "."));
      const montoNum2 = parseFloat((monto2 || "0").toString().replace(/\./g, "").replace(",", "."));

      const suma = montoNum1 + montoNum2;

      if (Math.abs(suma - montoNum1) > 0.01 && Math.abs(suma - montoNum2) > 0.01) {
        alert("La suma del monto 1 y monto 2 no coincide con el monto total ingresado.");
        return;
      }
    }

    const transaccionAEnviar = {
      id_usuario,
      tipo: origen.tipo,
      fecha: origen.fecha,
      monto: montoNumerico,
      id_categoria: origen.id_categoria,
      descripcion: origen.descripcion,
      tipoPago: origen.tipoPago,
      tipoPago2: usar2 ? origen.tipoPago2 : null,
      monto2: usar2
        ? parseFloat((origen.monto2 || "0").toString().replace(/\./g, "").replace(",", "."))
        : null,
      cuotas: parseInt(origen.cuotas || 1),
      interes: parseFloat(origen.interes || 0),
      valorCuota: parseFloat(origen.valorCuota || 0),
      totalCredito: parseFloat(origen.totalCredito || 0),
      imagen: imagenBase64,
      nombre_archivo: origen.imagen?.name || null
    };

    console.log("Transacción a enviar:", transaccionAEnviar);

    try {
      if (esEdicion) {
        const id_transaccion = editIndex;
        await fetch(`http://localhost:5000/api/transacciones/${id_transaccion}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaccionAEnviar)
        });

        const nuevasTransacciones = transacciones.map((t) =>
          t.id_transaccion === id_transaccion
            ? { ...t, ...transaccionAEnviar }
            : t
        );
        setTransacciones(nuevasTransacciones);
      } else {
        // Limpia campos opcionales vacíos
        if (!transaccionAEnviar.tipoPago2) delete transaccionAEnviar.tipoPago2;
        if (!transaccionAEnviar.monto2) delete transaccionAEnviar.monto2;
        if (!transaccionAEnviar.imagen) delete transaccionAEnviar.imagen;
        console.log("📤 Transacción a enviar:", transaccionAEnviar);

        await fetch(`${API_URL}/transacciones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaccionAEnviar)
        });

        await cargarTodasTransacciones();
      }

      setEditIndex(null);
      setNuevaTransaccion({
        fecha: "",
        monto: "",
        id_categoria: "",
        descripcion: "",
        imagen: null,
        tipoPago: "efectivo",
        cuotas: "1",
        interes: "0",
        totalCredito: "",
        valorCuota: "",
        tipo: tipo
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
      setMostrarFormulario(false);

    } catch (error) {
      console.error("Error al guardar transacción:", error);
      alert("Error al guardar la transacción");
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
    const confirmado = window.confirm("¿Estás segura(o) de que quieres eliminar esta transacción? Esto también eliminará la transacción asociada de este mes.");

    if (!confirmado) return;

    try {
      if (typeof id === "string" && id.startsWith("gp-")) {
        const idReal = id.split("-")[1];
        await fetch(`${API_URL}/transacciones/programados/${idReal}/eliminar`, {
          method: "PUT"
        });

      } else if (typeof id === "string" && id.startsWith("gm-")) {
        const idReal = id.split("-")[1];
        await fetch(`${API_URL}/transacciones/mensuales/${idReal}/eliminar`, {
          method: "PUT"
        });

      } else {
        await fetch(`${API_URL}/transacciones/${id}/eliminar`, {
          method: "PUT"
        });
      }

      await cargarTodasTransacciones(); // Recarga la vista
    } catch (error) {
      console.error("Error al eliminar transacción:", error);
      alert("No se pudo eliminar la transacción.");
    }
  };
  

  const exportarTransacciones = (mesExportar, anioExportar, formato) => {
    const filtradas = transacciones.filter((t) => {
      const fuente = t.fecha;
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
  
  
  const recuperarTransaccion = async (id) => {
    try {
      const respuesta = await fetch(`${API_URL}/transacciones/${id}/recuperar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo recuperar la transacción");
      }

      await cargarTodasTransacciones();
    } catch (error) {
      console.error("Error al recuperar transacción:", error);
      alert("Ocurrió un error al intentar recuperar la transacción.");
    }
  };
  
  const borrarDefinitivamente = async (id) => {
    try {
      await fetch(`${API_URL}/transacciones/${id}/borrar_definitivo`, {
        method: "DELETE"
      });

      // Quitar del estado eliminadas
      setEliminadas(prev => prev.filter(t => t.id !== id && t.id_transaccion !== id));
    } catch (error) {
      console.error("Error al borrar definitivamente:", error);
      alert("No se pudo borrar la transacción permanentemente");
    }
  };


  const exportarMesActual = async (formato) => {
    try {
      const response = await fetch(`${API_URL}/transacciones/exportar_mes_actual?id_usuario=${id_usuario}&mes=${mesFiltrado}&anio=${anioFiltrado}&formato=${formato}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error al exportar:", errorText);
        alert("Error al exportar. Verifica si hay transacciones para este mes o si el backend respondió correctamente.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transacciones_${mesFiltrado}-${anioFiltrado}.${formato === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      console.error("Error inesperado al exportar:", error);
      alert("Error al exportar transacciones. Revisa la consola para más detalles.");
    }
  };


  const eliminadasFiltradas = eliminadas.filter((t) => {
    const fecha = new Date(t.fecha);
    if (isNaN(fecha.getTime())) return false;

    const anio = fecha.getFullYear().toString();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");

    const coincideMes = !mesFiltrado || mes === mesFiltrado.padStart(2, "0");
    const coincideAnio = !anioFiltrado || anio === anioFiltrado;

    return coincideMes && coincideAnio;
  });


  return (
    <div className="page-layout">
      <main className="transacciones-container">
        <h1 className="titulo-transacciones">Gestión de Transacciones</h1>

        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem" }}>

          {/* BLOQUE IZQUIERDA */}
          <div style={{ flex: "2", minWidth: "300px" }}>
            <div className="menu-exportar-wrapper" style={{ marginBottom: "1.5rem" }}>
              <button className="btn-exportar-trigger" onClick={() => setMostrarMenuFormato(!mostrarMenuFormato)}>
                Exportar mes actual
              </button>
              {mostrarMenuFormato && (
                <div className="menu-exportar">
                  <label>Elegir formato:</label>
                  <button className="btn-exportar-confirmar" onClick={() => { exportarMesActual("excel"); setMostrarMenuFormato(false); }}>
                    Excel (.xlsx)
                  </button>
                  <button className="btn-exportar-confirmar" onClick={() => { exportarMesActual("pdf"); setMostrarMenuFormato(false); }}>
                    PDF
                  </button>
                </div>
              )}
            </div>

            <div className="importar-excel">
              <h4>Importar movimientos bancarios</h4>
              <input
                id="input-archivo"
                type="file"
                accept=".xlsx,.csv"
                onChange={handleArchivoChange}
                style={{ display: "none" }}
                ref={fileInputRef}
              />
              <label htmlFor="input-archivo" className="btn-seleccion-archivo">
                📁 Seleccionar archivo de movimientos bancarios
              </label>
              {archivoExcel && (
                <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#374151" }}>
                  Archivo seleccionado: <strong>{archivoExcel.name}</strong>
                </p>
              )}
              <button onClick={handleSubirArchivo} className="btn-guardar" style={{ marginTop: "0.5rem" }}>
                Subir archivo
              </button>
              {mensajeImportacion && <p>{mensajeImportacion}</p>}
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
      
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1rem" }}>
        <button
          className="btn-guardar"
          onClick={() => {
            setTipo("gasto");
            setNuevaTransaccion(prev => ({
            ...prev,
            tipo: tipo  // asegura que tipo ya esté seteado en nuevaTransaccion
          }));
          setMostrarFormulario(true);
          }}
        >
          Agregar nueva transacción
        </button>
      </div>

      <h3 className="titulo-secundario">Transacciones registradas</h3>

        <div className="lista-transacciones">
          {(() => {
            const filas = [];
            const transaccionesOrdenadas = [...transaccionesFiltradas].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            for (let i = 0; i < transaccionesOrdenadas.length; i += 2) {
              const fila = transaccionesOrdenadas.slice(i, i + 2);

              fila.forEach((t, index) => {
                filas.push(
                  <div
                    className={`tarjeta-minimal ${t.esMensual ? "gasto-mensual" : ""} ${t.esProgramado ? "esProgramado" : ""} ${t.tipoPago === "credito" ? "transaccion-credito" : ""}`}
                    key={i + index}
                  >
                    <div className="fila-superior">
                      <div className={`tag ${
                        t.id_gasto_mensual ? "gasto-mensual" :
                        t.id_gasto_programado ? "gasto-programado" :
                        t.tipo
                      }`}>
                        {
                          t.id_gasto_mensual
                            ? "GASTO MENSUAL"
                            : t.id_gasto_programado
                            ? "GASTO PROGRAMADO"
                            : `${t.tipo.toUpperCase()}${t.importada ? " (IMPORTADO)" : ""}`
                        }
                      </div>
                      <div className="fecha">{formatearFechaBonita(t.fecha)}</div>
                    </div>

                    <div className="contenido-horizontal">
                      <div className="item"><span>Monto:</span><div className="monto">${Number(t.monto).toLocaleString("es-CL")}</div></div>
                      <div className="item">
                        <span>Categoría:</span>
                        <div>
                          {
                            (() => {
                              const encontrada = categorias.find(c => Number(c.id_categoria) === Number(t.id_categoria));
                              return encontrada?.nombre || "Sin categoría";
                            })()
                          }
                        </div>
                      </div>
                      <div className="item"><span>Descripción:</span><div>{t.descripcion}</div></div>
                      <div className="item"><span>Tipo de pago:</span><div>{t.tipoPago}</div></div>
                    </div>

                    {t.imagen && (
                      <button className="btn-ver-comprobante" onClick={() => {
                        const url = t.imagen.startsWith("http") ? t.imagen : `${API_URL.replace("/api", "")}/imagenes/${t.imagen}`;
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
                            {!t.id_gasto_mensual && !t.id_gasto_programado && (
                              <button className="editar" onClick={() => editarTransaccion(t.id_transaccion)}>Editar</button>
                            )}
                            <button onClick={() => eliminarTransaccion(t.id || t.id_transaccion)}>Eliminar</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            }

            return filas;
          })()}
        </div>
      
        {mostrarFormulario && (
          <div className="modal-overlay" onClick={() => setMostrarFormulario(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Nueva transacción: {tipo === "gasto" ? "Gasto" : "Ingreso"}</h3>

              <div className="grid-formulario">

                <div className="botones-tipo-transaccion" style={{ gridColumn: "1 / 4", display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <button
                    className={`btn-tipo ${tipo === "ingreso" ? "activo ingreso" : ""}`}
                    onClick={() => {
                      setTipo("ingreso");
                      setNuevaTransaccion(prev => ({ ...prev, tipo: "ingreso" }));
                    }}
                  >
                    Ingreso
                  </button>
                  <button
                    className={`btn-tipo ${tipo === "gasto" ? "activo gasto" : ""}`}
                    onClick={() => {
                      setTipo("gasto");
                      setNuevaTransaccion(prev => ({ ...prev, tipo: "gasto" }));
                    }}
                  >
                    Gasto
                  </button>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <button
                    className="btn-guardar"
                    onClick={() => {
                      setModoDictado(true);
                      setPasoDictado(0);
                      iniciarDictadoPaso({
                        pasoActual: 0,
                        pasos: pasosDictado,
                        nuevaTransaccion,
                        setNuevaTransaccion,
                        setPasoActual: setPasoDictado,
                        categorias,
                        metodosMostrar,
                        setUsarSegundoMetodo,
                        formatearConPuntos,
                        formatearFechaOCR
                      });
                    }}
                  >
                    Iniciar dictado por voz
                  </button>

                  <button
                    className="btn-guardar"
                    style={{ backgroundColor: "#10b981" }}
                    onClick={probarMicrofono}
                  >
                    Probar micrófono
                  </button>

                  <button
                    className="btn-guardar"
                    style={{ backgroundColor: "#8b5cf6" }}
                    onClick={testReconocimientoBasico}
                  >
                    Test dictado básico
                  </button>
                </div>
                
                {/* Comprobante */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "end", gridColumn: "1 / 4" }}>
                  <div className="campo-imagen" style={{ flex: 1 }}>
                    <div className="grupo-comprobante">
                      <label>Comprobante (opcional):</label>
                      <div className="comprobante-y-boton">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleChange}
                          ref={fileInputRef}
                        />
                        <button className="btn-leer-boleta" onClick={leerBoleta}>
                          Leer boleta
                        </button>
                        <div className="tooltip-ayuda">
                          <button className="btn-ayuda-ocr">🛈</button>
                          <div className="tooltip-contenido">
                            <strong>¿Cómo usar "Leer boleta"?</strong><br />
                            1. Sube una imagen clara del comprobante.<br />
                            2. Haz clic en “Leer boleta”.<br />
                            3. Se detectarán la <em>fecha</em> y el <em>monto total</em> automáticamente.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {nuevaTransaccion.imagen && typeof nuevaTransaccion.imagen === "object" && (
                  <button
                    className="btn-ver-comprobante"
                    style={{ marginTop: "0.5rem" }}
                    onClick={() => {
                      const url = URL.createObjectURL(nuevaTransaccion.imagen);
                      setImagenVistaPrevia(url);
                      setMostrarModalImagen(true);
                    }}
                  >
                    Ver comprobante
                  </button>
                )}

                {/* Fecha y Categoría */}
                <div className="campo-fecha">
                  <label>Fecha:</label>
                  <input
                    type="date"
                    name="fecha"
                    value={nuevaTransaccion.fecha}
                    onChange={handleChange}
                    className={modoDictado && pasosDictado[pasoDictado] === "fecha" ? "campo-activo-dictado" : ""}
                  />
                </div>

                <div className="campo-categoria">
                  <label>Categoría:</label>
                  <select
                    name="id_categoria"
                    value={nuevaTransaccion.id_categoria}
                    onChange={handleChange}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias
                      .filter(c => {
                        if (!c.tipo) return false;
                        const tipoCategoria = c.tipo.toLowerCase();
                        return tipoCategoria === tipo || tipoCategoria === "ambos";
                      })
                      .map((c) => (
                        <option key={c.id_categoria} value={c.id_categoria}>
                          {c.nombre}
                        </option>
                      ))}
                  </select>
                  {modoDictado && pasosDictado[pasoDictado] === "id_categoria" && (
                    <div className="ayuda-dictado-categorias">
                      <p>Puedes decir una de estas opciones:</p>
                      <ul>
                        {categorias
                          .filter(c => {
                            const tipoCategoria = c.tipo?.toLowerCase();
                            return tipoCategoria === tipo || tipoCategoria === "ambos";
                          })
                          .map((c) => (
                            <li key={c.id_categoria}>{c.nombre}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Descripción (ocupa toda la fila) */}
                <div className="campo-descripcion" style={{ gridColumn: "1 / 4" }}>
                  <label>Descripción:</label>
                  <input
                    type="text"
                    name="descripcion"
                    value={nuevaTransaccion.descripcion}
                    onChange={handleChange}
                    className={modoDictado && pasosDictado[pasoDictado] === "descripcion" ? "campo-activo-dictado" : ""}
                  />
                </div>

                {/* Checkbox para doble método */}
                <div style={{ gridColumn: "1 / 4", display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
                  {modoDictado && pasosDictado[pasoDictado] === "usarSegundoMetodo" && (
                    <div className="ayuda-dictado-categorias">
                      <p>Puedes decir:</p>
                      <ul>
                        <li>“Sí” — para usar dos métodos de pago</li>
                        <li>“No” — para usar solo uno y terminar el dictado</li>
                      </ul>
                    </div>
                  )}
                  <label htmlFor="checkbox-doble-pago" style={{ cursor: "pointer", fontSize: "0.95rem" }}>
                    ¿Pagar con dos métodos?
                  </label>
                </div>

                <div className="fila-metodos-pago">
                  <div className="campo-tipopago">
                    <label>Tipo de pago</label>
                    <select
                      name="tipoPago"
                      value={nuevaTransaccion.tipoPago}
                      onChange={handleChange}
                      className={modoDictado && pasosDictado[pasoDictado] === "tipoPago" ? "campo-activo-dictado" : ""}
                    >
                      <option value="">Selecciona</option>
                      {metodosMostrar.map((m) => (
                        <option key={m.valor} value={m.valor}>{m.label}</option>
                      ))}
                    </select>
                    {modoDictado && pasosDictado[pasoDictado] === "tipoPago" && (
                      <div className="ayuda-dictado-categorias">
                        <p>Puedes decir uno de estos métodos de pago:</p>
                        <ul>
                          {metodosMostrar.map((m) => (
                            <li key={m.valor}>{m.label}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="campo-monto">
                    <label>Monto total</label>
                    <input
                      type="text"
                      name="monto"
                      value={nuevaTransaccion.monto}
                      onChange={handleChange}
                      className={modoDictado && pasosDictado[pasoDictado] === "monto" ? "campo-activo-dictado" : ""}
                    />
                  </div>

                  {usarSegundoMetodo && (
                    <>
                      <div className="campo-tipopago">
                        <label>Segundo tipo de pago</label>
                        <select
                          name="tipoPago2"
                          value={nuevaTransaccion.tipoPago2}
                          onChange={handleChange}
                          className={modoDictado && pasosDictado[pasoDictado] === "tipoPago2" ? "campo-activo-dictado" : ""}
                        >
                          <option value="">Selecciona</option>
                          {metodosMostrar.map((m) => (
                            <option key={m.valor} value={m.valor}>{m.label}</option>
                          ))}
                        </select>
                        {modoDictado && pasosDictado[pasoDictado] === "tipoPago2" && (
                          <div className="ayuda-dictado-categorias">
                            <p>Puedes decir uno de estos métodos de pago:</p>
                            <ul>
                              {metodosMostrar.map((m) => (
                                <li key={m.valor}>{m.label}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="campo-monto">
                        <label>Monto 2</label>
                        <input
                          type="text"
                          name="monto2"
                          value={nuevaTransaccion.monto2}
                          onChange={handleChange}
                          className={modoDictado && pasosDictado[pasoDictado] === "monto2" ? "campo-activo-dictado" : ""}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Créditos (si se eligió crédito) */}
                {nuevaTransaccion.tipoPago === "credito" && (
                  <>
                    <div>
                      <label>Cuotas:</label>
                      <input
                        type="number"
                        name="cuotas"
                        min="1"
                        value={nuevaTransaccion.cuotas}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label>Interés (%):</label>
                      <input
                        type="number"
                        name="interes"
                        step="0.1"
                        value={nuevaTransaccion.interes}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label>Total Crédito:</label>
                      <input
                        type="text"
                        name="totalCredito"
                        value={nuevaTransaccion.totalCredito}
                        readOnly
                      />
                    </div>

                    <div>
                      <label>Valor por Cuota:</label>
                      <input
                        type="text"
                        name="valorCuota"
                        value={nuevaTransaccion.valorCuota}
                        readOnly
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Botones de acción */}
              <div className="acciones-transaccion">
                <button className="btn-guardar" onClick={enviarTransaccion}>Guardar</button>
                <button
                  className="btn-cancelar"
                  onClick={() => {
                    limpiarFormulario();            // Limpia campos
                    setPasoDictado(0);              // Reinicia pasos del dictado
                    setModoDictado(false);          // Sale del modo dictado
                    setMostrarFormulario(false);    // Cierra el formulario
                  }}
                >
                  Cancelar
                </button>
              </div>
                {dictadoFinalizado && (
                  <div className="mensaje-final-dictado">
                    Dictado finalizado. Revisa los campos y haz clic en <strong>Guardar</strong>.
                  </div>
                )}

                {/* Previsualización de datos OCR */}
                {previaOCR && (
                  <div className="modal-previa-ocr">
                    <h4>Datos detectados desde la boleta:</h4>
                    <p><strong>Comercio:</strong> {previaOCR.descripcion}</p>
                    <p><strong>Fecha:</strong> {previaOCR.fecha}</p>
                    <p><strong>Monto total:</strong> ${Number(previaOCR.monto).toLocaleString("es-CL")}</p>

                    <div className="botones-previa-ocr">
                      <button
                        className="btn-guardar"
                        onClick={() => {
                          setNuevaTransaccion(prev => ({
                            ...prev,
                            descripcion: previaOCR.descripcion,
                            monto: previaOCR.monto,
                            fecha: previaOCR.fecha
                          }));
                          setPreviaOCR(null);
                        }}
                      >
                        Usar estos datos
                      </button>

                      <button
                        className="btn-cancelar"
                        onClick={() => setPreviaOCR(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

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
                <p><strong>Categoría:</strong> {
                  (() => {
                    const cat = categorias.find(c => Number(c.id_categoria) === Number(t.id_categoria));
                    return cat ? cat.nombre : "Sin categoría";
                  })()
                }</p>
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
                      : `${API_URL.replace("/api", "")}/imagenes/${imagen}`;
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
                <button
                  className="btn-recuperar"
                  style={{ backgroundColor: "#dc2626", marginLeft: "0.5rem" }}
                  onClick={() => {
                    const confirmado = window.confirm("¿Estás segura de eliminar esta transacción permanentemente?");
                    if (confirmado) borrarDefinitivamente(t.id || t.id_transaccion);
                  }}
                >
                  Eliminar definitivamente
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
                <select
                  name="id_categoria"
                  value={nuevaTransaccion.id_categoria || ""}
                  onChange={(e) =>
                    setNuevaTransaccion(prev => ({
                      ...prev,
                      id_categoria: e.target.value
                    }))
                  }
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias
                    .filter(c => {
                      if (!c.tipo) return false;
                      const tipoCategoria = c.tipo.toLowerCase();
                      const tipoTransaccion = nuevaTransaccion.tipo?.toLowerCase();
                      return tipoCategoria === tipoTransaccion || tipoCategoria === "ambos";
                    })
                    .map(c => (
                      <option key={c.id_categoria} value={c.id_categoria}>
                        {c.nombre}
                      </option>
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
                      <option value="transferencia">Transferencia</option>
                      <option value="debito">Débito</option>
                      <option value="credito">Crédito</option>
                      <option value="contribucion tarjeta de credito">Contribución Tarjeta de Crédito</option>
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
              <button className="btn-guardar" onClick={actualizarTransaccion}>Guardar cambios</button>
              <button
                className="btn-cancelar"
                onClick={() => {
                  limpiarFormulario();              // limpia
                  setEditIndex(null);               // limpia índice
                  setShowModalEditar(false);        // cierra
                }}
              >
                Cancelar
              </button>
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

        {mostrarModalImagen && (
          <div className="modal-overlay" onClick={() => setMostrarModalImagen(false)}>
            <div className="modal-imagen" onClick={(e) => e.stopPropagation()}>
              {imagenVistaPrevia ? (
                <img
                  src={imagenVistaPrevia}
                  alt="Vista previa comprobante"
                  style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: "8px" }}
                />
              ) : (
                <p style={{ color: "#ef4444" }}>No hay imagen cargada.</p>
              )}
              <button
                className="btn-cerrar-modal"
                style={{ marginTop: "1rem" }}
                onClick={() => setMostrarModalImagen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        </main>
      </div>
  );
}
