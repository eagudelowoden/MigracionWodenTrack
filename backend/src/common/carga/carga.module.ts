import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CargaService } from './carga.service';
import { CargaPesadaInterceptor } from './carga-pesada.interceptor';
import { CargaController } from './carga.controller';

/**
 * Registra el control de admisión de consultas pesadas de forma global.
 * El interceptor solo actúa en handlers marcados con @Pesado().
 */
@Global()
@Module({
  controllers: [CargaController],
  providers: [
    CargaService,
    { provide: APP_INTERCEPTOR, useClass: CargaPesadaInterceptor },
  ],
  exports: [CargaService],
})
export class CargaModule {}
