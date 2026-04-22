# app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

def init_db():
    conn = sqlite3.connect("rifa.db")
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS numeros (
        numero INTEGER PRIMARY KEY,
        estado TEXT NOT NULL
    )""")
    c.execute("SELECT COUNT(*) FROM numeros")
    if c.fetchone()[0] < 100:
        c.execute("DELETE FROM numeros")
        for n in range(1, 101):
            c.execute("INSERT INTO numeros (numero, estado) VALUES (?, ?)", (n, "disponible"))
    conn.commit()
    conn.close()

init_db()

def get_all():
    conn = sqlite3.connect("rifa.db")
    c = conn.cursor()
    c.execute("SELECT numero, estado FROM numeros")
    items = [{"numero": row[0], "estado": row[1]} for row in c.fetchall()]
    conn.close()
    return items

@app.get("/api/numeros")
def numeros():
    return get_all()

@app.post("/api/numeros/{numero}/estado")
def cambiar_estado(numero: int, estado: str):
    if estado not in ["disponible", "vendido"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    conn = sqlite3.connect("rifa.db")
    c = conn.cursor()
    c.execute("UPDATE numeros SET estado = ? WHERE numero = ?", (estado, numero))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.post("/api/reset")
def reset():
    conn = sqlite3.connect("rifa.db")
    c = conn.cursor()
    c.execute("UPDATE numeros SET estado = 'disponible'")
    conn.commit()
    conn.close()
    return {"ok": True}