import { ref } from "vue";

export function useCompanies() {
  // Inicializamos siempre con [] para evitar errores de .length en el renderizado
  const dbCompanies = ref([]); // Datos de SQL Server (Locales)
  const odooCompanies = ref([]); // Datos crudos de Odoo ERP
  const isSyncing = ref(false);
  const loading = ref(false);

  // Construcción de la URL (Asegúrate de que el backend use este prefijo)
  const API_URL = import.meta.env.VITE_API_URL + "/companies";

  // 1. Carga las compañías desde la base de datos local (WodenTrack)
  const fetchDbCompanies = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      dbCompanies.value = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Error al cargar compañías locales:", e);
      dbCompanies.value = [];
    }
  };

  // 2. Carga las compañías directamente desde Odoo (Lectura)
  const fetchOdooRaw = async () => {
    loading.value = true;
    try {
      const res = await fetch(`${API_URL}/odoo-raw`);
      const data = await res.json();
      odooCompanies.value = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Error al obtener datos de Odoo:", e);
      odooCompanies.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 3. Sincroniza Odoo con SQL Server
  const syncCompanies = async () => {
    isSyncing.value = true;
    try {
      const res = await fetch(`${API_URL}/sync`, { method: "POST" });
      const data = await res.json();
      // Tras sincronizar, refrescamos la lista local
      await fetchDbCompanies();
      return data;
    } catch (e) {
      console.error("Error en sincronización:", e);
      throw e;
    } finally {
      isSyncing.value = false;
    }
  };

  // 4. Cambia el estado visible/oculto en SQL Server
  const toggleCompanyStatus = async (id, currentStatus) => {
    try {
      await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      // Refrescamos para ver el cambio de switch y opacidad
      await fetchDbCompanies();
    } catch (e) {
      console.error("Error al actualizar estado:", e);
    }
  };

  return {
    dbCompanies,
    odooCompanies,
    isSyncing,
    loading,
    fetchDbCompanies,
    fetchOdooRaw,
    syncCompanies,
    toggleCompanyStatus,
  };
}
