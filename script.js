const slider = document.getElementById("autonomiaSlider");
const nivelDescripcion = document.getElementById("nivelDescripcion");
const mensajeImportanteDiv = document.getElementById("mensajeImportante");

const niveles = {
  1: {
    texto: "Manual – Solo corrige estilo y ortografía, sin reorganizar ni asumir nada.",
    clase: "manual",
    sliderClase: "slider-manual",
    endpoint: "Manual"
  },
  2: {
    texto: "Asistido – Redacción estructurada, sin inventar datos.",
    clase: "asistido",
    sliderClase: "slider-asistido",
    endpoint: "Asistido"
  },
  3: {
    texto: "Predictivo – Redacción completa, con inferencias clínicas razonables. (Incluye Exámen Físico, Impresión Diagnóstica y Posible Tratamiento)",
    clase: "predictivo",
    sliderClase: "slider-predictivo",
    endpoint: "Predictivo"
  },
};

const textarea = document.getElementById("historiaInput");
const mejorarBtn = document.getElementById("mejorarBtn");

let textoOriginal = "";
let textoActual = "";
let mejorado = false;

const setEstadoBoton = (texto, claseExtra = "") => {
  mejorarBtn.innerHTML = texto;
  mejorarBtn.className = claseExtra;
};

const mostrarSpinner = (texto) => {
  mejorarBtn.innerHTML = `<div class="spinner"></div> ${texto}`;
  mejorarBtn.className = "procesando";
};

textarea.addEventListener("input", () => {
  if (mejorado && textarea.value !== textoActual) {
    mejorado = false;
    setEstadoBoton("Mejorar con IA");
    mejorarBtn.disabled = false;
    mensajeImportanteDiv.style.display = "none";
  }
});

let modeloSeleccionado = "chatgpt";

const btnChatGPT = document.getElementById("modeloChatGPT");
const btnGemini = document.getElementById("modeloGemini");
const btnGemma = document.getElementById("modeloGemma");

/* nuevo para gemma */

function actualizarEstadoBotonGemma() {
  const nivel = niveles[slider.value];
  const estaEnManual = nivel.endpoint === "Manual";

  if (estaEnManual) {
    btnGemma.disabled = true;
    btnGemma.classList.add("deshabilitado");
    btnGemma.title = "No disponible en modo Manual";
    btnGemma.style.pointerEvents = "none";
    btnGemma.style.opacity = "0.5";

    // Si MedGemma está seleccionado, cambia a otro automáticamente
    if (modeloSeleccionado === "gemma") {
      modeloSeleccionado = "chatgpt";
      btnGemma.classList.remove("seleccionado");
      btnChatGPT.classList.add("seleccionado");
    }
  } else {
    btnGemma.disabled = false;
    btnGemma.classList.remove("deshabilitado");
    btnGemma.title = "";
    btnGemma.style.pointerEvents = "auto";
    btnGemma.style.opacity = "1";
  }
}

btnChatGPT.addEventListener("click", () => {
  modeloSeleccionado = "chatgpt";
  btnChatGPT.classList.add("seleccionado");
  btnGemini.classList.remove("seleccionado");
  btnGemma.classList.remove("seleccionado");
});

btnGemini.addEventListener("click", () => {
  modeloSeleccionado = "gemini";
  btnGemini.classList.add("seleccionado");
  btnChatGPT.classList.remove("seleccionado");
  btnGemma.classList.remove("seleccionado");
});

btnGemma.addEventListener("click", () => {
  modeloSeleccionado = "gemma";
  btnGemma.classList.add("seleccionado");
  btnChatGPT.classList.remove("seleccionado");
  btnGemini.classList.remove("seleccionado");
});

mejorarBtn.addEventListener("click", async () => {
  if (mejorado) {
    // Si ya fue mejorado, entonces estamos en modo "Deshacer"
    textarea.value = textoOriginal;
    mejorado = false;
    setEstadoBoton("Mejorar con IA");
    mensajeImportanteDiv.style.display = "none";
    return;
  }

  textoOriginal = textarea.value.trim();
  if (!textoOriginal) {
    alert("Escribe algo primero.");
    return;
  }

  mostrarSpinner("Procesando...");
  mejorarBtn.disabled = true;

  try {
    const nivel = niveles[slider.value];
    const base = "https://backend-falcon-extension.vercel.app/api/";
    let endpointNombre = "";

    if (modeloSeleccionado === "gemini") {
      endpointNombre = `redactar${nivel.endpoint}Gemini`;
    } else if (modeloSeleccionado === "gemma") {
      if (nivel.endpoint === "Manual") {
        setEstadoBoton("No disponible en MedGemma", "error");
        return;
      }
      endpointNombre = `redactar${nivel.endpoint}Gemma`;
    } else {
      endpointNombre = `redactar${nivel.endpoint}`;
    }

    const requisitos = document.getElementById("requisitosTextarea").value;

    const response = await fetch(`${base}${endpointNombre}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto_usuario: textoOriginal, requisitos }),
    });

    const data = await response.json();
    if (data.texto_mejorado) {
      textoActual = data.texto_mejorado;
      textarea.value = textoActual;
      setEstadoBoton("Deshacer", "deshacer");
      mejorado = true;

      if (data.texto_importante && data.texto_importante.trim() !== "") {
        let texto = data.texto_importante.trim()
          .replace(/^\s*\*\*\s*$/gm, "")
          .replace(/^\s*[-*]\s*$/gm, "")
          .replace(/^\s*$/gm, "");

        const html = DOMPurify.sanitize(marked.parse(`**IMPORTANTE:**\n\n${texto}`));
        mensajeImportanteDiv.innerHTML = html;
        mensajeImportanteDiv.style.display = "block";
        mensajeImportanteDiv.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        mensajeImportanteDiv.style.display = "none";
      }
    } else {
      setEstadoBoton("Error al mejorar", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    setEstadoBoton("Error al conectar", "error");
  } finally {
    mejorarBtn.disabled = false;
  }
});

slider.addEventListener("input", () => {
  const nivel = niveles[slider.value];

  nivelDescripcion.textContent = nivel.texto;
  nivelDescripcion.classList.remove("manual", "asistido", "predictivo");
  nivelDescripcion.classList.add("descripcion-autonomia", nivel.clase);

  slider.setAttribute("data-nivel", slider.value);

  const porcentaje = ((slider.value - 1) / 2) * 100;
  let color = "#ccc";
  if (slider.value == "1") color = "#607d8b";
  else if (slider.value == "2") color = "#f9a825";
  else if (slider.value == "3") color = "#2e7d32";

  slider.style.background = `linear-gradient(to right, ${color} ${porcentaje}%, #ccc ${porcentaje}%)`;
  actualizarEstadoBotonGemma(); // ← esta línea al final (es para gemma button)
});

window.addEventListener("DOMContentLoaded", () => {
  slider.dispatchEvent(new Event("input"));
});

const microfonoBtn = document.getElementById("microfonoBtn");
let escuchando = false;

let recognition;
let textoOriginalVoz = "";
let textoAcumulado = "";

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript.trim();

      if (event.results[i].isFinal) {
        finalTranscript += transcript.endsWith('.') || transcript.endsWith('?') || transcript.endsWith('!') 
          ? transcript 
          : transcript + " ";
      } else {
        interimTranscript += transcript + " ";
      }
    }

    if (finalTranscript.trim() !== "") {
      textoAcumulado += finalTranscript + " ";
    }

    textarea.value = (textoOriginalVoz + "\n" + textoAcumulado + interimTranscript).trim();
  };

  recognition.onend = () => {
    if (escuchando) recognition.start();
  };
}

microfonoBtn.addEventListener("click", () => {
  if (!recognition) {
    alert("Tu navegador no soporta reconocimiento de voz.");
    return;
  }

  if (!escuchando) {
    textoOriginalVoz = textarea.value.trim();
    textoAcumulado = "";
    recognition.start();
    escuchando = true;
    microfonoBtn.classList.add("escuchando");
    microfonoBtn.title = "Detener micrófono";
    microfonoBtn.textContent = "Escuchando..."
  } else {
    recognition.stop();
    escuchando = false;
    microfonoBtn.classList.remove("escuchando");
    microfonoBtn.title = "Hablar";
    microfonoBtn.textContent = "🎤";
  }
});

const toggleBtn = document.getElementById("toggleRequisitos");
const requisitosBox = document.getElementById("requisitosBox");
const requisitosTextarea = document.getElementById("requisitosTextarea");

toggleBtn.addEventListener("click", () => {
  requisitosBox.style.display = requisitosBox.style.display === "none" ? "block" : "none";
});

requisitosTextarea.textContent = 
` - Antecedentes  
 - Medicamentos que toma el paciente  
 - Síntomas del paciente  
 - Cuánto tiempo ha transcurrido  
 - Tomó medicamentos adicionales  
 - Atenuantes y exacerbantes  
 - Pertinentes negativos (MUY IMPORTANTE pues es un seguro legal para los médicos)
`;