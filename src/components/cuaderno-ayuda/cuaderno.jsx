import React, { useState } from "react";
import "./cuaderno.css";

export default function Cuaderno({ onClose }) {
  const [seccionActiva, setSeccionActiva] = useState("dashboard");

  return (
    <div className="cuaderno-overlay">
      <div className="cuaderno-box">
        <button className="cerrar-cuaderno" onClick={onClose}>✖</button>
        <h2>Cuaderno de Ayuda</h2>

        {/* Menú de secciones */}
        <div className="cuaderno-tabs">
          <button onClick={() => setSeccionActiva("dashboard")} className={seccionActiva === "dashboard" ? "activo" : ""}>Inicio</button>
          <button onClick={() => setSeccionActiva("transacciones")} className={seccionActiva === "transacciones" ? "activo" : ""}>Transacciones</button>
          <button onClick={() => setSeccionActiva("categorias")} className={seccionActiva === "categorias" ? "activo" : ""}>Categorías</button>
          <button onClick={() => setSeccionActiva("recurrentes")} className={seccionActiva === "recurrentes" ? "activo" : ""}>Gastos Recurrentes</button>
          <button onClick={() => setSeccionActiva("metas")} className={seccionActiva === "metas" ? "activo" : ""}>Metas de Ahorro</button>
        </div>

        {seccionActiva === "dashboard" && (
          <>
            <div className="bloque-ayuda">
              <h4>1. Pestaña: Resumen General</h4>
              <p>Visualiza tu panorama financiero del mes actual.</p>
              <ul>
                <li><strong>Salario actual:</strong> Se muestra el monto registrado como sueldo. Haz clic en <em>“Editar”</em> para modificarlo. Puedes definir desde qué fecha se aplica.</li>
                <li><strong>Ahorro acumulado:</strong> Se muestra el ahorro actual. Puedes incrementarlo o descontarlo usando los botones <em>“Añadir”</em> o <em>“Descontar”</em>.</li>
                <li><strong>Saldo restante del mes:</strong> Calculado como <em>Salario + Ingresos − Gastos</em>. No considera pagos en cuotas con crédito como deuda directa.</li>
                <li><strong>Últimos movimientos:</strong> Muestra las 3 transacciones más costosas con su fecha, descripción y monto. Haz clic en <em>“Ver más transacciones”</em> para revisar el historial completo.</li>
                <li><strong>Alertas automáticas:</strong> Se muestran advertencias si algún gasto mensual o programado está por cobrarse (dentro de 3 días), o si este mes estás gastando más de lo habitual en alguna categoría.</li>
                <li><strong>Control de límites por categoría:</strong> Tabla que muestra cuánto llevas gastado en cada categoría del mes actual, comparado con su límite (si existe). El estado se marca como:
                </li>
              </ul>
            </div>

            <div className="bloque-ayuda">
              <h4>2. Pestaña: Mis Metas</h4>
              <p>Muestra tu meta activa de ahorro.</p>
              <ul>
                <li><strong>Nombre, monto y fecha límite:</strong> Se presentan los datos básicos de la meta en curso.</li>
                <li><strong>Barra de progreso:</strong> Muestra el avance visual hacia tu meta financiera.</li>
                <li><strong>Botón “Ir a mis metas”:</strong> Te redirige a la vista completa para editar, eliminar o revisar otras metas.</li>
              </ul>
            </div>

            <div className="bloque-ayuda">
              <h4>3. Pestaña: Análisis Mensual</h4>
              <p>Presenta gráficos detallados con tu evolución financiera del mes.</p>
              <ul>
                <li><strong>Selector de mes y año:</strong> Puedes ver meses anteriores para comparar tu desempeño.</li>
                <li><strong>Saldo acumulado:</strong> Gráfico de línea que muestra tu saldo diario.
                  <ul>
                    <li><em>Verde</em>: saldo estable o creciente.</li>
                    <li><em>Rojo</em>: caídas por gastos significativos.</li>
                  </ul>
                </li>
                <li><strong>Evolución de ahorros:</strong> Gráfico que muestra cómo han variado tus ahorros durante el mes.</li>
              </ul>
            </div>

            <div className="bloque-ayuda">
              <div className="seccion-cuaderno">
                <h4>4. Pestaña: Comparación</h4>
                <ul>
                  <li>
                    <strong>Comparador de categorías:</strong> Permite comparar cuánto has gastado por categoría entre dos meses distintos. 
                    <ul>
                      <li>Selecciona dos meses y años.</li>
                      <li>Se muestra cuánto gastaste por categoría en cada mes.</li>
                      <li>El sistema calcula la diferencia y la muestra con flechas ↑↓ y porcentaje.</li>
                      <li>Si no había gasto el mes anterior, se muestra “N/A”.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Historial de salarios:</strong> Permite ver el historial de sueldos. 
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        {seccionActiva === "transacciones" && (
          <>
            <div className="bloque-ayuda">
              <h4>Gestión de Transacciones</h4>
              <p>En esta sección puedes revisar, agregar, editar, eliminar y recuperar tus movimientos financieros. Aquí se concentra todo tu historial de ingresos y gastos.</p>
              <ul>
                <li><strong>Exportar mes actual:</strong> Presiona el botón azul <em>“Exportar mes actual”</em> para generar un archivo Excel/PDF con todas tus transacciones del mes visible.</li>
                <li><strong>Importar movimientos bancarios:</strong>
                  <ul>
                    <li>De momento sólo se ha probado con archivos del banco Santander</li>
                    <li>Haz clic en “Seleccionar archivo de movimientos bancarios” y elige tu archivo Excel o PDF.</li>
                    <li>Presiona “Subir archivo” para cargarlos.</li>
                    <li>Las transacciones importadas aparecerán con la etiqueta <strong>“GASTO (IMPORTADO)”</strong> o <strong>“INGRESO (IMPORTADO)”</strong>.</li>
                  </ul>
                </li>
                <li><strong>Agregar nueva transacción:</strong> Clic en el botón azul para abrir el formulario. Ahí puedes ingresar:
                  <ul>
                    <li>Tipo (ingreso o gasto)</li>
                    <li>Fecha, monto, categoría, descripción</li>
                    <li>Tipo de pago y adjuntos</li>
                    <li>Opcional: cuotas o doble método de pago</li>
                  </ul>
                </li>
                <li><strong>Filtros por mes y año:</strong> Usa los selectores para cambiar el periodo que estás visualizando. Esto afecta la tabla y exportación.</li>
              </ul>
            </div>

            <div className="bloque-ayuda">
              <h4>Tipos de transacciones mostradas</h4>
              <ul>
                <li><strong>GASTO / INGRESO:</strong> Transacciones ingresadas manualmente por ti.</li>
                <li><strong>GASTO (IMPORTADO) / INGRESO (IMPORTADO):</strong> Creadas automáticamente desde archivos bancarios subidos.</li>
                <li><strong>GASTO MENSUAL:</strong> Transacciones que se repiten mes a mes. No se pueden editar aquí.</li>
                <li><strong>GASTO PROGRAMADO:</strong> Corresponden a pagos únicos en una fecha futura. Tampoco se pueden editar desde esta sección.</li>
              </ul>
              <p><em>Para modificar transacciones mensuales o programadas, accede a la sección <strong>Gastos Recurrentes</strong>.</em></p>
            </div>

            <div className="bloque-ayuda">
              <h4>Editar, eliminar y recuperar</h4>
              <ul>
                <li><strong>Acciones:</strong> Cada transacción tiene un botón con tres puntos (<strong>…</strong>) en la esquina inferior derecha.</li>
                <li><strong>Editar:</strong> Al hacer clic en “Editar”, puedes modificar cualquier campo solo si la transacción fue creada manualmente o fue importada. No se pueden editar transacciones generadas por gastos mensuales o programados.</li>
                <li><strong>Eliminar:</strong> Todas las transacciones pueden eliminarse desde este menú. Serán trasladadas a la sección <strong>Transacciones eliminadas</strong>.</li>
                <li><strong>Recuperar:</strong> En la parte inferior de la interfaz, puedes restaurar transacciones eliminadas haciendo clic en el botón verde <em>“Recuperar”</em>.</li>
                <li><strong>Eliminar definitivamente:</strong> Presiona el botón rojo si deseas borrar la transacción para siempre.</li>
              </ul>
            </div>
          </>
        )}

        {seccionActiva === "categorias" && (
          <>
            <div className="bloque-ayuda">
              <h4>Gestión de Categorías</h4>
              <p>Las categorías te permiten organizar tus transacciones según su tipo y propósito. Puedes crear, editar o eliminar las que necesites, excepto la categoría <strong>“General”</strong>, que es fija en el sistema.</p>
              <ul>
                <li><strong>Agregar categoría:</strong> Haz clic en el botón azul <em>“Agregar categoría”</em> para abrir el formulario. Deberás ingresar:
                  <ul>
                    <li><strong>Nombre:</strong> cómo se llamará la categoría (ej. "Transporte", "Salud", "Ahorro", etc.).</li>
                    <li><strong>Tipo:</strong> define si se usará para <em>Gastos</em>, <em>Ingresos</em> o <em>Ambos</em>.</li>
                    <li><strong>Monto límite:</strong> opcional. Puedes establecer un máximo mensual para ayudarte a no pasarte de ese valor en esa categoría.</li>
                  </ul>
                </li>
                <li><strong>Editar:</strong> Usa el botón <em>“Editar”</em> junto a cada categoría para modificar su nombre, tipo o límite. No puedes editar la categoría “General”.</li>
                <li><strong>Eliminar:</strong> Haz clic en el botón <em>“Eliminar”</em> para borrar una categoría. Solo puedes eliminar categorías que no estén en uso por transacciones actuales.</li>
                <li><strong>Tipo de categoría:</strong> Cada categoría se asocia a uno de estos tipos:
                  <ul>
                    <li><strong>Gasto:</strong> Solo aparecerá al registrar egresos.</li>
                    <li><strong>Ingreso:</strong> Solo disponible al registrar entradas de dinero.</li>
                    <li><strong>Ambos:</strong> Se puede usar para ingresos o gastos, útil para categorías generales.</li>
                  </ul>
                </li>
                <li><strong>Uso de categorías:</strong> Al crear una transacción, deberás asignar una categoría válida según su tipo. Esto permite visualizar mejor tus patrones de gasto e ingreso.</li>
              </ul>
            </div>
          </>
        )}

        {seccionActiva === "recurrentes" && (
          <>
            <div className="bloque-ayuda">
              <h4>Gestión de Pagos Recurrentes</h4>
              <p>En esta sección puedes registrar gastos automáticos que se repiten cada mes o pagos únicos programados para una fecha específica.</p>
              <ul>
                <li><strong>Agregar nuevo pago:</strong> Presiona el botón azul <em>“Agregar nuevo pago”</em> para abrir el formulario. Debes indicar:
                  <ul>
                    <li><strong>Tipo:</strong> Mensual (se repite mes a mes) o Programado (único).</li>
                    <li><strong>Descripción:</strong> Detalle breve del gasto (ej. "Suscripción Netflix").</li>
                    <li><strong>Monto:</strong> Valor numérico del pago.</li>
                    <li><strong>Categoría:</strong> Debe estar asociada a una categoría existente.</li>
                    <li><strong>Fecha de cobro:</strong> Día del mes (en gastos mensuales) o una fecha exacta (en pagos programados).</li>
                  </ul>
                </li>
                <li><strong>Editar:</strong> Usa el botón <em>“Editar”</em> para modificar cualquier dato del gasto recurrente.</li>
                <li><strong>Desactivar:</strong> Presiona <em>“Desactivar”</em> si ya no quieres que el gasto mensual se siga generando. Este se moverá automáticamente a la sección de <strong>Gastos recurrentes desactivados</strong>.</li>
              </ul>
            </div>

            <div className="bloque-ayuda">
              <h4>Gastos recurrentes desactivados</h4>
              <p>Los pagos que ya no están activos aparecerán en esta sección con estado “Desactivado”.</p>
              <ul>
                <li><strong>Visualización:</strong> Puedes revisar la descripción, monto, categoría y fecha de cobro original.</li>
                <li><strong>Estado:</strong> Muestra que el pago ha sido desactivado, y ya no se generarán más transacciones a partir de él.</li>
                <li><strong>Reactivación:</strong> Por ahora, la reactivación no está disponible directamente, pero podrías volver a crear el mismo pago si deseas que se active nuevamente.</li>
              </ul>
            </div>
          </>
        )}

        {seccionActiva === "metas" && (
          <>
            <div className="bloque-ayuda">
              <h4>Gestión de Metas de Ahorro</h4>
              <p>Desde esta sección puedes crear, editar o eliminar tus objetivos financieros personales, y hacer seguimiento a tu progreso.</p>
              <ul>
                <li><strong>Agregar meta de ahorro:</strong> Haz clic en el botón azul <em>“Agregar meta de ahorro”</em> para abrir el formulario. Debes completar:
                  <ul>
                    <li><strong>Título:</strong> El nombre de la meta (ej. “Viaje”, “Computador nuevo”, etc.).</li>
                    <li><strong>Monto meta:</strong> El objetivo de ahorro total que deseas alcanzar.</li>
                    <li><strong>Fecha límite:</strong> (opcional) Define hasta cuándo deseas cumplir la meta.</li>
                  </ul>
                </li>
                <li><strong>Ver tus metas:</strong> Se listan en una tabla con su título, monto y fecha. Desde aquí puedes monitorearlas.</li>
                <li><strong>Editar:</strong> Haz clic en el botón <em>“Editar”</em> para cambiar el nombre, el monto o la fecha de la meta.</li>
                <li><strong>Eliminar:</strong> Usa el botón <em>“Eliminar”</em> para quitar la meta del sistema. Esto no afecta tu ahorro acumulado.</li>
              </ul>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
