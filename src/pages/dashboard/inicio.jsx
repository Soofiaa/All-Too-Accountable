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
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 

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
  const [modoGrafico, setModoGrafico] = useState("mensual"); // "mensual" o "anual"
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [saldoAcumulado, setSaldoAcumulado] = useState([]);
  const [gastosMensuales, setGastosMensuales] = useState([]);
  const [movimientosAhorro, setMovimientosAhorro] = useState([]);
  const [evolucionAhorro, setEvolucionAhorro] = useState([]);
  const balanceReal = saldoAcumulado.length > 0 ? saldoAcumulado[saldoAcumulado.length - 1] : 0;
  const [consejos, setConsejos] = useState([]);
  const [animando, setAnimando] = useState(false);
  const [consejoActual, setConsejoActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metas, setMetas] = useState([]);
  const [fechaAhorro, setFechaAhorro] = useState("");
  const [showChatBot, setShowChatBot] = useState(false);
  const [mensajeIA, setMensajeIA] = useState("");
  const [mensajesIA, setMensajesIA] = useState([
    { role: "assistant", content: "Hola 👋 Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [chatMensajes, setChatMensajes] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1); // de 1 a 12
  const [anioSeleccionado, setAnioSeleccionado] = useState(fechaActual.getFullYear());
  const mesActual = mesSeleccionado - 1;
  const anioActual = anioSeleccionado;
  const [fechaSalario, setFechaSalario] = useState(""); // nueva fecha asociada al salario
  const [pestanaActiva, setPestanaActiva] = useState("resumen");
  const idUsuario = localStorage.getItem("idUsuario");
  

  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (!id_usuario) return;
  
    fetch(`http://localhost:5000/api/usuarios/${id_usuario}`)
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
    const id_usuario = localStorage.getItem("id_usuario");
    if (id_usuario) {
      fetch(`http://localhost:5000/api/detalles_usuario?id_usuario=${id_usuario}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Detalles usuario:", data);
          if (data.salario !== undefined) setSalario(data.salario);
          if (data.dia_facturacion !== undefined) setDiaFacturacion(data.dia_facturacion);
          setLoading(false);
        })        
        .catch((error) => {
          console.error("Error al obtener detalles usuario:", error);
          setLoading(false); // ← también aquí
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
    const idUsuario = localStorage.getItem("id_usuario");
  
    console.log("🧠 Cargando dashboard con id_usuario:", idUsuario);
  
    if (!idUsuario || idUsuario === "null" || idUsuario === "undefined") {
      navigate("/");  // solo redirige si está mal
    }
  }, []);     


  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (!id_usuario) {
      console.error("ID de usuario no encontrado en localStorage");
      return;
    }
  
    fetch(`http://localhost:5000/api/transacciones/${id_usuario}`)
      .then(res => res.json())
      .then(data => {
        setTransacciones(data);
        verificarYDepositarSalario(data);
        registrarSaldoSobranteSiCorresponde();
      })
      .catch(error => console.error("Error al cargar transacciones:", error));
  }, []);


  useEffect(() => {
    if (!transacciones.length) return;
  
    const agrupados = {};
  
    transacciones
      .filter(t => t.visible !== false) // Solo visibles
      .forEach((t) => {
        const fecha = new Date(t.fecha);
        let clave;
  
        if (modoGrafico === "mensual") {
          if (
            fecha.getMonth() + 1 === mesSeleccionado &&
            fecha.getFullYear() === anioSeleccionado
          ) {
            clave = fecha.getDate().toString().padStart(2, "0") + "-" + (fecha.getMonth() + 1).toString().padStart(2, "0");
          }
        } else {
          clave = (fecha.getMonth() + 1).toString().padStart(2, "0") + "-" + fecha.getFullYear();
        }
  
        if (clave) {
          if (!agrupados[clave]) {
            agrupados[clave] = { ingreso: 0, gasto: 0 };
          }
  
          if (t.tipo === "ingreso") {
            agrupados[clave].ingreso += parseFloat(t.monto);
          } else {
            // ❌ Excluir gastos a crédito en cuotas del gráfico
            if (!(t.tipoPago === "credito" && parseInt(t.cuotas) > 1)) {
              agrupados[clave].gasto += parseFloat(t.monto);
            }
          }
        }
      });
  
    let datos = [];
  
    if (modoGrafico === "mensual") {
      const diasEnMes = new Date(anioSeleccionado, mesSeleccionado, 0).getDate();
  
      for (let dia = 1; dia <= diasEnMes; dia++) {
        const clave = dia.toString().padStart(2, "0") + "-" + mesSeleccionado.toString().padStart(2, "0");
  
        datos.push({
          fecha: clave,
          ingreso: agrupados[clave]?.ingreso || 0,
          gasto: agrupados[clave]?.gasto || 0,
        });
      }
  
      // Agregamos el salario el día 1
      if (datos.length > 0) {
        datos[0].ingreso += salario;
      }
    } else {
      datos = Object.entries(agrupados)
        .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
        .map(([fecha, valores]) => ({
          fecha,
          ingreso: valores.ingreso,
          gasto: valores.gasto,
        }));
  
      if (datos.length > 0) {
        datos[0].ingreso += salario;
      }
    }
  
    setDatosGrafico(datos);
  }, [transacciones, modoGrafico, salario, mesSeleccionado, anioSeleccionado]);     


  useEffect(() => {
    if (!datosGrafico.length) return;

    const nuevoSaldoAcumulado = [];
    let saldo = 0;

    datosGrafico.forEach((d) => {
      const [dia, mes] = d.fecha.split("-").map(x => parseInt(x));
      const gastosFijosHoy = gastosMensuales.filter(gasto => parseInt(gasto.dia_pago) === dia);
      saldo += (d.ingreso - d.gasto);  // solo considera las transacciones
      nuevoSaldoAcumulado.push(saldo);
    });

    setSaldoAcumulado(nuevoSaldoAcumulado);
  }, [datosGrafico, gastosMensuales]);


  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (!id_usuario) return;
  
    fetch(`http://localhost:5000/api/movimientos_ahorro?id_usuario=${id_usuario}`)
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
    const id_usuario = localStorage.getItem("id_usuario");
    if (!id_usuario) return;
  
    fetch(`http://localhost:5000/api/metas/${id_usuario}`)
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
  

  const handleActualizarNombre = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    const nombre = nuevoNombreUsuario.trim();
  
    if (nombre && id_usuario) {
      axios.post("http://localhost:5000/api/actualizar_nombre", {
        id_usuario: parseInt(id_usuario),
        nombre_usuario: nombre
      })
      .then(() => {
        setNombreUsuario(nombre);
        setMostrarModalNombre(false);
        setNuevoNombreUsuario("");
      })
      .catch(err => {
        console.error("❌ Error al actualizar nombre:", err);
        alert("No se pudo actualizar el nombre.");
      });
    } else {
      alert("Debe ingresar un nombre válido.");
    }
  };  
  

  const transaccionesPorFecha = {};
  transacciones.forEach((t) => {
    const fecha = new Date(t.fecha).toLocaleDateString("es-CL");
    if (!transaccionesPorFecha[fecha]) transaccionesPorFecha[fecha] = [];
    transaccionesPorFecha[fecha].push(t);
  });


  const handleActualizarFacturacion = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (nuevoDiaFacturacion && id_usuario) {
      axios.post("http://localhost:5000/api/actualizar_facturacion", {
        id_usuario: parseInt(id_usuario),
        dia_facturacion: parseInt(nuevoDiaFacturacion)
      })
      .then(() => {
        setDiaFacturacion(parseInt(nuevoDiaFacturacion));
        setMostrarModalFacturacion(false);
      })
      .catch(err => {
        console.error("Error al actualizar día de facturación:", err);
        alert("No se pudo actualizar el día.");
      });
    }
  };
  

  const handleSave = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (nuevoSalario && id_usuario) {
      const limpio = parseInt(nuevoSalario.replace(/\./g, ""));
      const fechaFinal = fechaSalario || new Date().toISOString().split("T")[0];
  
      axios.post("http://localhost:5000/api/actualizar_salario", {
        id_usuario: parseInt(id_usuario),
        salario: limpio,
        fecha: fechaFinal
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
    const id_usuario = localStorage.getItem("id_usuario");
  
    if (!id_usuario || !montoAhorro) return;
  
    const montoNumerico = parseInt(montoAhorro.replace(/\./g, ""));
    const totalActual = calcularTotalAcumulado();
  
    if (montoNumerico > totalActual) {
      alert("No puedes quitar más ahorro del que tienes.");
      return;
    }
  
    fetch("http://localhost:5000/api/movimientos_ahorro", {
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
    const id_usuario = localStorage.getItem("id_usuario");
  
    if (montoAhorro !== "" && id_usuario) {
      const valor = parseInt(montoAhorro.replace(/\./g, ""));
      
      axios.post("http://localhost:5000/api/movimientos_ahorro", {
        id_usuario: parseInt(id_usuario),
        tipo: "agregar",
        monto: valor,
        fecha: fechaAhorro || new Date().toISOString().split("T")[0]
      })
      .then(() => {
        return fetch(`http://localhost:5000/api/movimientos_ahorro?id_usuario=${id_usuario}`);
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
    const id_usuario = localStorage.getItem("id_usuario");
  
    if (!id_usuario || salarioGuardado === 0) return;
  
    const ahora = new Date();
    const diaHoy = ahora.getDate(); // 1, 2, 3, ...
    const mesActual = ahora.getMonth() + 1; // Enero = 0
    const anioActual = ahora.getFullYear();
  
    // Solo intentamos depositar si es día 1
    if (diaHoy !== 1) {
      console.log("⏳ Hoy no es día de depósito automático (solo el día 1)");
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
  
      fetch("http://localhost:5000/api/transacciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoIngreso)
      })
      .then(res => res.json())
      .then(() => {
        console.log("💸 Salario depositado automáticamente.");
        // 🚨 AQUÍ HACEMOS ESTO:
        // Volvemos a pedir transacciones actualizadas
        fetch(`http://localhost:5000/api/transacciones/${id_usuario}`)
          .then(res => res.json())
          .then(data => {
            setTransacciones(data);
          })
          .catch(error => console.error("Error al refrescar transacciones:", error));
      })
      .catch(error => console.error("Error al depositar salario:", error));
    } else {
      console.log("✅ El salario de este mes ya fue depositado.");
    }
  };  


  const registrarSaldoSobranteSiCorresponde = () => {
    const id_usuario = localStorage.getItem("id_usuario");
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
  
        fetch("http://localhost:5000/api/transacciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nueva)
        })
        .then(res => res.json())
        .then(() => {
          console.log("✅ Saldo restante del mes anterior registrado.");
          // refrescar transacciones
          fetch(`http://localhost:5000/api/transacciones/${id_usuario}`)
            .then(res => res.json())
            .then(setTransacciones);
        })
        .catch(err => console.error("❌ Error al registrar saldo restante:", err));
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
    <Header />

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
          Mis Metas
        </button>
        <button
          className={pestanaActiva === "analisis" ? "tab active" : "tab"}
          onClick={() => setPestanaActiva("analisis")}
        >
          Análisis Mensual
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
              <span>👋 Bienvenida, <strong>{nombreUsuario}</strong></span>
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

              {/* FACTURACIÓN */}
              <div className="info-box compacta fila-horizontal">
                <div className="texto-horizontal">
                  <span className="label">Día de facturación:</span>
                  <span className="valor">{diaFacturacion}</span>
                </div>
                <button className="btn-azul" onClick={() => setMostrarModalFacturacion(true)}>Editar</button>
              </div>

            </div>

              {/* SALDO RESTANTE */}
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

              {/* ÚLTIMAS TRANSACCIONES */}
              <div className="info-box">
                <span className="label">Últimos movimientos:</span>
                <div className="info-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                  {transacciones
                    .filter(t => t.visible !== false)
                    .slice(-3)
                    .reverse()
                    .map((t, index) => (
                      <div key={index} style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <span>{new Date(t.fecha).toLocaleDateString("es-CL")}</span>
                        <span>{t.descripcion}</span>
                        <span style={{ color: t.tipo === "gasto" ? "#b91c1c" : "#15803d" }}>
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
              <label>Fecha desde que se aplica el salario:</label>
              <input
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
          <div className="dashboard-metas">
            <h2 className="titulo">Mi Meta de Ahorro</h2>
            <div className="meta-progreso-box">
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
                <div className="grafico-box">
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
                              const fechaLabel = context.label;
                              const fechaParts = fechaLabel.split("-");
                              const fechaJS = new Date(`${anioSeleccionado}-${fechaParts[1]}-${fechaParts[0]}`);
                              const fechaCL = fechaJS.toLocaleDateString("es-CL");

                              const saldo = context.dataset.data[index];
                              const detalles = transaccionesPorFecha[fechaCL] || [];

                              const resultado = [`Saldo: $${Number(saldo).toLocaleString("es-CL")}`];

                              if (detalles.length > 0) {
                                detalles.forEach(t => {
                                  const monto = `$${Number(t.monto).toLocaleString("es-CL")}`;
                                  if (t.tipo === "ingreso") {
                                    resultado.push(`🟢 ${t.descripcion} +${monto}`);
                                  } else {
                                    resultado.push(`🔴 ${t.descripcion} -${monto}`);
                                  }
                                });
                              }

                              return resultado;
                            }
                          }
                        },
                      },
                      scales: {
                        y: { beginAtZero: true },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Gráfico: Evolución de Ahorros */}
              <div className="grafico-contenedor">
                <h3 className="subtitulo">Evolución de Ahorros</h3>
                <div className="grafico-box">
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
                          max: Math.max(100000, ...evolucionAhorro),
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



    <Footer />
  </div>
);
}