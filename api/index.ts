import { NestFactory } from '../backend/node_modules/@nestjs/core';
import { ExpressAdapter } from '../backend/node_modules/@nestjs/platform-express';
import * as express from '../backend/node_modules/express';
import { AppModule } from '../backend/src/app.module';

let cachedServer;

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  await app.init();
  return server;
}

export default async function handler(req, res) {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  cachedServer(req, res);
}
