-- Agrega las 4 columnas que verify-schema.js detectó como faltantes en
-- PRODUCCIÓN el 2026-08-21 (bloqueó el deploy antes de tocar el proceso vivo).
-- Ejecutar contra la base de PRODUCCIÓN (WodenTrack, 3.133.217.145) antes de
-- volver a pushear/reintentar el deploy a dagudelo/production.

-- 1. compañias.marcacion_asistencia (Company entity)
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'compañias' AND COLUMN_NAME = 'marcacion_asistencia'
)
  ALTER TABLE compañias ADD marcacion_asistencia BIT NOT NULL DEFAULT 0;

-- 2. calculo_extra_cron_config.ultima_corrida_utc
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'calculo_extra_cron_config' AND COLUMN_NAME = 'ultima_corrida_utc'
)
  ALTER TABLE calculo_extra_cron_config ADD ultima_corrida_utc NVARCHAR(30) NULL;

-- 3. calculo_extra_cron_config.ultima_corrida_completa_fecha
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'calculo_extra_cron_config' AND COLUMN_NAME = 'ultima_corrida_completa_fecha'
)
  ALTER TABLE calculo_extra_cron_config ADD ultima_corrida_completa_fecha NVARCHAR(10) NULL;

-- 4. horas_extra_jobs.worker_pid
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'horas_extra_jobs' AND COLUMN_NAME = 'worker_pid'
)
  ALTER TABLE horas_extra_jobs ADD worker_pid INT NULL;
