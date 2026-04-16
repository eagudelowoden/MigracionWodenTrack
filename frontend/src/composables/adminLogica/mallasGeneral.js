import { ref, computed, watch } from "vue";
import axios from "axios";

export function useMallasGeneral() {
  const mallasData = ref([]);
  const searchQuery = ref("");
  const isLoading = ref(false);
  const isLoadingDownload = ref(false);
  const isUploading = ref(false);
  const uploadErrors = ref([]);
  const uploadSuccessMessage = ref("");
  const showResultModal = ref(false);
  const selectedCompany = ref("");
  const selectedDepartment = ref("");
  const selectedArea = ref(null);
  const selectedSegmento = ref(null);
  const currentPage = ref(1);
  const itemsPerPage = ref(15);
  const abortController = ref(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const debounce = (fn, delay) => {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const departments = computed(() => {
    if (!mallasData.value || mallasData.value.length === 0) return [];
    return [
      ...new Set(
        mallasData.value.map((item) => item.departamento).filter(Boolean),
      ),
    ].sort();
  });
  watch(selectedDepartment, () => {
    currentPage.value = 1;
    fetchMallasDesdeOdoo();
  });
  const fetchMallasDesdeOdoo = debounce(async () => {
    if (abortController.value) abortController.value.abort();
    abortController.value = new AbortController();

    try {
      isLoading.value = true;

      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const deptoUsuario = session.department || "";
      const permisos = session.permisos || session.permissions || {};
      const tieneFiltroDepto = permisos["admin.filtro_departamento"] === true;

      const params = new URLSearchParams();

      if (selectedCompany.value && selectedCompany.value !== "Todas") {
        params.append("company", selectedCompany.value);
      }

      // 👇 Igual que asistencias — área tiene prioridad
      if (selectedArea.value) {
        params.append("area_id", selectedArea.value);
      } else if (selectedSegmento.value) {
        params.append("segmento_id", selectedSegmento.value);
      } else if (tieneFiltroDepto) {
        if (selectedDepartment.value) {
          params.append("departamento", selectedDepartment.value);
        }
        // admin sin filtro → trae todo
      } else {
        if (deptoUsuario) {
          params.append("departamento", deptoUsuario);
        }
      }

      const url = `${API_BASE_URL}/mallas?${params.toString()}`;
      console.log("Consultando mallas en:", url);

      const response = await axios.get(url, {
        signal: abortController.value.signal,
      });
      mallasData.value = response.data;
      currentPage.value = 1;
    } catch (error) {
      if (axios.isCancel(error) || error.name === "AbortError") return;
      console.error("Error cargando mallas:", error);
    } finally {
      if (!abortController.value?.signal.aborted) {
        isLoading.value = false;
      }
    }
  }, 300);

  // const fetchMallasDesdeOdoo = async () => {
  //   try {
  //     isLoading.value = true;

  //     const session = JSON.parse(localStorage.getItem("user_session") || "{}");
  //     const deptoUsuario = session.department || "";
  //     const permisos = session.permisos || session.permissions || {};
  //     const tieneFiltroDepto = permisos["admin.filtro_departamento"] === true;

  //     const params = new URLSearchParams();
  //     params.append("t", Date.now().toString());

  //     if (selectedCompany.value && selectedCompany.value !== "Todas") {
  //       params.append("company", selectedCompany.value);
  //     }

  //     if (tieneFiltroDepto) {
  //       if (selectedDepartment.value) {
  //         params.append("departamento", selectedDepartment.value);
  //       }
  //     } else {
  //       if (deptoUsuario) {
  //         params.append("departamento", deptoUsuario);
  //       }
  //     }

  //     const url = `${API_BASE_URL}/mallas?${params.toString()}`;
  //     console.log("Consultando mallas en:", url);

  //     const response = await axios.get(url);
  //     mallasData.value = response.data;
  //     currentPage.value = 1;
  //   } catch (error) {
  //     console.error("Error cargando mallas:", error);
  //   } finally {
  //     isLoading.value = false;
  //   }
  // };
  const downloadMallaTemplate = async () => {
    try {
      isLoadingDownload.value = true;

      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const deptoUsuario = session.department || "";
      const esAdmin = session.role === "admin";

      // Admin: usa el filtro del selector si seleccionó algo, si no descarga todo
      // Usuario normal: siempre su departamento de sesión
      const deptoAplicar = esAdmin
        ? selectedDepartment.value || ""
        : deptoUsuario;

      const response = await axios.get(
        `${API_BASE_URL}/reports/mallas/template`,
        {
          params: {
            company: selectedCompany.value,
            departamento: deptoAplicar,
          },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const deptoClean = deptoAplicar.replace(/\s+/g, "_") || "general";
      const fecha = new Date().toISOString().slice(0, 10);

      link.setAttribute(
        "download",
        `plantilla_${selectedCompany.value}_${deptoClean}_${fecha}.xlsx`,
      );

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar plantilla:", error);
      alert(
        "Error al descargar la plantilla. Verifica que existan empleados en tu departamento.",
      );
    } finally {
      isLoadingDownload.value = false;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      isUploading.value = true;
      uploadErrors.value = [];
      uploadSuccessMessage.value = "";

      // 1. Leer el Excel con SheetJS y limpiar espacios
      const XLSX = await import("xlsx");
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Recorrer todas las celdas y hacer trim a los strings
      Object.keys(sheet).forEach((cellRef) => {
        if (cellRef.startsWith("!")) return;
        const cell = sheet[cellRef];
        if (cell && cell.t === "s" && typeof cell.v === "string") {
          // Trim de espacios
          let valor = cell.v.trim();

          // Normalizar espacios dobles internos
          valor = valor.replace(/\s+/g, " ");

          // Quitar tildes y caracteres especiales → ASCII limpio
          valor = valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          cell.v = valor;
          cell.w = valor;
        }
      });

      // 2. Re-generar el archivo limpio como Blob
      const cleanBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const cleanFile = new Blob([cleanBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // 3. Armar el FormData con el archivo limpio
      const formData = new FormData();
      formData.append("file", cleanFile, file.name);

      const response = await axios.post(
        `${API_BASE_URL}/contracts-upload/import`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.data.success) {
        uploadSuccessMessage.value = response.data.message;
        fetchMallasDesdeOdoo();
      } else {
        const rawErrors = response.data.errors || [];
        uploadErrors.value = rawErrors.map((err) => ({
          fila: err.fila || err.row || err.linea || "?",
          campo: err.campo || err.field || err.column || "General",
          error: err.error || err.message || err.err || "Error sin descripción",
          valor_enviado: err.valor_enviado || null,
        }));
      }
    } catch (error) {
      uploadErrors.value = [
        {
          fila: "!",
          campo: "RED",
          error: error.response?.data?.message || "Error de conexión",
        },
      ];
    } finally {
      isUploading.value = false;
      showResultModal.value = true;
      if (event.target) event.target.value = "";
    }
  };

  // --- Lógica de Filtro y Paginación (Optimizada) ---
  const filteredMallas = computed(() => {
    if (!searchQuery.value) return mallasData.value;
    const query = searchQuery.value.toLowerCase();
    return mallasData.value.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(query) ||
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
    showResultModal,
    selectedCompany,
    selectedDepartment,
    selectedArea, // 👈 exportar
    selectedSegmento, // 👈 exportar
    departments,
    fetchMallasDesdeOdoo,
    downloadMallaTemplate,
    handleFileUpload,
    paginatedMallas,
    currentPage,
    totalPages,
    totalRecords: computed(() => filteredMallas.value.length),
  };
}
