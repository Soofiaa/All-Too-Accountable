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

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
          <label>Mes:</label>
          <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("es-CL", { month: "long" })}
              </option>
            ))}
          </select>

          <label>Año:</label>
          <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => {
              const año = fechaActual.getFullYear() - 2 + i;
              return <option key={año} value={año}>{año}</option>;
            })}
          </select>
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
        

          {/* Modal: Cambiar día de facturación */}
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

          {/* Modal: Añadir ahorro */}
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
                      const formateado = Number(sinPuntos).toLocaleString("es-CL", { useGrouping: true });
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

          {/* Modal: Quitar ahorro */}
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
                      const formateado = Number(sinPuntos).toLocaleString("es-CL", { useGrouping: true });
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

          {/* Modal: Editar salario */}
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
                  <button onClick={() => {
                    setShowModal(false);
                    setNuevoSalario("");
                    setFechaSalario("");
                  }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}


        </div>

      </main>
        <Footer />
      </div>
    </div>
  );
}