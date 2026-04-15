import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  getRequired(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new Error(`❌ Missing config: "${key}"`);
    return value;
  }

  getOptional(key: string, defaultValue: string): string {
    return this.configService.get<string>(key) ?? defaultValue;
  }

  getRequiredNumber(key: string): number {
    const value = this.getRequired(key);
    const numberValue = parseInt(value, 10);
    if (isNaN(numberValue)) throw new Error(`❌ Config "${key}" is not a number`);
    return numberValue;
  }

  getOptionalNumber(key: string, defaultValue: number): number {
    const value = this.configService.get<string>(key);
    if (value === undefined) return defaultValue;
    const numberValue = parseInt(value, 10);
    if (isNaN(numberValue)) throw new Error(`❌ Config "${key}" is not a number`);
    return numberValue;
  }

  getRequiredBoolean(key: string): boolean {
    const value = this.getRequired(key).toLowerCase();
    return value === 'true' || value === '1';
  }

  getOptionalBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }
}
