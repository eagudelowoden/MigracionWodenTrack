/**
 * Configuración de PM2 para la API WodenTrack — PRODUCCIÓN.
 *
 * Un solo proceso: `WodenTrackPRD` (la API NestJS). El cálculo de horas extra
 * se procesa con el modelo de WORKER ON-DEMAND que ya funciona: la API lanza un
 * worker detached por cada job (con su propio --max-old-space-size, definido en
 * horas-extra-cron.service.ts) y ese worker muere solo al terminar. Por eso NO
 * hay un worker demonio aquí ni se usa HX_NO_SPAWN.
 *
 * NO usamos cluster a propósito: el cron, los WebSockets (socket.io) y los
 * guards en memoria (marcación / control de carga) asumen instancia única.
 * Cluster requeriría Redis + sticky sessions (ver análisis previo).
 *
 * ── Despliegue en el servidor (dentro de la carpeta del backend) ──────────────
 *   npm run build:prod
 *   npm run verify:schema:prod && pm2 delete WodenTrackPRD && pm2 start ecosystem.config.js && pm2 save
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
 *   pm2 restart WodenTrackPRD --update-env
 *
 * ── Comandos útiles ───────────────────────────────────────────────────────────
 *   pm2 status
 *   pm2 logs WodenTrackPRD
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
      env: {
        NODE_ENV: 'production',
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
  ],
};
