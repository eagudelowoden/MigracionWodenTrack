import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OdooModule } from './odoo/odoo.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AppController } from './app.controller'; // <--- IMPORTANTE: Importar el controlador
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OdooModule,
    UsuariosModule,
  ],
  controllers: [AppController], // <--- ¡AQUÍ ESTÁ EL TRUCO! Debe estar en esta lista
  providers: [AppService],
})
export class AppModule {}