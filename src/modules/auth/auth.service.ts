import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Auth } from 'firebase-admin/auth';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

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

@Injectable()
export class AuthService {
  constructor(
    @Inject('FIREBASE_AUTH') private auth: Auth,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  /**
   * Verify Firebase token and return decoded token
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
   * Generate backend JWT token
   */
  generateJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Register a new user
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
   * Login existing user or create new user if doesn't exist
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
   * Verify JWT token
   */
  async verifyJwtToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
