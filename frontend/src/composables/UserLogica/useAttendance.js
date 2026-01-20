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
        try {
          const statusRes = await fetch(`${API_BASE_URL}/attendance-status/${data.employee_id}`);
          const statusData = await statusRes.json();

          // Sincronización real con Odoo
          data.is_inside = statusData.is_inside;
          
          if (statusData.is_inside && statusData.last_check_in) {
            data.last_mark_time = new Date(statusData.last_check_in + "Z").toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
          }
        } catch (statusErr) {
          console.warn("Error sincronizando estado inicial.");
        }

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
      showToast("Error crítico de conexión", "error");
    } finally {
      loading.value = false;
    }
  };

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
      // ACTUALIZAMOS EL ESTADO CON LO QUE VIENE DEL SERVIDOR
      employee.value.is_inside = data.is_inside;
      employee.value.day_completed = data.day_completed;
      
      employee.value.last_status = data.message;
      employee.value.last_mark_time = new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      });

      // Guardamos la verdad absoluta en el storage
      localStorage.setItem("user_session", JSON.stringify(employee.value));
      showToast(data.message, data.type === 'completed' ? "warning" : "success");
      
    } else {
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

  onMounted(() => {
    updateClock();
    setInterval(updateClock, 1000);

    const saved = localStorage.getItem("user_session");
    if (saved) {
      const userData = JSON.parse(saved);
      const today = new Date().toLocaleDateString();

      // RESETEADOR DIARIO: Si es un nuevo día, desbloqueamos los botones
      if (userData.last_login_date !== today) {
        userData.is_inside = false;
        userData.day_completed = false;
        userData.last_login_date = today;
        userData.last_mark_time = null;
        userData.last_status = null;
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