// Importamos la librería directamente desde el CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
// Tus credenciales
const SUPABASE_URL = 'https://pmhainjpreboabxadett.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtaGFpbmpwcmVib2FieGFkZXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzU2NzEsImV4cCI6MjA5Nzc1MTY3MX0.7aZF6JpkJ0ZStD9bKF8SvvpPJrBh1sBedGvZapYAbzw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function obtenerInventario() {
    const { data, error } = await supabase.from('productos').select('*').order('codigo', { ascending: true });
    if (error) { console.error('Error al cargar inventario:', error); return []; }
    return data;
}

export async function crearProductoBD(producto) {
    const { error } = await supabase.from('productos').insert([producto]);
    if (error) { console.error('Error al crear:', error); return false; }
    return true;
}

export async function actualizarProductoBD(codigoOriginal, datosNuevos) {
    const { error } = await supabase.from('productos').update(datosNuevos).eq('codigo', codigoOriginal);
    if (error) { console.error('Error al actualizar:', error); return false; }
    return true;
}

export async function eliminarProductoBD(codigo) {
    const { error } = await supabase.from('productos').delete().eq('codigo', codigo);
    if (error) { console.error('Error al eliminar:', error); return false; }
    return true;
}

export async function registrarVentaBD(venta) {
    // Inserta la venta en la tabla 'historial'
    const { error } = await supabase.from('historial').insert([venta]);
    if (error) { console.error('Error al registrar venta:', error); return false; }
    return true;
}

export async function obtenerHistorialBD() {
    // Consulta la tabla 'historial' ordenando por fecha de la más reciente a la más antigua
    // Nota: Asegúrate de que tu tabla en Supabase se llame 'historial' y tenga una columna 'fecha'
    const { data, error } = await supabase.from('historial').select('*').order('fecha', { ascending: false });
    if (error) { console.error('Error al cargar historial:', error); return []; }
    return data;
}

// ─── FUNCIONES DE USUARIOS Y LOGIN ────────────────────────

export async function obtenerUsuariosBD() {
    const { data, error } = await supabase.from('usuarios').select('*').order('usuario', { ascending: true });
    if (error) { console.error('Error al cargar usuarios:', error); return []; }
    return data;
}

export async function crearUsuarioBD(nuevoUsuario) {
    const { error } = await supabase.from('usuarios').insert([nuevoUsuario]);
    if (error) { console.error('Error al crear usuario:', error); return false; }
    return true;
}

export async function eliminarUsuarioBD(usuarioId) {
    const { error } = await supabase.from('usuarios').delete().eq('usuario', usuarioId);
    if (error) { console.error('Error al eliminar usuario:', error); return false; }
    return true;
}

export async function validarLoginBD(usuario, password) {
    // Busca en la tabla si existe un registro que coincida con el usuario y la contraseña
    const { data, error } = await supabase.from('usuarios')
        .select('*')
        .eq('usuario', usuario)
        .eq('password', password);
    
    if (error) { console.error('Error en login:', error); return null; }
    
    // Si encuentra datos, retorna el primer usuario encontrado; si no, retorna nulo
    return data && data.length > 0 ? data[0] : null; 
}