import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import MarcacionView from "../views/MarcacionView.vue";
import AdminView from "../views/AdminView.vue";
import SuperAdminView from "../views/SuperAdmin.vue";
import DownloadView from "../views/Public/DownloadView.vue";
// 1. Importa la nueva vista de selección
import SelectorPerfilView from "../views/Public/SelectorPerfil.vue";

const routes = [
  { path: "/", redirect: "/login" },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/marcacion",
    name: "Marcacion",
    component: () => import("../views/MarcacionView.vue"),
  },
  {
    path: "/admin",
    name: "Admin",
    component: () => import("../views/AdminView.vue"),
  },
  {
    path: "/super-admin",
    name: "SuperAdmin",
    component: () => import("../views/SuperAdmin.vue"),
  },
  {
    path: "/novedad",
    name: "Novedad",
    component: () => import("../views/novedades/NovedadPublicaView.vue"),
  },
  {
    path: "/selector-perfil",
    name: "SelectorPerfil",
    component: () => import("../views/Public/SelectorPerfil.vue"),
  },
  {
    path: "/download",
    name: "Download",
    component: () => import("../views/Public/DownloadView.vue"),
    meta: { isPublic: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const session = JSON.parse(localStorage.getItem("user_session"));

  // A. RUTAS PÚBLICAS
  if (to.meta.isPublic) return next();

  // B. SIN SESIÓN: Solo al Login
  if (!session && to.path !== "/login") return next("/login");

  // C. CON SESIÓN INTENTANDO IR AL LOGIN: Redirigir según su "llave"
  if (session && to.path === "/login") {
    if (session.isSuperAdmin || session.permisos?.["super.superadmin"])
      return next("/selector-perfil");
    if (session.role === "admin" || session.permisos?.["admin.admin"])
      return next("/admin");
    return next("/marcacion");
  }

  // D. PROTECCIÓN DE RUTAS POR PERMISO (LA MAGIA)

  // 1. Acceso a Selector de Perfil o SuperAdmin
  // Entra si es SuperAdmin O si tiene el permiso explícito de usuarios
  const tienePermisoUsuarios = session?.permisos?.["super.superadmin"];
  if (
    (to.path === "/super-admin" || to.path === "/selector-perfil") &&
    !session?.isSuperAdmin &&
    !tienePermisoUsuarios
  ) {
    // Si no tiene permiso, lo mandamos a su siguiente nivel (Admin o Marcación)
    const fallback =
      session?.role === "admin" || session?.permisos?.["admin.admin"]
        ? "/admin"
        : "/marcacion";
    return next(fallback);
  }

  // 2. Acceso a Panel Admin (Mallas/Novedades)
  // Entra si es Admin, SuperAdmin, o tiene el permiso de admin
  const tienePermisoAdmin = session?.permisos?.["admin.admin"];
  if (
    to.path === "/admin" &&
    !session?.isSuperAdmin &&
    session?.role !== "admin" &&
    !tienePermisoAdmin
  ) {
    return next("/marcacion");
  }

  next();
});

export default router;
