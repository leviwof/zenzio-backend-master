import { DynamicModule, Module, OnModuleInit } from '@nestjs/common';
import { GlobalErrorService } from './global-error.service';

@Module({})
export class GlobalErrorModule implements OnModuleInit {
  constructor(private readonly globalErrorService: GlobalErrorService) {}

  onModuleInit() {
    if (
      this.globalErrorService &&
      typeof this.globalErrorService.setupGlobalErrorHandlers === 'function'
    ) {
      this.globalErrorService.setupGlobalErrorHandlers();
    }
  }

  static forRoot(): DynamicModule {
    return {
      module: GlobalErrorModule,
      providers: [GlobalErrorService],
      exports: [GlobalErrorService],
    };
  }
}
