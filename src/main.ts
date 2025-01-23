import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const config = new DocumentBuilder()
    .setTitle('VPN сервис')
    .setDescription('Документация REST API')
    .setVersion('1.0.0')
    .addTag('SlivkiVPN')
    .build();

  app.enableCors({
    origin: 'https://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document);

  console.log(join(__dirname, '..', 'data'), 'path to data');
  const PORT = process.env.PORT || 5000;
  await app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`));
}
bootstrap();
