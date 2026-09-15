/**
 * Configuración de PM2 para la API WodenTrack — PRODUCCIÓN.
 *
 * DOS procesos: `WodenTrackPRD` (la API NestJS) y `WodenTrackPRD-Worker` (el
 * worker de cálculo de horas extra, como demonio PM2 persistente).
 *
 * Antes el worker se lanzaba ON-DEMAND (detached, un proceso nuevo por cada
 * job) y NO era un proceso PM2 — quedaba invisible para `pm2 list`, y sobre
 * todo, un `pm2 restart` (deploy) nunca lo tocaba: si un job estaba en curso
 * (o el proceso quedaba vivo por algún motivo) seguía corriendo con el
 * código VIEJO indefinidamente, sin que ningún despliegue lo renovara. Ahora
 * es un proceso PM2 más: el deploy lo reinicia junto con la API, siempre con
 * el build nuevo. `HX_NO_SPAWN=1` en la API evita que, ADEMÁS, se sigan
 * lanzando workers on-demand por cada job — con el demonio persistente ya
 * alcanza, y tener los dos a la vez generaba una carrera entre workers con
 * código distinto (justo el bug que motivó este cambio).
 *
 * NO usamos cluster a propósito: el cron, los WebSockets (socket.io) y los
 * guards en memoria (marcación / control de carga) asumen instancia única.
 * Cluster requeriría Redis + sticky sessions (ver análisis previo).
 *
 * ── Despliegue en el servidor (dentro de la carpeta del backend) ──────────────
 *   npm run build:prod
 *   npm run verify:schema:prod && pm2 delete WodenTrackPRD WodenTrackPRD-Worker && pm2 start ecosystem.config.js && pm2 save
 *
 *   El "&&" es la protección: si verify:schema:prod encuentra una tabla o
 *   columna faltante en la base de datos, termina con código de salida 1 y
 *   CMD/PowerShell corta la cadena ahí mismo — nunca se llega a "pm2 delete"
 *   ni "pm2 start", así que el proceso viejo (bueno) se queda corriendo tal
 *   cual estaba, y llega una alerta por correo (MAIL_ALERT_TO) con el detalle
 *   de qué falta. Corregido eso (ALTER TABLE en la base correcta), se vuelve
 *   a correr la misma línea.
 *
 *   pm2 startup                       # (una vez) que arranque al reiniciar Windows
 *
 * ── Reinicio normal (releyendo variables de entorno) ──────────────────────────
 *   pm2 restart WodenTrackPRD WodenTrackPRD-Worker --update-env
 *
 * ── Comandos útiles ───────────────────────────────────────────────────────────
 *   pm2 status
 *   pm2 logs WodenTrackPRD
 *   pm2 logs WodenTrackPRD-Worker
 *   pm2 env <id>                      # ver NODE_OPTIONS / env del proceso
 */
module.exports = {
  apps: [
    {
      name: 'WodenTrackPRD',
      script: 'dist/main.js',
      cwd: __dirname, // resuelve dist/ relativo a la ubicación de este archivo

      exec_mode: 'fork',
      instances: 1,
      watch: false,

      // Heap de 3 GB. Este box (8 GB) también corre IIS + SO, por eso 3 GB y no
      // 4: deja margen para que el servidor no haga swap. El guard dinámico del
      // código se ajusta solo a este límite (v8.getHeapStatistics()).
      node_args: '--max-old-space-size=3072',

      // El código carga .env.${NODE_ENV} → esto hace que lea .env.production.
      // HX_NO_SPAWN=1: con el worker demonio de abajo ya corriendo, la API
      // NO debe además lanzar workers on-demand por cada job.
      env: {
        NODE_ENV: 'production',
        HX_NO_SPAWN: '1',
      },

      // ── Auto-recuperación (red de seguridad de último recurso) ─────────────
      autorestart: true,
      // Si el RSS pasa 3 GB (algo imprevisto se fugó), PM2 reinicia ORDENADO
      // antes de que Node muera por OOM. En operación normal los guards del
      // código mantienen el uso muy por debajo, así que casi nunca se dispara.
      max_memory_restart: '3000M',
      // Si crashea al arrancar, espacia los reintentos (evita bucle que quema
      // CPU): 200ms → 400ms → 800ms…
      exp_backoff_restart_delay: 200,
      max_restarts: 15,

      // ── Logs con timestamp ─────────────────────────────────────────────────
      time: true,
      merge_logs: true,
      out_file: './logs/wodentrack-out.log',
      error_file: './logs/wodentrack-error.log',

      // Da 5 s para cerrar conexiones en curso al reiniciar/desplegar.
      kill_timeout: 5000,
    },
    {
      name: 'WodenTrackPRD-Worker',
      script: 'dist/worker.js',
      cwd: __dirname,

      exec_mode: 'fork',
      instances: 1,
      watch: false,

      // Mismo heap que la API: procesa los mismos datasets grandes de Odoo.
      node_args: '--max-old-space-size=3072',

      env: {
        NODE_ENV: 'production',
        HX_WORKER: '1',
      },

      autorestart: true,
      max_memory_restart: '3000M',
      exp_backoff_restart_delay: 200,
      max_restarts: 15,

      time: true,
      merge_logs: true,
      out_file: './logs/wodentrack-worker-out.log',
      error_file: './logs/wodentrack-worker-error.log',

      // Más margen que la API: no queremos cortar un cálculo de horas extra
      // en curso a mitad de camino.
      kill_timeout: 10000,
    },
  ],
};
