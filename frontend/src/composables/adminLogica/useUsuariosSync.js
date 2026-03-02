import { ref, computed } from "vue";

export function useUsuariosSync() {
  const dbUsuarios = ref([]); // Datos en SQL Server (WodenTrack)
  const odooUsuarios = ref([]); // Datos crudos de Odoo
  const isSyncing = ref(false);
  const loading = ref(false);
  const syncProgress = ref(0);
  const searchUser = ref("");
  const selectedDept = ref("TODOS");

  // Asegúrate de que esta URL coincida con tu controlador de NestJS
  // Ejemplo: http://localhost:8082/usuarios/sincronizar
  const API_URL = import.meta.env.VITE_API_URL + "/sincronizar";

  // 1. Cargar usuarios de la base de datos local
  const fetchDbUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/lista-local`);
      const data = await res.json();
      dbUsuarios.value = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Error cargando usuarios locales:", e);
      dbUsuarios.value = [];
    }
  };
  // Filtro para la tabla de Odoo (Izquierda)
  const filteredOdoo = computed(() => {
    return (odooUsuarios.value || []).filter((u) => {
      const matchesSearch = u.name
        ?.toLowerCase()
        .includes(searchUser.value.toLowerCase());
      const deptName = u.department_id ? u.department_id[1] : "Sin asignar";
      const matchesDept =
        selectedDept.value === "TODOS" || deptName === selectedDept.value;
      return matchesSearch && matchesDept;
    });
  });

  // Filtro para la tabla Local (Derecha)
  const filteredLocal = computed(() => {
    return (dbUsuarios.value || []).filter((u) => {
      const matchesSearch =
        u.nombre?.toLowerCase().includes(searchUser.value.toLowerCase()) ||
        u.identificacion?.includes(searchUser.value);
      const matchesDept =
        selectedDept.value === "TODOS" || u.departamento === selectedDept.value;
      return matchesSearch && matchesDept;
    });
  });
  // Obtener lista única de departamentos para el Select
  const departamentosUnicos = computed(() => {
    const depts = (odooUsuarios.value || []).map((u) =>
      u.department_id ? u.department_id[1] : "Sin asignar",
    );
    return ["TODOS", ...new Set(depts)].sort();
  });

  // 2. Cargar usuarios crudos de Odoo (Tabla Izquierda)
  const fetchOdooUsuarios = async () => {
    loading.value = true;
    try {
      const res = await fetch(`${API_URL}/lista-odoo`);
      const data = await res.json();
      odooUsuarios.value = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Error cargando usuarios de Odoo:", e);
      odooUsuarios.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 3. Ejecutar sincronización con barra de progreso
  const executeSync = async () => {
    isSyncing.value = true;
    syncProgress.value = 5;

    // Animación estética de la barra
    const timer = setInterval(() => {
      if (syncProgress.value < 90) syncProgress.value += 3;
    }, 150);

    try {
      const res = await fetch(`${API_URL}/ejecutar`, { method: "POST" });
      const result = await res.json();

      syncProgress.value = 100;
      await fetchDbUsuarios(); // Refrescar tabla derecha
      return result;
    } catch (e) {
      console.error("Error en sincronización:", e);
      throw e;
    } finally {
      clearInterval(timer);
      setTimeout(() => {
        isSyncing.value = false;
        syncProgress.value = 0;
      }, 1000);
    }
  };

  return {
    dbUsuarios,
    odooUsuarios,
    isSyncing,
    loading,
    syncProgress,
    fetchDbUsuarios,
    fetchOdooUsuarios,
    executeSync,
  };
}
