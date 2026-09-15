-- Historial de corridas del resumen nocturno de asistencia (pendiente/procesando/
-- completado/error). Ejecutar manualmente en TEST y PROD antes de desplegar
-- (mismo motivo que los otros scripts de este módulo: synchronize desactivado
-- fuera de development, y verify-schema.js bloquea el despliegue si falta).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'asistencia_cron_log')
BEGIN
  CREATE TABLE asistencia_cron_log (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL,
    company NVARCHAR(255) NULL,
    rango_desde NVARCHAR(10) NULL,
    rango_hasta NVARCHAR(10) NULL,
    estado VARCHAR(20) NOT NULL CONSTRAINT DF_asistencia_cron_log_estado DEFAULT 'procesando',
    total_filas INT NULL,
    error_mensaje NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_asistencia_cron_log_created_at DEFAULT GETDATE(),
    finalizado_at DATETIME2 NULL
  );
  CREATE INDEX IDX_asistencia_cron_log_created_at ON asistencia_cron_log (created_at DESC);
END
