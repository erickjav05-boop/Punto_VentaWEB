import { actualizarProductoBD, registrarVentaBD, obtenerHistorialBD } from './db.js';
import { fmt, toast } from './utils.js';
import { Session } from './session.js';
import { productos, renderizarTablaInventario, cargarYRenderizarInventario } from './inventario.js';

let carrito = [];
let historialVentas = [];

export function renderizarTablaVenta(lista) {
  const datos = lista !== undefined ? lista : productos;
  const tbody = document.getElementById('tbody-venta-productos');
  if (!tbody) return;
  tbody.innerHTML = '';
  datos.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.nombre}</td>
      <td>${fmt(p.precio)}</td>
      <td>${p.stock}</td>
      <td><button class="btn btn-primary btn-sm" data-codigo="${p.codigo}">+ Agregar</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => agregarAlCarrito(p.codigo));
    tbody.appendChild(tr);
  });
}

function agregarAlCarrito(codigo) {
  const prod = productos.find(p => p.codigo === codigo);
  if (!prod) return;
  const existente = carrito.find(i => i.producto.codigo === codigo);
  if (existente) {
    if (existente.cantidad >= prod.stock) { toast('No hay más stock disponible.', 'error'); return; }
    existente.cantidad++;
  } else {
    if (prod.stock < 1) { toast('Sin stock.', 'error'); return; }
    carrito.push({ producto: prod, cantidad: 1 });
  }
  renderizarCarrito();
}

function renderizarCarrito() {
  const contenedor = document.getElementById('carrito-items');
  const totalEl    = document.getElementById('carrito-total-valor');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  let total = 0;
  carrito.forEach((item, idx) => {
    total += item.producto.precio * item.cantidad;
    const div = document.createElement('div');
    div.className = 'carrito-item';
    div.innerHTML = `
      <span class="carrito-item-name">${item.producto.nombre}</span>
      <div class="carrito-item-row">
        <span class="carrito-item-price">${fmt(item.producto.precio)} c/u</span>
        <input class="qty-input" type="number" min="1" max="${item.producto.stock}" value="${item.cantidad}" data-idx="${idx}" />
        <button class="btn-remove-item" data-idx="${idx}" title="Quitar">✕</button>
      </div>
    `;
    
    div.querySelector('.qty-input').addEventListener('change', e => {
      const val = parseInt(e.target.value, 10);
      if (val < 1) { carrito[idx].cantidad = 1; }
      else if (val > item.producto.stock) { carrito[idx].cantidad = item.producto.stock; }
      else { carrito[idx].cantidad = val; }
      renderizarCarrito();
    });
    div.querySelector('.btn-remove-item').addEventListener('click', () => { carrito.splice(idx, 1); renderizarCarrito(); });
    contenedor.appendChild(div);
  });
  if (totalEl) totalEl.textContent = fmt(total);
}

function generarTicketPDF(venta, items) {
  const { jsPDF } = window.jspdf;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 150] 
  });
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("InvSys", 40, 10, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text("Ticket de Venta", 40, 16, { align: "center" });
  
  doc.setFontSize(9);
  doc.text(`Folio: ${venta.folio_venta}`, 5, 25);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 5, 30);
  doc.text(`Cajero: ${venta.vendedor}`, 5, 35);
  doc.text("-------------------------------------------------", 5, 40);
  let y = 45;
  items.forEach(item => {
    doc.text(`${item.cantidad}x ${item.producto.nombre}`, 5, y);
    doc.text(`${fmt(item.producto.precio * item.cantidad)}`, 75, y, { align: "right" });
    y += 6;
  });
  doc.text("-------------------------------------------------", 5, y);
  y += 6;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL: ${fmt(venta.total)}`, 75, y, { align: "right" });
  y += 10;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text("¡Gracias por tu compra!", 40, y, { align: "center" });
  doc.save(`Ticket_${venta.folio_venta}.pdf`);
}

export async function confirmarVenta() {
  if (carrito.length === 0) { toast('El carrito está vacío.', 'error'); return; }
  let total = 0;
  let arrayProductosVenta = [];
  for (let item of carrito) {
    total += item.producto.precio * item.cantidad;
    const nuevoStock = item.producto.stock - item.cantidad;
    await actualizarProductoBD(item.producto.codigo, { stock: nuevoStock });
    arrayProductosVenta.push(`${item.producto.nombre} x${item.cantidad}`);
  }
  const sesion = Session.obtener();
  const nuevaVenta = {
    folio_venta: 'VTA' + String(Date.now()).slice(-6),
    descripcion_productos: arrayProductosVenta.join(', '),
    total: total,
    vendedor: sesion ? sesion.nombre : 'Desconocido'
  };
  const exito = await registrarVentaBD(nuevaVenta);
  
  if (exito) {
    try {
      generarTicketPDF(nuevaVenta, carrito);
    } catch (error) {
      console.error("Error al generar el ticket PDF:", error);
      toast('Venta registrada, pero falló el ticket PDF', 'error');
    }
    carrito = [];
    renderizarCarrito();
    toast('Venta registrada exitosamente.');
    
    await cargarYRenderizarInventario(); 
    renderizarTablaVenta();
    
    const tbodyHistorial = document.getElementById('tbody-historial');
    if(tbodyHistorial){
       await cargarYRenderizarHistorial();
    }
  } else {
    toast('Error al registrar la venta.', 'error');
  }
}

export async function cargarYRenderizarHistorial() {
    historialVentas = await obtenerHistorialBD();
    renderizarHistorial();
}

export function renderizarHistorial() {
  const tbody = document.getElementById('tbody-historial');
  const empty = document.getElementById('historial-vacio');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (historialVentas.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  historialVentas.forEach(v => {
    const tr = document.createElement('tr');
    const fechaFormateada = new Date(v.fecha).toLocaleString('es-MX');
    tr.innerHTML = `
      <td>${v.folio_venta}</td>
      <td>${fechaFormateada}</td>
      <td>${v.descripcion_productos}</td>
      <td>${fmt(v.total)}</td>
      <td>${v.vendedor}</td>
    `;
    tbody.appendChild(tr);
  });
}