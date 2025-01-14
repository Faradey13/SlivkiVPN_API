import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 5001;
  await app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}
bootstrap();
