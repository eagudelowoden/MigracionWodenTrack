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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe());

  // Timeouts HTTP — el handler del timeout cierra el socket activamente
  const server = app.getHttpServer();
  server.keepAliveTimeout = 120000;   // 2 min keep-alive
  server.headersTimeout   = 125000;   // debe ser > keepAliveTimeout

  // Cuando un socket lleva más de 4 min inactivo, cerrarlo limpiamente
  // para que el cliente reciba un 503 en vez de ERR_CONNECTION_RESET
  server.setTimeout(240000, (socket) => {
    socket.end('HTTP/1.1 503 Service Unavailable\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
    socket.destroy();
  });

  const PORT = process.env.PORT || 8082;
  await app.listen(PORT, '0.0.0.0');
  console.log(`🚀 Servidor NestJS corriendo en: http://localhost:${PORT}`);
}
bootstrap();
