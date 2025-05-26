import { NestFactory } from '../backend/node_modules/@nestjs/core';
import { ExpressAdapter } from '../backend/node_modules/@nestjs/platform-express';
import express from 'express';

import { AppModule } from '../backend/src/app.module';


import { Server } from 'http';

let cachedServer: Server;

export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter);
    await app.init();
    cachedServer = expressApp.listen(0);
  }

  return cachedServer.emit('request', req, res);
}
