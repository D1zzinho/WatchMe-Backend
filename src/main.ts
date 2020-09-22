import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {NestExpressApplication} from "@nestjs/platform-express";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

  app.useStaticAssets('./public');

  const options = new DocumentBuilder()
      .setTitle('WatchMe API')
      .setDescription('watchMe api')
      .setVersion('1.0.0')
      .addBearerAuth(
          { type: 'apiKey', in: 'header', name: 'Authorization' },
          //'Authorization'
      )
      .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/', app, document);

  await app.listen(3000);
}
bootstrap();
