import React, { useState, useEffect } from "react";
import "./gastos_recurrentes.css";
import { getIdUsuario } from "../../utils/usuario";

const API_URL = import.meta.env.VITE_API_URL;
const idUsuario = getIdUsuario();

const PagosRecurrentes = () => {
  if (!idUsuario) {
    alert("No se encontró el ID del usuario. Por favor, inicia sesión.");
    return null;
  }

  const [gastosMensuales, setGastosMensuales] = useState([]);
  const [gastosDesactivados, setGastosDesactivados] = useState([]);
  const [programadosDesactivados, setProgramadosDesactivados] = useState([]);
  const hoy = new Date();
  const [mesFiltrado, setMesFiltrado] = useState(String(hoy.getMonth() + 1));
  const [anioFiltrado, setAnioFiltrado] = useState(String(hoy.getFullYear()));
  const [alertas, setAlertas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [tipoNuevoPago, setTipoNuevoPago] = useState("mensual");
  const [nuevoPago, setNuevoPago] = useState({
    descripcion: "",
    monto: "",
    dia_pago: "",
    fecha_emision: "",
    dias_cheque: "",
    tipo_pago: "debito",
    id_categoria: ""
  });
  const [todosRecurrentesDesactivados, setTodosRecurrentesDesactivados] = useState([]);
  const [mensajeModal, setMensajeModal] = useState("");
  const [accionModal, setAccionModal] = useState(() => () => {});
  const [mostrarModalFormulario, setMostrarModalFormulario] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  
  useEffect(() => {
    const obtenerPagos = async () => {
      try {
        await fetch(`${API_URL}/pagos_programados/actualizar_estado_automatico/${idUsuario}`, {
          method: "PUT"
        });
        const resMensuales = await fetch(`${API_URL}/gastos_mensuales?id_usuario=${idUsuario}`);
        const mensuales = await resMensuales.json();

        if (!Array.isArray(mensuales)) {
          console.error("El backend no devolvió un array:", mensuales);
          return; // Evita seguir si viene mal
        }
        const resProgramados = await fetch(`${API_URL}/pagos_programados/${idUsuario}`);
        const programados = await resProgramados.json();

        const pagosMensuales = mensuales.filter(p => p.activo).map(p => ({
          id: p.id_gasto,
          descripcion: p.descripcion ? `${p.nombre} – ${p.descripcion}` : p.nombre,
          monto: p.monto,
          dia_pago: p.dia_pago,
          fecha: `Día ${p.dia_pago} de cada mes`,
          tipo: "Mensual",
          id_categoria: p.id_categoria
        }));

        const gastosMensualesDesactivados = mensuales
          .filter(p => !p.activo)
          .map(p => ({
            ...p,
            tipo: "Mensual",
            fecha: "-",
            dias_cheque: "-",
          }));

        setGastosDesactivados(gastosMensualesDesactivados);

        const pagosProgramados = programados
          .filter(p => p.activo) // solo los activos
          .map(p => {
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
              tipo: "Programado",
              id_categoria: p.id_categoria
            };
          });

        const pagosProgramadosDesactivados = programados
          .filter(p => !p.activo)
          .map(p => ({
            ...p,
            tipo: "Programado",
            fecha: p.fecha_emision,
            dias_cheque: p.dias_cheque,
          }));

        setProgramadosDesactivados(pagosProgramadosDesactivados);

        const todosDesactivados = [
          ...gastosMensualesDesactivados.map(g => ({
            ...g,
            origen: "Mensual"
          })),
          ...pagosProgramadosDesactivados.map(p => ({
            ...p,
            origen: "Programado"
          }))
        ];

        setTodosRecurrentesDesactivados(todosDesactivados);

        const pagosOrdenados = [...pagosProgramados, ...pagosMensuales];

        pagosOrdenados.sort((a, b) => {
          if (a.tipo !== b.tipo) {
            return a.tipo === "Programado" ? -1 : 1;
          }

          const fechaA = a.tipo === "Programado"
            ? new Date(a.fecha_emision)
            : new Date(new Date().setDate(a.dia_pago || 1));

          const fechaB = b.tipo === "Programado"
            ? new Date(b.fecha_emision)
            : new Date(new Date().setDate(b.dia_pago || 1));

          return fechaA - fechaB;
        });

        setPagos(pagosOrdenados);

        // Alertas
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
    if (!idUsuario) return;

    fetch(`${API_URL}/categorias/${idUsuario}`)
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(err => console.error("Error al cargar categorías:", err));
  }, []);


  useEffect(() => {
    if (!idUsuario) return;

    fetch(`${API_URL}/pagos_programados/${idUsuario}`)
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

        setGastosMensuales(prev => [...prev, ...gastosFiltrados]);
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
          await fetch(`${API_URL}/gastos_mensuales/${idEditando}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: nuevoPago.descripcion,
              descripcion: "",
              id_categoria: nuevoPago.id_categoria,
              monto: parseFloat(nuevoPago.monto),
              dia_pago: parseInt(nuevoPago.dia_pago),
              idUsuario: idUsuario
            })
          });
        } else {
          await fetch(`${API_URL}/pagos_programados/${idEditando}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descripcion: nuevoPago.descripcion,
              monto: parseFloat(nuevoPago.monto),
              fecha_emision: nuevoPago.fecha_emision,
              tipo_pago: nuevoPago.tipo_pago,
              dias_cheque: nuevoPago.tipo_pago === "cheque" ? parseInt(nuevoPago.dias_cheque) : null,
              id_categoria: nuevoPago.id_categoria,
              idUsuario: idUsuario
            })
          });
        }
      } else {
        if (tipoNuevoPago === "mensual") {
          const respuesta = await fetch(`${API_URL}/gastos_mensuales`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: nuevoPago.descripcion,
              descripcion: "",
              id_categoria: nuevoPago.id_categoria,
              monto: parseFloat(nuevoPago.monto),
              dia_pago: parseInt(nuevoPago.dia_pago),
              idUsuario: idUsuario
            })
          });

          const data = await respuesta.json();

          // Si el gasto fue creado con éxito, insertar su transacción
          if (respuesta.ok && data.id_gasto) {
            try {
              const insertar = await fetch(`${API_URL}/gastos_mensuales/insertar_transaccion/${data.id_gasto}`, {
                method: "POST"
              });

              if (!insertar.ok) {
                const errorTexto = await insertar.text();
                console.warn("No se insertó transacción automáticamente:", errorTexto);
              }
            } catch (error) {
              console.error("Error al insertar transacción:", error);
            }
          }
        } else {
          await fetch(`${API_URL}/pagos_programados`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descripcion: nuevoPago.descripcion,
              monto: parseFloat(nuevoPago.monto),
              fecha_emision: nuevoPago.fecha_emision,
              tipo_pago: nuevoPago.tipo_pago,
              dias_cheque: nuevoPago.tipo_pago === "cheque" ? parseInt(nuevoPago.dias_cheque) : null,
              id_categoria: nuevoPago.id_categoria,
              idUsuario: idUsuario
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
        url = `${API_URL}/gastos_mensuales/${pago.id}?idUsuario=${idUsuario}`;
      } else {
        url = `${API_URL}/pagos_programados/${pago.id}`;
      }

      await fetch(url, { method: "DELETE" });
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al eliminar");
    }
  };


  return (
    <div className="page-layout">
      <div className="categorias-container">
        <div className="contenido">
          <h2 className="titulo-categorias">Gestión de Pagos Recurrentes</h2>
          {alertas.length > 0 && (
            <div className="alerta-vencimiento">
              <strong>Tienes {alertas.length} pago(s) programado(s) por vencer en los próximos días:</strong>
              <ul>
                {alertas.map((a) => (
                  <li key={a.id_gasto_programado}>
                    {a.descripcion} → vence el {new Date(a.fecha_emision).toLocaleDateString("es-CL")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button className="btn-agregar" onClick={() => {
            setMostrarModalFormulario(true);
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

          {/* Tabla de gastos activos */}
          <table className="tabla-categorias">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago) => (
                <tr key={pago.id}>
                  <td>{pago.tipo}</td>
                  <td>{pago.descripcion}</td>
                  <td>${Number(pago.monto).toLocaleString("es-CL")}</td>
                  <td>
                    {categorias.find(c => Number(c.id_categoria) === Number(pago.id_categoria))?.nombre || "Sin categoría"}
                  </td>
                  <td>{pago.fecha}</td>
                  <td className="acciones">
                    <button
                      className="btn-editar"
                      onClick={() => {
                        const fechaFormateada = pago.fecha_emision
                          ? new Date(pago.fecha_emision).toISOString().split("T")[0]
                          : ""; // para pagos mensuales que no tienen fecha_emision

                        setMostrarModalFormulario(true);
                        setModoEdicion(true);
                        setIdEditando(pago.id);
                        setTipoNuevoPago(pago.tipo.toLowerCase());
                        setNuevoPago({
                          descripcion: pago.descripcion,
                          monto: pago.monto,
                          dia_pago: pago.dia_pago || "",
                          fecha_emision: fechaFormateada,
                          tipo_pago: pago.tipo_pago || "debito",
                          dias_cheque: pago.dias_cheque || "",
                          id_categoria: pago.id_categoria || ""
                        });
                      }}
                    >Editar</button>
                    {pago.tipo === "Mensual" ? (
                      <button
                        className="btn-eliminar"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMensajeModal("¿Deseas desactivar este gasto mensual?");
                          setAccionModal(() => async () => {
                            await fetch(`${API_URL}/gastos_mensuales/desactivar/${pago.id}?idUsuario=${idUsuario}`, {
                              method: "PUT"
                            });
                            window.location.reload();
                          });
                          setMostrarModalConfirmacion(true);
                        }}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button className="btn-eliminar" onClick={() => handleEliminar(pago)}>Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Tabla de gastos desactivados */}
          <h2 className="titulo-categorias" style={{ marginTop: "2rem" }}>Gastos recurrentes desactivados</h2>
          <table className="tabla-categorias">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Categoría</th>
                <th>Fecha de cobro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {todosRecurrentesDesactivados.map((gasto) => {
                let fecha;

                if (gasto.origen === "Mensual") {
                  fecha = `Día ${gasto.dia_pago}`;
                } else {
                  const [anio, mes, dia] = gasto.fecha.split("-").map(Number);
                  const fechaCobro = new Date(anio, mes - 1, dia + (gasto.dias_cheque || 0));
                  const cobroDia = fechaCobro.getDate().toString().padStart(2, "0");
                  const cobroMes = (fechaCobro.getMonth() + 1).toString().padStart(2, "0");
                  const cobroAnio = fechaCobro.getFullYear();
                  fecha = `${cobroDia}-${cobroMes}-${cobroAnio}`;
                }

                return (
                  <tr key={`${gasto.origen}-${gasto.id_gasto || gasto.id_gasto_programado}`}>
                    <td>{gasto.origen}</td>
                    <td>{gasto.nombre || gasto.descripcion}</td>
                    <td>${Number(gasto.monto).toLocaleString("es-CL")}</td>
                    <td>{categorias.find(c => Number(c.id_categoria) === Number(gasto.id_categoria))?.nombre || "Sin categoría"}</td>
                    <td>{fecha}</td>
                    <td>
                      {gasto.origen === "Mensual" ? (
                        <button
                          className="btn-reactivar"
                          onClick={() => {
                            setMensajeModal("¿Recuperar este gasto mensual?");
                            setAccionModal(() => async () => {
                              await fetch(`${API_URL}/gastos_mensuales/reactivar/${gasto.id_gasto}?idUsuario=${idUsuario}`, {
                                method: "PUT"
                              });
                              window.location.reload();
                            });
                            setMostrarModalConfirmacion(true);
                          }}
                        >
                          Recuperar
                        </button>
                      ) : (
                        <span style={{ fontStyle: "italic", color: "gray" }}>Desactivado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {mostrarModalFormulario && (
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
                  Categoría:
                  <select
                    value={nuevoPago.id_categoria || ""}
                    onChange={(e) =>
                      setNuevoPago({
                        ...nuevoPago,
                        id_categoria: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  >
                    <option value="">Selecciona categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
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
                  <button className="btn-cancelar" onClick={() => setMostrarModalFormulario(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {mostrarModalConfirmacion && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h3 className="modal-titulo">{mensajeModal}</h3>
                <div className="modal-acciones">
                  <button
                    className="btn-aceptar"
                    onClick={() => {
                      accionModal();
                      setMostrarModalConfirmacion(false);
                    }}
                  >
                    Sí, confirmar
                  </button>
                  <button
                    className="btn-cancelar"
                    onClick={() => setMostrarModalConfirmacion(false)}
                  >
                    No, cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PagosRecurrentes;