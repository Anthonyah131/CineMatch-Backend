import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Auth } from 'firebase-admin/auth';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * Extended Firebase decoded token interface
 * Contains user information extracted from Firebase ID token
 */
interface FirebaseDecodedToken {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  firebase?: {
    sign_in_provider?: string;
    identities?: {
      'google.com'?: string[];
      email?: string[];
    };
  };
}

/**
 * Authentication Service
 *
 * @description
 * Handles all authentication logic including:
 * - Firebase token verification
 * - JWT token generation and validation
 * - User registration with validation
 * - Automatic user creation on login
 * - OAuth provider tracking (Google, Facebook, etc.)
 *
 * @class AuthService
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject('FIREBASE_AUTH') private auth: Auth,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  /**
   * Verify Firebase ID token and extract user information
   *
   * @description
   * Validates the Firebase ID token using Firebase Admin SDK.
   * Extracts user data including UID, email, name, photo, and authentication provider.
   *
   * @param idToken - Firebase ID token from client authentication
   * @returns Decoded token with user information
   * @throws {UnauthorizedException} If token is invalid, expired, or malformed
   *
   * @example
   * ```typescript
   * const decodedToken = await this.verifyFirebaseToken(firebaseToken);
   * console.log(decodedToken.uid, decodedToken.email);
   * ```
   */
  async verifyFirebaseToken(idToken: string): Promise<FirebaseDecodedToken> {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken as FirebaseDecodedToken;
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  /**
   * Generate backend JWT token for authenticated requests
   *
   * @description
   * Creates a JWT token containing user identification payload.
   * Token expires after the configured JWT_EXPIRATION time (default: 7 days).
   * This token is used for authenticating all subsequent API requests.
   *
   * @param payload - JWT payload containing user identification data
   * @returns Signed JWT token string
   *
   * @example
   * ```typescript
   * const token = this.generateJwtToken({
   *   uid: 'user123',
   *   email: 'user@example.com',
   *   displayName: 'John Doe'
   * });
   * ```
   */
  generateJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Register a new user with Firebase authentication
   *
   * @description
   * Creates a new user in the database after validating the Firebase token.
   * This method explicitly checks for existing users and returns a conflict error if found.
   * Automatically tracks the authentication provider (Google, Facebook, etc.).
   *
   * **Flow**:
   * 1. Verify Firebase token validity
   * 2. Check if user already exists (throws ConflictException if exists)
   * 3. Determine authentication provider from Firebase token
   * 4. Create user in Firestore database
   * 5. Generate and return JWT token
   *
   * @param registerDto - Registration data including Firebase token and optional profile info
   * @returns Authentication response with JWT token and user data
   * @throws {ConflictException} If user already exists
   * @throws {UnauthorizedException} If Firebase token is invalid
   *
   * @example
   * ```typescript
   * const authResponse = await authService.register({
   *   firebaseToken: 'eyJhbGciOiJSUzI1NiIs...',
   *   displayName: 'John Doe',
   *   bio: 'Movie lover'
   * });
   * ```
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Verify Firebase token
    const firebaseUser = await this.verifyFirebaseToken(registerDto.firebaseToken);

    // Check if user already exists
    const existingUser = await this.usersService.getUserById(firebaseUser.uid);
    if (existingUser) {
      throw new ConflictException('User already exists. Please login instead.');
    }

    // Determine auth provider
    const signInProvider = firebaseUser.firebase?.sign_in_provider || 'google';
    const provider = signInProvider === 'google.com' ? 'google' : 'email';

    // Create user in Firestore
    const newUser = await this.usersService.createUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: registerDto.displayName || firebaseUser.name || firebaseUser.email,
      photoURL: firebaseUser.picture || '',
      bio: registerDto.bio,
      birthdate: registerDto.birthdate,
      authProvider: {
        provider,
        providerId: firebaseUser.uid,
      },
      emailVerified: firebaseUser.email_verified || false,
    });

    // Generate JWT token
    const jwtPayload: JwtPayload = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: newUser.displayName,
      photoURL: newUser.photoURL,
    };

    const token = this.generateJwtToken(jwtPayload);

    return {
      token,
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: newUser.displayName,
        photoURL: newUser.photoURL,
      },
    };
  }

  /**
   * Login user with automatic account creation
   *
   * @description
   * **Recommended authentication method** that handles both existing and new users seamlessly.
   * If the user exists, authenticates them. If not, creates a new user automatically.
   *
   * **Flow**:
   * 1. Verify Firebase token validity
   * 2. Determine authentication provider (Google, Facebook, email, etc.)
   * 3. Check if user exists in database
   * 4. If user doesn't exist: Create new user with Firebase profile data
   * 5. If user exists: Update auth provider list if needed
   * 6. Generate and return JWT token
   *
   * **Auth Provider Tracking**:
   * - Automatically detects the sign-in provider from Firebase token
   * - Stores provider information (google, facebook, apple, email)
   * - Updates provider list if user logs in with a new provider
   * - Prevents duplicate provider entries
   *
   * @param loginDto - Login data with Firebase token
   * @returns Authentication response with JWT token and user data
   * @throws {UnauthorizedException} If Firebase token is invalid
   *
   * @example
   * ```typescript
   * // First time login - user will be created automatically
   * const authResponse = await authService.login({
   *   firebaseToken: 'eyJhbGciOiJSUzI1NiIs...'
   * });
   *
   * // Subsequent logins - user authenticated
   * const authResponse2 = await authService.login({
   *   firebaseToken: 'newTokenFromSameUser...'
   * });
   * ```
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Verify Firebase token
    const firebaseUser = await this.verifyFirebaseToken(loginDto.firebaseToken);

    // Determine auth provider from Firebase token
    const signInProvider = firebaseUser.firebase?.sign_in_provider || 'google';
    const provider = signInProvider === 'google.com' ? 'google' : 'email';

    // Get user from Firestore
    let user = await this.usersService.getUserById(firebaseUser.uid);

    // If user doesn't exist, create it automatically
    if (!user) {
      user = await this.usersService.createUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.name || firebaseUser.email.split('@')[0],
        photoURL: firebaseUser.picture || '',
        authProvider: {
          provider,
          providerId: firebaseUser.uid,
        },
        emailVerified: firebaseUser.email_verified || false,
      });
    } else {
      // User exists, check if we need to add the auth provider
      const hasProvider = user.authProviders?.some((p) => p.provider === provider);

      if (!hasProvider) {
        // User exists but doesn't have this provider saved, add it
        await this.usersService.addOrUpdateAuthProvider(
          firebaseUser.uid,
          provider,
          firebaseUser.uid,
        );
      }
    }

    // Generate JWT token
    const jwtPayload: JwtPayload = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };

    const token = this.generateJwtToken(jwtPayload);

    return {
      token,
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
    };
  }

  /**
   * Verify and decode JWT token
   *
   * @description
   * Validates the JWT token signature and expiration, then returns the decoded payload.
   * Used internally by the JWT strategy for authenticating protected endpoints.
   *
   * @param token - JWT token string (without 'Bearer ' prefix)
   * @returns Decoded JWT payload with user identification
   * @throws {UnauthorizedException} If token is invalid, expired, or has invalid signature
   *
   * @example
   * ```typescript
   * const payload = await authService.verifyJwtToken(jwtToken);
   * console.log(payload.uid, payload.email);
   * ```
   */
  async verifyJwtToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
