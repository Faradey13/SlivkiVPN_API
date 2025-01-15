import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const config = new DocumentBuilder()
    .setTitle('VPN сервис')
    .setDescription('Документация REST API')
    .setVersion('1.0.0')
    .addTag('SlivkiVPN')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document);

  const PORT = process.env.PORT || 5000;
  await app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}
bootstrap();
