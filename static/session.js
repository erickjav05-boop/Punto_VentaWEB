export const Session = {
  guardar(u) { 
      localStorage.setItem('sesion_activa', JSON.stringify(u)); 
  },
  obtener()  {
    try { 
        return JSON.parse(localStorage.getItem('sesion_activa')); 
    } catch { 
        return null; 
    }
  },
  cerrar()   { 
      localStorage.removeItem('sesion_activa'); 
      window.location.href = 'login.html'; 
  },
  requerirAutenticacion() { 
      if (!this.obtener()) {
          window.location.href = 'login.html'; 
      }
  }
};