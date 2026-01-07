import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Creamos la instancia de la aplicación
  const app = await NestFactory.create(AppModule);

  // --- CONFIGURACIÓN DE CORS ---
  // Mantiene la misma lógica que tenías en Express
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Añadimos PUT/DELETE por si los necesitas luego
    allowedHeaders: ['Content-Type', 'Authorization'], // Authorization es útil para JWT
  });

  // --- VALIDACIÓN GLOBAL (Opcional pero recomendado) ---
  // Esto ayudará a que si envías datos mal formados, Nest responda automáticamente con error 400
  app.useGlobalPipes(new ValidationPipe());

  // --- PREFIJO GLOBAL (Opcional) ---
  // Si quieres que todas tus rutas empiecen con /api (ej: /api/usuarios/login)
  // app.setGlobalPrefix('api');

  const PORT = process.env.PORT || 8082;
  
  await app.listen(PORT, '0.0.0.0');
  
  console.log(`🚀 Servidor NestJS corriendo en: http://localhost:${PORT}`);
}
bootstrap();