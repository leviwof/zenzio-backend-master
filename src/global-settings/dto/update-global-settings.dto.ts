import { IsBoolean, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateGlobalSettingsDto {
    @IsBoolean()
    @IsOptional()
    enableOnlinePayment?: boolean;

    @IsBoolean()
    @IsOptional()
    enableCODPayment?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    platformFeePercent?: number;
}
