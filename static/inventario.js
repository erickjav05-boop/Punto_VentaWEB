import { obtenerInventario, crearProductoBD, actualizarProductoBD, eliminarProductoBD } from './db.js';
import { fmt, toast } from './utils.js';
import { cerrarModal } from './modales.js';

const STOCK_MINIMO = 5;
export let productos = [];
let productoSeleccionado = null;
let modoModal = 'agregar';

export async function cargarYRenderizarInventario() {
    productos = await obtenerInventario();
    renderizarTablaInventario();
}

export function renderizarTablaInventario(lista) {
  const datos = lista !== undefined ? lista : productos;
  const tbody  = document.getElementById('tbody-inventario');
  if (!tbody) return;

  tbody.innerHTML = '';
  datos.forEach(p => {
    const tr = document.createElement('tr');
    if (productoSeleccionado === p.codigo) tr.classList.add('selected');

    const stockClass = p.stock < STOCK_MINIMO ? 'stock-low-cell' : '';

    tr.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.nombre}</td>
      <td>${p.categoria}</td>
      <td>${fmt(p.costo)}</td>
      <td>${fmt(p.precio)}</td>
      <td class="${stockClass}">${p.stock}</td>
      <td>${p.unidad}</td>
    `;

    tr.addEventListener('click', () => {
      productoSeleccionado = p.codigo;
      document.querySelectorAll('#tbody-inventario tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
    });

    tbody.appendChild(tr);
  });
  gestionarStock();
}

export function filtrarProductos(texto) {
  const t = texto.toLowerCase();
  const filtrados = productos.filter(p =>
    p.codigo.toLowerCase().includes(t) ||
    p.nombre.toLowerCase().includes(t) ||
    p.categoria.toLowerCase().includes(t)
  );
  renderizarTablaInventario(filtrados);
}

function gestionarStock() {
  const bajos = productos.filter(p => p.stock < STOCK_MINIMO).map(p => p.nombre);
  const alerta = document.getElementById('stock-alert');
  const texto  = document.getElementById('stock-alert-text');
  if (!alerta) return;

  if (bajos.length > 0) {
    alerta.style.display = 'flex';
    texto.textContent = 'Stock bajo: ' + bajos.join(', ');
  } else {
    alerta.style.display = 'none';
  }
}

export function abrirModalInventario(modo, producto) {
  modoModal = modo;
  const modal = document.getElementById('modal-producto');
  document.getElementById('modal-titulo').textContent = modo === 'agregar' ? 'Agregar Producto' : 'Editar Producto';

  ['modal-codigo','modal-nombre','modal-categoria','modal-unidad',
   'modal-costo','modal-precio','modal-stock','modal-codigo-original']
    .forEach(id => { document.getElementById(id).value = ''; });

  document.getElementById('modal-codigo').readOnly = (modo === 'editar');

  if (modo === 'editar' && producto) {
    document.getElementById('modal-codigo-original').value = producto.codigo;
    document.getElementById('modal-codigo').value     = producto.codigo;
    document.getElementById('modal-nombre').value     = producto.nombre;
    document.getElementById('modal-categoria').value  = producto.categoria;
    document.getElementById('modal-unidad').value     = producto.unidad;
    document.getElementById('modal-costo').value      = producto.costo;
    document.getElementById('modal-precio').value     = producto.precio;
    document.getElementById('modal-stock').value      = producto.stock;
  }
  modal.style.display = 'flex';
}

export async function guardarProducto() {
  const codigo    = document.getElementById('modal-codigo').value.trim();
  const nombre    = document.getElementById('modal-nombre').value.trim();
  const categoria = document.getElementById('modal-categoria').value.trim();
  const unidad    = document.getElementById('modal-unidad').value.trim();
  const costo     = parseFloat(document.getElementById('modal-costo').value);
  const precio    = parseFloat(document.getElementById('modal-precio').value);
  const stock     = parseInt(document.getElementById('modal-stock').value, 10);

  if (!codigo || !nombre || isNaN(costo) || isNaN(precio) || isNaN(stock)) {
    toast('Completa todos los campos correctamente.', 'error');
    return;
  }

  const nuevoProducto = { codigo, nombre, categoria, costo, precio, stock, unidad };

  if (modoModal === 'agregar') {
    if (productos.find(p => p.codigo === codigo)) { toast('Ya existe un producto con ese código.', 'error'); return; }
    const exito = await crearProductoBD(nuevoProducto);
    if (exito) toast('Producto agregado correctamente.');
  } else {
    const codigoOriginal = document.getElementById('modal-codigo-original').value;
    const exito = await actualizarProductoBD(codigoOriginal, nuevoProducto);
    if (exito) { toast('Producto actualizado.'); productoSeleccionado = codigo; }
  }

  cerrarModal('modal-producto');
  await cargarYRenderizarInventario();
}

export async function eliminarProducto() {
  if (!productoSeleccionado) { toast('Selecciona un producto primero.', 'error'); return; }
  if (!confirm('¿Eliminar el producto ' + productoSeleccionado + ' de la base de datos?')) return;

  const exito = await eliminarProductoBD(productoSeleccionado);
  if (exito) {
    productoSeleccionado = null;
    await cargarYRenderizarInventario();
    toast('Producto eliminado.');
  } else {
    toast('Error al eliminar.', 'error');
  }
}
export const getProductoSeleccionado = () => productoSeleccionado;