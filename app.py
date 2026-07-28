import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, render_template, jsonify, request
from dotenv import load_dotenv

# Carga la variable DATABASE_URL de tu archivo .env
load_dotenv()

app = Flask(__name__)
db_url = os.environ.get("DATABASE_URL")

# Función para abrir la conexión a la base de datos
def get_db_connection():
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)

# ==========================================
# RUTAS PARA MOSTRAR TUS PÁGINAS HTML
# ==========================================
@app.route('/')
@app.route('/index.html')
def index():
    return render_template('index.html')

@app.route('/login.html')
def login():
    return render_template('login.html')

@app.route('/nueva_ventana.html')
def nueva_venta():
    return render_template('nueva_ventana.html')

@app.route('/historial.html')
def historial():
    return render_template('historial.html')

@app.route('/Usuarios.html')
def usuarios():
    return render_template('usuarios.html') 

# ==========================================
# API: INVENTARIO
# ==========================================
@app.route('/api/productos', methods=['GET'])
def get_productos():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos ORDER BY codigo ASC;")
    res = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(res)

@app.route('/api/productos', methods=['POST'])
def create_producto():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO productos (codigo, nombre, categoria, costo, precio, stock, unidad)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (data['codigo'], data['nombre'], data.get('categoria', ''), data['costo'], data['precio'], data['stock'], data.get('unidad', 'pieza')))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/productos/<codigo>', methods=['PUT'])
def update_producto(codigo):
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
    values = list(data.values())
    values.append(codigo)
    cursor.execute(f"UPDATE productos SET {set_clause} WHERE codigo = %s", values)
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/productos/<codigo>', methods=['DELETE'])
def delete_producto(codigo):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM productos WHERE codigo = %s", (codigo,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

# ==========================================
# API: HISTORIAL DE VENTAS
# ==========================================
@app.route('/api/historial', methods=['GET'])
def get_historial():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM historial ORDER BY fecha DESC;")
    res = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(res)

@app.route('/api/historial', methods=['POST'])
def create_historial():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO historial (folio_venta, descripcion_productos, total, vendedor)
        VALUES (%s, %s, %s, %s)
    """, (data['folio_venta'], data['descripcion_productos'], data['total'], data['vendedor']))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

# ==========================================
# API: USUARIOS Y LOGIN
# ==========================================
@app.route('/api/usuarios', methods=['GET'])
def get_usuarios():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usuarios ORDER BY usuario ASC;")
    res = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(res)

@app.route('/api/usuarios', methods=['POST'])
def create_usuario():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO usuarios (usuario, nombre, password, rol)
        VALUES (%s, %s, %s, %s)
    """, (data['usuario'], data['nombre'], data['password'], data['rol']))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/usuarios/<usuario_id>', methods=['DELETE'])
def delete_usuario(usuario_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM usuarios WHERE usuario = %s", (usuario_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/login', methods=['POST'])
def validar_login():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE usuario = %s AND password = %s", (data['usuario'], data['password']))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if user:
        return jsonify(user)
    return jsonify({"error": "Usuario o contraseña incorrectos"}), 404

# ==========================================
# API: RECONOCIMIENTO FACIAL (Por hacer)
# ==========================================
@app.route('/api/login-facial', methods=['POST'])
def login_facial():
    return jsonify({"status": "pendiente"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)