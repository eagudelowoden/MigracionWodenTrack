// src/composables/adminLogica/useNovedades.js
import { ref } from "vue";
import axios from "axios";

export function useNovedades() {
  const novedades = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // ─── GET todas las novedades ──────────────────────────────────────────────
  const fetchNovedades = async () => {
    try {
      loading.value = true;
      const res = await axios.get(`${API_URL}/novedades`);
      novedades.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("Error cargando novedades:", e);
      novedades.value = [];
      error.value = e;
    } finally {
      loading.value = false;
    }
  };

  // ─── POST crear novedad con soporte (multipart/form-data) ─────────────────
  const crearNovedad = async (payload) => {
    try {
      loading.value = true;

      const fd = new FormData();
      fd.append("nombre", payload.nombre);
      fd.append("cedula", payload.cedula);
      fd.append("descripcion", payload.descripcion);
      fd.append("tipificacion", payload.tipificacion ?? "");
      fd.append("fechaInicio", payload.fechaInicio);
      fd.append("fechaFin", payload.fechaFin);
      fd.append("storageMode", payload.storageMode || "local");
      if (payload.soporte) {
        fd.append("soporte", payload.soporte);
      }

      const res = await axios.post(`${API_URL}/novedades`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchNovedades();
      return res.data;
    } catch (e) {
      console.error("Error al crear novedad:", e);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // ─── GET detalle de una novedad (incluye fileUrl firmada o local) ─────────
  const fetchNovedad = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/novedades/${id}`);
      return res.data;
    } catch (e) {
      console.error("Error cargando novedad:", e);
      throw e;
    }
  };

  // ─── GET URL del archivo (para visor) ────────────────────────────────────
  const getFileUrl = (id) => {
    return `${API_URL}/novedades/${id}/file`;
  };

  // ─── DELETE eliminar novedad + archivo ────────────────────────────────────
  const eliminarNovedad = async (id) => {
    try {
      await axios.delete(`${API_URL}/novedades/${id}`);
      await fetchNovedades();
    } catch (e) {
      console.error("Error al eliminar novedad:", e);
      throw e;
    }
  };
  const aprobarNovedad = async (id, aprobado, motivo) => {
    try {
      const res = await axios.post(`${API_URL}/novedades/${id}/aprobar`, {
        aprobado,
        motivo,
      });
      await fetchNovedades();
      return res.data;
    } catch (e) {
      console.error("Error al aprobar/rechazar novedad:", e);
      throw e;
    }
  };

  return {
    novedades,
    loading,
    error,
    fetchNovedades,
    crearNovedad,
    fetchNovedad,
    getFileUrl,
    eliminarNovedad,
    aprobarNovedad,
  };
}
