from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import gspread
from google.oauth2.service_account import Credentials

# ==== CONFIGURACIÓN GOOGLE SHEETS ====

NOMBRE_HOJA = "Rifa_UnidosenOración"  # Cambia al nombre exacto de tu hoja
HEADER = ["Numero", "Comprador", "Vendedor", "Estado"]

# Autenticación
scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]
creds = Credentials.from_service_account_file("/etc/secrets/credenciales.json", scopes=scope)
client = gspread.authorize(creds)
sheet = client.open(NOMBRE_HOJA).sheet1

# ==== MODELO ====

class ActualizaNumero(BaseModel):
    estado: str
    nombre: str = ""
    vendedor: str = ""

# ==== FASTAPI SETUP ====

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

def normalizar_numero(n):
    return str(n).zfill(2)

# ==== FUNCIONES PARA GOOGLE SHEETS ====

def buscar_fila_por_numero(numero):
    num_str = normalizar_numero(numero)
    try:
        cell = sheet.find(num_str)
        if cell.col == 1:  # la columna número debe ser la 1
            return cell.row
    except gspread.exceptions.CellNotFound:
        return None
    return None

def obtener_todos():
    rows = sheet.get_all_records()
    # Completa con disponibles si hay menos de 100 números
    numeros = {int(str(r["Numero"]).zfill(2)): r for r in rows if str(r["Numero"]).isdigit()}
    result = []
    for n in range(1, 101):
        k = int(str(n).zfill(2))
        if k in numeros and numeros[k]["Estado"] == "vendido":
            result.append({
                "numero": k,
                "estado": "vendido",
                "nombre": numeros[k].get("Comprador", ""),
                "vendedor": numeros[k].get("Vendedor", "")
            })
        else:
            result.append({
                "numero": k,
                "estado": "disponible",
                "nombre": "",
                "vendedor": ""
            })
    return result

def registrar_venta(numero, comprador, vendedor):
    fila = buscar_fila_por_numero(numero)
    num_str = normalizar_numero(numero)
    if fila:
        # Actualiza la fila existente
        sheet.update(f"B{fila}", comprador)
        sheet.update(f"C{fila}", vendedor)
        sheet.update(f"D{fila}", "vendido")
    else:
        # Si no existe, agrega una nueva fila
        sheet.append_row([num_str, comprador, vendedor, "vendido"])

def resetear_hoja():
    # Elimina todas las filas excepto el header
    sheet.resize(1)
    # Se mantienen los encabezados y la hoja vacía
    # Opcional: puedes repoblar, pero el frontend ya muestra todo como disponible

# ==== ENDPOINTS ====

@app.get("/api/numeros")
def numeros():
    return obtener_todos()

@app.post("/api/numeros/{numero}/estado")
def cambiar_estado(numero: int, data: ActualizaNumero):
    if data.estado not in ["disponible", "vendido"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    if data.estado == "vendido":
        if not data.nombre:
            raise HTTPException(status_code=400, detail="Debe ingresar nombre del comprador")
        registrar_venta(numero, data.nombre, data.vendedor or "")
    else:  # disponible: quitar de la hoja si existe
        fila = buscar_fila_por_numero(numero)
        if fila:
            sheet.delete_rows(fila)
    return {"ok": True}

@app.post("/api/reset")
def reset():
    resetear_hoja()
    return {"ok": True}
