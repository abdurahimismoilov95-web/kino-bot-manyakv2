import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyDto {
  @ApiProperty({
    description: 'Telegram WebApp.initData string',
    example: 'query_id=...&user=...&auth_date=...&hash=...',
  })
  @IsString()
  @MinLength(10)
  initData: string;

  /** Hardware fingerprint (ixtiyoriy) */
  @ApiProperty({ required: false, description: 'Device fingerprint (HWID)' })
  @IsString()
  @IsOptional()
  hwid?: string;
}
