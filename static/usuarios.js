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

export async function guardarUsuario() {
  const nombre   = document.getElementById('mu-nombre').value.trim();
  const usuario  = document.getElementById('mu-usuario').value.trim();
  const password = document.getElementById('mu-password').value;
  const rol      = document.getElementById('mu-rol').value;

  if (!nombre || !usuario || !password) { toast('Completa todos los campos.', 'error'); return; }
  
  if (listaUsuarios.find(u => u.usuario === usuario)) { toast('Ese nombre de usuario ya existe.', 'error'); return; }

  const exito = await crearUsuarioBD({ usuario, nombre, password, rol });
  
  if (exito) {
      cerrarModal('modal-usuario');
      await cargarYRenderizarUsuarios();
      toast('Usuario creado exitosamente.');
  } else {
      toast('Error al crear usuario.', 'error');
  }
}