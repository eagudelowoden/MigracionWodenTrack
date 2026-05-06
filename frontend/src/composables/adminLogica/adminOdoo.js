import { ref, onMounted, computed } from "vue";
import { useAttendance } from "../UserLogica/useAttendance.js";
import { useCargarAsistencias } from "../UserLogica/cargarAsistencias.js";
import { useRouter } from "vue-router";
import * as XLSX from "xlsx";

export function adminOdoo() {
  const router = useRouter();
  const att = useAttendance();

  const {
    fetchReporte,
    selectedCompany,
    selectedArea,
    selectedSegmento,
    rawData,
    filteredReport, // 👈 del composable directamente
    search,
    selectedDepartment,
    startDate,
    endDate,
    filterHoy,
    loading,
    downloadReport,
    clearFilters,
    departments,
    reportData,
  } = useCargarAsistencias();

  const currentModule = ref("asistencias");
  const isSidebarOpen = ref(true);
  const searchQuery = ref("");
  const isExporting = ref(false);
  const allCompanies = ref([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Inicialización sincrónica: leer company desde la sesión guardada para que
  // los componentes hijos ya reciban el prop correcto cuando montan.
  const _session = JSON.parse(localStorage.getItem("user_session") || "{}");
  if (_session.company && !selectedCompany.value) {
    selectedCompany.value = _session.company;
  }

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/companies`);
      const data = await res.json();
      const active = data.filter((c) => c.is_active);

      const companyDelEmpleado =
        _session.company || att.employee.value?.company;
      const isSuperAdmin =
        _session.isSuperAdmin || att.employee.value?.isSuperAdmin;

      if (isSuperAdmin) {
        // SuperAdmin ve todas las compañías y puede cambiar libremente
        allCompanies.value = active;
        if (!selectedCompany.value) {
          selectedCompany.value = active[0]?.name ?? "";
        }
      } else if (companyDelEmpleado) {
        const match = active.find((c) => c.name === companyDelEmpleado);
        // Admin normal solo ve su propia compañía
        allCompanies.value = match ? [match] : active;
        selectedCompany.value = match?.name ?? active[0]?.name ?? "";
      } else {
        allCompanies.value = active;
        selectedCompany.value = active[0]?.name ?? "";
      }
    } catch (err) {
      console.error("Error cargando compañías:", err);
    }
  };

  const handleAttendance = async () => {
    if (!att.employee.value) return;
    att.loading.value = true;
    try {
      const res = await fetch(`${API_BASE_URL}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: att.employee.value.employee_id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await fetchReporte();
        if (data.type === "in") {
          att.employee.value.is_inside = true;
          att.employee.value.day_completed = false;
        } else {
          att.employee.value.is_inside = false;
          att.employee.value.day_completed = true;
        }
        localStorage.setItem(
          "user_session",
          JSON.stringify(att.employee.value),
        );
        att.showToast(data.message, "success");
      }
    } catch (err) {
      att.showToast("Error al registrar", "error");
    } finally {
      att.loading.value = false;
    }
  };

  const downloadExcelReport = async () => {
    isExporting.value = true;
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredReport.value);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias");
      XLSX.writeFile(
        workbook,
        `Reporte_${selectedCompany.value}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      att.showToast("Excel generado", "success");
    } catch (err) {
      att.showToast("Error Excel", "error");
    } finally {
      isExporting.value = false;
    }
  };

  onMounted(async () => {
    await fetchCompanies();
    // fetchReporte lo llama el componente Vue — no llamar aquí
  });

  return {
    ...att,
    currentModule,
    isSidebarOpen,
    searchQuery,
    isExporting,
    allCompanies,
    // Del composable:
    selectedCompany,
    selectedArea,
    selectedSegmento,
    selectedDepartment,
    search,
    startDate,
    endDate,
    filterHoy,
    loading,
    rawData,
    reportData,
    filteredReport,
    departments,
    fetchReporte,
    downloadReport,
    clearFilters,
    handleAttendance,
    downloadExcelReport,
  };
}
