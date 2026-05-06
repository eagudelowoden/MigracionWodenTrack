import { createRouter, createWebHistory } from "vue-router";

// Retorna la primera ruta admin a la que el usuario tiene acceso
const getFirstAdminRoute = (session) => {
  const p = session?.permisos || {};
  const isSA = session?.isSuperAdmin;
  if (isSA || p["admin.asistencias"]) return "/admin/asistencias";
  if (p["admin.mallas"]) return "/admin/mallas";
  if (p["admin.calculos"]) return "/admin/horas-extra";
  if (p["horas.ver_cargue_ch"]) return "/admin/cargue-horas-ch";
  if (p["admin.novedades"]) return "/admin/novedades";
  return "/marcacion";
};

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

  // ── Panel Admin con sub-rutas ──────────────────────────────────────────────
  {
    path: "/admin",
    component: () => import("../views/AdminView.vue"),
    children: [
      {
        // /admin solo → redirige al primer módulo con permiso
        path: "",
        redirect: () => {
          const session = JSON.parse(localStorage.getItem("user_session") || "null");
          return getFirstAdminRoute(session);
        },
      },
      {
        path: "asistencias",
        name: "AdminAsistencias",
        meta: { permiso: "admin.asistencias" },
        component: () => import("../components/admin/ModuloUsuariosAsistencias.vue"),
      },
      {
        path: "mallas",
        name: "AdminMallas",
        meta: { permiso: "admin.mallas" },
        component: () => import("../components/admin/ModuloMallaUpload.vue"),
      },
      {
        path: "horas-extra",
        name: "AdminHorasExtra",
        meta: { permiso: "admin.calculos" },
        component: () => import("../components/admin/ModuloCalculos.vue"),
      },
      {
        path: "novedades",
        name: "AdminNovedades",
        meta: { permiso: "admin.novedades" },
        component: () => import("../views/novedades/NovedadesPanelView.vue"),
      },
      {
        path: "cargue-horas-ch",
        name: "CargueHorasCH",
        meta: { permiso: "horas.ver_cargue_ch" },
        component: () => import("../components/admin/ModuloCargueHorasCH.vue"),
      },
    ],
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
  const session = JSON.parse(localStorage.getItem("user_session") || "null");

  // ── Rutas públicas ─────────────────────────────────────────────────────────
  if (to.meta.isPublic) return next();

  // ── Sin sesión → solo al Login ─────────────────────────────────────────────
  if (!session && to.path !== "/login") return next("/login");

  // ── Con sesión intentando ir al Login → redirigir según rol ───────────────
  if (session && to.path === "/login") {
    if (session.isSuperAdmin || session.permisos?.["super.superadmin"])
      return next("/selector-perfil");
    if (session.role === "admin" || session.permisos?.["admin.admin"])
      return next(getFirstAdminRoute(session));
    return next("/marcacion");
  }

  const isSuperAdmin = session?.isSuperAdmin;

  // ── Protección de SuperAdmin / Selector Perfil ─────────────────────────────
  const tienePermisoUsuarios = session?.permisos?.["super.superadmin"];
  if (
    (to.path === "/super-admin" || to.path === "/selector-perfil") &&
    !isSuperAdmin &&
    !tienePermisoUsuarios
  ) {
    const fallback =
      session?.role === "admin" || session?.permisos?.["admin.admin"]
        ? getFirstAdminRoute(session)
        : "/marcacion";
    return next(fallback);
  }

  // ── Protección de rutas /admin/* ───────────────────────────────────────────
  if (to.path.startsWith("/admin")) {
    const tienePermisoAdmin = session?.permisos?.["admin.admin"];

    // Debe tener acceso general al panel admin
    if (!isSuperAdmin && session?.role !== "admin" && !tienePermisoAdmin) {
      return next("/marcacion");
    }

    // Verifica permiso específico del módulo (sólo para rutas hijas)
    if (to.meta?.permiso && !isSuperAdmin) {
      if (!session?.permisos?.[to.meta.permiso]) {
        // No tiene permiso para ese módulo → primer módulo disponible
        return next(getFirstAdminRoute(session));
      }
    }
  }

  next();
});

export default router;
