import { ref, computed, watch } from "vue";
import axios from "axios";

export function useMallasGeneral() {
  const mallasData = ref([]);
  const searchQuery = ref("");
  const isLoading = ref(true);
  const isLoadingDownload = ref(false);
  const isUploading = ref(false);
  const uploadErrors = ref([]);
  const uploadSuccessMessage = ref("");
  const showResultModal = ref(false);
  const selectedCompany = ref("");
  const selectedDepartment = ref("");

  // --- NUEVO: Variables de Paginación (Sin borrar nada de lo anterior) ---
  const currentPage = ref(1);
  const itemsPerPage = ref(15);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const departments = computed(() => {
    if (!mallasData.value || mallasData.value.length === 0) return [];
    const allDeps = mallasData.value
      .map((item) => item.departamento) // 👈 cambia department_id por departamento
      .filter(Boolean);
    return [...new Set(allDeps)].sort();
  });
  watch(selectedDepartment, () => {
    currentPage.value = 1;
    fetchMallasDesdeOdoo();
  });

  const fetchMallasDesdeOdoo = async () => {
    try {
      isLoading.value = true;

      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const deptoUsuario = session.department || "";
      const permisos = session.permisos || session.permissions || {};
      const tieneFiltroDepto = permisos["admin.filtro_departamento"] === true;

      const params = new URLSearchParams();
      params.append("t", Date.now().toString());

      if (selectedCompany.value && selectedCompany.value !== "Todas") {
        params.append("company", selectedCompany.value);
      }

      if (tieneFiltroDepto) {
        if (selectedDepartment.value) {
          params.append("departamento", selectedDepartment.value);
        }
      } else {
        if (deptoUsuario) {
          params.append("departamento", deptoUsuario);
        }
      }

      const url = `${API_BASE_URL}/mallas?${params.toString()}`;
      console.log("Consultando mallas en:", url);

      const response = await axios.get(url);
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
    const formData = new FormData();
    formData.append("file", file);

    try {
      isUploading.value = true;
      uploadErrors.value = [];
      uploadSuccessMessage.value = "";
      const response = await axios.post(
        `${API_BASE_URL}/contracts-upload/import`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
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
    showResultModal,
    selectedCompany,
    fetchMallasDesdeOdoo,
    downloadMallaTemplate,
    handleFileUpload,
    paginatedMallas,
    currentPage,
    totalPages,
    totalRecords: computed(() => filteredMallas.value.length),
    selectedDepartment,
    departments,
  };
}
