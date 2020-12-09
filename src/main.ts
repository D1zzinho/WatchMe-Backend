import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {NestExpressApplication} from "@nestjs/platform-express";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import session from 'cookie-session';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets('./public');
  app.enableCors();

  app.use(
      session({
        secret: process.env.COOKIE_SECRET,
      })
  );

  const options = new DocumentBuilder()
      .setTitle('WatchMe API')
      .setDescription('watchMe api')
      .setVersion('1.0.0')
      .addBearerAuth(
          { type: 'apiKey', in: 'header', name: 'Authorization' }
      )
      .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/', app, document);

  await app.listen(parseInt(process.env.PORT, 10) || 3000);
}
bootstrap();
