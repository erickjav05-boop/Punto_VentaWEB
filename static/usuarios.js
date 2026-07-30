import { obtenerUsuariosBD, crearUsuarioBD, eliminarUsuarioBD } from './db.js';
import { toast } from './utils.js';
import { cerrarModal } from './modales.js';

let listaUsuarios = [];

export async function cargarYRenderizarUsuarios() {
    listaUsuarios = await obtenerUsuariosBD();
    renderizarUsuarios();
}

export function renderizarUsuarios() {
  const tbody = document.getElementById('tbody-usuarios');
  if (!tbody) return;
  tbody.innerHTML = '';
  listaUsuarios.forEach((u) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.usuario}</td>
      <td>${u.nombre}</td>
      <td>${u.rol}</td>
      <td><button class="btn btn-danger btn-sm">Eliminar</button></td>
    `;
    
    tr.querySelector('button').addEventListener('click', async () => {
      if (!confirm('¿Eliminar usuario ' + u.usuario + '?')) return;
      
      const exito = await eliminarUsuarioBD(u.usuario);
      if (exito) {
        await cargarYRenderizarUsuarios();
        toast('Usuario eliminado exitosamente.');
      } else {
        toast('Error al eliminar el usuario.', 'error');
      }
    });
    
    tbody.appendChild(tr);
  });
}

// ==========================================
// LÓGICA DE RECONOCIMIENTO FACIAL (REGISTRO)
// ==========================================

export async function encenderCamaraRegistro() {
    const video = document.getElementById('video-registro');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        toast("No se pudo acceder a la cámara. Revisa los permisos.", "error");
    }
}

export function apagarCamaraRegistro() {
    const video = document.getElementById('video-registro');
    if (video && video.srcObject) {
        const pistas = video.srcObject.getTracks();
        pistas.forEach(pista => pista.stop());
        video.srcObject = null;
    }
}

// ==========================================
// GUARDAR USUARIO Y ROSTRO AL MISMO TIEMPO
// ==========================================
export async function guardarUsuario() {
  const nombre   = document.getElementById('mu-nombre').value.trim();
  const usuario  = document.getElementById('mu-usuario').value.trim();
  const password = document.getElementById('mu-password').value;
  const rol      = document.getElementById('mu-rol').value;
  
  if (!nombre || !usuario || !password) { toast('Completa todos los campos.', 'error'); return; }
  if (listaUsuarios.find(u => u.usuario === usuario)) { toast('Ese nombre de usuario ya existe.', 'error'); return; }
  
  // 1. Guardar primero al usuario en la Base de Datos
  const exito = await crearUsuarioBD({ usuario, nombre, password, rol });
  
  if (exito) {
      const video = document.getElementById('video-registro');
      
      if (video) {
          toast('Registrando usuario y escaneando rostro...', 'ok');
          const canvas = document.getElementById('canvas-registro');
          const ctx = canvas.getContext('2d');
          
          // Forzar dimensiones del video actual
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imagenData = canvas.toDataURL('image/jpeg');
          
          // 2. Enviar la imagen al servidor sin condiciones previas
          try {
              const res = await fetch('/api/registrar-rostro', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ usuario: usuario, imagen: imagenData })
              });
              
              const data = await res.json();
              if (data.success) {
                  toast('¡Rostro y usuario guardados con éxito!');
              } else {
                  console.warn('Aviso de rostro:', data.error);
                  toast('Usuario guardado, pero el rostro no pasó el filtro: ' + (data.error || 'Intenta de nuevo'), 'error');
              }
          } catch (e) {
              console.error('Error enviando rostro:', e);
          }
      }
      
      cerrarModal('modal-usuario');
      await cargarYRenderizarUsuarios();
  } else {
      toast('Error al crear usuario en la base de datos.', 'error');
  }
}

// Anulamos el botón viejo por si le das clic por accidente
window.registrarRostro = function() {
    toast('¡Solo dale clic al botón verde de "Guardar" para hacer todo de un golpe!', 'ok');
};