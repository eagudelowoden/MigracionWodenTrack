import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MarcacionView from '../views/MarcacionView.vue'
import AdminView from '../views/AdminView.vue'
import SuperAdminView from '../views/SuperAdmin.vue'
import DownloadView from '../views/Public/DownloadView.vue'
// 1. Importa la nueva vista de selección
import SelectorPerfilView from '../views/Public/SelectorPerfil.vue' 

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/marcacion', name: 'Marcacion', component: MarcacionView },
  { path: '/admin', name: 'Admin', component: AdminView },
  { path: '/super-admin', name: 'SuperAdmin', component: SuperAdminView },
  
  // 2. Nueva ruta para elegir el modo de entrada
  { 
    path: '/selector-perfil', 
    name: 'SelectorPerfil', 
    component: SelectorPerfilView 
  },

  { 
    path: '/download', 
    alias: '/descargar', 
    name: 'Download', 
    component: DownloadView,
    meta: { isPublic: true } 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})



router.beforeEach((to, from, next) => {
  const session = JSON.parse(localStorage.getItem('user_session'));

  // A. RUTAS PÚBLICAS (Download, etc)
  if (to.meta.isPublic) {
    return next();
  }

  // B. SIN SESIÓN: Solo al Login
  if (!session && to.path !== '/login') {
    return next('/login');
  }

  // C. CON SESIÓN INTENTANDO IR AL LOGIN: 
  // Redirigir al Selector si es SuperAdmin, o a su ruta por defecto
  if (session && to.path === '/login') {
    if (session.isSuperAdmin) return next('/selector-perfil'); // <-- Prioridad al Selector
    if (session.role === 'admin') return next('/admin');
    return next('/marcacion');
  }

  // D. PROTECCIÓN DE RUTAS POR PERMISO
  
  // Si intenta ir a SuperAdmin y no lo es en la sesión
  if (to.path === '/super-admin' && !session?.isSuperAdmin) {
    return next(session?.role === 'admin' ? '/admin' : '/marcacion');
  }

  // Si intenta ir a Admin y no tiene rol de admin ni es superAdmin
  if (to.path === '/admin' && !session?.isSuperAdmin && session?.role !== 'admin') {
    return next('/marcacion');
  }

  next();
});

export default router;