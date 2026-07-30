import sqlite3

def crear_base_datos():
    # Esto creará un archivo llamado 'inventario.db' en la misma carpeta
    conn = sqlite3.connect("inventario.db")
    cursor = conn.cursor()

    # 1. Crear tabla de Productos
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        categoria TEXT,
        costo REAL NOT NULL,
        precio REAL NOT NULL,
        stock INTEGER NOT NULL,
        unidad TEXT DEFAULT 'pieza'
    );
    """)

    # 2. Crear tabla de Historial de Ventas
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS historial (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folio_venta TEXT NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        descripcion_productos TEXT NOT NULL,
        total REAL NOT NULL,
        vendedor TEXT NOT NULL
    );
    """)

    # 3. Crear tabla de Usuarios
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL,
        face_encoding TEXT
    );
    """)

    # 4. Insertar datos de prueba (Solo si no existen)
    cursor.execute("""
    INSERT OR IGNORE INTO productos (codigo, nombre, categoria, costo, precio, stock, unidad)
    VALUES 
      ('PROD001', 'Laptop Dell 15"', 'Electronica', 8, 12, 10, 'pieza'),
      ('PROD002', 'Mouse Inalámbrico', 'Electronica', 150, 299, 46, 'pieza'),
      ('PROD005', 'Cuaderno Prof.', 'Papeleria', 25, 55, 80, 'pieza'),
      ('PROD006', 'PC', 'Electronica', 1500, 2000, 3, 'pieza');
    """)

    cursor.execute("""
    INSERT OR IGNORE INTO usuarios (usuario, nombre, password, rol)
    VALUES 
      ('admin', 'Lola Lola', 'admin123', 'administrador'),
      ('Emple', 'Erick Santos', 'emple123', 'empleado');
    """)

    conn.commit()
    conn.close()
    print("Base de datos SQLite creada y configurada exitosamente.")

if __name__ == '__main__':
    crear_base_datos()