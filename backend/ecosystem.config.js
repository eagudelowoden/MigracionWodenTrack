/**
 * Configuración de PM2 para WodenTrack.
 *
 * Levanta DOS procesos independientes que se reinician solos y arrancan con el
 * servidor:
 *   1. woden-api    → la API (NestJS). Nunca lanza workers (HX_NO_SPAWN=1):
 *                     el cron solo ENCOLA, y el worker demonio procesa la cola.
 *   2. woden-worker → el worker en modo DEMONIO (siempre vivo, revisa la cola
 *                     cada pocos segundos). Si revienta por un job enorme, PM2 lo
 *                     reinicia solo (max_memory_restart) sin tocar la API.
 *
 * Uso (en el servidor, dentro de la carpeta backend):
 *   npm run build
 *   pm2 start ecosystem.config.js
 *   pm2 save          # recuerda los procesos
 *   pm2 startup       # que arranquen al reiniciar Windows (sigue las instrucciones que imprime)
 *
 * Comandos útiles:
 *   pm2 status                 # ver estado
 *   pm2 logs woden-worker      # ver logs del worker
 *   pm2 restart woden-api      # reiniciar la API
 *   pm2 reload ecosystem.config.js   # recargar tras un nuevo build
 */
module.exports = {
  apps: [
    {
      name: 'woden-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        // La API no spawnea workers: el demonio (abajo) procesa la cola.
        HX_NO_SPAWN: '1',
      },
    },
    {
      name: 'woden-worker',
      script: 'dist/worker.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      // Si un job enorme dispara la memoria, PM2 reinicia SOLO el worker.
      max_memory_restart: '1500M',
      env: {
        NODE_ENV: 'production',
        // Modo DEMONIO: siempre vivo, revisa la cola (sin HX_WORKER_ONCE).
        HX_WORKER: '1',
      },
    },
  ],
};
