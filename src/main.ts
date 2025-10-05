import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('CineMatch API')
    .setDescription('Backend API for CineMatch - A movie and TV show matching app')
    .setVersion('1.0')
    .addTag('users', 'User management operations')
    .addTag('lists', 'User lists and collections')
    .addTag('media', 'Movies and TV shows cache management')
    .addTag('matches', 'Content matching system')
    .addTag('auth', 'Authentication')
    .addTag('tmdb', 'TMDb API integration for movies and TV shows')
    .addTag('hello', 'Health check and testing endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🟢 CineMatch Backend is running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

void bootstrap();
