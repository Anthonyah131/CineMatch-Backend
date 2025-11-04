import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * Authentication Controller
 *
 * @description
 * Handles user authentication using Firebase tokens and JWT.
 * Supports both explicit registration and automatic user creation on login.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user with Firebase authentication
   *
   * @description
   * Creates a new user in the database after validating the Firebase ID token.
   * Returns a JWT token for subsequent authenticated requests.
   *
   * @throws {ConflictException} If a user with the same UID already exists
   * @throws {UnauthorizedException} If the Firebase token is invalid or expired
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account using Firebase authentication. ' +
      'Validates the Firebase ID token and stores user data in the database. ' +
      'Returns a JWT token for authenticated API access. ' +
      '\n\n**Note**: If you want automatic user creation without explicit registration, use the login endpoint instead.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data with Firebase token',
    examples: {
      'google-auth': {
        summary: 'Register with Google authentication',
        description: 'Example using a Firebase token from Google Sign-In',
        value: {
          firebaseToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlMzU4ZDJjODU...',
          displayName: 'John Doe',
          bio: 'Movie enthusiast and popcorn lover 🍿',
          birthdate: '1990-01-15',
        },
      },
      'minimal-registration': {
        summary: 'Minimal registration (only token)',
        description: 'Register with only Firebase token, other fields will be auto-populated',
        value: {
          firebaseToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlMzU4ZDJjODU...',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Returns JWT token and user data.',
    type: AuthResponseDto,
    example: {
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJNMUNWbzJPZEZHWEE5bnlMQ3ZSbkdGNXJCZzEzIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImRpc3BsYXlOYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE2OTg3ODk2MDAsImV4cCI6MTY5OTM5NDQwMH0.abc123...',
      user: {
        uid: 'M1CVo2OdFGXA9nyLCvRnGF5rBg13',
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocK...',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists with this Firebase UID.',
    example: {
      statusCode: 409,
      message: 'User already exists',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired Firebase token.',
    example: {
      statusCode: 401,
      message: 'Invalid Firebase token',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error in request body.',
    example: {
      statusCode: 400,
      message: [
        'firebaseToken should not be empty',
        'Birthdate must be a valid ISO 8601 date string (YYYY-MM-DD)',
      ],
      error: 'Bad Request',
    },
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Login with Firebase authentication (auto-creates user if needed)
   *
   * @description
   * Validates Firebase ID token and returns JWT. If the user doesn't exist in the database,
   * creates it automatically using Firebase profile data. This is the recommended endpoint
   * for authentication as it handles both login and registration seamlessly.
   *
   * @throws {UnauthorizedException} If the Firebase token is invalid or expired
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with Firebase token (auto-creates user)',
    description:
      'Authenticates a user by validating their Firebase ID token. ' +
      'If the user exists in the database, returns their JWT token. ' +
      "If the user doesn't exist, creates a new user automatically using Firebase profile data. " +
      '\n\n**This is the recommended authentication endpoint** as it handles both scenarios seamlessly. ' +
      '\n\n**Auth Provider Tracking**: Automatically tracks which authentication provider was used (Google, Facebook, etc.) and stores the provider ID.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Login credentials with Firebase token',
    examples: {
      'google-login': {
        summary: 'Login with Google',
        description: 'Standard login using Google Firebase token',
        value: {
          firebaseToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlMzU4ZDJjODU...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Login successful. User authenticated and JWT token returned. ' +
      'User may have been created automatically if this was their first login.',
    type: AuthResponseDto,
    example: {
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJNMUNWbzJPZEZHWEE5bnlMQ3ZSbkdGNXJCZzEzIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImRpc3BsYXlOYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE2OTg3ODk2MDAsImV4cCI6MTY5OTM5NDQwMH0.abc123...',
      user: {
        uid: 'M1CVo2OdFGXA9nyLCvRnGF5rBg13',
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocK...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired Firebase token.',
    example: {
      statusCode: 401,
      message: 'Invalid Firebase token',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error in request body.',
    example: {
      statusCode: 400,
      message: ['firebaseToken should not be empty'],
      error: 'Bad Request',
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Get current authenticated user information
   *
   * @description
   * Returns the JWT payload of the currently authenticated user.
   * Requires a valid JWT token in the Authorization header.
   *
   * @throws {UnauthorizedException} If no valid JWT token is provided
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated user',
    description:
      'Retrieves the payload of the currently authenticated user from the JWT token. ' +
      'Requires a valid JWT token in the Authorization header as "Bearer <token>". ' +
      '\n\n**Use this endpoint to**:' +
      '\n- Verify token validity' +
      '\n- Get current user UID for other API calls' +
      '\n- Retrieve basic user information without a database query',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user information from JWT token payload.',
    schema: {
      type: 'object',
      properties: {
        uid: {
          type: 'string',
          description: "User's unique Firebase identifier",
          example: 'M1CVo2OdFGXA9nyLCvRnGF5rBg13',
        },
        email: {
          type: 'string',
          description: "User's email address",
          example: 'john.doe@example.com',
        },
        displayName: {
          type: 'string',
          description: "User's display name",
          example: 'John Doe',
        },
        photoURL: {
          type: 'string',
          description: "User's profile photo URL (optional)",
          example: 'https://lh3.googleusercontent.com/a/ACg8ocK...',
          nullable: true,
        },
      },
    },
    example: {
      uid: 'M1CVo2OdFGXA9nyLCvRnGF5rBg13',
      email: 'john.doe@example.com',
      displayName: 'John Doe',
      photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocK...',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - No valid JWT token provided or token expired.',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
    },
  })
  getCurrentUser(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }
}
