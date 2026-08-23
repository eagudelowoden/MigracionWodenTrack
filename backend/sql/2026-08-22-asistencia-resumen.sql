-- Tablas nuevas del resumen nocturno de asistencia (dashboard-asistencia).
-- Ejecutar manualmente en TEST y PROD antes de desplegar (synchronize está
-- desactivado fuera de development, y el deploy corre verify-schema.js, que
-- bloquea el despliegue si estas tablas no existen).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'asistencia_diaria_resumen')
BEGIN
  CREATE TABLE asistencia_diaria_resumen (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cedula NVARCHAR(50) NOT NULL,
    nombre NVARCHAR(255) NOT NULL,
    employee_id_odoo INT NULL,
    departamento NVARCHAR(255) NULL,
    company NVARCHAR(255) NULL,
    fecha DATE NOT NULL,
    hora_programada DECIMAL(5,2) NULL,
    hora_entrada NVARCHAR(30) NULL,
    hora_salida NVARCHAR(30) NULL,
    minutos_tarde INT NULL,
    estado NVARCHAR(20) NOT NULL,
    ausencia_justificada BIT NULL,
    novedad_tipificacion NVARCHAR(100) NULL,
    horas_extra_id INT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_asistencia_dia_created_at DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_asistencia_dia_updated_at DEFAULT GETDATE(),
    CONSTRAINT UQ_asistencia_dia_cedula_fecha UNIQUE (cedula, fecha, company)
  );
  CREATE INDEX IDX_asistencia_dia_fecha ON asistencia_diaria_resumen (fecha);
  CREATE INDEX IDX_asistencia_dia_departamento ON asistencia_diaria_resumen (departamento);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'asistencia_cron_config')
BEGIN
  CREATE TABLE asistencia_cron_config (
    id INT NOT NULL PRIMARY KEY,
    hora INT NOT NULL CONSTRAINT DF_asistencia_cron_hora DEFAULT 3,
    minuto INT NOT NULL CONSTRAINT DF_asistencia_cron_minuto DEFAULT 0,
    activo BIT NOT NULL CONSTRAINT DF_asistencia_cron_activo DEFAULT 1,
    company NVARCHAR(255) NOT NULL CONSTRAINT DF_asistencia_cron_company DEFAULT 'Todas',
    dias_ventana INT NOT NULL CONSTRAINT DF_asistencia_cron_dias_ventana DEFAULT 2,
    ultima_corrida_fecha NVARCHAR(10) NULL
  );
END
