import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {


  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

  //Version API
  app.setGlobalPrefix('api')
  app.enableVersioning({
    type:VersioningType.URI,
    defaultVersion:["1"]
  })

  //Global Validate
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }))
  //Public file
  app.useStaticAssets('public')


  await app.listen(process.env.SV_PORT);
}
bootstrap();
