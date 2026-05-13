import { ref, computed, watch } from "vue";
import axios from "axios";
import { useMallasSchedule } from "./useMallasSchedule.js";

export function useMallasGeneral() {
  const mallasData = ref([]);
  const searchQuery = ref("");
  const isLoading = ref(true);
  const isLoadingDownload = ref(false);
  const isUploading = ref(false);
  const uploadErrors = ref([]);
  const uploadSuccessMessage = ref("");
  const uploadProcesados = ref([]);   // detalle de los exitosos
  const showResultModal = ref(false);
  const selectedCompany = ref("");
  const selectedDepartment = ref("");

  // Modales
  const showChoiceModal = ref(false);   // "¿Vista previa o subir directo?"
  const showPreviewModal = ref(false);  // Tabla de datos del Excel
  const previewRows = ref([]);
  const previewHeaders = ref([]);
  const pendingCleanBlob = ref(null);
  const pendingFileName = ref("");

  const currentPage = ref(1);
  const itemsPerPage = ref(15);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // ── Control de fechas de cargue ──────────────────────────────────────────
  const { schedule, carguePermitido, proximaFechaHabilitada, cargarSchedule } = useMallasSchedule();
  const showSolicitudModal = ref(false);
  cargarSchedule();

  const crearSolicitud = async (mensaje = '') => {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const perfil = perfilUsuario.value;
    try {
      await axios.post(`${API_BASE_URL}/superadmin/solicitudes`, {
        solicitante_id_odoo: session.employee_id || session.id_odoo || 0,
        solicitante_nombre:  session.name || 'Desconocido',
        area_nombre:         perfil?.area?.nombre || null,
        segmento_nombre:     perfil?.segmento?.nombre || null,
        mensaje:             mensaje || `Solicitud de apertura para cargue de mallas del ${new Date().toLocaleDateString('es-CO')}`,
      });
    } catch (e) {
      console.error('Error creando solicitud:', e);
    }
    showSolicitudModal.value = false;
  };

  const departments = computed(() => {
    if (!mallasData.value || mallasData.value.length === 0) return [];
    const allDeps = mallasData.value.map((item) => item.departamento).filter(Boolean);
    return [...new Set(allDeps)].sort();
  });

  watch(selectedDepartment, () => {
    currentPage.value = 1;
    fetchMallasDesdeOdoo();
  });

  // Perfil del usuario con su segmento y área
  const perfilUsuario = ref(null);

  const _cargarPerfil = async () => {
    try {
      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const idOdoo = session.employee_id || session.id_odoo;
      if (!idOdoo) return;
      const resp = await axios.get(`${API_BASE_URL}/perfil-completo/${idOdoo}`);
      perfilUsuario.value = resp.data;
    } catch (e) {
      console.error("Error cargando perfil para mallas:", e);
    }
  };

  const fetchMallasDesdeOdoo = async () => {
    try {
      isLoading.value = true;

      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const permisos = session.permisos || session.permissions || {};
      const tieneFiltroDepto = permisos["admin.filtro_departamento"] === true;
      const esResponsableSegmento = permisos["novedades.ver_segmento"] === true;
      const esCoordSegmento = !esResponsableSegmento && permisos["coord.ver_segmento"] === true;

      // Cargar perfil si aún no se tiene y el usuario no es admin con filtro libre
      if (!tieneFiltroDepto && !perfilUsuario.value) {
        await _cargarPerfil();
      }

      const params = new URLSearchParams();
      params.append("t", Date.now().toString());

      if (selectedCompany.value && selectedCompany.value !== "Todas") {
        params.append("company", selectedCompany.value);
      }

      if (tieneFiltroDepto) {
        // Admin con filtro libre
        if (selectedDepartment.value) params.append("departamento", selectedDepartment.value);
      } else {
        // Usuario con permisos de estructura (responsable de segmento o área)
        const perfil = perfilUsuario.value;
        if (esResponsableSegmento && perfil?.segmento?.id) {
          // Responsable de segmento: ve todos en su segmento
          params.append("segmento_id", perfil.segmento.id);
        } else if (esCoordSegmento && perfil?.segmento?.id) {
          // Coordinador con acceso al segmento completo (sin ser responsable)
          params.append("segmento_id", perfil.segmento.id);
        } else if (perfil?.area?.id) {
          // Responsable de área: ve solo su área
          params.append("area_id", perfil.area.id);
        } else {
          // Usuario normal: filtrar por departamento de sesión
          const deptoUsuario = session.department || "";
          if (deptoUsuario) params.append("departamento", deptoUsuario);
        }
      }

      const response = await axios.get(`${API_BASE_URL}/mallas?${params.toString()}`);
      mallasData.value = response.data;
      currentPage.value = 1;
    } catch (error) {
      console.error("Error cargando mallas:", error);
    } finally {
      isLoading.value = false;
    }
  };

  const downloadMallaTemplate = async () => {
    try {
      isLoadingDownload.value = true;

      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const permisos = session.permisos || session.permissions || {};
      const tieneFiltroDepto = permisos["admin.filtro_departamento"] === true;
      const esResponsableSegmento = permisos["novedades.ver_segmento"] === true;
      const esCoordSegmento = !esResponsableSegmento && permisos["coord.ver_segmento"] === true;

      // Asegurar que el perfil esté cargado (igual que fetchMallasDesdeOdoo)
      if (!tieneFiltroDepto && !perfilUsuario.value) {
        await _cargarPerfil();
      }

      const params = {};
      if (selectedCompany.value && selectedCompany.value !== "Todas") {
        params.company = selectedCompany.value;
      }

      if (tieneFiltroDepto) {
        if (selectedDepartment.value) params.departamento = selectedDepartment.value;
      } else {
        const perfil = perfilUsuario.value;
        if (esResponsableSegmento && perfil?.segmento?.id) {
          params.segmento_id = perfil.segmento.id;
        } else if (esCoordSegmento && perfil?.segmento?.id) {
          params.segmento_id = perfil.segmento.id;
        } else if (perfil?.area?.id) {
          params.area_id = perfil.area.id;
        } else {
          const deptoUsuario = session.department || "";
          if (deptoUsuario) params.departamento = deptoUsuario;
        }
      }

      const response = await axios.get(`${API_BASE_URL}/reports/mallas/template`, {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fecha = new Date().toISOString().slice(0, 10);
      const sufijo = params.segmento_id ? `seg${params.segmento_id}`
        : params.area_id ? `area${params.area_id}`
        : (params.departamento || "general").replace(/\s+/g, "_");
      link.setAttribute("download", `plantilla_mallas_${sufijo}_${fecha}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar plantilla:", error);
      alert("Error al descargar la plantilla. Verifica que existan empleados en tu área.");
    } finally {
      isLoadingDownload.value = false;
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  const _readAndCleanExcel = async (file) => {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    Object.keys(sheet).forEach((cellRef) => {
      if (cellRef.startsWith("!")) return;
      const cell = sheet[cellRef];
      if (cell && cell.t === "s" && typeof cell.v === "string") {
        const valor = cell.v
          .trim()
          .replace(/\s+/g, " ")
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "");
        cell.v = valor;
        cell.w = valor;
      }
    });

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const cleanBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const cleanBlob = new Blob([cleanBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return { jsonData, cleanBlob };
  };

  const _buildPreview = (jsonData) => {
    const WANTED_COLS = [
      { label: "Empleado", keys: ["empleado"] },
      { label: "Horario de trabajo", keys: ["horario de trabajo"] },
      { label: "Estado", keys: ["estado"] },
      { label: "Fecha de inicio", keys: ["fecha de inicio"] },
      { label: "Fecha de finalizacion", keys: ["fecha de finalizacion", "fecha de fin"] },
    ];

    const rawHeaders = (jsonData[0] || []).map((h) =>
      String(h).trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    );

    const matched = WANTED_COLS.map((col) => ({
      label: col.label,
      idx: rawHeaders.findIndex((h) => col.keys.includes(h)),
    })).filter((c) => c.idx >= 0);

    let finalHeaders, finalIndices;
    if (matched.length === 0) {
      // Fallback: primeras 5 columnas originales
      const origHeaders = (jsonData[0] || []).map(String);
      finalHeaders = origHeaders.slice(0, 5);
      finalIndices = [0, 1, 2, 3, 4];
    } else {
      finalHeaders = matched.map((c) => c.label);
      finalIndices = matched.map((c) => c.idx);
    }

    const dataRows = jsonData.slice(1).filter((row) => row.some((c) => c !== ""));

    return {
      headers: finalHeaders,
      rows: dataRows.map((row) => finalIndices.map((i) => row[i] ?? "")),
      totalRows: dataRows.length,
    };
  };

  const _doUpload = async (blob, fileName) => {
    const session = JSON.parse(localStorage.getItem("user_session") || "{}");
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("asignado_por", session.name || "Desconocido");

    const response = await axios.post(
      `${API_BASE_URL}/mallas-upload/import`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    // Siempre guardamos ambas listas (puede haber éxitos parciales)
    uploadProcesados.value = response.data.procesados || [];
    const rawErrors = response.data.errors || [];
    uploadErrors.value = rawErrors.map((err) => ({
      fila: err.fila || "?",
      cedula: err.cedula || "",
      error: err.error || err.message || "Error sin descripción",
    }));

    if (response.data.total_procesados > 0) {
      uploadSuccessMessage.value = response.data.message;
      fetchMallasDesdeOdoo();
    }
  };

  // ── Reporte Excel del resultado de carga ────────────────────────────────
  const descargarReporteCarga = async () => {
    const XLSX = await import("xlsx");

    const wb = XLSX.utils.book_new();

    // ── Hoja 1: Exitosos ────────────────────────────────────────────────────
    const exitososData = [
      ["Fila", "Cédula", "Nombre", "Malla Asignada", "Fecha"],
      ...uploadProcesados.value.map((p) => [p.fila, p.cedula, p.nombre, p.malla, p.fecha]),
    ];
    const wsExito = XLSX.utils.aoa_to_sheet(exitososData);
    wsExito["!cols"] = [{ wch: 6 }, { wch: 15 }, { wch: 35 }, { wch: 45 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsExito, "Asignados");

    // ── Hoja 2: Errores ─────────────────────────────────────────────────────
    const erroresData = [
      ["Fila", "Cédula", "Error"],
      ...uploadErrors.value.map((e) => [e.fila, e.cedula || "", e.error]),
    ];
    const wsError = XLSX.utils.aoa_to_sheet(erroresData);
    wsError["!cols"] = [{ wch: 6 }, { wch: 15 }, { wch: 55 }];
    XLSX.utils.book_append_sheet(wb, wsError, "Errores");

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `reporte_carga_mallas_${fecha}.xlsx`);
  };

  // ── Punto de entrada único: seleccionar archivo ──────────────────────────

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (event.target) event.target.value = "";

    // Verificar ventana de cargue
    if (!carguePermitido.value) {
      showSolicitudModal.value = true;
      return;
    }

    // Limpiar estado anterior
    uploadErrors.value = [];
    uploadSuccessMessage.value = "";
    uploadProcesados.value = [];
    showResultModal.value = false;

    try {
      const { jsonData, cleanBlob } = await _readAndCleanExcel(file);
      const preview = _buildPreview(jsonData);

      previewHeaders.value = preview.headers;
      previewRows.value = preview.rows;
      pendingCleanBlob.value = cleanBlob;
      pendingFileName.value = file.name;

      // Mostrar modal de elección
      showChoiceModal.value = true;
    } catch (err) {
      console.error("Error leyendo archivo:", err);
      uploadErrors.value = [
        { fila: "!", campo: "Archivo", error: "No se pudo leer el archivo Excel." },
      ];
      showResultModal.value = true;
    }
  };

  // Desde el modal de elección: ver preview
  const openPreview = () => {
    showChoiceModal.value = false;
    showPreviewModal.value = true;
  };

  // Desde el modal de elección: subir directo
  const uploadDirect = async () => {
    showChoiceModal.value = false;
    if (!pendingCleanBlob.value) return;

    try {
      isUploading.value = true;
      await _doUpload(pendingCleanBlob.value, pendingFileName.value);
    } catch (error) {
      uploadErrors.value = [
        { fila: "!", campo: "RED", error: error.response?.data?.message || "Error de conexion" },
      ];
    } finally {
      isUploading.value = false;
      showResultModal.value = true;
      pendingCleanBlob.value = null;
    }
  };

  // Desde el modal de preview: confirmar carga
  const confirmUpload = async () => {
    if (!pendingCleanBlob.value) return;
    showPreviewModal.value = false;

    try {
      isUploading.value = true;
      uploadErrors.value = [];
      uploadSuccessMessage.value = "";
      await _doUpload(pendingCleanBlob.value, pendingFileName.value);
    } catch (error) {
      uploadErrors.value = [
        { fila: "!", campo: "RED", error: error.response?.data?.message || "Error de conexion" },
      ];
    } finally {
      isUploading.value = false;
      showResultModal.value = true;
      pendingCleanBlob.value = null;
    }
  };

  const cancelAll = () => {
    showChoiceModal.value = false;
    showPreviewModal.value = false;
    pendingCleanBlob.value = null;
    previewRows.value = [];
    previewHeaders.value = [];
  };

  // ── Filtro y Paginación ──────────────────────────────────────────────────

  const filteredMallas = computed(() => {
    if (!searchQuery.value) return mallasData.value;
    const query = searchQuery.value.toLowerCase();
    return mallasData.value.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(query) ||
        p.cc?.toString().includes(query) ||
        p.malla?.toLowerCase().includes(query),
    );
  });

  const paginatedMallas = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    return filteredMallas.value.slice(start, start + itemsPerPage.value);
  });

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredMallas.value.length / itemsPerPage.value)),
  );

  watch(searchQuery, () => {
    currentPage.value = 1;
  });

  return {
    mallasData,
    searchQuery,
    isLoading,
    isLoadingDownload,
    isUploading,
    uploadErrors,
    uploadSuccessMessage,
    uploadProcesados,
    descargarReporteCarga,
    showResultModal,
    showChoiceModal,
    showPreviewModal,
    previewRows,
    previewHeaders,
    pendingFileName,
    selectedCompany,
    fetchMallasDesdeOdoo,
    downloadMallaTemplate,
    handleFileSelect,
    openPreview,
    uploadDirect,
    confirmUpload,
    cancelAll,
    paginatedMallas,
    currentPage,
    totalPages,
    totalRecords: computed(() => filteredMallas.value.length),
    selectedDepartment,
    departments,
    perfilUsuario,
    // schedule
    carguePermitido,
    proximaFechaHabilitada,
    showSolicitudModal,
    crearSolicitud,
    schedule,
  };
}
