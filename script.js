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

// POST para cambiar estado/registrar comprador + vendedor
async function enviarEstado(numero, estado, nombre, vendedor) {
  await fetch(`${API_URL}/numeros/${numero}/estado`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ estado, nombre, vendedor })
  });
}

// POST para resetear rifa (solo admin)
async function resetearRifa() {
  await fetch(`${API_URL}/reset`, {method: "POST"});
}

// Renderiza la cuadrícula
function renderizarCuadricula(items) {
  const grid = document.getElementById("numbersGrid");
  grid.innerHTML = "";
  for (let item of items) {
    const btn = document.createElement("button");
    btn.className = `number-btn ${item.estado}`;
    btn.innerText = item.numero.toString().padStart(2,"0");

    // Muestra nombre del comprador debajo del número vendido (para todos)
    if(item.estado === "vendido" && item.nombre) {
      const nombreDiv = document.createElement("div");
      nombreDiv.className = "nombre-vendedor";
      nombreDiv.innerText = item.nombre;
      btn.appendChild(nombreDiv);
      btn.title = `Comprador: ${item.nombre}` + (item.vendedor ? `\nVendedor: ${item.vendedor}` : "");
    }

    if(item.estado === "disponible") {
      btn.onclick = async () => {
        const nombre = prompt("Ingrese NOMBRE del comprador:");
        if (!nombre || nombre.trim() === "") return;
        const vendedor = prompt("Ingrese NOMBRE del vendedor (si aplica):");
        await enviarEstado(item.numero, "vendido", nombre.trim(), vendedor ? vendedor.trim() : "");
        await inicializar();
      };
    } else {
      btn.disabled = true; // deshabilita botón vendido
    }
    grid.appendChild(btn);
  }
}

// Actualiza contadores de vendidos/disponibles
function renderizarContadores(items) {
  const disponibles = items.filter(x => x.estado === "disponible").length;
  const vendidos = items.filter(x => x.estado === "vendido").length;
  document.getElementById("disponibles").innerText = `Disponibles: ${disponibles}`;
  document.getElementById("vendidos").innerText = `Vendidos: ${vendidos}`;
}

// Lista de compradores para el administrador (debajo de la cuadrícula)
function renderizarListaCompradores(items) {
  let div = document.getElementById('compradoresList');
  if (!esAdmin) {
    if (div) div.innerHTML = "";
    return;
  }
  let vendidos = items.filter(x => x.estado === "vendido");
  if (vendidos.length === 0) {
    div.innerHTML = "<b>No hay ventas registradas aún.</b>";
    return;
  }
  let tabla = `<table border="1" cellpadding="5" style="border-collapse:collapse;width:auto;"><tr><th>Número</th><th>Comprador</th><th>Vendedor</th></tr>`;
  vendidos.forEach(item => {
    tabla += `<tr>
      <td>${item.numero.toString().padStart(2, "0")}</td>
      <td>${item.nombre}</td>
      <td>${item.vendedor || ""}</td>
    </tr>`;
  });
  tabla += `</table>
    <button id="descargarCsvBtn">Descargar CSV</button>`;
  div.innerHTML = tabla;

  document.getElementById("descargarCsvBtn").onclick = () => {
    descargarCSV(vendidos);
  }
}

// Exportar lista de compradores a CSV
function descargarCSV(items) {
  let csv = "Numero,Comprador,Vendedor\n";
  items.forEach(item => {
    let nombre = (item.nombre || "").replace(/\n/g, " ").replace(/,/g, " ");
    let vendedor = (item.vendedor || "").replace(/\n/g, " ").replace(/,/g, " ");
    csv += `${item.numero.toString().padStart(2, "0")},${nombre},${vendedor}\n`;
  });
  let blob = new Blob([csv], {type: "text/csv"});
  let link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = "lista_rifa.csv";
  link.click();
}

// Inicialización general
async function inicializar() {
  const datos = await cargarDatos();
  renderizarCuadricula(datos);
  renderizarContadores(datos);
  renderizarListaCompradores(datos);
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
