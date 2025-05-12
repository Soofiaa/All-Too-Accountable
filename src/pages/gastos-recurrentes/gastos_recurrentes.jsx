import React, { useState, useEffect } from "react";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import "./gastos_recurrentes.css";


const PagosRecurrentes = () => {
  const idUsuario = localStorage.getItem("id_usuario");
  if (!idUsuario) {
    alert("No se encontró el ID del usuario. Por favor, inicia sesión.");
    return null;
  }


  const hoy = new Date();
  const [mesFiltrado, setMesFiltrado] = useState(String(hoy.getMonth() + 1));
  const [anioFiltrado, setAnioFiltrado] = useState(String(hoy.getFullYear()));
  const [alertas, setAlertas] = useState([]);
  const [gastosMensuales, setgastosMensuales] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [tipoNuevoPago, setTipoNuevoPago] = useState("mensual");
  const [nuevoPago, setNuevoPago] = useState({
    descripcion: "",
    monto: "",
    dia_pago: "",
    fecha_emision: "",
    dias_cheque: "",
    tipo_pago: "debito"
  });


  useEffect(() => {
  const obtenerPagos = async () => {
    try {
      const resMensuales = await fetch(`http://localhost:5000/api/gastos_mensuales?id_usuario=${idUsuario}`);
      const mensuales = await resMensuales.json();
      const resProgramados = await fetch(`http://localhost:5000/api/pagos_programados/${idUsuario}`);
      const programados = await resProgramados.json();

      console.log("📦 Datos recibidos:", programados);

      const pagosMensuales = mensuales.map(p => ({
        id: p.id_gasto,
        descripcion: p.descripcion
          ? `${p.nombre} – ${p.descripcion}`
          : p.nombre,
        monto: p.monto,
        dia_pago: p.dia_pago,
        fecha: `Día ${p.dia_pago} de cada mes`,
        tipo: "Mensual"
      }));

      const pagosProgramados = programados.map(p => {
        const [anio, mes, dia] = p.fecha_emision.split("-");
        const fechaEmisionObj = new Date(Number(anio), Number(mes) - 1, Number(dia));
        const fechaCobro = new Date(
          fechaEmisionObj.getFullYear(),
          fechaEmisionObj.getMonth(),
          fechaEmisionObj.getDate() + (p.dias_cheque || 0)
        );

        return {
          id: p.id_gasto_programado,
          descripcion: p.descripcion,
          monto: p.monto,
          fecha_emision: p.fecha_emision,
          fecha: p.tipo_pago === "cheque"
            ? `Emisión: ${fechaEmisionObj.toLocaleDateString("es-CL")} | Cobro: ${fechaCobro.toLocaleDateString("es-CL")}`
            : fechaEmisionObj.toLocaleDateString("es-CL"),
          tipo_pago: p.tipo_pago,
          dias_cheque: p.dias_cheque,
          tipo: "Programado"
        };
      });

      const pagosOrdenados = [...pagosProgramados, ...pagosMensuales];

      pagosOrdenados.sort((a, b) => {
        if (a.tipo !== b.tipo) {
          return a.tipo === "Programado" ? -1 : 1; // Programados primero
        }

        // Si ambos son del mismo tipo, ordenar por fecha
        const fechaA = a.tipo === "Programado"
          ? new Date(a.fecha_emision)
          : new Date(new Date().setDate(a.dia_pago || 1)); // Día del mes actual

        const fechaB = b.tipo === "Programado"
          ? new Date(b.fecha_emision)
          : new Date(new Date().setDate(b.dia_pago || 1));

        return fechaA - fechaB;
      });

      setPagos(pagosOrdenados);

      // Calcular alertas: pagos programados con fecha próxima
      const hoy = new Date();
      const tresDiasDespues = new Date();
      tresDiasDespues.setDate(hoy.getDate() + 3);

      const alertasDetectadas = pagosProgramados.filter(p => {
        const fecha = new Date(p.fecha_emision);
        return fecha >= hoy && fecha <= tresDiasDespues;
      });

      setAlertas(alertasDetectadas);

    } catch (error) {
      console.error("Error al obtener pagos:", error);
    }
  };

  obtenerPagos();
}, [idUsuario]);


  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (!id_usuario) return;

    fetch(`http://localhost:5000/api/pagos_programados/${id_usuario}`)
      .then(res => res.json())
      .then(data => {
        const hoy = new Date();
        const mesF = parseInt(mesFiltrado);
        const anioF = parseInt(anioFiltrado);

        const gastosFiltrados = data
          .filter(gasto => {
            const fecha = new Date(gasto.fecha_emision);
            return (
              gasto.activo &&
              fecha.getFullYear() === anioF &&
              fecha.getMonth() + 1 === mesF
            );
          })
          .map(gasto => ({
            id_transaccion: `gp-${gasto.id_gasto_programado}`,
            fecha: gasto.fecha_emision,
            monto: gasto.monto,
            categoria: "Gasto programado",
            descripcion: gasto.descripcion,
            tipo: "gasto",
            tipoPago: gasto.tipo_pago,
            visible: true,
            imagen: null,
            esProgramado: true
          }));

        setgastosMensuales(prev => [...prev, ...gastosFiltrados]); // usamos el mismo estado para que se integren
      })
      .catch(err => {
        console.error("Error al cargar gastos programados:", err);
      });
  }, [mesFiltrado, anioFiltrado]);


  const handleGuardarNuevoPago = async () => {
    if (!nuevoPago.descripcion || !nuevoPago.monto) {
      alert("Debes completar los campos obligatorios.");
      return;
    }

    try {
      if (modoEdicion) {
        if (tipoNuevoPago === "mensual") {
          await fetch(`http://localhost:5000/api/gastos_mensuales/${idEditando}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: nuevoPago.descripcion,
              descripcion: "",
              monto: parseFloat(nuevoPago.monto),
              dia_pago: parseInt(nuevoPago.dia_pago),
              id_usuario: idUsuario
            })
          });
        } else {
          await fetch(`http://localhost:5000/api/pagos_programados/${idEditando}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descripcion: nuevoPago.descripcion,
              monto: parseFloat(nuevoPago.monto),
              fecha_emision: nuevoPago.fecha_emision,
              tipo_pago: nuevoPago.tipo_pago,
              dias_cheque: nuevoPago.tipo_pago === "cheque" ? parseInt(nuevoPago.dias_cheque) : null
            })
          });
        }
      } else {
        if (tipoNuevoPago === "mensual") {
          await fetch("http://localhost:5000/api/gastos_mensuales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: nuevoPago.descripcion,
              descripcion: "",
              monto: parseFloat(nuevoPago.monto),
              dia_pago: parseInt(nuevoPago.dia_pago),
              id_usuario: idUsuario
            })
          });
        } else {
          await fetch("http://localhost:5000/api/pagos_programados", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descripcion: nuevoPago.descripcion,
              monto: parseFloat(nuevoPago.monto),
              fecha_emision: nuevoPago.fecha_emision,
              tipo_pago: nuevoPago.tipo_pago,
              dias_cheque: nuevoPago.tipo_pago === "cheque" ? parseInt(nuevoPago.dias_cheque) : null,
              id_usuario: idUsuario
            })
          });
        }
      }

      setMostrarModal(false);
      setModoEdicion(false);
      setIdEditando(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar");
    }
  };


  const handleEliminar = async (pago) => {
    if (!window.confirm("¿Seguro que deseas eliminar este pago?")) return;

    try {
      let url = "";
      if (pago.tipo === "Mensual") {
        url = `http://localhost:5000/api/gastos_mensuales/${pago.id}?id_usuario=${idUsuario}`;
      } else {
        url = `http://localhost:5000/api/pagos_programados/${pago.id}`;
      }

      await fetch(url, { method: "DELETE" });
      alert("Pago eliminado correctamente");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al eliminar");
    }
  };


  return (
    <div className="page-layout">
      <Header />
      <div className="categorias-container">
        <div className="contenido">
          <h2 className="titulo-categorias">Gestión de Pagos Recurrentes</h2>
          {alertas.length > 0 && (
            <div className="alerta-vencimiento">
              <strong>⚠️ Tienes {alertas.length} pago(s) programado(s) por vencer en los próximos días:</strong>
              <ul>
                {alertas.map((a, idx) => (
                  <li key={idx}>{a.descripcion} → vence el {new Date(a.fecha_emision).toLocaleDateString("es-CL")}</li>
                ))}
              </ul>
            </div>
          )}
          <button className="btn-agregar" onClick={() => {
            setMostrarModal(true);
            setModoEdicion(false);
            setNuevoPago({
              descripcion: "",
              monto: "",
              dia_pago: "",
              fecha_emision: "",
              dias_cheque: "1",
              tipo_pago: "debito"
            });
          }}>
            Agregar nuevo pago
          </button>

          <table className="tabla-categorias">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago) => (
                <tr key={pago.id}>
                  <td>{pago.descripcion}</td>
                  <td>${Number(pago.monto).toLocaleString("es-CL")}</td>
                  <td>{pago.fecha}</td>
                  <td>{pago.tipo}</td>
                  <td className="acciones">
                    <button
                      className="btn-editar"
                      onClick={() => {
                        const fechaFormateada = new Date(pago.fecha_emision).toISOString().split("T")[0];

                        setMostrarModal(true);
                        setModoEdicion(true);
                        setIdEditando(pago.id);
                        setTipoNuevoPago(pago.tipo.toLowerCase());
                        setNuevoPago({
                          descripcion: pago.descripcion,
                          monto: pago.monto,
                          dia_pago: pago.dia_pago || "",
                          fecha_emision: fechaFormateada,
                          tipo_pago: pago.tipo_pago || "debito",
                          dias_cheque: pago.dias_cheque || ""
                        });
                      }}
                    >Editar</button>
                    <button className="btn-eliminar" onClick={() => handleEliminar(pago)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {mostrarModal && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h3 className="modal-titulo">{modoEdicion ? "Editar pago" : "Agregar nuevo pago"}</h3>

                <label>
                  Tipo de gasto:
                  <select value={tipoNuevoPago} onChange={(e) => setTipoNuevoPago(e.target.value)}>
                    <option value="mensual">Mensual</option>
                    <option value="programado">Programado</option>
                  </select>
                </label>

                <label>
                  Descripción:
                  <input type="text" value={nuevoPago.descripcion} onChange={(e) => setNuevoPago({ ...nuevoPago, descripcion: e.target.value })} />
                </label>

                <label>
                  Monto:
                  <input
                    type="text"
                    value={Number(nuevoPago.monto).toLocaleString("es-CL")}
                    onChange={(e) => {
                      const sinPuntos = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                      if (!isNaN(sinPuntos)) {
                        setNuevoPago({ ...nuevoPago, monto: sinPuntos });
                      }
                    }}
                  />
                </label>

                {tipoNuevoPago === "mensual" ? (
                  <label>
                    Día de pago:
                    <input type="number" min="1" max="28" value={nuevoPago.dia_pago} onChange={(e) => setNuevoPago({ ...nuevoPago, dia_pago: e.target.value })} />
                  </label>
                ) : (
                  <>
                    <label>
                      Fecha de emisión:
                      <input type="date" value={nuevoPago.fecha_emision} onChange={(e) => setNuevoPago({ ...nuevoPago, fecha_emision: e.target.value })} />
                    </label>
                    <label>
                      Tipo de pago:
                      <select value={nuevoPago.tipo_pago} onChange={(e) => setNuevoPago({ ...nuevoPago, tipo_pago: e.target.value })}>
                        <option value="cheque">Cheque</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="debito">Débito</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </label>
                    {nuevoPago.tipo_pago === "cheque" && (
                      <label>
                        Días a cobrar:
                        <input type="number" value={nuevoPago.dias_cheque} onChange={(e) => setNuevoPago({ ...nuevoPago, dias_cheque: e.target.value })} />
                      </label>
                    )}
                  </>
                )}

                <div className="modal-acciones">
                  <button className="btn-aceptar" onClick={handleGuardarNuevoPago}>Guardar</button>
                  <button className="btn-cancelar" onClick={() => setMostrarModal(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PagosRecurrentes;