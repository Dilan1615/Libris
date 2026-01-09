import apiClient from './apiClient';

// ===========================
// Servicio de Calificaciones
// ===========================

export const calificacionService = {
  // Obtener todas mis calificaciones
  getMyRatings: async () => {
    try {
      const response = await apiClient.get('/api/calificaciones/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo calificaciones:', error);
      throw error;
    }
  },

  // Calificar un material
  rateaterial: async (materialData) => {
    // materialData debe tener: { rating, libro?, manga?, novela? }
    try {
      const response = await apiClient.post('/api/calificaciones/', materialData);
      return response.data;
    } catch (error) {
      console.error('Error al calificar:', error);
      throw error;
    }
  },

  // Actualizar una calificación
  updateRating: async (ratingId, rating) => {
    try {
      const response = await apiClient.patch(`/api/calificaciones/${ratingId}/`, {
        rating,
      });
      return response.data;
    } catch (error) {
      console.error('Error actualizando calificación:', error);
      throw error;
    }
  },

  // Eliminar una calificación
  deleteRating: async (ratingId) => {
    try {
      await apiClient.delete(`/api/calificaciones/${ratingId}/`);
      return { success: true };
    } catch (error) {
      console.error('Error eliminando calificación:', error);
      throw error;
    }
  },
};

// ===========================
// Servicio de Favoritos
// ===========================

export const favoritoService = {
  // Obtener todos mis favoritos
  getMyFavorites: async () => {
    try {
      const response = await apiClient.get('/api/favoritos/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo favoritos:', error);
      throw error;
    }
  },

  // Agregar a favoritos
  addFavorite: async (materialData) => {
    // materialData debe tener: { libro?, manga?, novela? }
    try {
      const response = await apiClient.post('/api/favoritos/', materialData);
      return response.data;
    } catch (error) {
      console.error('Error al agregar a favoritos:', error);
      throw error;
    }
  },

  // Eliminar de favoritos
  removeFavorite: async (favoriteId) => {
    try {
      await apiClient.delete(`/api/favoritos/${favoriteId}/`);
      return { success: true };
    } catch (error) {
      console.error('Error eliminando favorito:', error);
      throw error;
    }
  },

  // Verificar si un material es favorito (mediante el array de favoritos)
  isFavorite: async (materialId, materialType) => {
    try {
      const favoritos = await favoritoService.getMyFavorites();
      return favoritos.results?.some(fav => fav.material_info?.id === materialId);
    } catch (error) {
      console.error('Error verificando favorito:', error);
      return false;
    }
  },

  // Verificar rápidamente si un material está en favoritos
  checkIfFavorite: async (materialId) => {
    try {
      const favoritos = await favoritoService.getMyFavorites();
      return favoritos.results?.some(fav => fav.material_info?.id === materialId) || false;
    } catch (error) {
      console.error('Error verificando favorito:', error);
      return false;
    }
  },
};

// ===========================
// Servicio de Estadísticas
// ===========================

export const estadisticasService = {
  // Obtener estadísticas personales del usuario
  getMyStats: async (userId) => {
    try {
      const response = await apiClient.get(`/api/usuarios/${userId}/estadisticas/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  },
};
