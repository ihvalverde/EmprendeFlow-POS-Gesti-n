import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(env.port, () => {
  console.log(`\n🚀 EmprendeFlow API escuchando en http://localhost:${env.port}/api/v1`);
  console.log(`   Entorno: ${env.nodeEnv}`);
  console.log(`   CORS permitido: ${env.clientOrigins.join(', ')}\n`);
});

async function shutdown(signal) {
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
