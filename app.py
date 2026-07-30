import os
import sqlite3
from flask import Flask, render_template, jsonify, request
import face_recognition
import numpy as np
import base64
from PIL import Image
import io

app = Flask(__name__)
DB_NAME = "inventario.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row 
    return conn

def obtener_encoding(base64_string):
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        imagen_bytes = base64.b64decode(base64_string)
        imagen_pil = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
        
        imagen_pil.thumbnail((800, 800))
        rgb = np.array(imagen_pil)
        
        # Aumentamos el upsample a 2 para mayor sensibilidad y flexibilidad en la detección del rostro
        ubicaciones = face_recognition.face_locations(rgb, number_of_times_to_upsample=2, model="hog")
        
        if len(ubicaciones) == 0:
            print("No se encontró ningún rostro en la imagen.")
            return None
            
        encoding = face_recognition.face_encodings(rgb, ubicaciones)[0]
        return encoding
    except Exception as e:
        print("Error procesando imagen:", e)
        return None

@app.route('/')
@app.route('/index.html')
def index(): return render_template('index.html')

@app.route('/login.html')
def login(): return render_template('login.html')

@app.route('/nueva_ventana.html')
def nueva_venta(): return render_template('nueva_ventana.html')

@app.route('/historial.html')
def historial(): return render_template('historial.html')

@app.route('/Usuarios.html')
def usuarios(): return render_template('Usuarios.html')

@app.route('/api/productos', methods=['GET'])
def get_productos():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos ORDER BY codigo ASC;")
    res = [dict(row) for row in cursor.fetchall()]
    cursor.close(); conn.close()
    return jsonify(res)

@app.route('/api/productos', methods=['POST'])
def create_producto():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO productos (codigo, nombre, categoria, costo, precio, stock, unidad)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (data['codigo'], data['nombre'], data.get('categoria', ''), data['costo'], data['precio'], data['stock'], data.get('unidad', 'pieza')))
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({"success": True})

@app.route('/api/productos/<codigo>', methods=['PUT'])
def update_producto(codigo):
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    set_clause = ", ".join([f"{k} = ?" for k in data.keys()])
    values = list(data.values()) + [codigo]
    cursor.execute(f"UPDATE productos SET {set_clause} WHERE codigo = ?", values)
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({"success": True})

@app.route('/api/productos/<codigo>', methods=['DELETE'])
def delete_producto(codigo):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM productos WHERE codigo = ?", (codigo,))
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({"success": True})

@app.route('/api/historial', methods=['GET'])
def get_historial():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM historial ORDER BY fecha DESC;")
    res = [dict(row) for row in cursor.fetchall()]
    cursor.close(); conn.close()
    return jsonify(res)

@app.route('/api/historial', methods=['POST'])
def create_historial():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO historial (folio_venta, descripcion_productos, total, vendedor)
        VALUES (?, ?, ?, ?)
    """, (data['folio_venta'], data['descripcion_productos'], data['total'], data['vendedor']))
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({"success": True})

@app.route('/api/usuarios', methods=['GET'])
def get_usuarios():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usuarios ORDER BY usuario ASC;")
    res = [dict(row) for row in cursor.fetchall()]
    cursor.close(); conn.close()
    return jsonify(res)

@app.route('/api/usuarios', methods=['POST'])
def create_usuario():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO usuarios (usuario, nombre, password, rol)
        VALUES (?, ?, ?, ?)
    """, (data['usuario'], data['nombre'], data['password'], data['rol']))
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({"success": True})

@app.route('/api/usuarios/<usuario_id>', methods=['DELETE'])
def delete_usuario(usuario_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM usuarios WHERE usuario = ?", (usuario_id,))
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({"success": True})

@app.route('/api/login', methods=['POST'])
def validar_login():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE usuario = ? AND password = ?", (data['usuario'], data['password']))
    user = cursor.fetchone()
    cursor.close(); conn.close()
    if user:
        return jsonify(dict(user))
    return jsonify({"error": "Usuario o contraseña incorrectos"}), 404

@app.route("/api/login-facial", methods=["POST"])
def login_facial():
    data = request.json
    encoding = obtener_encoding(data["imagen"])
    if encoding is None:
        return jsonify({"login":False})
        
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT usuario,nombre,rol,face_encoding FROM usuarios")
    usuarios = cur.fetchall()
    cur.close(); conn.close()
    
    for usuario in usuarios:
        if usuario["face_encoding"] is None:
            continue
        guardado = np.array(list(map(float, usuario["face_encoding"].split(","))))
        resultado = face_recognition.compare_faces([guardado], encoding)
        if resultado[0]:
            return jsonify({
                "login":True,
                "usuario":usuario["usuario"],
                "nombre":usuario["nombre"],
                "rol":usuario["rol"]
            })
    return jsonify({"login":False})

@app.route("/api/registrar-rostro", methods=["POST"])
def registrar_rostro():
    data = request.json
    usuario = data["usuario"]
    encoding = obtener_encoding(data["imagen"])
    if encoding is None:
        return jsonify({"error":"No se detectó un rostro claro"}), 400

    texto = ",".join(map(str, encoding.tolist()))
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE usuarios SET face_encoding=? WHERE usuario=?", (texto, usuario))
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"success":True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)