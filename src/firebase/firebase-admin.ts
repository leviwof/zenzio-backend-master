import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { ServiceAccount } from 'firebase-admin';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  constructor(private readonly encryptionService: EncryptionService) {}

  onModuleInit() {
    this.initializeFirebaseAdmin();
  }

  private initializeFirebaseAdmin() {
    // Skip if apps are already initialized (NotificationService handles multi-project init)
    if (admin.apps.length > 0) {
      console.log('ℹ️ Firebase Admin already initialized, skipping...');
      return;
    }

    const serviceAccountPath = join(
      process.cwd(),
      'src',
      'config',
      'decrypted-firebase-adminsdk.json',
    );

    const encryptedFirebaseAdminPath = resolve(process.cwd(), 'encrypted-firebase-adminsdk.json');

    const plainFirebaseAdminPath = resolve(process.cwd(), 'firebase-adminsdk.json');

    // Encrypt if decrypted file doesn't exist
    if (!existsSync(serviceAccountPath)) {
      if (existsSync(plainFirebaseAdminPath)) {
        try {
          this.encryptionService.encryptFile(plainFirebaseAdminPath, encryptedFirebaseAdminPath);
          console.log(
            `✅ Encrypted Firebase-adminsdk.json created at ${encryptedFirebaseAdminPath}`,
          );
        } catch (err) {
          console.error(
            `❌ Failed to encrypt Firebase-adminsdk.json: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          writeFileSync(encryptedFirebaseAdminPath, '');
        }
      } else {
        console.warn(`⚠️ Plain Firebase admin file not found at ${plainFirebaseAdminPath}`);
        writeFileSync(encryptedFirebaseAdminPath, '');
      }
    }

    // Only initialize if the decrypted file exists
    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('✅ Firebase Admin Initialized');
    }
  }

  getAdmin(): typeof admin {
    return admin;
  }
}
export default admin;
