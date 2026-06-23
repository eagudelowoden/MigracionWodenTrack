import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import * as fs from 'fs';

/**
 * Carga el certificado para servir HTTPS (necesario para que el WebSocket vaya
 * directo a Node como `wss://` sin pasar por el proxy de IIS). Si las variables
 * no están o el archivo no carga, devuelve null y el servidor arranca en HTTP
 * (comportamiento actual) — así nunca tumba local ni entornos sin certificado.
 *
 * Variables admitidas (.env):
 *   - SSL_PFX_PATH (+ SSL_PFX_PASSPHRASE)   → certificado .pfx exportado de IIS
 *   - o bien SSL_KEY_PATH + SSL_CERT_PATH   → par clave/certificado en PEM
 */
function cargarHttpsOptions(): { pfx?: Buffer; passphrase?: string; key?: Buffer; cert?: Buffer } | null {
  try {
    const pfxPath = process.env.SSL_PFX_PATH;
    if (pfxPath && fs.existsSync(pfxPath)) {
      return {
        pfx: fs.readFileSync(pfxPath),
        passphrase: process.env.SSL_PFX_PASSPHRASE || undefined,
      };
    }
    const keyPath = process.env.SSL_KEY_PATH;
    const certPath = process.env.SSL_CERT_PATH;
    if (keyPath && certPath && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
    }
  } catch (e: any) {
    console.error('⚠️  No se pudo cargar el certificado HTTPS, se arranca en HTTP:', e?.message);
  }
  return null;
}

async function bootstrap() {
  const httpsOptions = cargarHttpsOptions();
  const app = await NestFactory.create(AppModule, {
    httpsOptions: httpsOptions ?? undefined,
    bodyParser: true,
  });
  // Deshabilitar ETags para evitar respuestas 304 con datos cacheados
  app.getHttpAdapter().getInstance().set('etag', false);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, cb) => {
      // Permitir requests sin origin (mobile apps, Postman, etc.)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origen no permitido → ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
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
  const proto = httpsOptions ? 'https' : 'http';
  console.log(`🚀 Servidor NestJS corriendo en: ${proto}://0.0.0.0:${PORT}  (${httpsOptions ? 'HTTPS/wss' : 'HTTP/ws'})`);
}
bootstrap();
