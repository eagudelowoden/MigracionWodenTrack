import { ref, onMounted, onUnmounted, computed } from "vue";
import { useAttendance } from "../UserLogica/useAttendance.js";
import { useRouter } from "vue-router";
import * as XLSX from "xlsx";

export function adminOdoo() {
  const router = useRouter();
  const att = useAttendance(); // Trae employee, loading, showToast, etc.

  const currentModule = ref("novedades");
  const isSidebarOpen = ref(true);
  const report = ref([]);
  const searchQuery = ref("");
  const isExporting = ref(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  let intervalId = null;

  const fetchReport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/report`);
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
        await fetchReport(); // Refresca la tabla
        
        // Actualiza el estado local (usando att.)
        if (data.type === "in") {
          att.employee.value.is_inside = true;
          att.employee.value.day_completed = false;
        } else {
          att.employee.value.is_inside = false;
          att.employee.value.day_completed = true;
        }
        localStorage.setItem("user_session", JSON.stringify(att.employee.value));
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
      const res = await fetch(`${API_BASE_URL}/admin/export-excel`);
      const data = await res.json();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias");
      XLSX.writeFile(workbook, `Reporte_${new Date().toISOString().split("T")[0]}.xlsx`);
      att.showToast("Excel generado", "success");
    } catch (err) {
      att.showToast("Error Excel", "error");
    } finally {
      isExporting.value = false;
    }
  };

  onMounted(() => {
    fetchReport();
    intervalId = setInterval(fetchReport, 60000);
  });

  onUnmounted(() => { if (intervalId) clearInterval(intervalId); });

  return {
    ...att, // Expone employee, loading, logout, etc.
    currentModule,
    isSidebarOpen,
    report,
    searchQuery,
    isExporting,
    fetchReport,
    handleAttendance,
    downloadExcelReport,
    filteredReport: computed(() => {
      if (!searchQuery.value) return report.value;
      return report.value.filter((item) =>
        item.empleado.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    }),
  };
}