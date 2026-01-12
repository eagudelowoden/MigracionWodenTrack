<template>
  <div class="min-h-screen bg-[#1a1d2d] flex flex-col items-center justify-center p-6 relative overflow-hidden text-white font-sans">
    
    <div class="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl"></div>

    <div class="w-full max-w-md z-10">
      
      <div class="flex flex-col items-center mb-8">
        <div class="w-20 h-20 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl shadow-2xl flex items-center justify-center mb-4 transform rotate-3">
          <i class="fab fa-android text-4xl text-white"></i>
        </div>
        <h1 class="text-2xl font-black uppercase tracking-tighter">WODEN TRACK MOVIL</h1>
        <p class="text-blue-400/60 text-[10px] font-bold uppercase tracking-[0.3em]">Centro de Despliegue</p>
      </div>

      <div class="bg-[#252a41] border border-[#2d324d] rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
        
        <div class="flex items-center justify-between mb-6">
          <div>
            <span class="block text-xs font-bold text-slate-400 uppercase">Versión Actual</span>
            <span class="text-2xl font-mono font-bold text-white">v2.4.0</span>
          </div>
          <div class="text-right">
            <span class="block text-xs font-bold text-slate-400 uppercase">Peso</span>
            <span class="text-sm font-mono text-slate-300">24.5 MB</span>
          </div>
        </div>

        <div class="space-y-4">
          <a href="/path-to-your-apk/app-release.apk" 
             download
             class="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase text-sm transition-all active:scale-95 shadow-lg shadow-blue-900/40">
            <i class="fas fa-download text-lg"></i>
            Descargar APK
          </a>

          <button class="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
            ¿Cómo instalar? (Orígenes desconocidos)
          </button>
        </div>

        <div class="mt-8 pt-6 border-t border-white/5 flex items-center gap-4">
          <div class="flex-1">
            <p class="text-[9px] text-slate-400 leading-relaxed uppercase tracking-tight">
              Esta es una versión interna firmada oficialmente. Asegúrese de tener habilitada la instalación de fuentes desconocidas.
            </p>
          </div>
          <div class="shrink-0">
             <i class="fas fa-shield-alt text-emerald-500 opacity-50 text-xl"></i>
          </div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <router-link to="/login" class="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors">
          <i class="fas fa-arrow-left mr-2"></i> Ir al panel de administración
        </router-link>
      </div>

    </div>
    
    <div class="absolute bottom-6 text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">
      © 2024 Tu Empresa - IT Department
    </div>
  </div>
</template>