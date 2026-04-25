import { ref } from "vue";
import axios from "axios";

export function useOrganizacion() {
  const areas = ref([]);
  const segmentos = ref([]);
  const API_URL = import.meta.env.VITE_API_URL; // Ejemplo: http://localhost:8082

  const fetchDatos = async () => {
    try {
      // AJUSTE: Agregamos /organizacion/ antes de areas y segmentos
      const [resA, resS] = await Promise.all([
        axios.get(`${API_URL}/organizacion/areas`),
        axios.get(`${API_URL}/organizacion/segmentos`),
      ]);

      areas.value = Array.isArray(resA.data) ? resA.data : [];
      segmentos.value = Array.isArray(resS.data) ? resS.data : [];
    } catch (e) {
      console.error("Error cargando estructura:", e);
      areas.value = [];
      segmentos.value = [];
    }
  };

  const getAdminName = () => {
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      return session.name || 'Desconocido';
    } catch {
      return 'Desconocido';
    }
  };

  const crearArea = async (payload) => {
    try {
      await axios.post(`${API_URL}/organizacion/areas`, {
        ...payload,
        creadoPor: getAdminName(),
      });
      await fetchDatos();
    } catch (e) {
      console.error("Error al crear área:", e);
      throw e;
    }
  };

  const crearSegmento = async (payload) => {
    try {
      await axios.post(`${API_URL}/organizacion/segmentos`, {
        ...payload,
        creadoPor: getAdminName(),
      });
      await fetchDatos();
    } catch (e) {
      console.error("Error al crear segmento:", e);
      throw e;
    }
  };

  return { areas, segmentos, fetchDatos, crearArea, crearSegmento };
}
