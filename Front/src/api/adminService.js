import apiClient from './apiClient';

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

export const getUsuarios = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/usuarios/', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

export const deleteUsuario = async (userId) => {
  try {
    await apiClient.delete(`/api/usuarios/${userId}/`);
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

export const updateUsuario = async (userId, data) => {
  try {
    const response = await apiClient.patch(`/api/usuarios/${userId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

// ============================================
// GESTIÓN DE COMENTARIOS
// ============================================

export const getComentarios = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/comentarios/', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    throw error;
  }
};

export const deleteComentario = async (comentarioId) => {
  try {
    await apiClient.delete(`/api/comentarios/${comentarioId}/`);
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    throw error;
  }
};

// ============================================
// GESTIÓN DE MATERIALES (mejoras)
// ============================================

// Obtener todos los libros para gestión
export const getAllLibros = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/libros/', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener libros:', error);
    throw error;
  }
};

// Obtener todos los mangas para gestión
export const getAllMangas = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/mangas/', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener mangas:', error);
    throw error;
  }
};

// Obtener todas las novelas para gestión
export const getAllNovelas = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/novelas/', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener novelas:', error);
    throw error;
  }
};

// Actualizar un libro
export const updateLibro = async (libroId, data) => {
  try {
    const response = await apiClient.patch(`/api/libros/${libroId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar libro:', error);
    throw error;
  }
};

// Eliminar un libro
export const deleteLibro = async (libroId) => {
  try {
    await apiClient.delete(`/api/libros/${libroId}/`);
  } catch (error) {
    console.error('Error al eliminar libro:', error);
    throw error;
  }
};

// Actualizar un manga
export const updateManga = async (mangaId, data) => {
  try {
    const response = await apiClient.patch(`/api/mangas/${mangaId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar manga:', error);
    throw error;
  }
};

// Eliminar un manga
export const deleteManga = async (mangaId) => {
  try {
    await apiClient.delete(`/api/mangas/${mangaId}/`);
  } catch (error) {
    console.error('Error al eliminar manga:', error);
    throw error;
  }
};

// Actualizar una novela
export const updateNovela = async (novelaId, data) => {
  try {
    const response = await apiClient.patch(`/api/novelas/${novelaId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar novela:', error);
    throw error;
  }
};

// Eliminar una novela
export const deleteNovela = async (novelaId) => {
  try {
    await apiClient.delete(`/api/novelas/${novelaId}/`);
  } catch (error) {
    console.error('Error al eliminar novela:', error);
    throw error;
  }
};
