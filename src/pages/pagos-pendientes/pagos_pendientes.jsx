import React, { useState, useEffect } from "react";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import "./pagos_pendientes.css";

export default function PagosPendientes() {
  const [pagosPendientes, setPagosPendientes] = useState([]);

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
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
              {Array.isArray(pagosPendientes) && pagosPendientes.map((p) => (
                  <tr key={p.id_pago}>
                    <td>{p.descripcion}</td>
                    <td>{new Date(p.fecha).toLocaleDateString("es-CL", {year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    <td>${Number(p.valorCuota).toLocaleString("es-CL")}</td>
                    <td>{p.cuotasPagadas}</td>
                    <td>{p.cuotas - p.cuotasPagadas}</td>
                    <td>
                      <button
                        className="btn-pagado"
                        onClick={() =>
                          marcarPagado(p.id_pago, p.cuotasPagadas, p.cuotas)
                        }
                      >
                        Pagado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
