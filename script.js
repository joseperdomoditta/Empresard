const API_URL = "https://empresard-1.onrender.com/api";

async function cargarDatos() {
  const res = await fetch(`${API_URL}/numeros`);
  return await res.json();
}

async function enviarEstado(numero, estado) {
  await fetch(`${API_URL}/numeros/${numero}/estado?estado=${estado}`, {
    method: "POST",
    headers: {"Content-Type":"application/json"}
  });
}

async function resetearRifa() {
  await fetch(`${API_URL}/reset`, {method: "POST"});
}

function renderizarCuadricula(items) {
  const grid = document.getElementById("numbersGrid");
  grid.innerHTML = "";
  for (let item of items) {
    const btn = document.createElement("button");
    btn.className = `number-btn ${item.estado}`;
    btn.innerText = item.numero.toString().padStart(2,"0");
    btn.onclick = async () => {
      let nuevoEstado = item.estado === "disponible" ? "vendido" : "disponible";
      await enviarEstado(item.numero, nuevoEstado);
      await inicializar();
    };
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

document.addEventListener("DOMContentLoaded", () => {
  inicializar();
  document.getElementById("resetBtn").onclick = async () => {
    if (confirm("¿Seguro?")) {
      await resetearRifa();
      await inicializar();
    }
  };
});