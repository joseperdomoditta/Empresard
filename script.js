const API_URL = "https://empresard-1.onrender.com/api";
const ADMIN_PASS = "@Joseper37965V1L2"; // Cambia esto por una clave fuerte

let esAdmin = false;

// Pregunta si eres admin al cargar la página
function autenticarAdmin() {
  const clave = prompt("¿Eres administrador? Ingresa contraseña o déjalo vacío si eres usuario normal.");
  if (clave === ADMIN_PASS) {
    esAdmin = true;
  }
}
autenticarAdmin();

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

function renderizarCuadricula(items) {
  const grid = document.getElementById("numbersGrid");
  grid.innerHTML = "";
  for (let item of items) {
    const btn = document.createElement("button");
    btn.className = `number-btn ${item.estado}`;
    btn.innerText = item.numero.toString().padStart(2,"0");

    // Si el número está vendido y es admin, muestra el nombre
    if(item.estado === "vendido" && esAdmin && item.nombre) {
      const nombre = document.createElement("div");
      nombre.className = "nombre-vendedor";
      nombre.innerText = item.nombre;
      btn.appendChild(nombre);
      btn.title = `Vendido a: ${item.nombre}`;
    }

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

// Reset solo si es admin
document.addEventListener("DOMContentLoaded", () => {
  inicializar();
  // Muestra/reset solo si es admin
  const btn = document.getElementById("resetBtn");
  if (esAdmin) {
    btn.style.display = "inline-block";
    btn.onclick = async () => {
      if (confirm("¿Seguro que quieres resetear la rifa?")) {
        await resetearRifa();
        await inicializar();
      }
    };
  } else {
    btn.style.display = "none";
  }
});
