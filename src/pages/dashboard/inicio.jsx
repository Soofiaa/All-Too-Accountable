import React, { useEffect, useState } from "react";
import "./inicio.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getIdUsuario } from "../../utils/usuario";

const API_URL = import.meta.env.VITE_API_URL;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardFinanciero() {
  const navigate = useNavigate();
  const [gastosProgramados, setGastosProgramados] = useState([]);
  const [salario, setSalario] = useState(0);
  const [ahorros, setAhorros] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [nuevoSalario, setNuevoSalario] = useState("");
  const [showAgregarAhorro, setShowAgregarAhorro] = useState(false);
  const [showQuitarAhorro, setShowQuitarAhorro] = useState(false);
  const [montoAhorro, setMontoAhorro] = useState("");
  const [diaFacturacion, setDiaFacturacion] = useState(1);
  const [mostrarModalFacturacion, setMostrarModalFacturacion] = useState(false);
  const [nuevoDiaFacturacion, setNuevoDiaFacturacion] = useState(diaFacturacion);
  const [nuevoNombreUsuario, setNuevoNombreUsuario] = useState("");
  const [mostrarModalNombre, setMostrarModalNombre] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [modoGrafico, setModoGrafico] = useState("mensual");
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [saldoAcumulado, setSaldoAcumulado] = useState([]);
  const [gastosMensuales, setGastosMensuales] = useState([]);
  const [movimientosAhorro, setMovimientosAhorro] = useState([]);
  const [evolucionAhorro, setEvolucionAhorro] = useState([]);
  const [consejos, setConsejos] = useState([]);
  const [consejoActual, setConsejoActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metas, setMetas] = useState([]);
  const [fechaAhorro, setFechaAhorro] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1); // de 1 a 12
  const [anioSeleccionado, setAnioSeleccionado] = useState(fechaActual.getFullYear());
  const [fechaSalario, setFechaSalario] = useState(() => {
    const hoy = new Date().toISOString().split("T")[0];
    return hoy;
  });
  const [pestanaActiva, setPestanaActiva] = useState("resumen");
  const [categorias, setCategorias] = useState([]);
  const [alertasRecurrentes, setAlertasRecurrentes] = useState([]);
  const [alertasComparativas, setAlertasComparativas] = useState([]);
  const [comparacion, setComparacion] = useState([]);
  const [visible, setVisible] = useState(true);
  const now = new Date();
  const [mes1, setMes1] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
  const [anio1, setAnio1] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [mes2, setMes2] = useState(now.getMonth() + 1);
  const [anio2, setAnio2] = useState(now.getFullYear());
  const id_usuario = getIdUsuario();

  useEffect(() => {
    if (!id_usuario) return;

    fetch(`${API_URL}/estadisticas/comparar_categorias?id_usuario=${id_usuario}&mes1=${mes1}&anio1=${anio1}&mes2=${mes2}&anio2=${anio2}`)
      .then(res => res.json())
      .then(data => setComparacion(data))
      .catch(err => console.error("Error al comparar categorías:", err));
  }, [mes1, anio1, mes2, anio2]);

  
  useEffect(() => {
    if (!id_usuario) return;
  
    fetch(`${API_URL}/usuarios/${id_usuario}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.nombre_usuario) {
          setNombreUsuario(data.nombre_usuario);
        } else {
          console.warn("Nombre no encontrado en la respuesta:", data);
        }
      })
      .catch((error) => {
        console.error("Error al obtener nombre de usuario desde la base de datos:", error);
      });
  }, []);  
  
  
  useEffect(() => {
    if (id_usuario) {
      fetch(`${API_URL}/detalles_usuario?id_usuario=${id_usuario}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.salario !== undefined) setSalario(data.salario);
          if (data.dia_facturacion !== undefined) setDiaFacturacion(data.dia_facturacion);
          setLoading(false);
        })        
        .catch((error) => {
          console.error("Error al obtener detalles usuario:", error);
          setLoading(false);
        });
    }
  }, []);     
  

  useEffect(() => {
    fetch("/consejos.json")
      .then(res => res.json())
      .then(data => setConsejos(data))
      .catch(err => console.error("Error al cargar consejos:", err));
  }, []);  


  useEffect(() => {
    const idUsuario = getIdUsuario();
    
    if (!idUsuario || idUsuario === "null" || idUsuario === "undefined") {
      navigate("/");  // solo redirige si está mal
    }
  }, []);     


  useEffect(() => {
    if (!id_usuario) return;

    fetch(`${API_URL}/categorias/${id_usuario}`)
      .then(res => res.json())
      .then(setCategorias)
      .catch(err => console.error("Error al cargar categorías:", err));
  }, []);


  useEffect(() => {
    if (!id_usuario) return;

+   fetch(`${API_URL}/transacciones_completas?id_usuario=${id_usuario}&mes=${mesSeleccionado}&anio=${anioSeleccionado}`)
      .then(res => {
        if (!res.ok) throw new Error("Error al obtener transacciones completas");
        return res.json();
      })
      .then(data => {
        setTransacciones(data);
        verificarYDepositarSalario(data);
        registrarSaldoSobranteSiCorresponde();
      })
      .catch(error => {
        console.error("Error al cargar transacciones completas:", error);
      });
  }, [mesSeleccionado, anioSeleccionado]);


  useEffect(() => {
    if (!transacciones.length) return;
    const datosPorDia = {};

    transacciones
      .filter(t => t.visible !== false)
      .forEach((t) => {
        const [anio, mes, dia] = t.fecha.split("-");
        const clave = `${dia.padStart(2, "0")}-${mes.padStart(2, "0")}`;

        if (!datosPorDia[clave]) {
          datosPorDia[clave] = { ingresos: 0, gastos: 0, transacciones: [] };
        }

        const monto = Number(t.monto);

        if (t.tipo === "ingreso") {
          datosPorDia[clave].ingresos += monto;
        }

        if (t.tipo === "gasto" && t.tipoPago !== "credito") {
          datosPorDia[clave].gastos += monto;
        }

        datosPorDia[clave].transacciones.push(t);
      });

    const diasEnMes = new Date(anioSeleccionado, mesSeleccionado, 0).getDate();
    const datos = [];

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const clave = `${String(dia).padStart(2, "0")}-${String(mesSeleccionado).padStart(2, "0")}`;
      const ingreso = Number(datosPorDia[clave]?.ingresos || 0);
      const gasto = Number(datosPorDia[clave]?.gastos || 0);

      // incluir salario si es día 1
      const ingresoFinal = dia === 1 ? ingreso + Number(salario || 0) : ingreso;

      // combinar transacciones y gastos mensuales
      const transaccionesTotales = [
        ...(datosPorDia[clave]?.transacciones || [])
      ];

      datos.push({
        fecha: clave,
        ingreso: ingresoFinal,
        gasto,
        transacciones: transaccionesTotales
      });
    }

    setDatosGrafico(datos);
  }, [transacciones, modoGrafico, salario, mesSeleccionado, anioSeleccionado, gastosMensuales]);


  useEffect(() => {
    if (!datosGrafico.length) return;

    const nuevoSaldoAcumulado = [];
    let saldo = 0;

    datosGrafico.forEach((d) => {
      // suma ingresos y resta solo gastos REALES, excluyendo los de tipoPago = "credito"
      const transaccionesFiltradas = d.transacciones.filter(
        t => t.visible !== false && t.tipo === "gasto" && t.tipoPago !== "credito"
      );

      const gastoReal = transaccionesFiltradas.reduce((acc, t) => acc + Number(t.monto), 0);

      saldo += Number(d.ingreso) - gastoReal;
      nuevoSaldoAcumulado.push(saldo);
    });

    setSaldoAcumulado(nuevoSaldoAcumulado);
  }, [datosGrafico]);


  useEffect(() => {
    if (!id_usuario) return;
  
    fetch(`${API_URL}/movimientos_ahorro?id_usuario=${id_usuario}`)
      .then(res => res.json())
      .then(data => {
        setMovimientosAhorro(data);
      })
      .catch(err => console.error("Error al cargar movimientos de ahorro:", err));
  }, []);


  useEffect(() => {
    if (!datosGrafico.length || !movimientosAhorro.length) return;
  
    const acumuladoPorDia = [];

    const fechaInicioGrafico = new Date();
    const primerDia = new Date(fechaInicioGrafico.getFullYear(), fechaInicioGrafico.getMonth(), 1);
    
    let acumulado = movimientosAhorro.reduce((acc, mov) => {
      const fechaMov = new Date(mov.fecha);
      return fechaMov < primerDia
        ? acc + (mov.tipo === "agregar" ? mov.monto : -mov.monto)
        : acc;
    }, 0);    

    // let acumulado = 0;
  
    datosGrafico.forEach(d => {
      const [dia, mes] = d.fecha.split("-").map(Number);
      const fechaActual = new Date();
      fechaActual.setDate(dia);
      fechaActual.setMonth(mes - 1);
  
      const movimientosDelDia = movimientosAhorro.filter(mov => {
        const fechaMov = new Date(mov.fecha);
        return (
          fechaMov.getDate() === dia &&
          fechaMov.getMonth() + 1 === mes
        );
      });
  
      movimientosDelDia.forEach(m => {
        acumulado += m.tipo === "agregar" ? m.monto : -m.monto;
      });
  
      acumuladoPorDia.push(acumulado);
    });
  
    setEvolucionAhorro(acumuladoPorDia);
  }, [datosGrafico, movimientosAhorro]);


  useEffect(() => {
    if (!id_usuario) return;
  
    fetch(`${API_URL}/metas/${id_usuario}`)
      .then(res => res.json())
      .then(data => setMetas(data))
      .catch(err => console.error("Error al cargar metas:", err));
  }, []);  


  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Ingresos vs Gastos (Mensual)" },
    },
  };


  const totalAhorros = movimientosAhorro.reduce((acc, mov) => {
    return acc + (mov.tipo === "agregar" ? mov.monto : -mov.monto);
  }, 0);


  useEffect(() => {
    setAhorros(totalAhorros);
  }, [totalAhorros]);
  

  useEffect(() => {
    const hoy = new Date();
    const alertas = [];

    gastosMensuales.forEach((g) => {
      const diaCobro = Number(g.dia_pago);
      const fechaCobro = new Date(hoy.getFullYear(), hoy.getMonth(), diaCobro);
      const diffDias = (fechaCobro - hoy) / (1000 * 60 * 60 * 24);

      if (diffDias >= 0 && diffDias <= 3) {
        alertas.push(`Tienes un gasto mensual (“${g.nombre}”) programado para el día ${diaCobro}.`);
      }
    });

    // Repite para pagos programados
    gastosProgramados.forEach((g) => {
      const fechaPago = new Date(g.fecha_pago);
      const diffDias = (fechaPago - hoy) / (1000 * 60 * 60 * 24);

      if (diffDias >= 0 && diffDias <= 3) {
        alertas.push(`Tienes un pago programado (“${g.descripcion}”) para el ${fechaPago.toLocaleDateString("es-CL")}.`);
      }
    });

    setAlertasRecurrentes(alertas);
  }, [gastosMensuales, gastosProgramados]);


  useEffect(() => {
    if (!id_usuario) return;

    // GASTOS MENSUALES
    fetch(`${API_URL}/gastos_mensuales?id_usuario=${id_usuario}`)
      .then(res => res.json())
      .then(data => setGastosMensuales(data))
      .catch(err => console.error("Error al cargar gastos mensuales:", err));

    // GASTOS PROGRAMADOS
    fetch(`${API_URL}/pagos_programados/${id_usuario}`)
      .then(res => res.json())
      .then(data => setGastosProgramados(data))
      .catch(err => console.error("Error al cargar gastos programados:", err));
  }, []);

  useEffect(() => {
    if (!id_usuario || !transacciones.length || !categorias.length) return;

    const alertas = [];

    categorias.forEach(async (cat) => {
      if (cat.tipo !== "Gasto" && cat.tipo !== "Ambos") return;

      const gastoActual = transacciones
        .filter(t =>
          t.tipo === "gasto" &&
          t.visible !== false &&
          Number(t.id_categoria) === Number(cat.id_categoria)
        )
        .reduce((acc, t) => acc + Number(t.monto), 0);

      const res = await fetch(`${API_URL}/promedios/promedio_categoria?id_usuario=${id_usuario}&id_categoria=${cat.id_categoria}`);
      const data = await res.json();
      const promedio = data.promedio;

      if (promedio > 0 && gastoActual > promedio * 1.3) {
        const exceso = Math.round(((gastoActual - promedio) / promedio) * 100);
        alertas.push(`⚠️ Este mes llevas un ${exceso}% más en “${cat.nombre}” que tu promedio mensual.`);
      }

      setAlertasComparativas(alertas); // importante: actualizar dentro del ciclo
    });
  }, [transacciones, categorias]);


  useEffect(() => {
    const hoy = new Date();
    const alertas = [];

    // GASTOS MENSUALES
    gastosMensuales.forEach(g => {
      const diaCobro = Number(g.dia_pago);
      const fechaCobro = new Date(hoy.getFullYear(), hoy.getMonth(), diaCobro);
      const diffDias = (fechaCobro - hoy) / (1000 * 60 * 60 * 24);

      if (diffDias >= 0 && diffDias <= 3) {
        alertas.push(`El gasto mensual “${g.nombre}” se cobrará el día ${diaCobro} de este mes.`);
      }
    });

    // GASTOS PROGRAMADOS
    gastosProgramados.forEach(g => {
      const fecha = new Date(g.fecha_transaccion);
      const diffDias = (fecha - hoy) / (1000 * 60 * 60 * 24);

      if (diffDias >= 0 && diffDias <= 3) {
        alertas.push(`El gasto programado “${g.descripcion}” se cobrará el ${fecha.toLocaleDateString("es-CL")}.`);
      }
    });

    setAlertasRecurrentes(alertas);
  }, [gastosMensuales, gastosProgramados]);


  const handleActualizarNombre = () => {
    const nombre = nuevoNombreUsuario.trim();
  
    if (nombre && id_usuario) {
      axios.post(`${API_URL}/actualizar_nombre`, {
        id_usuario: parseInt(id_usuario),
        nombre_usuario: nombre
      })
      .then(() => {
        setNombreUsuario(nombre);
        setMostrarModalNombre(false);
        setNuevoNombreUsuario("");
      })
      .catch(err => {
        console.error("Error al actualizar nombre:", err);
        alert("No se pudo actualizar el nombre.");
      });
    } else {
      alert("Debe ingresar un nombre válido.");
    }
  };  
  

  const transaccionesPorFecha = {};
  transacciones.forEach((t) => {  
    const fecha = new Date(t.fecha);
    const fechaCL = fecha.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    if (!transaccionesPorFecha[fechaCL]) transaccionesPorFecha[fechaCL] = [];
    transaccionesPorFecha[fechaCL].push(t);
  });
  

  const handleSave = () => {
    if (nuevoSalario && id_usuario) {
      const limpio = parseInt(nuevoSalario.replace(/\./g, ""));
      const fechaFinal = fechaSalario || new Date().toISOString().split("T")[0];
  
      axios.post(`${API_URL}/actualizar_salario`, {
        id_usuario: parseInt(id_usuario),
        salario: limpio,
        fecha_salario: fechaFinal
      })
      .then(() => {
        setSalario(limpio);
        setShowModal(false);
        setNuevoSalario("");
        setFechaSalario(""); // limpia la fecha ingresada
      })
      .catch(err => {
        console.error("Error al actualizar salario:", err);
        alert("No se pudo actualizar el salario.");
      });
    }
  };   


  function calcularTotalAcumulado() {
    return movimientosAhorro.reduce((acc, mov) => {
      return acc + (mov.tipo === "agregar" ? mov.monto : -mov.monto);
    }, 0);
  }
  
  
  const handleQuitarAhorro = () => {
  
    if (!id_usuario || !montoAhorro) return;
  
    const montoNumerico = parseInt(montoAhorro.replace(/\./g, ""));
    const totalActual = calcularTotalAcumulado();
  
    if (montoNumerico > totalActual) {
      alert("No puedes quitar más ahorro del que tienes.");
      return;
    }
  
    fetch(`${API_URL}/movimientos_ahorro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_usuario,
        tipo: "quitar",
        monto: montoNumerico,
        fecha: fechaAhorro || new Date().toISOString().split("T")[0],
      }),
    })
    .then((res) => res.json())
    .then((data) => {
      setMovimientosAhorro([...movimientosAhorro, data]);
      setShowQuitarAhorro(false);
      setMontoAhorro("");
      setFechaAhorro("");
    })
    .catch((err) => {
      console.error("Error al quitar ahorro:", err);
      alert("No se pudo descontar el monto.");
    });
  };  


  const handleAgregarAhorro = () => {  
    if (montoAhorro !== "" && id_usuario) {
      const valor = parseInt(montoAhorro.replace(/\./g, ""));
      
      axios.post(`${API_URL}/movimientos_ahorro`, {
        id_usuario: parseInt(id_usuario),
        tipo: "agregar",
        monto: valor,
        fecha: fechaAhorro || new Date().toISOString().split("T")[0]
      })
      .then(() => {
        return fetch(`${API_URL}/movimientos_ahorro?id_usuario=${id_usuario}`);
      })
      .then(res => res.json())
      .then(data => {
        setMovimientosAhorro(data);
        setShowAgregarAhorro(false);
        setMontoAhorro("");
        setFechaAhorro("");
      })
      .catch(err => {
        console.error("Error al agregar ahorro:", err);
        alert("No se pudo agregar el monto.");
      });
    }
  };  

  
  const verificarYDepositarSalario = (transaccionesExistentes) => {
    const salarioGuardado = salario;
  
    if (!id_usuario || salarioGuardado === 0) return;
  
    const ahora = new Date();
    const diaHoy = ahora.getDate(); // 1, 2, 3, ...
    const mesActual = ahora.getMonth() + 1; // Enero = 0
    const anioActual = ahora.getFullYear();
  
    // Solo intentamos depositar si es día 1
    if (diaHoy !== 1) {
      console.log("Hoy no es día de depósito automático (solo el día 1)");
      return;
    }
  
    const salarioYaDepositado = transaccionesExistentes.some(t => {
      const fecha = new Date(t.fecha);
      return (
        t.descripcion === "Depósito de salario" &&
        fecha.getMonth() + 1 === mesActual &&
        fecha.getFullYear() === anioActual
      );
    });
  
    if (!salarioYaDepositado) {
      const nuevoIngreso = {
        id_usuario: parseInt(id_usuario),
        tipo: "ingreso",
        fecha: `${anioActual}-${String(mesActual).padStart(2, "0")}-01`,
        monto: salarioGuardado,
        categoria: "Salario",
        descripcion: "Depósito de salario",
        tipoPago: "transferencia",
        cuotas: 1,
        interes: 0,
        valorCuota: 0,
        totalCredito: 0,
        repetido: false,
        imagen: null,
        nombre_archivo: null
      };
  
      fetch(`${API_URL}/transacciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoIngreso)
      })
      .then(res => res.json())
      .then(() => {
        console.log("Salario depositado automáticamente.");
        // 🚨 AQUÍ HACEMOS ESTO:
        // Volvemos a pedir transacciones actualizadas
        fetch(`${API_URL}/transacciones/${id_usuario}`)
          .then(res => res.json())
          .then(data => {
            setTransacciones(data);
          })
          .catch(error => console.error("Error al refrescar transacciones:", error));
      })
      .catch(error => console.error("Error al depositar salario:", error));
    } else {
      console.log("El salario de este mes ya fue depositado.");
    }
  };  


  const registrarSaldoSobranteSiCorresponde = () => {
    if (!id_usuario || saldoAcumulado.length === 0) return;
  
    const ahora = new Date();
    const esDiaUno = ahora.getDate() === 1;
  
    if (!esDiaUno) return;
  
    const transaccionYaExiste = transacciones.some(t => {
      return t.descripcion === "Saldo restante del mes anterior" &&
             new Date(t.fecha).getMonth() === ahora.getMonth() &&
             new Date(t.fecha).getFullYear() === ahora.getFullYear();
    });
  
    if (!transaccionYaExiste) {
      const montoRestante = saldoAcumulado[saldoAcumulado.length - 1];
  
      if (montoRestante > 0) {
        const nueva = {
          id_usuario: parseInt(id_usuario),
          tipo: "ingreso",
          fecha: ahora.toISOString().split("T")[0],
          monto: montoRestante,
          categoria: "Saldo",
          descripcion: "Saldo restante del mes anterior",
          tipoPago: "automático",
          cuotas: 1,
          interes: 0,
          valorCuota: 0,
          totalCredito: 0,
          repetido: false,
          imagen: null,
          nombre_archivo: null,
          visible: true, // 👈 se muestra
          protegida: true // 👈 clave para frontend (no editable/eliminable)
        };
  
        fetch(`${API_URL}/transacciones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nueva)
        })
        .then(res => res.json())
        .then(() => {
          console.log("Saldo restante del mes anterior registrado.");
          // refrescar transacciones
          fetch(`${API_URL}/transacciones/${id_usuario}`)
            .then(res => res.json())
            .then(setTransacciones);
        })
        .catch(err => console.error("Error al registrar saldo restante:", err));
      }
    }
  };
  

  const maxValor = Math.max(
    ...datosGrafico.map((d) => Math.max(d.ingreso, d.gasto)),
    1000 // Valor mínimo
  );


  if (loading) {
    return <p style={{ padding: "2rem", fontSize: "1.2rem" }}>Cargando datos del usuario...</p>;
  }


  return (
  <div className="page-layout">
    <div className="dashboard-container">
      {/* PESTAÑAS */}
      <div className="tabs">
        <button
          className={pestanaActiva === "resumen" ? "tab active" : "tab"}
          onClick={() => setPestanaActiva("resumen")}
        >
          Resumen General
        </button>
        <button
          className={pestanaActiva === "metas" ? "tab active" : "tab"}
          onClick={() => setPestanaActiva("metas")}
        >
          Mi Meta Próxima
        </button>
        <button
          className={pestanaActiva === "analisis" ? "tab active" : "tab"}
          onClick={() => setPestanaActiva("analisis")}
        >
          Análisis Mensual
        </button>
          <button
            className={pestanaActiva === "alertas" ? "tab active" : "tab"}
            onClick={() => setPestanaActiva("alertas")}
          >
            Comparación
          </button>
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA */}
      <div className="tab-content">

        {pestanaActiva === "resumen" && (
          <div className="dashboard-resumen">
            <h2 className="titulo">Resumen General</h2>

            <div style={{
              backgroundColor: "#fef3c7",
              color: "#92400e",
              padding: "1rem 1.5rem",
              borderRadius: "1rem",
              marginBottom: "1rem",
              fontWeight: "600",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "30%",
            }}>
              <span>Bienvenido, <strong>{nombreUsuario}</strong></span>
              <button className="btn-azul" onClick={() => setMostrarModalNombre(true)}>Cambiar nombre de usuario</button>
            </div>

            <div className="info-row1 info-grid-3">

              {/* SALARIO */}
              <div className="info-box compacta fila-horizontal">
                <div className="texto-horizontal">
                  <span className="label">Salario:</span>
                  <span className="valor">${Number(salario).toLocaleString("es-CL")}</span>
                </div>
                <button className="btn-azul" onClick={() => setShowModal(true)}>Editar</button>
              </div>

              {/* AHORROS */}
              <div className="info-box compacta fila-horizontal">
                <div className="texto-horizontal">
                  <span className="label">Ahorros:</span>
                  <span className="valor">${Number(ahorros).toLocaleString("es-CL")}</span>
                </div>
                <div className="btn-group">
                  <button className="btn-azul" onClick={() => setShowAgregarAhorro(true)}>Añadir</button>
                  <button className="btn-azul" onClick={() => setShowQuitarAhorro(true)}>Descontar</button>
                </div>
              </div>

              <div className="info-box compacta fila-horizontal">
                <div className="texto-horizontal">
                  <span className="label">Saldo restante del mes:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span className="valor">
                      ${saldoAcumulado.length > 0 ? saldoAcumulado[saldoAcumulado.length - 1].toLocaleString("es-CL") : "-"}
                    </span>
                    <span className="badge-saldo" style={{
                      backgroundColor: saldoAcumulado[saldoAcumulado.length - 1] > 0 ? "#d1fae5" : "#fee2e2",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "0.5rem",
                      fontWeight: "600",
                      color: saldoAcumulado[saldoAcumulado.length - 1] > 0 ? "#065f46" : "#991b1b"
                    }}>
                      {saldoAcumulado[saldoAcumulado.length - 1] > 0 ? "Adecuado" : "Alerta"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CONSEJO + ÚLTIMOS MOVIMIENTOS en una fila */}
            <div className="fila-consejo-movimientos">
              {/* CONSEJOS FINANCIEROS */}
              {consejos.length > 0 && (
                <div className="consejo-wrapper">
                  <div className="consejo-central">
                    <h3 className="subtitulo">Consejos financieros</h3>
                    <p className={`consejo-animado ${visible ? "visible" : ""}`}>
                      {consejos[consejoActual]}
                    </p>
                    <div style={{ marginTop: "0.75rem" }}>
                      <button
                        className="btn-azul"
                        onClick={() => {
                          setVisible(false);
                          setTimeout(() => {
                            setConsejoActual((prev) => (prev + 1) % consejos.length);
                            setVisible(true);
                          }, 200);
                        }}>
                        Ver otro consejo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ÚLTIMOS MOVIMIENTOS */}
              <div className="movimientos-recientes info-box">
                <span className="label">Top 3 de gastos :</span>
                <div className="info-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                  {[...transacciones]
                    .filter(t => t.visible !== false && t.tipo === "gasto" && t.tipoPago !== "credito")
                    .sort((a, b) => Number(b.monto) - Number(a.monto))
                    .slice(0, 3)
                    .map((t, index) => (
                      <div key={index} style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <span>{new Date(t.fecha).toLocaleDateString("es-CL")}</span>
                        <span>{t.descripcion}</span>
                        <span style={{ color: "#b91c1c", fontWeight: "bold" }}>
                          ${Number(t.monto).toLocaleString("es-CL")}
                        </span>
                      </div>
                  ))}
                </div>
                <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
                  <button className="btn-azul" onClick={() => navigate("/transacciones")}>
                    Ver más transacciones
                  </button>
                </div>
              </div>

            </div>

            <div className="fila-horizontal">
              {/* ALERTAS FINANCIERAS */}
              <div className="alertas-dashboard">
                <h3 className="subtitulo">Notificaciones</h3>
                {alertasRecurrentes.length === 0 && <p>No hay alertas por ahora</p>}
                {alertasRecurrentes.map((msg, i) => (
                  <div key={i} className="alerta-aviso">{msg}</div>
                ))}
              </div>

              {/* CONTROL DE LÍMITES POR CATEGORÍA */}
              <div className="dashboard-card limites-categorias">
                <h3 className="subtitulo">Control de gastos por categoría (mes actual)</h3>
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
                    {[...categorias]
                      .filter(cat => cat.tipo === "Gasto" || cat.tipo === "Ambos")
                      .sort((a, b) => {
                        const orden = { "General": 0 };
                        const ordenA = orden[a.nombre] ?? 99;
                        const ordenB = orden[b.nombre] ?? 99;
                        return ordenA - ordenB || a.nombre.localeCompare(b.nombre);
                      })
                      .map((cat, i) => {
                        const transaccionesCategoria = transacciones.filter(t =>
                          t.tipo === "gasto" &&
                          t.visible !== false &&
                          t.tipoPago !== "credito" &&
                          Number(t.id_categoria) === Number(cat.id_categoria)
                        );
                        const gastoActual = transaccionesCategoria.reduce((acc, t) => acc + parseFloat(t.monto), 0);
                        const limite = cat.monto_limite || 0;

                        return (
                          <tr key={i}>
                            <td>{cat.nombre}</td>
                            <td>${gastoActual.toLocaleString("es-CL")}</td>
                            <td>{limite !== 0 ? `$${limite.toLocaleString("es-CL")}` : "Sin límite"}</td>
                            <td>
                              {limite !== 0 ? (
                                gastoActual > limite ? (
                                  <span className="estado-sobrepasado">Sobrepasado</span>
                                ) : (
                                  <span className="estado-dentro">Dentro del límite</span>
                                )
                              ) : (
                                <span className="estado-sin-limite">No hay límite</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {mostrarModalNombre && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <h3>Cambiar nombre</h3>
                  <input
                    type="text"
                    placeholder="Nuevo nombre"
                    value={nuevoNombreUsuario}
                    onChange={(e) => setNuevoNombreUsuario(e.target.value)}
                  />
                  <div className="modal-buttons">
                    <button onClick={handleActualizarNombre}>Guardar</button>
                    <button onClick={() => setMostrarModalNombre(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {pestanaActiva === "alertas" && (
          <div className="dashboard-alertas">
            <h2 className="titulo">Comparación</h2>

            {/* Comparador de Categorías entre Meses */}
            <div className="comparador-categorias">
              <h3 className="subtitulo">Comparador de categorías entre meses</h3>

              <div className="selectores-comparacion">
                <label>Mes 1:</label>
                <input type="number" value={mes1} onChange={(e) => setMes1(Number(e.target.value))} min="1" max="12" />
                <input type="number" value={anio1} onChange={(e) => setAnio1(Number(e.target.value))} />

                <label>Mes 2:</label>
                <input type="number" value={mes2} onChange={(e) => setMes2(Number(e.target.value))} min="1" max="12" />
                <input type="number" value={anio2} onChange={(e) => setAnio2(Number(e.target.value))} />
              </div>

              <table className="tabla-comparacion">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>{`Mes ${mes1}/${anio1}`}</th>
                    <th>{`Mes ${mes2}/${anio2}`}</th>
                    <th>Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {comparacion.map((item, i) => {
                    const categoria = categorias.find(c => Number(c.id_categoria) === Number(item.id_categoria));
                    const nombre = categoria ? categoria.nombre : "Sin nombre";

                    const cambio = item.cambio;
                    const porcentaje = item.porcentaje;
                    const flecha = cambio > 0 ? "↑" : (cambio < 0 ? "↓" : "–");
                    const color = cambio > 0 ? "red" : (cambio < 0 ? "green" : "inherit");

                    return (
                      <tr key={i}>
                        <td>{nombre}</td>
                        <td>${item.monto_mes1.toLocaleString("es-CL")}</td>
                        <td>${item.monto_mes2.toLocaleString("es-CL")}</td>
                        <td style={{ color }}>
                          {flecha} {porcentaje !== null ? `${Math.abs(porcentaje).toFixed(1)}%` : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODALES */}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Editar salario</h3>
              <input
                type="text"
                placeholder="Nuevo salario"
                value={nuevoSalario}
                onChange={(e) => {
                  const limpio = e.target.value.replace(/\./g, '');
                  if (!isNaN(limpio)) {
                    const valorFormateado = Number(limpio).toLocaleString("es-CL");
                    setNuevoSalario(valorFormateado);
                  }
                }}
              />
              <label htmlFor="fecha-salario">Fecha desde que se aplica el salario:</label>
              <input
                id="fecha-salario"
                type="date"
                value={fechaSalario}
                onChange={(e) => setFechaSalario(e.target.value)}
              />
              <div className="modal-buttons">
                <button onClick={handleSave}>Guardar</button>
                <button onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {showAgregarAhorro && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Añadir monto al ahorro</h3>
              <input
                type="text"
                placeholder="Monto"
                value={montoAhorro}
                onChange={(e) => {
                  const sinPuntos = e.target.value.replace(/\./g, '');
                  if (!isNaN(sinPuntos)) {
                    const formateado = Number(sinPuntos).toLocaleString("es-CL");
                    setMontoAhorro(formateado);
                  }
                }}
              />
              <label>Fecha:</label>
              <input
                type="date"
                value={fechaAhorro}
                onChange={(e) => setFechaAhorro(e.target.value)}
              />
              <div className="modal-buttons">
                <button onClick={handleAgregarAhorro}>Guardar</button>
                <button onClick={() => {
                  setShowAgregarAhorro(false);
                  setMontoAhorro("");
                  setFechaAhorro("");
                }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {showQuitarAhorro && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Descontar monto del ahorro</h3>
              <input
                type="text"
                placeholder="Monto"
                value={montoAhorro}
                onChange={(e) => {
                  const sinPuntos = e.target.value.replace(/\./g, '');
                  if (!isNaN(sinPuntos)) {
                    const formateado = Number(sinPuntos).toLocaleString("es-CL");
                    setMontoAhorro(formateado);
                  }
                }}
              />
              <label>Fecha:</label>
              <input
                type="date"
                value={fechaAhorro}
                onChange={(e) => setFechaAhorro(e.target.value)}
              />
              <div className="modal-buttons">
                <button onClick={handleQuitarAhorro}>Guardar</button>
                <button onClick={() => {
                  setShowQuitarAhorro(false);
                  setMontoAhorro("");
                  setFechaAhorro("");
                }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {mostrarModalFacturacion && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Cambiar día de facturación</h3>
              <input
                type="number"
                min="1"
                max="31"
                value={nuevoDiaFacturacion}
                onChange={(e) => setNuevoDiaFacturacion(e.target.value)}
              />
              <div className="modal-buttons">
                <button onClick={handleActualizarFacturacion}>Guardar</button>
                <button onClick={() => setMostrarModalFacturacion(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {pestanaActiva === "metas" && metas.length > 0 && (
          <div className="dashboard-metas analisis-mensual-wrapper">
            <h2 className="titulo">Mi Meta de Ahorro</h2>
            {metas.length === 0 && (
              <p style={{ textAlign: "center", marginBottom: "1rem" }}>
                Aún no has creado una meta de ahorro.
              </p>
            )}
            <div className="meta-progreso-box">
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <button className="btn-azul" onClick={() => navigate("/metas-ahorro")}>
                  Ir a mis metas
                </button>
              </div>
              <h3>{metas[0].titulo}</h3>
              <p>
                Meta: ${metas[0].monto_meta.toLocaleString("es-CL")} <br />
                Fecha límite: {metas[0].fecha_limite}
              </p>
              <div className="barra-progreso">
                <div
                  className="barra-llenado"
                  style={{
                    width: `${Math.min((totalAhorros / metas[0].monto_meta) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {pestanaActiva === "analisis" && (
          <div className="analisis-mensual-wrapper">
            <div className="dashboard-analisis">
              <h2 className="titulo">Análisis Mensual</h2>
              <div className="filtros-fecha-analisis" style={{ marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "center", width: "fit-content" }}>
                <label>Mes:</label>
                <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString("es-CL", { month: "long" })}
                    </option>
                  ))}
                </select>

                <label>Año:</label>
                <input
                  type="number"
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                  style={{ width: "80px" }}
                />
              </div>

              {/* Gráfico: Saldo acumulado */}
              <div className="grafico-contenedor">
                <h3 className="subtitulo">Saldo acumulado</h3>
                <div className="grafico-box" style={{ height: "400px" }}>
                  <Line
                    data={{
                      labels: datosGrafico.map((d) => d.fecha),
                      datasets: [
                        {
                          label: "Saldo acumulado",
                          data: saldoAcumulado,
                          borderColor: "#10b981",
                          backgroundColor: "rgba(16, 185, 129, 0.2)",
                          tension: 0.4,
                          segment: {
                            borderColor: ctx => {
                              const { p0, p1 } = ctx;
                              return p1.parsed.y < p0.parsed.y ? "#ef4444" : "#10b981";
                            }
                          },
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top" },
                        title: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const index = context.dataIndex;
                              const fechaLabel = context.label; // "DD-MM"
                              const punto = datosGrafico.find(d => d.fecha === fechaLabel);
                              const detalles = punto?.transacciones || [];
                              const saldo = context.dataset.data[index];

                              const resultado = [`Saldo: $${Number(saldo).toLocaleString("es-CL")}`];

                              if (detalles.length === 0) {
                                resultado.push("Sin movimientos ese día.");
                              } else {
                                detalles.forEach(t => {
                                  const monto = `$${Number(t.monto).toLocaleString("es-CL")}`;
                                  const emoji = t.tipo === "ingreso" ? "🟢" : "🔴";
                                  const signo = t.tipo === "ingreso" ? "+" : "-";

                                  const tipo =
                                    t.esMensual
                                      ? " (mensual)"
                                      : t.esProgramado
                                        ? " (programado)"
                                        : "";

                                  resultado.push(`${emoji} ${t.descripcion}${tipo} ${signo}${monto}`);
                                });
                              }

                              return resultado;
                            }
                          }
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          min: 0,
                          max: Math.max(...saldoAcumulado) + 10000,
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Gráfico: Evolución de Ahorros */}
              <div className="grafico-contenedor">
                <h3 className="subtitulo">Evolución de Ahorros</h3>
                <div className="grafico-box" style={{ height: "300px" }}>
                  <Line
                    data={{
                      labels: datosGrafico.map((d) => d.fecha),
                      datasets: [
                        {
                          label: "Evolución de Ahorros",
                          data: evolucionAhorro,
                          borderColor: "#3b82f6",
                          backgroundColor: "rgba(59, 130, 246, 0.2)",
                          tension: 0.3,
                          pointRadius: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top" },
                        title: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          min: 0,
                          max: Math.max(...evolucionAhorro) + 10000
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  </div>
);
}