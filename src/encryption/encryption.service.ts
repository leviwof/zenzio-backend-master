import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer; // 32 bytes key

  private generateIv(): Buffer {
    return crypto.randomBytes(16); // AES block size = 16 bytes IV
  }

  // Encrypt a file
  encryptFile(inputFilePath: string, outputFilePath: string): void {
    const iv = this.generateIv();
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);

    const input = fs.createReadStream(inputFilePath);
    const output = fs.createWriteStream(outputFilePath);

    // Write the IV at the beginning of the encrypted file
    output.write(iv);

    input.pipe(cipher).pipe(output);

    output.on('finish', () => {
      console.log('File encrypted successfully');
    });
  }

  // Decrypt a file
  decryptFile(inputFilePath: string, outputFilePath: string): void {
    const input = fs.openSync(inputFilePath, 'r');
    const output = fs.createWriteStream(outputFilePath);

    // Read the IV (first 16 bytes)
    const iv = Buffer.alloc(16);
    fs.readSync(input, iv, 0, 16, 0);

    const key = this.key;
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    const encryptedInput = fs.createReadStream(inputFilePath, { start: 16 });
    encryptedInput.pipe(decipher).pipe(output);

    output.on('finish', () => {
      console.log('File decrypted successfully');
    });
  }
}
