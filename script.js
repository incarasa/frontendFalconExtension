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
    const response = await fetch("https://backend-falcon-extension.vercel.app/api/chatGPT", {
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