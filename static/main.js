'use strict';
import { Session } from './session.js';
import { alternarTema } from './utils.js';
import { inicializarEventosModales } from './modales.js';
import { validarLoginBD } from './db.js';
import { 
    productos, cargarYRenderizarInventario, filtrarProductos, 
    abrirModalInventario, eliminarProducto, guardarProducto, getProductoSeleccionado
} from './inventario.js';
import { renderizarTablaVenta, confirmarVenta, cargarYRenderizarHistorial } from './ventas.js';
import { cargarYRenderizarUsuarios, guardarUsuario, encenderCamaraRegistro, apagarCamaraRegistro } from './usuarios.js';

function cambiarVista(nombre) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.remove('active'));
    const vista = document.getElementById('view-' + nombre);
    if (vista) vista.classList.add('active');
    const btn = document.querySelector('.nav-btn[data-view="' + nombre + '"]');
    if (btn) btn.classList.add('active');
}

function inicializarLogin() {
  const btnLogin  = document.getElementById('btn-login');
  if (!btnLogin) return;
  
  if (Session.obtener()) { window.location.href = 'index.html'; return; }
  
  async function intentar() {
    const u = document.getElementById('usuario').value.trim();
    const p = document.getElementById('password').value;
    const err = document.getElementById('error-msg');
    
    if (err) err.style.display = 'none';
    if (!u || !p) { 
        if (err) { err.textContent = 'Completa todos los campos.'; err.style.display = 'block'; } 
        return; 
    }
    const found = await validarLoginBD(u, p);
    if (found) {
      Session.guardar({ usuario: found.usuario, nombre: found.nombre, rol: found.rol });
      window.location.href = 'index.html';
    } else {
      if (err) { err.textContent = 'Usuario o contraseña incorrectos.'; err.style.display = 'block'; }
      document.getElementById('password').value = '';
    }
  }
  btnLogin.addEventListener('click', intentar);
  document.getElementById('usuario')?.addEventListener('keydown', e => e.key==='Enter' && intentar());
  document.getElementById('password')?.addEventListener('keydown', e => e.key==='Enter' && intentar());

  const videoLogin = document.querySelector('video');
  if (videoLogin) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => { videoLogin.srcObject = stream; videoLogin.play(); })
        .catch(err => console.error("Error al acceder a la cámara:", err));
  }

  window.loginFacial = async function() {
      if (!videoLogin || !videoLogin.srcObject) {
          alert('La cámara no está encendida.'); return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = videoLogin.videoWidth;
      canvas.height = videoLogin.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoLogin, 0, 0, canvas.width, canvas.height);
      const imagenData = canvas.toDataURL('image/jpeg');

      try {
          const res = await fetch('/api/login-facial', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imagen: imagenData })
          });
          const data = await res.json();
          if (data.login) {
              Session.guardar({ usuario: data.usuario, nombre: data.nombre, rol: data.rol });
              const pistas = videoLogin.srcObject.getTracks();
              pistas.forEach(pista => pista.stop());
              window.location.href = 'index.html';
          } else {
              alert('Rostro no reconocido.');
          }
      } catch (error) {
          console.error('Error en login facial:', error);
          alert('Error al conectar con el servidor.');
      }
  };
}

async function inicializarApp() {
  const sesion = Session.obtener();
  Session.requerirAutenticacion();
  const temaGuardado = localStorage.getItem('tema') || 'dark';
  document.body.className = temaGuardado + '-theme';
  const paginaActual = window.location.pathname.split('/').pop();

  if (sesion) {
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = sesion.nombre || 'Usuario';
    if (roleEl) roleEl.textContent = 'Rol: ' + (sesion.rol || 'empleado');
    if (avatarEl) avatarEl.textContent = (sesion.nombre || 'U')[0].toUpperCase();

    if (sesion.rol === 'empleado') {
      const btnInv = document.querySelector('.nav-btn[data-view="inventario"]');
      const btnUsu = document.querySelector('.nav-btn[data-view="usuarios"]');
      if (btnInv) btnInv.style.display = 'none';
      if (btnUsu) btnUsu.style.display = 'none';
      if (paginaActual === 'index.html' || paginaActual === '' || paginaActual === 'Usuarios.html') {
        window.location.href = 'nueva_ventana.html';
        return; 
      }
    }
  }

  if (paginaActual === 'index.html' || paginaActual === '' || paginaActual === 'nueva_ventana.html') {
      await cargarYRenderizarInventario();
      if (paginaActual === 'nueva_ventana.html' || (paginaActual === 'index.html' && document.getElementById('view-nueva-venta'))) {
          renderizarTablaVenta();
      }
  }
  if (paginaActual === 'historial.html' || (paginaActual === 'index.html' && document.getElementById('view-historial'))) {
      await cargarYRenderizarHistorial();
  }
  if (paginaActual === 'Usuarios.html' || (paginaActual === 'index.html' && document.getElementById('view-usuarios'))) {
      await cargarYRenderizarUsuarios();
  }

  inicializarEventosModales();

  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
        if(!btn.hasAttribute('onclick')) cambiarVista(btn.dataset.view);
    });
  });

  document.getElementById('btn-cerrar-sesion')?.addEventListener('click', Session.cerrar.bind(Session));
  document.getElementById('btn-cambiar-tema')?.addEventListener('click', alternarTema);
  
  document.getElementById('buscador-inventario')?.addEventListener('input', e => filtrarProductos(e.target.value));
  document.getElementById('btn-agregar')?.addEventListener('click', () => abrirModalInventario('agregar'));
  document.getElementById('btn-editar')?.addEventListener('click', () => {
    const prodSel = getProductoSeleccionado();
    if (!prodSel) return;
    const prod = productos.find(p => p.codigo === prodSel);
    abrirModalInventario('editar', prod);
  });
  document.getElementById('btn-eliminar')?.addEventListener('click', eliminarProducto);
  document.getElementById('btn-guardar-producto')?.addEventListener('click', guardarProducto);

  document.getElementById('buscador-venta')?.addEventListener('input', e => {
    const t = e.target.value.toLowerCase();
    const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t));
    renderizarTablaVenta(filtrados);
  });
  document.getElementById('btn-confirmar-venta')?.addEventListener('click', confirmarVenta);

  document.getElementById('btn-agregar-usuario')?.addEventListener('click', () => {
    document.getElementById('modal-usuario').style.display = 'flex';
    encenderCamaraRegistro();
  });
  
  document.getElementById('btn-guardar-usuario')?.addEventListener('click', () => {
      guardarUsuario();
      apagarCamaraRegistro();
  });

  document.querySelectorAll('[data-close-modal="modal-usuario"]').forEach(btn => {
      btn.addEventListener('click', apagarCamaraRegistro);
  });
}

function arrancarSistema() {
  const pagina = window.location.pathname.split('/').pop();
  if (pagina === 'login.html') {
    inicializarLogin();
  } else {
    inicializarApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', arrancarSistema);
} else {
  arrancarSistema();
}