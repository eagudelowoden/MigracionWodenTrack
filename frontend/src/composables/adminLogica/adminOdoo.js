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
      // 1. Obtenemos el departamento que guardamos en el login
      // 'att.employee' viene de useAttendance()
      const departamentoUsuario = att.employee.value?.department || "";

      // 2. Creamos los parámetros
      const queryParams = new URLSearchParams({
        hoy: "true",
        company: selectedCompany.value || "Todas",
        departamento: departamentoUsuario, // <--- AQUÍ AGREGAMOS EL DEPARTAMENTO
      });

      // 3. La URL final quedará: .../reporte-novedades?hoy=true&company=...&departamento=...
      const urlFinal = `${API_BASE_URL}/reporte-novedades?${queryParams.toString()}`;

      console.log("Petición enviada a:", urlFinal); // Para que verifiques en consola

      const res = await fetch(urlFinal);
      const data = await res.json();
      report.value = data;
    } catch (err) {
      console.error("Error al obtener el reporte:", err);
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
      // Exportamos solo lo que está filtrado actualmente en pantalla
      const worksheet = XLSX.utils.json_to_sheet(filteredReport.value);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias");
      XLSX.writeFile(
        workbook,
        `Reporte_${selectedCompany.value}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
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
  // useCargarAsistencias.js
  const filteredReport = computed(() => {
    const s = search.value.toLowerCase().trim();
    const deptoSeleccionado = selectedDepartment.value;

    return rawData.value.filter((item) => {
      // 1. Filtro de Búsqueda (Colaborador o Estado)
      const matchesSearch =
        !s ||
        String(item.empleado || "")
          .toLowerCase()
          .includes(s) ||
        String(item.estado || "")
          .toLowerCase()
          .includes(s);

      // 2. Filtro de Departamento (SOLUCIÓN):
      // Si ya viene filtrado del backend, no necesitamos re-filtrar aquí
      // a menos que el usuario use explícitamente el SELECT del UI.
      const matchesDept =
        !deptoSeleccionado ||
        String(item.department_id).trim() === String(deptoSeleccionado).trim();

      return matchesSearch && matchesDept;
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
