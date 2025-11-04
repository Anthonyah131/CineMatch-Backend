import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseModule } from '../../config/firebase.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

/**
 * Authentication Module
 *
 * @description
 * Provides complete authentication functionality for CineMatch Backend.
 *
 * **Features**:
 * - Firebase token verification (Google, Facebook, Apple, etc.)
 * - JWT token generation and validation
 * - User registration with validation
 * - Automatic user creation on login
 * - OAuth provider tracking
 * - Protected route guards
 *
 * **Configuration**:
 * - JWT_SECRET: Secret key for signing JWT tokens (from environment)
 * - JWT_EXPIRATION: Token expiration time (default: 7 days)
 * - Firebase Admin SDK credentials (from Firebase config)
 *
 * **Exports**:
 * - AuthService: For use in other modules that need authentication logic
 * - JwtStrategy: Passport strategy for JWT validation
 * - PassportModule: For guard usage in other modules
 *
 * **Usage in other modules**:
 * ```typescript
 * @Module({
 *   imports: [AuthModule],
 *   // ...
 * })
 * export class SomeModule {}
 * ```
 *
 * **Protecting endpoints**:
 * - All endpoints are protected by default via global JwtAuthGuard in app.module.ts
 * - Use @Public() decorator to bypass authentication on specific endpoints
 *
 * @module AuthModule
 */
@Module({
  imports: [
    // Firebase Admin SDK for token verification
    FirebaseModule,
    // Users module for database operations
    UsersModule,
    // Passport with JWT as default strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JWT configuration from environment variables
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRATION') || '7d') as `${number}d`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
