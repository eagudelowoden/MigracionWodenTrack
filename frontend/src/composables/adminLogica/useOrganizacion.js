import { ref } from "vue";
import axios from "axios";

export function useOrganizacion() {
  const areas = ref([]);
  const segmentos = ref([]);
  const areasAgrupadas = ref({});
  const departamentos = ref([]);
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchDatos = async () => {
    try {
      const [resA, resS, resAg, resDep] = await Promise.all([
        axios.get(`${API_URL}/organizacion/areas`),
        axios.get(`${API_URL}/organizacion/segmentos`),
        axios.get(`${API_URL}/organizacion/areas-agrupadas`),
        axios.get(`${API_URL}/organizacion/departamentos`),
      ]);

      areas.value = Array.isArray(resA.data) ? resA.data : [];
      segmentos.value = Array.isArray(resS.data) ? resS.data : [];
      areasAgrupadas.value = resAg.data && typeof resAg.data === 'object' ? resAg.data : {};
      departamentos.value = Array.isArray(resDep.data) ? resDep.data : [];
    } catch (e) {
      console.error("Error cargando estructura:", e);
      areas.value = [];
      segmentos.value = [];
      areasAgrupadas.value = {};
      departamentos.value = [];
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
        nombre: payload.nombre,
        responsableId: payload.responsableId,
        departamento: payload.departamento || null,
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

  const updateArea = async (id, payload) => {
    try {
      await axios.put(`${API_URL}/organizacion/areas/${id}`, payload);
      await fetchDatos();
    } catch (e) {
      console.error("Error al actualizar área:", e);
      throw e;
    }
  };

  return { areas, segmentos, areasAgrupadas, departamentos, fetchDatos, crearArea, crearSegmento, updateArea };
}
