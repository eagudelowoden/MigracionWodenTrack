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
        // Guardamos la fecha del login para el reseteo automático mañana
        data.last_login_date = new Date().toLocaleDateString();
        
        employee.value = data;
        localStorage.setItem("user_session", JSON.stringify(data));

        showToast(`Bienvenido ${data.name}`, "success");

        if (data.isSuperAdmin) router.push("/selector-perfil");
        else if (data.role === "admin") router.push("/admin");
        else router.push("/marcacion");
      } else {
        showToast(data.message || "Credenciales inválidas", "error");
      }
    } catch (err) {
      showToast("Error de conexión con el servidor", "error");
    } finally {
      loading.value = false;
    }
  };

// ... dentro de useAttendance()
const handleAttendance = async () => {
  if (loading.value || !employee.value) return;

  loading.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: employee.value.employee_id }),
    });
    
    const data = await res.json();

    if (res.ok && data.status === "success") {
      // 1. Actualizamos estados de navegación
      employee.value.is_inside = (data.type === "in");
      employee.value.day_completed = (data.type === "out");

      // 2. NUEVO: Guardamos información de la marcación para la UI
      // Guardamos la hora actual formateada
      employee.value.last_mark_time = new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      // Guardamos el mensaje (A TIEMPO, TARDE, etc.)
      employee.value.last_status = data.message;
      // Guardamos el nombre de la malla
      employee.value.malla_info = data.malla;

      localStorage.setItem("user_session", JSON.stringify(employee.value));
      showToast(data.message, "success");
    } else {
      showToast(data.message || "Error en Odoo", "error");
    }
  } catch (err) {
    showToast("Fallo de red", "error");
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

  onMounted(() => {
    updateClock();
    setInterval(updateClock, 1000);

    const saved = localStorage.getItem("user_session");
    if (saved) {
      const userData = JSON.parse(saved);
      const today = new Date().toLocaleDateString();

      // RESETEADOR: Si el login guardado no es de hoy, limpiamos el estado bloqueado
      if (userData.last_login_date !== today) {
        userData.is_inside = false;
        userData.day_completed = false;
        userData.last_login_date = today;
        localStorage.setItem("user_session", JSON.stringify(userData));
      }

      employee.value = userData;
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
    handleLogin,
    handleAttendance,
    logout,
    toggleTheme,
  };
}