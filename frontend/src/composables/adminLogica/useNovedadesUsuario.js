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

  // ─── POST crear novedad ───────────────────────────────────────────────────
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
      if (payload.soporte) fd.append("soporte", payload.soporte);
      fd.append("responsableIdOdoo", payload.responsableIdOdoo ?? "");
      fd.append("responsableNombre", payload.responsableNombre ?? "");
      fd.append("responsableCargo", payload.responsableCargo ?? "");
      if (payload.creadoPor != null) fd.append("creadoPor", payload.creadoPor);

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

  // ─── GET mis novedades (historial del usuario) ────────────────────────────
  const misNovedades = ref([]);
  const fetchMisNovedades = async ({ idOdoo, fechaDesde, fechaHasta, buscar } = {}) => {
    if (!idOdoo) return;
    try {
      loading.value = true;
      const params = { idOdoo };
      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;
      if (buscar) params.buscar = buscar;
      const res = await axios.get(`${API_URL}/novedades/mis-novedades`, { params });
      misNovedades.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("Error cargando mis novedades:", e);
      misNovedades.value = [];
    } finally {
      loading.value = false;
    }
  };

  // ─── Jefe de área ─────────────────────────────────────────────────────────
  const jefe = ref(null);
  const fetchJefeDeArea = async (department) => {
    if (!department) return null;
    try {
      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const res = await axios.get(`${API_URL}/area-responsable`, {
        params: { department, idOdoo: session.id_odoo },
      });
      const data = res.data;
      if (!data) return null;

      jefe.value = {
        name: data.responsable_nombre,
        job: data.responsable_cargo,
        id_odoo: data.responsable_id_odoo,
      };
      return jefe.value;
    } catch (e) {
      console.error("Error buscando jefe de área:", e);
      return null;
    }
  };

  // ─── GET detalle ──────────────────────────────────────────────────────────
  const fetchNovedad = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/novedades/${id}`);
      return res.data;
    } catch (e) {
      console.error("Error cargando novedad:", e);
      throw e;
    }
  };

  // ─── GET URL archivo ──────────────────────────────────────────────────────
  const getFileUrl = (id) => `${API_URL}/novedades/${id}/file`;

  // ─── DELETE ───────────────────────────────────────────────────────────────
  const eliminarNovedad = async (id) => {
    try {
      await axios.delete(`${API_URL}/novedades/${id}`);
      await fetchNovedades();
    } catch (e) {
      console.error("Error al eliminar novedad:", e);
      throw e;
    }
  };

  // ─── DELETE desde historial usuario (con auditoría) ───────────────────────
  const eliminarMiNovedad = async (id, eliminadoPor, eliminadoPorNombre) => {
    try {
      await axios.delete(`${API_URL}/novedades/${id}`, {
        params: { eliminadoPor, eliminadoPorNombre },
      });
      misNovedades.value = misNovedades.value.filter((n) => n.id !== id);
    } catch (e) {
      console.error("Error al eliminar novedad:", e);
      throw e;
    }
  };

  // ─── Aprobación Jefe ──────────────────────────────────────────────────────
  const aprobarJefe = async (id, aprobado, motivo) => {
    try {
      const res = await axios.post(`${API_URL}/novedades/${id}/aprobar-jefe`, {
        aprobado,
        motivo,
      });
      await fetchNovedades();
      return res.data;
    } catch (e) {
      console.error("Error al aprobar/rechazar como jefe:", e);
      throw e;
    }
  };

  // ─── Aprobación RRHH ──────────────────────────────────────────────────────
  const aprobarRrhh = async (id, aprobado, motivo) => {
    try {
      const res = await axios.post(`${API_URL}/novedades/${id}/aprobar-rrhh`, {
        aprobado,
        motivo,
      });
      await fetchNovedades();
      return res.data;
    } catch (e) {
      console.error("Error al aprobar/rechazar como RRHH:", e);
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
    aprobarJefe,
    aprobarRrhh,
    jefe,
    fetchJefeDeArea,
    misNovedades,
    fetchMisNovedades,
    eliminarMiNovedad,
  };
}
