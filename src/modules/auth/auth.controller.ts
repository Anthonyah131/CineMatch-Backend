import { Controller, Post, Get, Body, Headers, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  @ApiOperation({ summary: 'Verify Firebase ID token' })
  @ApiHeader({ name: 'authorization', description: 'Bearer token' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  async verifyToken(@Headers('authorization') authHeader: string): Promise<any> {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    return this.authService.verifyToken(token);
  }

  @Get('user/:uid')
  @ApiOperation({ summary: 'Get user by UID' })
  @ApiParam({ name: 'uid', description: 'User UID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUserByUid(@Param('uid') uid: string): Promise<any> {
    return this.authService.getUserByUid(uid);
  }

  @Post('custom-token')
  @ApiOperation({ summary: 'Create custom token for user' })
  @ApiResponse({ status: 200, description: 'Custom token created successfully' })
  async createCustomToken(
    @Body() body: { uid: string; claims?: object },
  ): Promise<{ customToken: string }> {
    const customToken = await this.authService.createCustomToken(body.uid, body.claims);
    return { customToken };
  }
}
