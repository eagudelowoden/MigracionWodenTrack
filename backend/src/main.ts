import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe());

  // 👇 Aumentar timeout del servidor HTTP
  const server = app.getHttpServer();
  server.setTimeout(300000); // 5 minutos
  server.keepAliveTimeout = 300000; // 5 minutos
  server.headersTimeout = 301000; // debe ser mayor que keepAliveTimeout

  const PORT = process.env.PORT || 8082;
  await app.listen(PORT, '0.0.0.0');
  console.log(`🚀 Servidor NestJS corriendo en: http://localhost:${PORT}`);
}
bootstrap();
