import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";

export function useAttendance() {
  const router = useRouter();
  const employee = ref(null);
  const loading = ref(false);
  const showPassword = ref(false);
  const currentTime = ref("00:00:00 AM");
  const form = reactive({ usuario: "", password: "" });
  const message = reactive({ text: "", type: "" });
  const isDark = ref(localStorage.getItem("theme") !== "light");

  // Estado de malla del día y actualización de APK
  const malla = ref(null);
  const apkUpdate = ref(null);

  // Guard contra doble marcación rápida (ms desde el último intento)
  const lastMarkTimestamp = ref(0);
  const MARK_COOLDOWN_MS = 4000;

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const updateClock = () => {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const showToast = (msg, type) => {
    message.text = msg;
    message.type = type;
    setTimeout(() => (message.text = ""), 4000);
  };

  const handleLogin = async () => {
    if (!form.usuario || !form.password) {
      showToast("Completa los campos", "error");
      return;
    }

    loading.value = true;
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        // 1. SINCRONIZACIÓN DE ESTADO (Asistencia)
        try {
          const statusRes = await fetch(
            `${API_BASE_URL}/attendance-status/${data.employee_id}`,
          );
          const statusData = await statusRes.json();
          data.is_inside = statusData.is_inside;
        } catch (statusErr) {
          console.warn("Error sincronizando estado inicial.");
        }

        // 2. GUARDAR SESIÓN
        data.last_login_date = new Date().toLocaleDateString();
        employee.value = data;
        localStorage.setItem("user_session", JSON.stringify(data));

        showToast(`Bienvenido ${data.name}`, "success");

        // 3. REDIRECCIÓN INTELIGENTE
        if (
          data.isSuperAdmin ||
          (data.permisos && data.permisos["super.superadmin"])
        ) {
          router.push("/selector-perfil");
        } else if (
          data.role === "admin" ||
          (data.permisos && data.permisos["admin.admin"])
        ) {
          router.push("/admin");
        } else {
          router.push("/marcacion");
        }
      } else {
        showToast(data.message || "Credenciales inválidas", "error");
      }
    } catch (err) {
      showToast("Error crítico de conexión", "error");
    } finally {
      loading.value = false;
    }
  };

  const syncEstado = async (empId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance-status/${empId}`);
      const data = await res.json();
      if (employee.value) {
        employee.value.is_inside     = data.is_inside;
        employee.value.day_completed = data.day_completed;
        employee.value.hora_entrada  = data.check_in_at  ?? null;
        employee.value.hora_salida   = data.check_out_at ?? null;
        localStorage.setItem("user_session", JSON.stringify(employee.value));
      }
    } catch (e) {
      console.warn("Error sincronizando estado de asistencia:", e);
    }
  };

  // Carga la malla horaria del día para el empleado actual
  const fetchMalla = async (empId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/malla-hoy/${empId}`);
      if (res.ok) {
        malla.value = await res.json();
      }
    } catch (e) {
      console.warn("No se pudo obtener malla del día:", e);
    }
  };

  // Verifica si hay una nueva versión de APK disponible en el servidor
  const checkApkUpdate = async () => {
    try {
      // El endpoint de APK está fuera de /usuarios
      const apkBase = API_BASE_URL.replace(/\/usuarios\/?$/, "");
      const res = await fetch(`${apkBase}/apk/info`, { cache: "no-store" });
      if (!res.ok) return;
      const info = await res.json();
      if (!info.exists) return;

      // Comparar con el timestamp de la última vez que el usuario descartó el aviso
      const dismissedAt = localStorage.getItem("apk_update_dismissed_at");
      const serverMs = new Date(info.lastUpdate).getTime();

      if (!dismissedAt || Number(dismissedAt) < serverMs) {
        apkUpdate.value = info;
      }
    } catch (e) {
      // Fallo silencioso — no crítico
    }
  };

  const dismissApkUpdate = () => {
    localStorage.setItem("apk_update_dismissed_at", Date.now().toString());
    apkUpdate.value = null;
  };

  // action: 'in' | 'out'
  const handleAttendance = async (action) => {
    if (loading.value || !employee.value) return;

    // Guard de doble marcación: bloquear si el usuario pulsó hace menos de MARK_COOLDOWN_MS
    const now = Date.now();
    if (now - lastMarkTimestamp.value < MARK_COOLDOWN_MS) {
      showToast("Espera un momento antes de marcar de nuevo", "warning");
      return;
    }
    lastMarkTimestamp.value = now;

    loading.value = true;
    try {
      const res = await fetch(`${API_BASE_URL}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employee.value.employee_id, action }),
      });

      const data = await res.json();

      if (data.status === "success") {
        employee.value.is_inside     = data.is_inside;
        employee.value.day_completed = data.day_completed;
        employee.value.hora_entrada  = data.check_in_at  ?? employee.value.hora_entrada;
        employee.value.hora_salida   = data.check_out_at ?? employee.value.hora_salida;
        employee.value.last_status   = data.message;
        localStorage.setItem("user_session", JSON.stringify(employee.value));
        showToast(data.message, data.type === "completed" ? "warning" : "success");
      } else {
        // El backend rechazó la acción (doble entrada, doble salida, etc.)
        // Sincronizamos el estado real para corregir el UI
        if (data.is_inside !== undefined) {
          employee.value.is_inside    = data.is_inside;
          employee.value.hora_entrada = data.check_in_at  ?? employee.value.hora_entrada;
          employee.value.hora_salida  = data.check_out_at ?? employee.value.hora_salida;
          localStorage.setItem("user_session", JSON.stringify(employee.value));
        }
        showToast(data.message || "Error de conexión", "error");
      }
    } catch (err) {
      showToast("Error de red", "error");
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    employee.value = null;
    localStorage.removeItem("user_session");
    form.usuario = "";
    form.password = "";
    router.push("/login");
  };

  onMounted(async () => {
    updateClock();
    setInterval(updateClock, 1000);

    const saved = localStorage.getItem("user_session");
    if (saved) {
      const userData = JSON.parse(saved);
      const today = new Date().toLocaleDateString();

      // Resetear estado al inicio de un nuevo día
      if (userData.last_login_date !== today) {
        userData.is_inside     = false;
        userData.day_completed = false;
        userData.last_login_date = today;
        userData.hora_entrada  = null;
        userData.hora_salida   = null;
        userData.last_status   = null;
        localStorage.setItem("user_session", JSON.stringify(userData));
      }

      employee.value = userData;

      // Sincronizar estado real con Odoo, cargar malla y verificar APK en paralelo
      if (userData.employee_id) {
        await Promise.allSettled([
          syncEstado(userData.employee_id),
          fetchMalla(userData.employee_id),
          checkApkUpdate(),
        ]);
      }
    }
  });

  return {
    employee,
    loading,
    showPassword,
    currentTime,
    form,
    message,
    isDark,
    malla,
    apkUpdate,
    handleLogin,
    handleAttendance,
    syncEstado,
    logout,
    toggleTheme,
    dismissApkUpdate,
  };
}
