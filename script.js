const slider = document.getElementById("autonomiaSlider");
const nivelDescripcion = document.getElementById("nivelDescripcion");

const niveles = {
  1: {
    texto: "Manual – Solo corrige estilo y ortografía, sin reorganizar ni asumir nada.",
    clase: "manual",
    sliderClase: "slider-manual",
    endpoint: "manual"
  },
  2: {
    texto: "Asistido – Redacción estructurada, sin inventar datos.",
    clase: "asistido",
    sliderClase: "slider-asistido",
    endpoint: "asistido"
  },
  3: {
    texto: "Predictivo – Redacción completa, con inferencias clínicas razonables.",
    clase: "predictivo",
    sliderClase: "slider-predictivo",
    endpoint: "predictivo"
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
  }
});

mejorarBtn.addEventListener("click", async () => {
  if (mejorado) {
    textarea.value = textoOriginal;
    setEstadoBoton("Mejorar con IA");
    mejorado = false;
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
    const response = await fetch(`https://backend-falcon-extension.vercel.app/api/redactar/${nivel.endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto_usuario: textoOriginal }),
    });

    const data = await response.json();
    if (data.texto_mejorado) {
      textoActual = data.texto_mejorado;
      textarea.value = textoActual;
      setEstadoBoton("Deshacer", "deshacer");
      mejorado = true;
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

//CODIGO PARA EL SLIDER

slider.addEventListener("input", () => {
  const nivel = niveles[slider.value];

  // Actualizar texto descriptivo
  nivelDescripcion.textContent = nivel.texto;
  nivelDescripcion.classList.remove("manual", "asistido", "predictivo");
  nivelDescripcion.classList.add("descripcion-autonomia", nivel.clase);

  // Cambiar el color del thumb dinámicamente
  slider.setAttribute("data-nivel", slider.value);

  // Actualizar el fondo de la barra con un degradado visual
  const porcentaje = ((slider.value - 1) / 2) * 100;
  let color = "#ccc";
  if (slider.value == "1") color = "#607d8b";
  else if (slider.value == "2") color = "#f9a825";
  else if (slider.value == "3") color = "#2e7d32";

  slider.style.background = `linear-gradient(to right, ${color} ${porcentaje}%, #ccc ${porcentaje}%)`;


});

window.addEventListener("DOMContentLoaded", () => {
  slider.dispatchEvent(new Event("input"));
});