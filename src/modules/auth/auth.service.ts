import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { Auth } from 'firebase-admin/auth';

@Injectable()
export class AuthService {
  constructor(@Inject('FIREBASE_AUTH') private auth: Auth) {}

  async verifyToken(idToken: string): Promise<any> {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUserByUid(uid: string): Promise<any> {
    try {
      const userRecord = await this.auth.getUser(uid);
      return userRecord;
    } catch {
      throw new UnauthorizedException('User not found');
    }
  }

  async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    return this.auth.createCustomToken(uid, additionalClaims);
  }

  async setCustomUserClaims(uid: string, customClaims: object): Promise<void> {
    await this.auth.setCustomUserClaims(uid, customClaims);
  }
}
