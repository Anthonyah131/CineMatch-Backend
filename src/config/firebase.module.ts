import { Module, Global } from '@nestjs/common';
import { FirebaseConfig } from './firebase.config';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_APP',
      useFactory: () => {
        return FirebaseConfig.initialize();
      },
    },
    {
      provide: 'FIRESTORE',
      useFactory: () => {
        return FirebaseConfig.getFirestore();
      },
    },
    {
      provide: 'FIREBASE_AUTH',
      useFactory: () => {
        return FirebaseConfig.getAuth();
      },
    },
  ],
  exports: ['FIREBASE_APP', 'FIRESTORE', 'FIREBASE_AUTH'],
})
export class FirebaseModule {}
