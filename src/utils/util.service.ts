import { Injectable } from '@nestjs/common';
import { VerificationFlags } from 'src/constants/app.enums';

@Injectable()
export class UtilService {
  /**
   * Generate a random alphanumeric UID of the given length
   * @param length - UID length (default: 7)
   */
  private generateRandomUid(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uid = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      uid += chars[randomIndex];
    }
    return uid;
  }

  /**
   * Generate a unique UID using an external checker
   * @param existsChecker - async function that checks UID existence
   * @param length - UID length (default: 7)
   * @returns a unique alphanumeric UID
   */
  async generateUniqueUid(
    existsChecker: (uid: string) => Promise<boolean>,
    length = 7,
  ): Promise<string> {
    let uid = ''; // ✅ initialized to avoid TS2454
    let exists = true;

    while (exists) {
      uid = this.generateRandomUid(length);
      exists = await existsChecker(uid);
    }

    return uid;
  }

  /**
   * Set a verification flag
   */
  setFlag(currentFlags: number, flag: VerificationFlags): number {
    return currentFlags | flag;
  }

  /**
   * Check if verification flag is set
   */
  hasFlag(currentFlags: number, flag: VerificationFlags): boolean {
    return (currentFlags & flag) !== 0;
  }

  /**
   * Clear a verification flag
   */
  clearFlag(currentFlags: number, flag: VerificationFlags): number {
    return currentFlags & ~flag;
  }
}
