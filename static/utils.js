export function fmt(n) { 
    return '$' + Number(n).toFixed(2); 
}
export function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show' + (tipo === 'error' ? ' error' : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = 'toast'; }, 2800);
}
export function alternarTema() {
  const body = document.body;
  if (body.classList.contains('dark-theme')) {
    body.classList.replace('dark-theme', 'light-theme');
    localStorage.setItem('tema', 'light');
  } else {
    body.classList.replace('light-theme', 'dark-theme');
    localStorage.setItem('tema', 'dark');
  }
}