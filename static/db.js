// ==========================================
// FUNCIONES DE INVENTARIO
// ==========================================
export async function obtenerInventario() {
    try {
        const res = await fetch('/api/productos');
        return await res.json();
    } catch (error) {
        console.error('Error al cargar inventario:', error);
        return [];
    }
}

export async function crearProductoBD(producto) {
    try {
        const res = await fetch('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
        });
        return res.ok;
    } catch (error) {
        console.error('Error al crear:', error);
        return false;
    }
}

export async function actualizarProductoBD(codigoOriginal, datosNuevos) {
    try {
        const res = await fetch('/api/productos/' + codigoOriginal, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosNuevos)
        });
        return res.ok;
    } catch (error) {
        console.error('Error al actualizar:', error);
        return false;
    }
}

export async function eliminarProductoBD(codigo) {
    try {
        const res = await fetch('/api/productos/' + codigo, {
            method: 'DELETE'
        });
        return res.ok;
    } catch (error) {
        console.error('Error al eliminar:', error);
        return false;
    }
}

// ==========================================
// FUNCIONES DE HISTORIAL
// ==========================================
export async function registrarVentaBD(venta) {
    try {
        const res = await fetch('/api/historial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venta)
        });
        return res.ok;
    } catch (error) {
        console.error('Error al registrar venta:', error);
        return false;
    }
}

export async function obtenerHistorialBD() {
    try {
        const res = await fetch('/api/historial');
        return await res.json();
    } catch (error) {
        console.error('Error al cargar historial:', error);
        return [];
    }
}

// ==========================================
// FUNCIONES DE USUARIOS Y LOGIN
// ==========================================
export async function obtenerUsuariosBD() {
    try {
        const res = await fetch('/api/usuarios');
        return await res.json();
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        return [];
    }
}

export async function crearUsuarioBD(nuevoUsuario) {
    try {
        const res = await fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoUsuario)
        });
        return res.ok;
    } catch (error) {
        console.error('Error al crear usuario:', error);
        return false;
    }
}

export async function eliminarUsuarioBD(usuarioId) {
    try {
        const res = await fetch('/api/usuarios/' + usuarioId, {
            method: 'DELETE'
        });
        return res.ok;
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return false;
    }
}

export async function validarLoginBD(usuario, password) {
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        
        if (res.ok) {
            return await res.json();
        }
        return null;
    } catch (error) {
        console.error('Error en login:', error);
        return null;
    }
}