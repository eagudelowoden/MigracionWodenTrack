<template>
  <div class="min-h-screen bg-[#0f121a] flex flex-col items-center justify-center p-4 text-white relative overflow-hidden font-sans">
    
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-[#FF8F00]/10 rounded-full blur-[120px]"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>

    <div v-if="loading" class="flex flex-col items-center gap-4 z-10">
      <div class="w-12 h-12 border-4 border-[#FF8F00]/20 border-t-[#FF8F00] rounded-full animate-spin"></div>
      <p class="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8F00]">Sincronizando...</p>
    </div>

    <div v-else-if="apkData" class="w-full max-w-[380px] z-10 space-y-4">
      
      <div class="flex flex-col items-center text-center">
        <div class="relative mb-4">
          <div class="absolute -inset-4 bg-[#FF8F00]/20 rounded-full blur-2xl animate-pulse"></div>
          <div class="relative w-20 h-20 bg-gradient-to-b from-[#252a41] to-[#0f121a] border border-[#FF8F00]/30 rounded-[2rem] flex items-center justify-center shadow-2xl">
            <i class="fab fa-android text-4xl text-[#FF8F00]"></i>
          </div>
        </div>
        <h1 class="text-3xl font-black italic tracking-tighter uppercase leading-none">
          WODEN<span class="text-[#FF8F00]">TRACK</span>
        </h1>
        <div class="flex items-center justify-center gap-2 mt-2">
          <span class="px-2 py-0.5 bg-[#FF8F00]/10 border border-[#FF8F00]/20 rounded text-[8px] font-black text-[#FF8F00] uppercase tracking-widest">
            Uso Profesional
          </span>
        </div>
      </div>

      <div class="bg-[#1a1d2d] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div class="bg-gradient-to-b from-[#252a41] to-[#1a1d2d] p-6 space-y-6">
          
          <div class="flex items-center justify-between px-2">
            <div>
              <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Versión</span>
              <span class="text-xl font-black italic text-white">v{{ apkData.version }}</span>
            </div>
            <div class="text-right">
              <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Tamaño</span>
              <span class="text-xl font-black italic text-white">{{ apkData.size }}MB</span>
            </div>
          </div>

          <button @click="descargarApk" 
             class="w-full py-4 bg-[#FF8F00] hover:bg-[#FFB300] text-black rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-xl shadow-[#FF8F00]/20 flex items-center justify-center gap-3">
            <i class="fas fa-download text-lg"></i>
            Descargar APK
          </button>

          <div class="grid grid-cols-2 gap-2">
            <button @click="activeModal = 'changelog'" class="py-2.5 rounded-xl bg-white/5 text-[9px] font-black uppercase hover:bg-white/10 transition-all border border-white/5">
              <i class="fas fa-rocket mr-2 text-blue-400"></i> Novedades
            </button>
            <button @click="activeModal = 'qr'" class="py-2.5 rounded-xl bg-white/5 text-[9px] font-black uppercase hover:bg-white/10 transition-all border border-white/5">
              <i class="fas fa-qrcode mr-2 text-[#FF8F00]"></i> Código QR
            </button>
          </div>
        </div>
      </div>

      <div class="bg-[#1a1d2d]/60 border border-white/10 rounded-[2rem] p-5 space-y-4 shadow-xl">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 shrink-0 bg-[#FF8F00]/10 rounded-xl flex items-center justify-center text-[#FF8F00]">
            <i class="fas fa-user-shield text-lg"></i>
          </div>
          <div class="space-y-1">
            <p class="text-[12px] leading-tight text-slate-200 font-bold">
              WodenTrack es una aplicación de marcación de entrada y salida. 
            </p>
            <p class="text-[11px] text-[#FF8F00] font-black uppercase tracking-tighter italic">
              WodenTrack NO es Intrusiva
            </p>
          </div>
        </div>

        <button @click="activeModal = 'privacy'" class="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2">
           ¿Cómo funcionan los permisos? <i class="fas fa-chevron-right text-[8px]"></i>
        </button>
      </div>

      <div class="flex justify-center pt-2">
        <router-link to="/login" class="text-[9px] font-black uppercase tracking-widest opacity-20 hover:opacity-100 flex items-center gap-2 transition-all">
          <i class="fas fa-arrow-left"></i> Regresar
        </router-link>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="activeModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f121a]/95 backdrop-blur-xl">
        <div class="w-full max-w-sm bg-[#1a1d2d] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
          
          <button @click="activeModal = null" class="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
            <i class="fas fa-times"></i>
          </button>

          <div v-if="activeModal === 'privacy'" class="p-8 space-y-6 text-center">
            <div class="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <i class="fas fa-shield-check text-3xl text-emerald-500"></i>
            </div>
            
            <h3 class="text-sm font-black uppercase tracking-widest text-[#FF8F00]">Política de Cero Permisos</h3>
            
            <div class="space-y-4 text-left">
              <p class="text-[12px] leading-relaxed text-slate-300">
                Tu dispositivo móvil arrojará una solicitud de acceso si una aplicación intenta entrar a tus datos privados. 
              </p>
              <div class="p-4 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-2xl">
                <p class="text-[12px] font-bold text-white italic mb-1">
                  WodenTrack no hará esto:
                </p>
                <p class="text-[11px] text-slate-400">
                  Nuestra arquitectura técnica es <span class="text-white font-bold italic">No Intrusiva</span> y funciona sin pedir permisos de fotos, contactos o micrófono.
                </p>
              </div>
            </div>

            <button @click="activeModal = null" class="w-full py-4 bg-[#FF8F00] text-black font-black uppercase text-[10px] rounded-2xl tracking-[0.2em]">
              Entendido
            </button>
          </div>

          <div v-if="activeModal === 'qr'" class="p-10 text-center space-y-6">
            <h3 class="text-xs font-black uppercase tracking-widest text-[#FF8F00]">Escaneo Rápido</h3>
            <div class="p-3 bg-white rounded-[2.5rem] inline-block shadow-2xl">
              <qrcode-vue :value="apkData.downloadUrl" :size="180" level="H" foreground="#0f121a" />
            </div>
            <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Cámara Móvil / QR Reader</p>
          </div>

          <div v-if="activeModal === 'changelog'" class="p-10 space-y-6">
            <h3 class="text-xs font-black uppercase tracking-widest text-blue-400 text-center">Novedades de v{{ apkData.version }}</h3>
            <ul class="space-y-3">
              <li v-for="item in apkData.changelog" :key="item" class="text-[11px] p-4 bg-white/5 rounded-2xl border border-white/5 leading-relaxed italic text-slate-300">
                {{ item }}
              </li>
            </ul>
          </div>

          <div v-if="activeModal !== 'privacy'" class="p-5 bg-[#252a41] text-center">
            <button @click="activeModal = null" class="text-[10px] font-black uppercase tracking-widest text-[#FF8F00]">Cerrar</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { useApkRepo } from '../../composables/adminLogica/useApkRepo.js';

const { apkData, loading, error, fetchApkInfo, descargarApk } = useApkRepo();
const activeModal = ref(null);

onMounted(fetchApkInfo);
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.9) translateY(20px); }
</style>