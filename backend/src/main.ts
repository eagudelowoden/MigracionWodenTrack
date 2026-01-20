import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express'; // Importamos las funciones de express

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- SOLUCIÓN AL ERROR 413 ---
  // Aumentamos el límite para JSON y datos codificados en URL
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // --- CONFIGURACIÓN DE CORS ---
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe());

  const PORT = process.env.PORT || 8082;
  
  await app.listen(PORT, '0.0.0.0');
  
  console.log(`🚀 Servidor NestJS corriendo en: http://localhost:${PORT}`);
}
bootstrap();