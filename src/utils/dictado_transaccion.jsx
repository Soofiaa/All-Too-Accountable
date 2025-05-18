export const pasosDictado = [
  "fecha",
  "id_categoria",
  "descripcion",
  "usarSegundoMetodo",
  "tipoPago",
  "monto",
  "tipoPago2",
  "monto2"
];

// Inicializa reconocimiento compatible con navegadores
export const inicializarReconocimiento = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SpeechRecognition ? new SpeechRecognition() : null;
};

// Función principal que avanza paso a paso
export const iniciarDictadoPaso = ({
  pasoActual,
  pasos,
  nuevaTransaccion,
  setNuevaTransaccion,
  setPasoActual,
  categorias,
  metodosMostrar,
  setUsarSegundoMetodo,
  setModoDictado,
  formatearConPuntos,
  formatearFechaOCR
}) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  if (pasoActual >= pasos.length) {
    recognition.stop();
    return;
  }

  const campo = pasos[pasoActual];
  recognition.lang = "es-CL";

  console.log("🎤 Iniciando reconocimiento para:", campo);
  console.log("🎤 Dictado iniciado para:", campo);
  
  try {
    recognition.abort();
    setTimeout(() => {
      recognition.start();
    }, 300); // Espera 300ms antes de iniciar
  } catch (e) {
    console.error("❌ Error al reiniciar recognition:", e);
  }

  recognition.onresult = (event) => {
    const texto = event.results[0][0].transcript.trim().toLowerCase();
    console.log("🗣 Dictado:", texto);
    console.log("🗣 Dictado capturado:", texto);

    const nueva = { ...nuevaTransaccion };

    if (campo === "fecha") {
      const fechaFormateada = formatearFechaOCR(texto);
      nueva.fecha = fechaFormateada;
      nueva.tipo = "gasto";
    }

    if (campo === "id_categoria") {
      const categoriaEncontrada = categorias.find(cat => cat.nombre.toLowerCase() === texto);
      if (categoriaEncontrada) {
        nueva.id_categoria = categoriaEncontrada.id_categoria;
      } else {
        alert("❌ Categoría no reconocida. Diga exactamente una opción válida.");
        return;
      }
    }

    if (campo === "descripcion") {
      nueva.descripcion = texto;
    }

    if (campo === "tipoPago") {
      const metodo = metodosMostrar.find(m => m.label.toLowerCase() === texto);
      if (metodo) {
        nueva.tipoPago = metodo.valor;
      } else {
        alert("❌ Método de pago no válido. Diga exactamente una de las opciones mostradas.");
        return;
      }
    }

    if (campo === "monto") {
      nueva.monto = formatearConPuntos(texto.replace(/[^\d]/g, ""));
    }

    if (campo === "usarSegundoMetodo") {
      if (texto === "sí" || texto === "si") {
        setUsarSegundoMetodo(true);
        nueva.tipoPago2 = "";
        nueva.monto2 = "";
      } else {
        setUsarSegundoMetodo(false);
      }

      // En ambos casos, simplemente avanza al siguiente paso
      setPasoActual(p => p + 1);
      return;
    }

    if (campo === "tipoPago2") {
      const metodo2 = metodosMostrar.find(m => m.label.toLowerCase() === texto);
      if (metodo2) {
        nueva.tipoPago2 = metodo2.valor;
      } else {
        alert("❌ Segundo tipo de pago no válido.");
        return;
      }
    }

    if (campo === "monto2") {
      nueva.monto2 = formatearConPuntos(texto.replace(/[^\d]/g, ""));
    }

    setNuevaTransaccion(nueva);

    // Detectar final del dictado según flujo
    const esUltimoPaso =
      (!nueva.usarSegundoMetodo && campo === "monto") || 
      (nueva.usarSegundoMetodo && campo === "monto2");

    if (esUltimoPaso) {
      console.log("✅ Dictado finalizado automáticamente.");
      setModoDictado(false);
      setPasoActual(0);
      if (typeof window.setDictadoFinalizado === "function") {
        window.setDictadoFinalizado(true);
      }
    } else if (campo !== "usarSegundoMetodo") {
      setPasoActual(p => p + 1);
    }
  };

  recognition.onerror = (event) => {
    console.error("🎤 Error en reconocimiento:", event.error);
    alert("❌ Hubo un error con el reconocimiento de voz.");
  };
};