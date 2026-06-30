# Horas Extra — Arquitectura de Cálculo

Documento para el equipo. Explica cómo funciona el cálculo de horas extra: por qué
se diseñó así, qué piezas hay y cómo operarlo.

---

## 1. El problema que resuelve

El cálculo original se hacía **en vivo dentro de la API**, trayendo TODAS las
marcaciones de Odoo a memoria de golpe. Con rangos grandes o varios usuarios a la
vez, la RAM se disparaba y **se caía toda la aplicación**.

La solución: **no calcular en vivo**. Un proceso aparte (worker) calcula por lotes
y guarda los resultados en una tabla; los usuarios solo **consultan** esa tabla.

---

## 2. Las piezas

```
┌──────────────────────────────────────────────────────────────────┐
│  API (NestJS)                                                      │
│   • Atiende usuarios (login, marcación, consultas)                 │
│   • Cron CADA HORA (6-20) → solo ENCOLA un job (instantáneo)       │
│   • Panel Super Admin para configurar el cron                      │
└───────────────┬──────────────────────────────────────────────────┘
                │ (encola en SQL)
                ▼
       ┌─────────────────────┐
       │  Cola: horas_extra_jobs (tabla SQL, sin Redis)             │
       └─────────┬───────────┘
                 │ (el worker toma de a uno, atómico)
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  WORKER (proceso APARTE)                                           │
│   • Toma 1 job → calcula POR LOTES de 50 empleados                 │
│   • Guarda el resultado en  calculados_extras                     │
│   • Si revienta la memoria → muere SOLO él, la API sigue viva      │
└──────────────────────────────────────────────────────────────────┘
                 │
                 ▼
       ┌─────────────────────┐
       │ calculados_extras (resultados listos)                      │
       └─────────┬───────────┘
                 │ (SELECT instantáneo, filtrado por jefe)
                 ▼
        Coordinadores → pantalla "Cálculos" → "Consultar"
```

---

## 3. Tablas

| Tabla | Qué guarda | Quién escribe |
|-------|------------|---------------|
| `calculados_extras` | Resultados calculados (RN, HEFN, etc.) que se **consultan** | El worker (cron / manual) |
| `horas_extra_jobs` | La **cola** de trabajos (estado: pendiente/procesando/completado/error) | API y cron encolan; worker actualiza |
| `calculo_extra_cron_config` | Config del cron (activo, rango horario, días a recalcular) | Panel Super Admin |
| `horas_extra` | Flujo **manual** de aprobación/notificación (NO lo toca el cron) | Admin con "Guardar" |

> El cron escribe en `calculados_extras`, **no** en `horas_extra`, para no pisar
> las aprobaciones manuales.

---

## 4. Flujo de cálculo (motor)

- **Orquestador** `calcularExtras`: resuelve los empleados con marcaciones en el
  rango (vía `read_group`, incluye inactivos/retirados que trabajaron) y los
  procesa en **lotes de 50**, liberando memoria entre cada lote.
- **Núcleo** `_calcularExtrasScoped`: la lógica de siempre (turnos nocturnos que
  cruzan medianoche, festivos, RN/RNDF/RDDF/HEDO/HENO/HEFD/HEFN, malla vigente por
  fecha). **No cambió** respecto al cálculo original — solo se ejecuta por lotes.
- **Empresa**: cada registro guarda la empresa REAL del empleado (no el filtro).

El cálculo es **por empleado-día** (independiente), por eso procesar por lotes da
el **mismo resultado** que "todo junto", con memoria acotada.

---

## 5. El cron

- Corre **cada hora** dentro de un rango horario (por defecto **6:00 a 20:00**).
- Cada corrida **encola** un job que recalcula la **ventana de asentamiento**
  (`dias_ventana`, por defecto unos pocos días) → recoge marcaciones tardías y
  correcciones.
- Es **idempotente**: recalcular un rango lo reemplaza (borra + reinserta).
- Configurable desde **Super Admin → Cálculo Horas Extra**:
  - Activar/desactivar
  - Rango horario (desde/hasta) y minuto
  - Días a recalcular (mantener **bajo, 2-3**, para corridas horarias)
  - **Ejecutar ahora** (con empresa y rango opcional → para backfills)
  - Historial de corridas

> Para cargar un **histórico grande** (ej. 2 meses) usa "Ejecutar ahora" con las
> fechas explícitas, NO subas `dias_ventana` del cron.

---

## 6. Consulta (lo que ve el coordinador)

- Pantalla **Cálculos → "Consultar"**: lee `calculados_extras` (SELECT instantáneo,
  no toca Odoo ni RAM). Aguanta muchos usuarios a la vez.
- **Filtro por jefe**: cada coordinador ve solo los empleados de **su área/segmento**
  (mismo mecanismo que el cálculo en vivo: `area_id`/`segmento_id` →
  `resolverIdsPorEstructura`). SuperAdmin ve todo.

---

## 7. Cómo se ejecuta

### Desarrollo
```bash
npm run start:dev      # API en modo watch (SOLO para editar código)
```
> En `start:dev` NO uses el spawn de worker: el watch reinicia ante cambios.

### Producción (servidor Windows) — con PM2
```bash
npm install -g pm2          # una vez
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup                 # que arranque al reiniciar Windows
```

Esto levanta:
- `woden-api` → la API (con `HX_NO_SPAWN=1`: solo encola, no lanza workers).
- `woden-worker` → el worker en modo **demonio** (siempre vivo, revisa la cola).

PM2 los reinicia si caen y los arranca con el servidor.

```bash
pm2 status                       # estado
pm2 logs woden-worker            # logs del worker
pm2 reload ecosystem.config.js   # tras un nuevo build
```

### Modos del worker (variables de entorno)
| Variable | Efecto |
|----------|--------|
| `HX_WORKER=1` | Marca el proceso como worker (desactiva crons de la app dentro de él) |
| `HX_WORKER_ONCE=1` | Worker "once": procesa la cola y se cierra (lo usa el spawn bajo demanda) |
| `HX_NO_SPAWN=1` | La API NO lanza workers (cuando hay un demonio con PM2) |

---

## 8. Operación / problemas comunes

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Job se queda en `pendiente` | No hay worker corriendo | Levantar el worker (PM2) o "Ejecutar ahora" relanza el spawn |
| "Consultar" no trae nada | Ese rango/empresa aún no se calculó | "Ejecutar ahora" con esa empresa + rango |
| La API se reinicia al "Ejecutar ahora" | Se está usando `start:dev` (watch) | Usar `npm run start` / PM2 |
| Faltan días en un mes | El cron solo cubre `dias_ventana` | Backfill con "Ejecutar ahora" + fechas |
| Faltan empleados retirados | (Ya corregido) el scope usa marcaciones reales, no `active=true` | — |

---

## 9. Archivos clave

| Archivo | Rol |
|---------|-----|
| `horas-extra.service.ts` | Motor de cálculo + `recalcularYGuardarCalculados` + `consultarCalculados` |
| `horas-extra-job.service.ts` | Cola (encolar, tomar, marcar completado/error) |
| `horas-extra-cron.service.ts` | Cron configurable + lanzar worker |
| `worker.ts` | Proceso worker (demonio u once) |
| `entities/calculado-extra.entity.ts` | Tabla `calculados_extras` |
| `entities/hora-extra-job.entity.ts` | Tabla `horas_extra_jobs` |
| `entities/calculo-extra-cron-config.entity.ts` | Config del cron |
| `ecosystem.config.js` | PM2 (API + worker) |
| `components/admin/SuperAdmin/GestionCronHoras.vue` | Panel de administración del cron |
