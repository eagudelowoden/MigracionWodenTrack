// src/composables/adminLogica/useNovedades.js
import { ref } from "vue";
import axios from "axios";

// ─── Helper de estado visual (folder-style) ───────────────────────────────
// Devuelve { icon, color, bg, label } para renderizar el estado de una novedad
export function getEstadoVisual(nov) {
  if (!nov) return { icon: 'fas fa-folder-open', color: '#FF8F00', bg: 'bg-[#FF8F00]/10 border-[#FF8F00]/20', label: 'Nueva' };

  // Aprobada por ambos
  if (nov.aprobado === 1)
    return { icon: 'fas fa-folder', color: '#22c55e', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Aprobada' };

  // Rechazada por alguno
  if (nov.aprobado === 0)
    return { icon: 'fas fa-folder', color: '#ef4444', bg: 'bg-red-500/10 border-red-500/20', label: 'No aprobada' };

  // Nueva = nadie ha actuado aún
  if ((nov.aprobadoJefe === null || nov.aprobadoJefe === undefined) &&
    (nov.aprobadoRrhh === null || nov.aprobadoRrhh === undefined))
    return { icon: 'fas fa-folder-open', color: '#FF8F00', bg: 'bg-[#FF8F00]/10 border-[#FF8F00]/20', label: 'Nueva' };

  // Pendiente jefe únicamente
  if ((nov.aprobadoJefe === null || nov.aprobadoJefe === undefined) && nov.aprobadoRrhh === 1)
    return { icon: 'fas fa-folder', color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Pend. Jefe' };

  // Pendiente RRHH únicamente (jefe ya aprobó)
  if (nov.aprobadoJefe === 1 && (nov.aprobadoRrhh === null || nov.aprobadoRrhh === undefined))
    return { icon: 'fas fa-folder', color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Pend. Capital' };

  // En revisión (cualquier otro caso parcial)
  return { icon: 'fas fa-folder', color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/20', label: 'En revisión' };
}

export function useNovedades() {
  const novedades = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const estadosCh = ref([]);

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
      fd.append("tipificacion", payload.tipificacion);
      fd.append("fechaInicio", payload.fechaInicio);
      fd.append("fechaFin", payload.fechaFin);
      fd.append("storageMode", payload.storageMode || "local");
      if (payload.soporte) {
        fd.append("soporte", payload.soporte);
      }
      fd.append("responsableIdOdoo", payload.responsableIdOdoo ?? "");
      fd.append("responsableNombre", payload.responsableNombre ?? "");
      fd.append("responsableCargo", payload.responsableCargo ?? "");

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
  const jefe = ref(null);

  const fetchJefeDeArea = async (department) => {
    try {
      const res = await axios.get(`${API_URL}/empleados/jefe-area`, {
        params: { department },
      });
      jefe.value = res.data ?? null;
    } catch (e) {
      console.warn("No se encontró jefe de área:", e);
      jefe.value = null;
    }
  };

  // ─── Nivel ÁREA: solo los empleados del área asignada ───────────────────
  const fetchPorArea = async (idOdoo) => {
    try {
      loading.value = true;
      const res = await axios.get(`${API_URL}/novedades/por-area`, { params: { idOdoo } });
      novedades.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("Error cargando novedades por área:", e);
      novedades.value = [];
    } finally {
      loading.value = false;
    }
  };

  // ─── Nivel SEGMENTO: todos los empleados del segmento (con o sin área) ───
  const fetchPorSegmento = async (idOdoo) => {
    try {
      loading.value = true;
      const res = await axios.get(`${API_URL}/novedades/por-segmento`, { params: { idOdoo } });
      novedades.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("Error cargando novedades por segmento:", e);
      novedades.value = [];
    } finally {
      loading.value = false;
    }
  };

  // ─── Nivel DEPARTAMENTO: todos en los deptos configurados ────────────────
  const fetchPorDepartamentos = async (departamentos) => {
    if (!departamentos?.length) { novedades.value = []; return; }
    try {
      loading.value = true;
      const res = await axios.get(`${API_URL}/novedades/por-departamento`, {
        params: { departamentos: departamentos.join(',') },
      });
      novedades.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("Error cargando novedades por departamento:", e);
      novedades.value = [];
    } finally {
      loading.value = false;
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // ESTADOS PERSONALIZADOS — CAPITAL HUMANO
  // ══════════════════════════════════════════════════════════════════

  /** Carga la lista de estados CH personalizados */
  const fetchEstadosCh = async () => {
    try {
      const res = await axios.get(`${API_URL}/novedades/estados-ch`);
      estadosCh.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("Error cargando estados CH:", e);
      estadosCh.value = [];
    }
  };

  /** Crea un nuevo estado CH */
  const crearEstadoCh = async ({ nombre, icono = 'fas fa-folder', color = '#6b7280' }) => {
    try {
      const res = await axios.post(`${API_URL}/novedades/estados-ch`, { nombre, icono, color });
      await fetchEstadosCh();
      return res.data;
    } catch (e) {
      console.error("Error creando estado CH:", e);
      throw e;
    }
  };

  /** Elimina un estado CH */
  const eliminarEstadoCh = async (id) => {
    try {
      await axios.delete(`${API_URL}/novedades/estados-ch/${id}`);
      await fetchEstadosCh();
    } catch (e) {
      console.error("Error eliminando estado CH:", e);
      throw e;
    }
  };

  /** Cambia el estado CH de una novedad (null = quitar estado) */
  const cambiarEstadoCh = async (novedadId, estadoCh) => {
    try {
      const res = await axios.post(`${API_URL}/novedades/${novedadId}/estado-ch`, {
        estadoCh: estadoCh ?? null,
      });
      // Actualizar en la lista local sin recargar todo
      const idx = novedades.value.findIndex((n) => n.id === novedadId);
      if (idx !== -1) novedades.value[idx] = { ...novedades.value[idx], estadoCh: estadoCh ?? null };
      return res.data;
    } catch (e) {
      console.error("Error cambiando estado CH:", e);
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
    aprobarJefe,
    aprobarRrhh,
    jefe,
    fetchJefeDeArea,
    fetchPorArea,
    fetchPorSegmento,
    fetchPorDepartamentos,
    // Estados CH
    estadosCh,
    fetchEstadosCh,
    crearEstadoCh,
    eliminarEstadoCh,
    cambiarEstadoCh,
  };
}
