def init_db():
    conn = sqlite3.connect("rifa.db")
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS numeros (
        numero INTEGER PRIMARY KEY,
        estado TEXT NOT NULL,
        nombre TEXT,
        vendedor TEXT
    )
    """)
    # Rellenar los campos faltantes si la tabla existe pero sin columna vendedor
    try:
        c.execute("ALTER TABLE numeros ADD COLUMN vendedor TEXT")
    except:
        pass
    c.execute("SELECT COUNT(*) FROM numeros")
    if c.fetchone()[0] < 100:
        c.execute("DELETE FROM numeros")
        for n in range(1, 101):
            c.execute("INSERT INTO numeros (numero, estado, nombre, vendedor) VALUES (?, ?, ?, ?)", (n, "disponible", "", ""))
    conn.commit()
    conn.close()
