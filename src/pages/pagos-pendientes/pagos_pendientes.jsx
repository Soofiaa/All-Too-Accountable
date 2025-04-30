import React, { useState, useEffect } from "react";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import "./pagos_pendientes.css";

export default function PagosPendientes() {
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [montoPagado, setMontoPagado] = useState("");
  const [transacciones, setTransacciones] = useState([]);


  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    if (!id_usuario) return;
  
    fetch(`http://localhost:5000/api/transacciones/${id_usuario}`)
      .then(res => res.json())
      .then(data => setTransacciones(data.filter(t => t.visible !== false)))
      .catch(err => console.error("Error cargando transacciones:", err));
  }, []);
  

  useEffect(() => {
    const id_usuario = localStorage.getItem("id_usuario");
    fetch(`http://localhost:5000/api/pagos_pendientes?id_usuario=${id_usuario}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("🎯 Respuesta del backend:", data);  // 🔍 esto muestra lo que llega
        if (Array.isArray(data)) {
          setPagosPendientes(data);
        } else {
          console.error("🚨 Respuesta inesperada del backend:", data);
          setPagosPendientes([]);
        }
      })
      
      .catch((error) => {
        console.error("❌ Error al obtener pagos pendientes:", error);
        setPagosPendientes([]);
      });
  }, []);  
  console.log("🧪 pagosPendientes:", pagosPendientes);  

  const marcarPagado = async (id_pago, cuotasPagadasActuales, cuotasTotales) => {
    const nuevasCuotas = cuotasPagadasActuales + 1;

    try {
      const response = await fetch(`http://localhost:5000/api/pagos_pendientes/${id_pago}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuotasPagadas: nuevasCuotas })
      });

      if (!response.ok) throw new Error("Error al actualizar pago pendiente");

      const actualizadas = [...pagosPendientes];
      if (nuevasCuotas >= cuotasTotales) {
        setPagosPendientes(actualizadas.filter(p => p.id_pago !== id_pago));
      } else {
        setPagosPendientes(actualizadas.map(p => p.id_pago === id_pago ? { ...p, cuotasPagadas: nuevasCuotas } : p));
      }
    } catch (error) {
      console.error("Error al marcar como pagado:", error);
    }
  };


  const formatearConPuntos = (valor) => {
    const soloNumeros = valor.replace(/\D/g, "");
    return soloNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };  

  
  return (
    <div className="page-layout">
      <Header />
      <div className="pagos-pendientes-container">
        <h2 className="titulo-pp">Gestión de pagos pendientes con tarjeta de crédito</h2>
        
        <div className="contenido-tabla">
          {pagosPendientes.length === 0 ? (
            <p className="mensaje">No hay pagos pendientes registrados.</p>
          ) : (
            <table className="tabla-pagos">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Fecha de inicio</th>
                  <th>Valor cuota</th>
                  <th>Cuotas pagadas</th>
                  <th>Restantes</th>
                  <th>Valor total</th>
                  <th>Valor restante</th>
                  <th>Acción</th>
                </tr>
              </thead>
              
              <tbody>
              {Array.isArray(pagosPendientes) && pagosPendientes.map((p) => {
                console.log("🧾 Registro recibido:", p); // para depuración
                const descripcionPago = `Pago de cuota: ${p.descripcion}`;

                const totalPagadoReal = transacciones
                  .filter(t => t.descripcion === descripcionPago && t.tipo === "gasto")
                  .reduce((acc, t) => acc + parseFloat(t.monto), 0);

                const valorTotal = p.valorCuota * p.cuotas;
                const valorRestante = valorTotal - totalPagadoReal;

                return (
                  <tr key={p.id_pago}>
                    <td>{p.descripcion}</td>
                    <td>
                      {p.fecha
                        ? new Date(p.fecha).toLocaleDateString("es-CL", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Sin fecha"}
                    </td>
                    <td>
                      {p.valorCuota !== undefined && !isNaN(p.valorCuota)
                        ? `$${Number(p.valorCuota).toLocaleString("es-CL")}`
                        : "—"}
                    </td>
                    <td>{p.cuotasPagadas ?? 0}</td>
                    <td>
                      {p.cuotas !== undefined && p.cuotasPagadas !== undefined
                        ? p.cuotas - p.cuotasPagadas
                        : "—"}
                    </td>
                    <td>
                      {p.valorCuota !== undefined && p.cuotas !== undefined
                        ? `$${(p.valorCuota * p.cuotas).toLocaleString("es-CL")}`
                        : "—"}
                    </td>
                    <td>
                      ${valorRestante.toLocaleString("es-CL")}
                    </td>
                    <td>
                    <button
                      className="btn-pagado"
                      onClick={() => {
                        setPagoSeleccionado(p);
                        setMontoPagado(formatearConPuntos(String(Math.round(p.valorCuota || 0))));
                        setModalPagoAbierto(true);
                      }}
                    >
                      Pagar cuota
                    </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            </table>
          )}
        </div>
      </div>

      {modalPagoAbierto && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Pagar cuota de: {pagoSeleccionado.descripcion}</h3>
            <p>Valor esperado: ${Number(pagoSeleccionado.valorCuota).toLocaleString("es-CL")}</p>
            <label>
              <strong>Monto realmente pagado</strong>
              <input
                type="text"
                value={montoPagado}
                onChange={(e) => setMontoPagado(formatearConPuntos(e.target.value))}
              />
            </label>
            <div className="modal-buttons">
              <button
                onClick={async () => {
                  // 1. Marcar cuota como pagada
                  const nuevasCuotas = pagoSeleccionado.cuotasPagadas + 1;

                  await fetch(`http://localhost:5000/api/pagos_pendientes/${pagoSeleccionado.id_pago}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cuotasPagadas: nuevasCuotas })
                  });

                  // 2. Registrar gasto como transacción
                  await fetch(`http://localhost:5000/api/transacciones`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id_usuario: parseInt(localStorage.getItem("id_usuario")),
                      tipo: "gasto",
                      fecha: new Date().toISOString().split("T")[0],
                      monto: parseFloat(montoPagado.replace(/\./g, "")),
                      categoria: "Pago Tarjeta",
                      descripcion: `Pago de cuota: ${pagoSeleccionado.descripcion}`,
                      tipoPago: "contribucion tarjeta de credito",
                      cuotas: 1,
                      interes: 0,
                      valorCuota: parseFloat(montoPagado.replace(/\./g, "")),
                      totalCredito: parseFloat(montoPagado.replace(/\./g, "")),
                      imagen: null,
                      nombre_archivo: null
                    })
                  });

                  // 3. Actualizar estado local
                  const actualizadas = [...pagosPendientes];
                  if (nuevasCuotas >= pagoSeleccionado.cuotas) {
                    setPagosPendientes(actualizadas.filter(p => p.id_pago !== pagoSeleccionado.id_pago));
                  } else {
                    setPagosPendientes(actualizadas.map(p =>
                      p.id_pago === pagoSeleccionado.id_pago
                        ? { ...p, cuotasPagadas: nuevasCuotas } // ← ¡nombre correcto aquí!
                        : p
                    ));
                  }

                  setModalPagoAbierto(false);
                  setPagoSeleccionado(null);
                  setMontoPagado("");
                }}
              >
                Confirmar pago
              </button>
              <button onClick={() => setModalPagoAbierto(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
