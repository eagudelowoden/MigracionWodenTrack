<template>
  <div class="super-admin-container animate-fade-in space-y-8 p-6">
    <header class="flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-black italic uppercase text-[#FF8F00]">Panel de Control</h1>
        <p class="opacity-60 font-bold tracking-tighter uppercase text-xs">Consola Central de Administración</p>
      </div>
      <div class="text-right">
        <span class="bg-[#FF8F00] text-black px-4 py-1 rounded-full text-[10px] font-black uppercase">
          Acceso Nivel: Super Admin
        </span>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="stat-card">
        <span class="label">Total Empleados</span>
        <span class="value">{{ mallasData.length }}</span>
      </div>
      <div class="stat-card destaque">
        <span class="label">Asistencias Hoy</span>
        <span class="value">{{ asistenciasHoy }}</span>
      </div>
      <div class="stat-card">
        <span class="label">Alertas de Retraso</span>
        <span class="value text-red-500">4</span>
      </div>
    </div>

    <section class="bg-white/5 border border-dashed border-slate-700 p-8 rounded-[2rem]">
      <h3 class="mb-6 font-bold uppercase italic">Acciones Globales</h3>
      <div class="flex flex-wrap gap-4">
        <button class="admin-btn primary">
          <i class="fas fa-sync-alt mr-2"></i> Sincronizar Odoo
        </button>
        <button class="admin-btn">
          <i class="fas fa-download mr-2"></i> Reporte Consolidado
        </button>
        <button class="admin-btn danger">
          <i class="fas fa-exclamation-triangle mr-2"></i> Cerrar todas las sesiones
        </button>
      </div>
    </section>

    </div>
</template>

<style scoped>
.stat-card {
  @apply bg-white/5 p-6 rounded-[1.5rem] border border-slate-800 flex flex-col;
}
.stat-card.destaque {
  @apply border-[#FF8F00]/50 bg-[#FF8F00]/5;
}
.stat-card .label {
  @apply text-[10px] uppercase font-bold opacity-50;
}
.stat-card .value {
  @apply text-4xl font-black italic;
}
.admin-btn {
  @apply px-6 py-3 rounded-xl font-bold uppercase text-xs transition-all border border-white/10;
}
.admin-btn.primary {
  @apply bg-[#FF8F00] text-black border-none hover:bg-[#e68200];
}
.admin-btn.danger {
  @apply text-red-500 border-red-500/30 hover:bg-red-500/10;
}
</style>