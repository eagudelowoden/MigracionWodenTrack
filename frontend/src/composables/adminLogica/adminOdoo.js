import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useAttendance } from "../UserLogica/useAttendance.js";
import { useRouter } from "vue-router";
import * as XLSX from "xlsx";

export function adminOdoo() {
  const router = useRouter();
  const att = useAttendance();

  const currentModule = ref("novedades");
  const isSidebarOpen = ref(true);
  const report = ref([]);
  const searchQuery = ref("");
  const isExporting = ref(false);

  // --- NUEVAS VARIABLES PARA COMPAÑÍAS ---
  const allCompanies = ref([]);
  const selectedCompany = ref("");

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  let intervalId = null;

  // Cargar lista de compañías desde el nuevo endpoint
  const fetchCompanies = async () => {
    try {
      // Si creaste el recurso 'companies', el endpoint es este:
      const res = await fetch(`${API_BASE_URL}/companies`);
      const data = await res.json();
      allCompanies.value = data;

      if (data.length > 0 && !selectedCompany.value) {
        selectedCompany.value = data[0].name;
      }
    } catch (err) {
      console.error("Error cargando compañías:", err);
    }
  };
  const fetchReport = async () => {
    try {
      // Opcional: Podrías pasar la compañía al backend si quieres filtrar desde la DB
      const res = await fetch(`${API_BASE_URL}/reporte-novedades`);
      const data = await res.json();
      report.value = data;
    } catch (err) {
      console.error("Error reporte:", err);
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
        await fetchReport();
        if (data.type === "in") {
          att.employee.value.is_inside = true;
          att.employee.value.day_completed = false;
        } else {
          att.employee.value.is_inside = false;
          att.employee.value.day_completed = true;
        }
        localStorage.setItem(
          "user_session",
          JSON.stringify(att.employee.value)
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
      // Exportamos solo lo que está filtrado actualmente en pantalla
      const worksheet = XLSX.utils.json_to_sheet(filteredReport.value);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias");
      XLSX.writeFile(
        workbook,
        `Reporte_${selectedCompany.value}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );
      att.showToast("Excel generado", "success");
    } catch (err) {
      att.showToast("Error Excel", "error");
    } finally {
      isExporting.value = false;
    }
  };

  onMounted(async () => {
    await fetchCompanies(); // Primero traemos las compañías
    fetchReport();
    intervalId = setInterval(fetchReport, 60000);
  });

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  // --- FILTRADO POR BUSQUEDA Y POR COMPAÑIA ---
  const filteredReport = computed(() => {
    return report.value.filter((item) => {
      // Filtro por Compañía
      const matchesCompany =
        !selectedCompany.value || item.company_name === selectedCompany.value;

      // Filtro por Buscador
      const s = searchQuery.value.toLowerCase();
      const matchesSearch =
        !searchQuery.value ||
        item.empleado.toLowerCase().includes(s) ||
        item.department_id.toLowerCase().includes(s);

      return matchesCompany && matchesSearch;
    });
  });

  return {
    ...att,
    currentModule,
    isSidebarOpen,
    report,
    searchQuery,
    isExporting,
    allCompanies, // Exportamos para el select
    selectedCompany, // Exportamos para el v-model
    fetchReport,
    handleAttendance,
    downloadExcelReport,
    filteredReport,
  };
}
