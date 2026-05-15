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

  // ─── POST crear novedad con múltiples archivos (PDF/imagen) ──────────────
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
      fd.append("responsableIdOdoo", payload.responsableIdOdoo ?? "");
      fd.append("responsableNombre", payload.responsableNombre ?? "");
      fd.append("responsableCargo", payload.responsableCargo ?? "");
      if (payload.creadoPor != null) fd.append("creadoPor", payload.creadoPor);

      // Múltiples archivos — field name: archivos
      const archivos = Array.isArray(payload.archivos) ? payload.archivos : (payload.archivos ? [payload.archivos] : []);
      for (const file of archivos) fd.append("archivos", file);

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

  // ─── GET archivos de una novedad ──────────────────────────────────────────
  const getArchivos = async (novedadId) => {
    try {
      const res = await axios.get(`${API_URL}/novedades/${novedadId}/archivos`);
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("Error cargando archivos:", e);
      return [];
    }
  };

  // ─── POST subir archivos a novedad existente ──────────────────────────────
  const subirArchivos = async (novedadId, files) => {
    const fd = new FormData();
    const lista = Array.isArray(files) ? files : [files];
    for (const f of lista) fd.append("archivos", f);
    const res = await axios.post(`${API_URL}/novedades/${novedadId}/archivos`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  };

  // ─── URL de un archivo adjunto ────────────────────────────────────────────
  const getArchivoUrl = (novedadId, archivoId) =>
    `${API_URL}/novedades/${novedadId}/archivos/${archivoId}/file`;

  // ─── DELETE archivo adjunto ───────────────────────────────────────────────
  const eliminarArchivo = async (novedadId, archivoId) => {
    await axios.delete(`${API_URL}/novedades/${novedadId}/archivos/${archivoId}`);
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

  // ─── MI SEGMENTO: todos en el segmento del coordinador (sin ser responsable) ─
  const fetchPorMiSegmento = async (idOdoo) => {
    try {
      loading.value = true;
      const res = await axios.get(`${API_URL}/novedades/por-mi-segmento`, { params: { idOdoo } });
      novedades.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("Error cargando novedades por mi segmento:", e);
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
  // CARPETAS PERSONALIZADAS (independientes por módulo)
  //   tipo = 'rrhh'         → Capital Humano   → campo estadoCh
  //   tipo = 'coordinador'  → Jefe/Coordinador → campo estadoChCoord
  // ══════════════════════════════════════════════════════════════════

  /**
   * Carga las carpetas del tipo indicado.
   * Cada módulo pasa su propio tipo para obtener solo las suyas.
   */
  const fetchEstadosCh = async (tipo = 'rrhh') => {
    try {
      const res = await axios.get(`${API_URL}/novedades/estados-ch`, { params: { tipo } });
      estadosCh.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("Error cargando carpetas:", e);
      estadosCh.value = [];
    }
  };

  /** Crea una nueva carpeta para el tipo indicado */
  const crearEstadoCh = async ({ nombre, icono = 'fas fa-folder', color = '#6b7280', tipo = 'rrhh' }) => {
    try {
      const res = await axios.post(`${API_URL}/novedades/estados-ch`, { nombre, icono, color, tipo });
      await fetchEstadosCh(tipo);
      return res.data;
    } catch (e) {
      console.error("Error creando carpeta:", e);
      throw e;
    }
  };

  /** Edita nombre/icono/color de una carpeta (tipo para refrescar la lista) */
  const editarEstadoCh = async (id, { nombre, icono = 'fas fa-folder', color = '#6b7280' }, tipo = 'rrhh') => {
    try {
      const res = await axios.put(`${API_URL}/novedades/estados-ch/${id}`, { nombre, icono, color });
      await fetchEstadosCh(tipo);
      return res.data;
    } catch (e) {
      console.error("Error editando carpeta:", e);
      throw e;
    }
  };

  /** Elimina una carpeta (tipo para refrescar la lista correcta) */
  const eliminarEstadoCh = async (id, tipo = 'rrhh') => {
    try {
      await axios.delete(`${API_URL}/novedades/estados-ch/${id}`);
      await fetchEstadosCh(tipo);
    } catch (e) {
      console.error("Error eliminando carpeta:", e);
      throw e;
    }
  };

  /**
   * Asigna (o limpia) la carpeta en una novedad.
   *   tipo = 'rrhh'        → actualiza novedades[idx].estadoCh
   *   tipo = 'coordinador' → actualiza novedades[idx].estadoChCoord
   */
  const cambiarEstadoCh = async (novedadId, estadoCh, tipo = 'rrhh') => {
    try {
      const res = await axios.post(`${API_URL}/novedades/${novedadId}/estado-ch`, {
        estadoCh: estadoCh ?? null,
        tipo,
      });
      // Actualizar campo correcto en la lista local
      const idx = novedades.value.findIndex((n) => n.id === novedadId);
      if (idx !== -1) {
        const field = tipo === 'coordinador' ? 'estadoChCoord' : 'estadoCh';
        novedades.value[idx] = { ...novedades.value[idx], [field]: estadoCh ?? null };
      }
      return res.data;
    } catch (e) {
      console.error("Error asignando carpeta:", e);
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
    fetchPorMiSegmento,
    fetchPorDepartamentos,
    // Archivos adjuntos
    getArchivos,
    subirArchivos,
    getArchivoUrl,
    eliminarArchivo,
    // Carpetas personalizadas
    estadosCh,
    fetchEstadosCh,
    crearEstadoCh,
    editarEstadoCh,
    eliminarEstadoCh,
    cambiarEstadoCh,
  };
}
