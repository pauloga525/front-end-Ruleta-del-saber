// Servicio para comunicarse con la API del backend

// Detectar si estamos en desarrollo y usar la IP correcta
const getApiBaseUrl = () => {
  // Si hay una variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // En desarrollo, usar el hostname actual del navegador
  if (import.meta.env.DEV) {
    const hostname = window.location.hostname;
    return `http://${hostname}:5000/api`;
  }
  
  // En producción, usar localhost
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('📡 API Base URL:', API_BASE_URL);

/**
 * Obtener todas las preguntas agrupadas por categoría
 */
export async function obtenerTodasLasPreguntas() {
  try {
    const response = await fetch(`${API_BASE_URL}/preguntas`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data.success ? data.data : {};
  } catch (error) {
    console.error('Error al obtener todas las preguntas:', error);
    throw error;
  }
}

/**
 * Obtener preguntas de una categoría específica
 * @param {string} categoria - Nombre de la categoría (ej: "matematicas", "lengua-y-literatura")
 * @param {string} curso - Curso seleccionado (ej: "1ro", "2do", "3rob")
 */
export async function obtenerPreguntasPorCategoria(categoria, curso = null) {
  try {
    let url = `${API_BASE_URL}/preguntas/${categoria}`;
    if (curso) {
      url += `?curso=${encodeURIComponent(curso)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error(`Error al obtener preguntas de ${categoria}:`, error);
    throw error;
  }
}

/**
 * Obtener todas las categorías disponibles
 */
export async function obtenerCategorias() {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
}

/**
 * Verificar el estado del servidor
 */
export async function verificarEstadoServidor() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al verificar estado del servidor:', error);
    throw error;
  }
}

/**
 * Crear una nueva pregunta
 */
export async function crearPregunta(preguntaData) {
  try {
    const response = await fetch(`${API_BASE_URL}/preguntas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preguntaData),
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al crear pregunta:', error);
    throw error;
  }
}
