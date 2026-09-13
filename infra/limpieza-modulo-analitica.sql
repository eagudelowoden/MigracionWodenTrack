-- ============================================================================
-- Limpieza del módulo "Analítica HR" (slug: super.analitica)
-- ============================================================================
-- El código del módulo ya fue eliminado del repositorio. Este script retira lo
-- que queda en base de datos, que el código NO puede limpiar solo: el seed de
-- modulos-disponibles.service.ts solo inserta lo que falta, nunca borra
-- (ver modulos-disponibles.service.ts → seed()).
--
-- Sin ejecutar esto, el permiso "Analítica HR" sigue apareciendo asignable en
-- la pantalla de Módulos, apuntando a una vista que ya no existe.
--
-- EJECUTAR EN: primero QA, luego PRODUCCIÓN.
-- ============================================================================

-- ── 1. Revisión previa: cuántos usuarios tienen el permiso asignado ─────────
-- Ejecuta esto ANTES de borrar para saber a quién afecta.
SELECT u.id_odoo,
       u.nombre,
       p.nivel_acceso,
       p.asignado_por
  FROM usuarios_permisos p
  JOIN usuarios u ON u.id_odoo = p.usuario_id_odoo
 WHERE p.modulos = 'super.analitica'
 ORDER BY u.nombre;

-- ¿Existe la fila del catálogo?
SELECT id, slug, nombre, activo
  FROM modulos_disponibles
 WHERE slug = 'super.analitica';


-- ── 2. Borrado ──────────────────────────────────────────────────────────────
-- Va en transacción: si algo sale mal, ROLLBACK y no queda a medias.
BEGIN;

-- 2.1 Quitar el permiso a todos los usuarios que lo tuvieran asignado.
DELETE FROM usuarios_permisos
 WHERE modulos = 'super.analitica';

-- 2.2 Quitar la entrada del catálogo de módulos.
DELETE FROM modulos_disponibles
 WHERE slug = 'super.analitica';

-- Revisa los conteos que devuelven los DELETE antes de confirmar.
COMMIT;
-- ROLLBACK;  -- ← usa esto en vez del COMMIT si algo no cuadra.


-- ── 3. Verificación posterior ───────────────────────────────────────────────
-- Ambas consultas deben devolver 0 filas.
SELECT COUNT(*) AS permisos_restantes
  FROM usuarios_permisos
 WHERE modulos = 'super.analitica';

SELECT COUNT(*) AS catalogo_restante
  FROM modulos_disponibles
 WHERE slug = 'super.analitica';
