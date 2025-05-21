export const getIdUsuario = () => localStorage.getItem("id_usuario");

export const getNombreUsuario = () => localStorage.getItem("nombre_usuario");

export const getUsuarioAutenticado = () => ({
  id: localStorage.getItem("id_usuario"),
  nombre: localStorage.getItem("nombre_usuario")
});

export const cerrarSesion = () => {
  localStorage.removeItem("id_usuario");
  localStorage.removeItem("nombre_usuario");
};