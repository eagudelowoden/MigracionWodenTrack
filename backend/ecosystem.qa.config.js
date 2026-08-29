/**
 * Configuración de PM2 para la API WodenTrack — QA / TEST.
 *
 * Copia de ecosystem.config.js (PROD) con nombres de proceso, entorno y logs
 * PROPIOS. Antes QA no tenía su propio ecosystem.config.js — si en algún
 * momento el ecosystem.config.js de PROD se copió (sin editar) también a la
 * carpeta del servidor de QA, ambos ambientes terminaban compartiendo el
 * MISMO nombre de proceso PM2 ('WodenTrackPRD'). PM2 identifica procesos
 * SOLO por nombre, sin importar desde qué carpeta se lanzaron — así que
 * arrancar uno con ese ecosystem.config.js reemplazaba (no sumaba) al otro:
 * el que arrancaba de último "pisaba" al que ya estaba corriendo, aunque
 * apuntaran a carpetas distintas. Con nombres separados (WodenTrackTest /
 * WodenTrackTest-Worker) cada ambiente vive en su propio slot de PM2.
 *
 * El pipeline de GitHub Actions (deploy.yml, job deploy-test) NO usa este
 * archivo — arranca/reinicia QA por CLI directa (pm2 start/restart por
 * nombre). Este ecosystem.config.js es para cuando alguien necesita levantar
 * QA A MANO en el servidor (ej. después de reiniciar Windows) sin arriesgarse
 * a chocar con PROD.
 *
 * ── Uso en el servidor de QA (carpeta C:\Users\Administrator\Documents\WodenTrackTest) ──
 *   pm2 start ecosystem.qa.config.js && pm2 save
 *
 * ── Reinicio normal ────────────────────────────────────────────────────────
 *   pm2 restart WodenTrackTest WodenTrackTest-Worker --update-env
 */
module.exports = {
  apps: [
    {
      name: 'WodenTrackTest',
      script: 'dist/main.js',
      cwd: __dirname,

      exec_mode: 'fork',
      instances: 1,
      watch: false,

      node_args: '--max-old-space-size=3072',

      // El código carga .env.${NODE_ENV} → esto hace que lea .env.qa.
      env: {
        NODE_ENV: 'qa',
        HX_NO_SPAWN: '1',
      },

      autorestart: true,
      max_memory_restart: '3000M',
      exp_backoff_restart_delay: 200,
      max_restarts: 15,

      time: true,
      merge_logs: true,
      out_file: './logs/wodentrack-test-out.log',
      error_file: './logs/wodentrack-test-error.log',

      kill_timeout: 5000,
    },
    {
      name: 'WodenTrackTest-Worker',
      script: 'dist/worker.js',
      cwd: __dirname,

      exec_mode: 'fork',
      instances: 1,
      watch: false,

      node_args: '--max-old-space-size=3072',

      env: {
        NODE_ENV: 'qa',
        HX_WORKER: '1',
      },

      autorestart: true,
      max_memory_restart: '3000M',
      exp_backoff_restart_delay: 200,
      max_restarts: 15,

      time: true,
      merge_logs: true,
      out_file: './logs/wodentrack-test-worker-out.log',
      error_file: './logs/wodentrack-test-worker-error.log',

      kill_timeout: 10000,
    },
  ],
};
