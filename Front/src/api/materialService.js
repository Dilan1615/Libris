import apiClient from './apiClient';

// Obtener Libros (Ruta: /api/libros/)
export const getLibros = async (params = {}) => {
  const response = await apiClient.get('/api/libros/', { params }); 
  return response.data; 
};

// Obtener Mangas (Ruta: /api/mangas/)
export const getMangas = async (params = {}) => {
  const response = await apiClient.get('/api/mangas/', { params });
  return response.data;
};

// Obtener Novelas (Ruta: /api/novelas/)
export const getNovelas = async (params = {}) => {
  const response = await apiClient.get('/api/novelas/', { params });
  return response.data;
};

// Obtener un material específico por tipo e ID
export const getMaterialById = async (tipo, id) => {
  const endpoint = tipo === 'libro' ? '/api/libros/' : tipo === 'manga' ? '/api/mangas/' : '/api/novelas/';
  const response = await apiClient.get(`${endpoint}${id}/`);
  return response.data;
};

// Obtener Libros Externos de Google (Ruta: /api/libros-externos/)
export const getLibrosExternos = async () => {
  const response = await apiClient.get('/api/libros-externos/');
  return response.data;
};

// Iniciar/Continuar Lectura (Ruta: /api/registros/)
export const createRegistroLectura = async (data) => {
  // data debe incluir { material: material_id, pagina_actual: 1, estado: 'PENDIENTE' }
  const response = await apiClient.post('/api/registros/', data);
  return response.data;
};

// Crear Comentario (Ruta: /api/comentarios/)
export const createComentario = async (data) => {
    // data debe incluir { libro: id/null, manga: id/null, novela: id/null, descripcion: "..." }
    const response = await apiClient.post('/api/comentarios/', data);
    return response.data;
};

// Actualizar Comentario (Ruta: /api/comentarios/{id}/)
export const updateComentario = async (id, data) => {
    const response = await apiClient.patch(`/api/comentarios/${id}/`, data);
    return response.data;
};

// Eliminar Comentario (Ruta: /api/comentarios/{id}/)
export const deleteComentario = async (id) => {
    await apiClient.delete(`/api/comentarios/${id}/`);
};

// Obtener comentarios de un material específico
export const getComentariosByMaterial = async (tipo, id) => {
  const materialKey = tipo === 'libro' ? 'libro' : tipo === 'manga' ? 'manga' : 'novela';
  const response = await apiClient.get('/api/comentarios/', {
    params: { [materialKey]: id }
  });
  return response.data;
};

// Obtener el historial de lectura del usuario (Ruta: /api/registros/)
export const getRegistrosLectura = async (params = {}) => {
  // El backend debe usar el permiso IsAuthenticated y filtrar por el usuario actual.
  const response = await apiClient.get('/api/registros/', { params });
  return response.data; // Esperamos { count, next, previous, results: [...] }
};

// Actualizar un Registro de Lectura (ej: cambiar estado o página actual)
export const updateRegistroLectura = async (id, data) => {
    const response = await apiClient.patch(`/api/registros/${id}/`, data); // Usamos PATCH para actualizar parcialmente
    return response.data;
};

// Eliminar un Registro de Lectura
export const deleteRegistroLectura = async (id) => {
    await apiClient.delete(`/api/registros/${id}/`);
};