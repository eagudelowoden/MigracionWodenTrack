import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MarcacionView from '../views/MarcacionView.vue'
import AdminView from '../views/AdminView.vue'
import SuperAdminView from '../views/SuperAdmin.vue'
// 1. Importa la nueva vista del repositorio/descarga
import DownloadView from '../views/Public/DownloadView.vue' 

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/marcacion', name: 'Marcacion', component: MarcacionView },
  { path: '/admin', name: 'Admin', component: AdminView },
  { path: '/super-admin', name: 'SuperAdmin', component: SuperAdminView },
  // 2. Ruta pública para descargar la APK
{ 
    path: '/download', // <--- Cámbialo aquí para que coincida con tu URL
    alias: '/descargar', // Opcional: Esto permite que AMBAS funcionen
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

  // 3. EXCEPCIÓN PARA RUTAS PÚBLICAS
  // Si la ruta tiene la propiedad 'isPublic', permitimos el acceso sin sesión
  if (to.meta.isPublic) {
    return next();
  }

  // 1. Si no hay sesión, solo puede estar en Login
  if (!session && to.path !== '/login') {
    return next('/login');
  }

  // 2. Si ya hay sesión e intenta ir al Login, redirigir según su rol
  if (session && to.path === '/login') {
    if (session.role === 'super-admin') return next('/super-admin');
    if (session.role === 'admin') return next('/admin');
    return next('/marcacion');
  }

  // 3. PROTECCIÓN DE RUTAS POR ROL
  if (to.path === '/super-admin' && session?.role !== 'super-admin') {
    return next(session?.role === 'admin' ? '/admin' : '/marcacion');
  }

  if (to.path === '/admin' && !['admin', 'super-admin'].includes(session?.role)) {
    return next('/marcacion');
  }

  next();
});

export default router;