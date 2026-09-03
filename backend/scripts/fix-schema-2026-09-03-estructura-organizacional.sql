-- Estructura Organizacional: maestros de Segmento y Centro de Costo PROPIOS
-- (independientes de maestro_segmentos, que usa el módulo "Organización"),
-- más la tabla de asignación por persona (segmentacion_areas), y las columnas
-- correspondientes en asistencia_diaria_resumen.
-- Ejecutar contra la base correspondiente antes de desplegar este cambio.

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'maestro_segmentos_estructura')
CREATE TABLE maestro_segmentos_estructura (
  id INT IDENTITY(1,1) PRIMARY KEY,
  nombre NVARCHAR(255) NOT NULL UNIQUE,
  creado_por NVARCHAR(255) NULL,
  creado_en DATETIME NOT NULL DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'maestro_centros_costo')
CREATE TABLE maestro_centros_costo (
  id INT IDENTITY(1,1) PRIMARY KEY,
  nombre NVARCHAR(255) NOT NULL UNIQUE,
  codigo NVARCHAR(50) NULL,
  creado_por NVARCHAR(255) NULL,
  creado_en DATETIME NOT NULL DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'segmentacion_areas')
CREATE TABLE segmentacion_areas (
  id INT IDENTITY(1,1) PRIMARY KEY,
  usuario_id_odoo INT NOT NULL UNIQUE,
  segmento_id INT NULL,
  centro_costo_id INT NULL,
  asignado_por NVARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT GETDATE(),
  updated_at DATETIME NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_segmentacion_segmento FOREIGN KEY (segmento_id) REFERENCES maestro_segmentos_estructura(id),
  CONSTRAINT FK_segmentacion_centro_costo FOREIGN KEY (centro_costo_id) REFERENCES maestro_centros_costo(id)
);

-- Si segmentacion_areas ya existía apuntando por error al maestro_segmentos
-- VIEJO (el de "Organización"), corrige la FK para que apunte al nuevo.
IF EXISTS (
  SELECT 1 FROM sys.foreign_keys fk
  JOIN sys.tables t ON fk.referenced_object_id = t.object_id
  WHERE fk.name = 'FK_segmentacion_segmento' AND t.name = 'maestro_segmentos'
)
BEGIN
  ALTER TABLE segmentacion_areas DROP CONSTRAINT FK_segmentacion_segmento;
  ALTER TABLE segmentacion_areas ADD CONSTRAINT FK_segmentacion_segmento
    FOREIGN KEY (segmento_id) REFERENCES maestro_segmentos_estructura(id);
END

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'asistencia_diaria_resumen' AND COLUMN_NAME = 'centro_costo_id'
)
  ALTER TABLE asistencia_diaria_resumen ADD centro_costo_id INT NULL;

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'asistencia_diaria_resumen' AND COLUMN_NAME = 'centro_costo_nombre'
)
  ALTER TABLE asistencia_diaria_resumen ADD centro_costo_nombre NVARCHAR(255) NULL;
