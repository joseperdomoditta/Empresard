from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

class ActualizaNumero(BaseModel):
    estado: str
    nombre: str = ""
    vendedor: str = ""

def init_db():
    conn = sqlite3.connect("rifa.db")
    c = conn.cursor()
    # Asegúrate de tener la columna vendedor
    c.execute("""
    CREATE TABLE IF NOT EXISTS numeros (
        numero INTEGER PRIMARY KEY,
        estado TEXT NOT NULL,
        nombre TEXT,
        vendedor TEXT
    )
    """)
    # Intenta añadir si por error fue creada sin vendedor antes
    try:
        c.execute("ALTER TABLE numeros ADD COLUMN vendedor TEXT")
    except:
        pass
    c.execute("SELECT COUNT(*) FROM numeros")
    if c.fetchone()[0] < 100:
        c.execute("DELETE FROM numeros")
        for n in range(1, 100):
            c.execute("INSERT INTO numeros (numero, estado, nombre, vendedor) VALUES (?, ?, ?, ?)", (n, "disponible", "", ""))
    conn.commit()
    conn.close()

init_db()

@app.get("/api/numeros")
def numeros():
    conn = sqlite3.connect("rifa.db")
    c = conn.cursor()
    c.execute("SELECT numero, estado, nombre, vendedor FROM numeros")
    items = [{"numero": row[0], "estado": row[1], "nombre": row[2] or "", "vendedor": row[3] or ""} for row in c.fetchall()]
    conn.close()
    return items

@app.post("/api/numeros/{numero}/estado")
def cambiar_estado(numero: int, data: ActualizaNumero):
    if data.estado not in ["disponible", "vendido"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    conn = sqlite3.connect("rifa.db")
    c = conn.cursor()
    c.execute("UPDATE numeros SET estado = ?, nombre = ?, vendedor = ? WHERE numero = ?",
              (data.estado, data.nombre, data.vendedor, numero))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.post("/api/reset")
def reset():
    conn = sqlite3.connect("rifa.db")
    c = conn.cursor()
    c.execute("UPDATE numeros SET estado = 'disponible', nombre = '', vendedor = ''")
    conn.commit()
    conn.close()
    return {"ok": True}
