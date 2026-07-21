export function cerrarModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

export function inicializarEventosModales() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => cerrarModal(btn.dataset.closeModal));
    });
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) cerrarModal(overlay.id);
      });
    });
    
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
      }
    });
}