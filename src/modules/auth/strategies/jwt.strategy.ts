import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Token Payload Interface
 *
 * @description
 * Defines the structure of data stored in JWT tokens.
 * This payload is returned by protected endpoints when accessing @CurrentUser() decorator.
 *
 * @interface JwtPayload
 */
export interface JwtPayload {
  /** User's unique Firebase identifier */
  uid: string;
  /** User's email address */
  email: string;
  /** User's display name */
  displayName: string;
  /** User's profile photo URL (optional) */
  photoURL?: string;
}

/**
 * JWT Authentication Strategy
 *
 * @description
 * Passport strategy for validating JWT tokens in protected endpoints.
 * Automatically extracts and validates Bearer tokens from Authorization header.
 *
 * **How it works**:
 * 1. Extracts JWT token from "Authorization: Bearer <token>" header
 * 2. Verifies token signature using JWT_SECRET
 * 3. Checks token expiration
 * 4. Validates payload contains required fields (uid, email)
 * 5. Returns payload to be injected via @CurrentUser() decorator
 *
 * **Configuration**:
 * - Token extraction: Authorization header as Bearer token
 * - Expiration validation: Enabled (tokens expire after JWT_EXPIRATION)
 * - Secret key: JWT_SECRET from environment variables
 *
 * **Usage in controllers**:
 * ```typescript
 * @Get('me')
 * getCurrentUser(@CurrentUser() user: JwtPayload) {
 *   return user; // Contains uid, email, displayName, photoURL
 * }
 * ```
 *
 * @class JwtStrategy
 * @extends {PassportStrategy(Strategy)}
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Extract JWT from Authorization header as "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens
      ignoreExpiration: false,
      // Secret key for token verification
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
    });
  }

  /**
   * Validate JWT token payload
   *
   * @description
   * Called automatically by Passport after token signature and expiration are verified.
   * Performs additional validation to ensure payload contains required user identification.
   *
   * @param payload - Decoded JWT payload
   * @returns Validated payload to be injected in route handlers
   * @throws {UnauthorizedException} If payload is missing required fields
   */
  validate(payload: JwtPayload): JwtPayload {
    if (!payload.uid || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
}
