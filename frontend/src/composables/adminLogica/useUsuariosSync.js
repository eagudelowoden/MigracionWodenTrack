import { ref, computed } from "vue";

export function useUsuariosSync() {
  const dbUsuarios = ref([]);
  const odooUsuarios = ref([]);
  const isSyncing = ref(false);
  const loading = ref(false);
  const syncProgress = ref(0);
  const searchUser = ref("");
  const selectedDept = ref("TODOS");
  
  // NUEVO: Estado para el país seleccionado
  const selectedCountry = ref("TODOS");

  const API_URL = import.meta.env.VITE_API_URL + "/sincronizar";

  // 1. Cargar usuarios locales filtrados por país
  const fetchDbUsuarios = async () => {
    try {
      // Enviamos el país como parámetro de consulta (Query Param)
      const res = await fetch(`${API_URL}/lista-local?pais=${selectedCountry.value}`);
      const data = await res.json();
      dbUsuarios.value = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Error cargando usuarios locales:", e);
      dbUsuarios.value = [];
    }
  };

  // 2. Cargar usuarios de Odoo filtrados por país
  const fetchOdooUsuarios = async () => {
    loading.value = true;
    try {
      const res = await fetch(`${API_URL}/lista-odoo?pais=${selectedCountry.value}`);
      const data = await res.json();
      odooUsuarios.value = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Error cargando usuarios de Odoo:", e);
      odooUsuarios.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 3. Ejecutar sincronización enviando el país al backend
  const executeSync = async () => {
    if (selectedCountry.value === 'TODOS') {
      alert("Por favor, selecciona un país específico para sincronizar");
      return;
    }

    isSyncing.value = true;
    syncProgress.value = 5;

    const timer = setInterval(() => {
      if (syncProgress.value < 90) syncProgress.value += 3;
    }, 150);

    try {
      // POST enviando el país seleccionado
      const res = await fetch(`${API_URL}/ejecutar?pais=${selectedCountry.value}`, { 
        method: "POST" 
      });
      const result = await res.json();

      syncProgress.value = 100;
      await fetchDbUsuarios(); // Refrescar solo los del país actual
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

  // --- Propiedades Computadas para Filtros de Interfaz ---
  
  const filteredOdoo = computed(() => {
    return (odooUsuarios.value || []).filter((u) => {
      const matchesSearch = u.name?.toLowerCase().includes(searchUser.value.toLowerCase()) ||
                            u.id.toString().includes(searchUser.value);
      const deptName = u.department_id ? u.department_id[1] : "Sin asignar";
      const matchesDept = selectedDept.value === "TODOS" || deptName === selectedDept.value;
      return matchesSearch && matchesDept;
    });
  });

  const filteredLocal = computed(() => {
    return (dbUsuarios.value || []).filter((u) => {
      const matchesSearch = u.nombre?.toLowerCase().includes(searchUser.value.toLowerCase()) ||
                            u.identificacion?.includes(searchUser.value);
      const matchesDept = selectedDept.value === "TODOS" || u.departamento === selectedDept.value;
      return matchesSearch && matchesDept;
    });
  });

  const departamentosUnicos = computed(() => {
    const depts = (odooUsuarios.value || []).map((u) =>
      u.department_id ? u.department_id[1] : "Sin asignar",
    );
    return ["TODOS", ...new Set(depts)].sort();
  });

  return {
    dbUsuarios,
    odooUsuarios,
    isSyncing,
    loading,
    syncProgress,
    searchUser,
    selectedDept,
    selectedCountry,
    filteredOdoo,
    filteredLocal,
    departamentosUnicos,
    fetchDbUsuarios,
    fetchOdooUsuarios,
    executeSync,
  };
}