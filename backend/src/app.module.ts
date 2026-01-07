// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OdooModule } from './odoo/odoo.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Esto permite usar ConfigService en cualquier lugar sin volver a importarlo
    }),
    OdooModule,
    UsuariosModule,
  ],
})
export class AppModule {}