const API_URL = "https://empresard-1.onrender.com/api";

// GET todos los números
async function cargarDatos() {
  const res = await fetch(`${API_URL}/numeros`);
  return await res.json();
}

// POST para cambiar estado/registrar comprador
async function enviarEstado(numero, estado, nombre) {
  await fetch(`${API_URL}/numeros/${numero}/estado`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ estado, nombre })
  });
}

// POST para resetear rifa
async function resetearRifa() {
  await fetch(`${API_URL}/reset`, {method: "POST"});
}

// Renderiza la cuadrícula, nombres y color
function renderizarCuadricula(items) {
  const grid = document.getElementById("numbersGrid");
  grid.innerHTML = "";
  for (let item of items) {
    const btn = document.createElement("button");
    btn.className = `number-btn ${item.estado}`;
    btn.innerText = item.numero.toString().padStart(2,"0");

    // Muestra el nombre del comprador debajo
    if(item.estado === "vendido" && item.nombre) {
      const nombre = document.createElement("div");
      nombre.className = "nombre-vendedor";
      nombre.innerText = item.nombre;
      btn.appendChild(nombre);
      btn.title = `Vendido a: ${item.nombre}`;
    }

    // Sólo permite selección si está disponible
    if(item.estado === "disponible") {
      btn.onclick = async () => {
        const nombre = prompt("Ingrese nombre del comprador:");
        if (!nombre || nombre.trim() === "") return;
        await enviarEstado(item.numero, "vendido", nombre.trim());
        await inicializar();
      };
    } else {
      btn.disabled = true; // deshabilita botón vendido
    }
    grid.appendChild(btn);
  }
}

function renderizarContadores(items) {
  const disponibles = items.filter(x => x.estado === "disponible").length;
  const vendidos = items.filter(x => x.estado === "vendido").length;
  document.getElementById("disponibles").innerText = `Disponibles: ${disponibles}`;
  document.getElementById("vendidos").innerText = `Vendidos: ${vendidos}`;
}

async function inicializar() {
  const datos = await cargarDatos();
  renderizarCuadricula(datos);
  renderizarContadores(datos);
}

// Evento de reset
document.addEventListener("DOMContentLoaded", () => {
  inicializar();
  document.getElementById("resetBtn").onclick = async () => {
    if (confirm("¿Seguro que quieres resetear la rifa?")) {
      await resetearRifa();
      await inicializar();
    }
  };
});
