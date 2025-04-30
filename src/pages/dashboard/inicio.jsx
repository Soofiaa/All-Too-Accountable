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
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
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
  const [metas, setMetas] = useState([]);
  const [showChatBot, setShowChatBot] = useState(false);
  const [mensajeIA, setMensajeIA] = useState("");
  const [mensajesIA, setMensajesIA] = useState([
    { role: "assistant", content: "Hola 👋 Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [chatMensajes, setChatMensajes] = useState([]);



  useEffect(() => {
    fetch("/consejos.json")
      .then(res => res.json())
      .then(data => setConsejos(data))
      .catch(err => console.error("Error al cargar consejos:", err));
  }, []);  


  useEffect(() => {
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) {
      window.location.href = "/"; // redirige al login si no hay sesión
      return;
    }
  
    const usuario = JSON.parse(usuarioStr);
    const id_usuario = usuario.id;
  
    axios.get(`http://localhost:5000/api/detalles_usuario?id_usuario=${id_usuario}`)
      .then(res => {
        console.log("🔍 Detalles recibidos:", res.data);
        const { salario, ahorros, nombre_usuario, dia_facturacion } = res.data;
        setSalario(salario);
        setAhorros(ahorros);
        setNombreUsuario(nombre_usuario);
        setDiaFacturacion(dia_facturacion);
      })
      .catch(err => console.error("❌ Error cargando detalles:", err));
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
  
    const ahora = new Date();
    const mesActual = ahora.getMonth(); // 0-indexed
    const anioActual = ahora.getFullYear();
  
    const agrupados = {};
  
    transacciones
      .filter(t => t.visible !== false) // Solo visibles
      .forEach((t) => {
        const fecha = new Date(t.fecha);
        let clave;
  
        if (modoGrafico === "mensual") {
          if (fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual) {
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
      const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
  
      for (let dia = 1; dia <= diasEnMes; dia++) {
        const clave = dia.toString().padStart(2, "0") + "-" + (mesActual + 1).toString().padStart(2, "0");
  
        datos.push({
          fecha: clave,
          ingreso: agrupados[clave]?.ingreso || 0,
          gasto: agrupados[clave]?.gasto || 0,
        });
      }
  
      // agregamos el salario el día 1
      if (datos.length > 0) {
        datos[0].ingreso += salario; //  sumamos el salario guardado
      }
    } else {
      datos = Object.entries(agrupados)
        .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
        .map(([fecha, valores]) => ({
          fecha,
          ingreso: valores.ingreso,
          gasto: valores.gasto,
        }));
  
      // agregamos salario al mes si se está en modo anual
      if (datos.length > 0) {
        datos[0].ingreso += salario;
      }
    }
  
    setDatosGrafico(datos);
  }, [transacciones, modoGrafico, salario]);   


  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (id_usuario) {
      fetch(`http://localhost:5000/api/gastos?id_usuario=${id_usuario}`)
        .then(res => res.json())
        .then(data => {
          const gastosFormateados = data.map(gasto => ({
            ...gasto,
            dia_pago: parseInt(gasto.dia_pago)
          }));
          setGastosMensuales(gastosFormateados);
        })
        .catch(error => console.error("Error al cargar gastos mensuales:", error));
    }
  }, []);  


  useEffect(() => {
    if (!datosGrafico.length) return;

    const nuevoSaldoAcumulado = [];
    let saldo = 0;

    datosGrafico.forEach((d) => {
      const [dia, mes] = d.fecha.split("-").map(x => parseInt(x));
      const gastosFijosHoy = gastosMensuales.filter(gasto => parseInt(gasto.dia_pago) === dia);
      const totalGastosFijosHoy = gastosFijosHoy.reduce((acc, gasto) => acc + Number(gasto.monto), 0);
      saldo += (d.ingreso - d.gasto - totalGastosFijosHoy);
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
    let acumulado = 0;
  
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
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) return;

    const usuario = JSON.parse(usuarioStr);
    const id_usuario = usuario.id;

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
      axios.post("http://localhost:5000/api/actualizar_salario", {
        id_usuario: parseInt(id_usuario),
        salario: limpio
      })
      .then(() => {
        setSalario(limpio);
        setShowModal(false);
        setNuevoSalario("");
      })
      .catch(err => {
        console.error("Error al actualizar salario:", err);
        alert("No se pudo actualizar el salario.");
      });
    }
  };  


  const handleAgregarAhorro = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (montoAhorro !== "" && id_usuario) {
      const valor = parseInt(montoAhorro.replace(/\./g, ""));
  
      axios.post("http://localhost:5000/api/movimientos_ahorro", {
        id_usuario: parseInt(id_usuario),
        tipo: "agregar",
        monto: valor,
        fecha: new Date().toISOString().split("T")[0]
      })
      .then(() => {
        // volver a cargar la lista de movimientos para actualizar el gráfico
        return fetch(`http://localhost:5000/api/movimientos_ahorro?id_usuario=${id_usuario}`);
      })
      .then(res => res.json())
      .then(data => {
        setMovimientosAhorro(data);
        setShowAgregarAhorro(false);
        setMontoAhorro("");
      })
      .catch(err => {
        console.error("Error al agregar ahorro:", err);
        alert("No se pudo agregar el monto.");
      });
    }
  };  


  const handleQuitarAhorro = () => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (montoAhorro !== "" && id_usuario) {
      const valor = parseInt(montoAhorro.replace(/\./g, ""));
  
      axios.post("http://localhost:5000/api/movimientos_ahorro", {
        id_usuario: parseInt(id_usuario),
        tipo: "quitar",
        monto: valor,
        fecha: new Date().toISOString().split("T")[0]
      })
      .then(() => {
        return fetch(`http://localhost:5000/api/movimientos_ahorro?id_usuario=${id_usuario}`);
      })
      .then(res => res.json())
      .then(data => {
        setMovimientosAhorro(data);
        setShowQuitarAhorro(false);
        setMontoAhorro("");
      })
      .catch(err => {
        console.error("Error al quitar ahorro:", err);
        alert("No se pudo descontar el monto.");
      });
    }
  };  

  
  const verificarYDepositarSalario = (transaccionesExistentes) => {
    const salarioGuardado = parseFloat(localStorage.getItem("salario")) || 0;
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


  return (
    <div className="page-layout">
    <Header />
    <div className="dashboard-container">
      <main className="dashboard-main">
        <aside className="dashboard-sidebar">


          <div className="dashboard-profile dashboard-card">
            <h3 className="dashboard-nombre">Bienvenido, {nombreUsuario}</h3>
            <button onClick={() => setMostrarModalNombre(true)}>Cambiar nombre</button>
            {mostrarModalNombre && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <h3>Cambiar nombre de usuario</h3>
                  <input
                    type="text"
                    placeholder="Nuevo nombre"
                    value={nuevoNombreUsuario}
                    onChange={(e) => setNuevoNombreUsuario(e.target.value)}
                  />
                  <div className="modal-buttons">
                    <button onClick={handleActualizarNombre}>Aceptar</button>
                    <button onClick={() => {
                      setMostrarModalNombre(false);
                      setNuevoNombreUsuario("");
                    }}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="dashboard-consejo-profesional dashboard-card">
            <div className={`consejo-slide ${animando ? "animando" : ""}`}>
              <p className="texto-consejo">{consejos[consejoActual]}</p>
            </div>
            <div className="controles-consejo">
            <button
              className="consejo-btn"
              onClick={() => {
                setAnimando(true);
                setTimeout(() => {
                  setConsejoActual((prev) => (prev - 1 + consejos.length) % consejos.length);
                  setAnimando(false);
                }, 300);
              }}
            >
              ←
            </button>
            <button
              className="consejo-btn"
              onClick={() => {
                setAnimando(true);
                setTimeout(() => {
                  setConsejoActual((prev) => (prev + 1) % consejos.length);
                  setAnimando(false);
                }, 300);
              }}
            >
              →
            </button>
            </div>
          </div>


          <div style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          padding: "1.5rem",
          marginBottom: "1rem",
          textAlign: "center"
        }}>
          <h3 style={{ color: "#1e40af", marginBottom: "0.5rem" }}>Balance del mes</h3>
          <div className="dashboard-box" style={{ fontSize: "1.2rem", display: "inline-block" }}>
            ${Number(balanceReal || 0).toLocaleString("es-CL")}
          </div>
        </div>

          <div className="dashboard-dia-facturacion dashboard-card">
            <h3>Día de facturación</h3>
            <div className="dashboard-box">Día {diaFacturacion}</div>
            <button className="center-button" onClick={() => setMostrarModalFacturacion(true)}>
              Editar día
            </button>
          </div>

          <div className="dashboard-ahorros">
            <h3>Ahorros</h3>
            <div className="dashboard-box">
              ${Number(totalAhorros || 0).toLocaleString("es-CL", { minimumFractionDigits: 0 })}
            </div>
            <div className="dashboard-ahorro-btns">
              <button className="center-button" onClick={() => setShowAgregarAhorro(true)}>Añadir monto</button>
              <button className="center-button" onClick={() => setShowQuitarAhorro(true)}>Descontar monto</button>
            </div>
          </div>

          <button className="chatbot-fab" onClick={() => setShowChatBot(!showChatBot)}>
            🤖
          </button>


        </aside>
        

        <div className="dashboard-grafico">

        <div className="dashboard-salario-banner">
          <div className="salario-banner-contenido">
            <span className="salario-label">Salario:</span>
            <span className="salario-cifra">${Number(salario).toLocaleString("es-CL", { minimumFractionDigits: 0 })}</span>
            <button className="editar-salario" onClick={() => setShowModal(true)}>Editar</button>
          </div>
        </div>

          <div style={{ overflowX: "auto", width: "100%" }}>
            <div style={{ minWidth: "1200px", height: "400px" }}>
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
                          if (p1.parsed.y < p0.parsed.y) {
                            return "#ef4444"; // 🔴 Rojo si baja
                          } else {
                            return "#10b981"; // 🟢 Verde si sube o se mantiene
                          }
                        }
                      },
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                    },
                    tooltip: {
                      backgroundColor: function(context) {
                        const index = context.tooltip.dataPoints[0].dataIndex;
                        const saldo = context.tooltip.dataPoints[0].parsed.y;
                        if (index === 0) return "#10b981"; // El primer día siempre verde
                        const saldoAnterior = context.tooltip.dataPoints[0].dataset.data[index - 1];
                
                        return saldo >= saldoAnterior ? "#10b981" : "#ef4444";
                      },
                      borderColor: function(context) {
                        const index = context.tooltip.dataPoints[0].dataIndex;
                        const saldo = context.tooltip.dataPoints[0].parsed.y;
                        if (index === 0) return "#10b981";
                        const saldoAnterior = context.tooltip.dataPoints[0].dataset.data[index - 1];
                
                        return saldo >= saldoAnterior ? "#10b981" : "#ef4444";
                      },
                      callbacks: {
                        label: function(context) {
                          const index = context.dataIndex;
                          const saldo = context.dataset.data[index];
                          const fechaLabel = datosGrafico[index]?.fecha;
                        
                          let detalles = [];
                        
                          // Buscar transacciones normales del día
                          const transaccionesDelDia = transacciones.filter(t => {
                            const fechaT = new Date(t.fecha);
                            const dia = fechaT.getDate().toString().padStart(2, "0");
                            const mes = (fechaT.getMonth() + 1).toString().padStart(2, "0");
                            const formato = `${dia}-${mes}`;
                            return formato === fechaLabel;
                          });
                        
                          transaccionesDelDia.forEach(t => {
                            if (t.tipo === "ingreso") {
                              detalles.push(`+$${Number(t.monto).toLocaleString("es-CL")} → (${t.descripcion})`);
                            } else if (t.tipo === "gasto") {
                              detalles.push(`-$${Number(t.monto).toLocaleString("es-CL")} → (${t.descripcion})`);
                            }
                          });
                        
                          // Buscar gastos mensuales del día
                          const diaActual = parseInt(fechaLabel.split("-")[0]);
                          const gastosFijosHoy = gastosMensuales.filter(g => parseInt(g.dia_pago) === diaActual);
                        
                          gastosFijosHoy.forEach(gm => {
                            detalles.push(`-$${Number(gm.monto).toLocaleString("es-CL")} → (${gm.nombre})`);
                          });
                        
                          // Retornar saldo y luego todos los detalles encontrados
                          return [`Saldo: $${Number(saldo).toLocaleString("es-CL")}`, ...detalles];
                        }                                                                  
                      }                      
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        autoSkip: false,
                      },
                    },
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}                              
              />
            </div>
          </div>

          <div style={{ width: "100%", padding: "30px 0", backgroundColor: "white" }}>
            <div style={{ width: "90%", margin: "0 auto", maxWidth: "1200px", height: "300px" }}>
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
                    title: { display: true, text: "Historial de Ahorros" },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      min: 0,
                      max: Math.max(100000, ...evolucionAhorro)
                    },
                  },                                    
                }}
              />
            </div>
          </div>

          {metas.length > 0 && (
            <div className="dashboard-card" style={{ marginTop: "2rem" }}>
              <h3 style={{ color: "#1e40af", marginBottom: "1rem" }}>Progreso de tus metas</h3>
              {metas.map((meta) => {
                const porcentaje = Math.min((totalAhorros / meta.monto_meta) * 100, 100);
                const faltante = meta.monto_meta - totalAhorros;

                return (
                  <div key={meta.id_meta} style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{meta.titulo}</h4>
                    <p style={{ fontSize: "0.9rem", margin: 0 }}>
                      Necesitas: ${meta.monto_meta.toLocaleString("es-CL")} &nbsp;|&nbsp;
                      Llevas: ${Math.min(totalAhorros, meta.monto_meta).toLocaleString("es-CL")} &nbsp;|&nbsp;
                      Faltan: ${Math.max(faltante, 0).toLocaleString("es-CL")}
                    </p>
                    <div style={{
                      backgroundColor: "#e5e7eb",
                      borderRadius: "1rem",
                      overflow: "hidden",
                      marginTop: "0.5rem",
                      height: "12px"
                    }}>
                      <div style={{
                        width: `${porcentaje}%`,
                        backgroundColor: "#2563eb",
                        height: "100%",
                        transition: "width 0.3s ease"
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </main>  

      <Footer />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Editar salario</h3>
            <div className="modal-input-container">
              <span>$</span>
              <input
                type="text"
                placeholder="Ingrese el salario"
                value={nuevoSalario}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // solo números
                  const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                  setNuevoSalario(formatted);
                }}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleSave}>Aceptar</button>
              <button onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {(showAgregarAhorro || showQuitarAhorro) && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{showAgregarAhorro ? "Agregar monto en ahorros" : "Eliminar monto en ahorros"}</h3>
            <div className="modal-input-container">
            <input
              type="text"
              placeholder={showAgregarAhorro ? "Escriba el monto a agregar" : "Escriba el monto a disminuir"}
              value={montoAhorro}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // solo números
                const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                setMontoAhorro(formatted);
              }}
            />
            </div>
            <div className="modal-buttons">
              <button onClick={showAgregarAhorro ? handleAgregarAhorro : handleQuitarAhorro}>Aceptar</button>
              <button onClick={() => {
                setShowAgregarAhorro(false);
                setShowQuitarAhorro(false);
                setMontoAhorro("");
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>

    {showChatBot && (
      <div className="chatbot-burbuja">
        <div className="chat-header">🤖 FinAI – Tu asistente de finanzas</div>
        <div className="chat-mensajes">
          {mensajesIA.map((msg, index) => (
            <div
              key={index}
              className={msg.role === "user" ? "msg-user" : "msg-ia"}
            >
              {msg.content}
            </div>
          ))}
        </div>
        <div className="chat-footer">
          <textarea
            rows="2"
            placeholder="Escribe tu pregunta..."
            value={mensajeIA}
            onChange={(e) => setMensajeIA(e.target.value)}
          ></textarea>
          <button onClick={async () => {
            const nuevoMensaje = { role: "user", content: mensajeIA };
            const nuevosMensajes = [...mensajesIA, nuevoMensaje];
            setMensajesIA(nuevosMensajes);
            setMensajeIA("");
            setCargandoIA(true);

            const resumen = `
              Saldo: $${Number(balanceReal).toLocaleString("es-CL")}, 
              Ahorros: $${Number(totalAhorros).toLocaleString("es-CL")}, 
              Día de facturación: ${diaFacturacion}, 
              Metas: ${metas.map(m => `${m.titulo} ($${m.monto_meta})`).join(", ")},
              Últimas transacciones: ${transacciones.slice(-5).map(t => `${t.tipo} por $${t.monto} (${t.descripcion})`).join("; ")}.
            `;

            try {
              const res = await fetch("http://localhost:5000/api/chat_ia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contexto: resumen,
                  historial: nuevosMensajes
                })
              });
              const data = await res.json();
              const respuesta = {
                role: "assistant",
                content: data.respuesta || "Lo siento, no entendí la pregunta."
              };
              setMensajesIA([...nuevosMensajes, respuesta]);
            } catch (err) {
              setMensajesIA([...nuevosMensajes, { role: "assistant", content: "Error al contactar a la IA." }]);
            }
            setCargandoIA(false);
          }}>
            Enviar
          </button>
        </div>
      </div>
    )}

    {mostrarModalFacturacion && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3>Editar día de facturación</h3>
      <input
        type="number"
        min="1"
        max="31"
        value={nuevoDiaFacturacion}
        onChange={(e) => setNuevoDiaFacturacion(e.target.value)}
      />
      <div className="modal-buttons">
        <button onClick={handleActualizarFacturacion}>Aceptar</button>
        <button onClick={() => setMostrarModalFacturacion(false)}>Cancelar</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}