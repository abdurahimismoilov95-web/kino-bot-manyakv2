import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Admin brauzer orqali kirish uchun DTO.
 * telegramId + env dagi maxfiy kod bilan autentifikatsiya.
 */
export class AdminLoginDto {
  @ApiProperty({ description: "Admin Telegram ID (raqam ko'rinishida)", example: '123456789' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  telegramId: string;

  @ApiProperty({ description: 'Admin maxfiy kirish kodi (ADMIN_BROWSER_SECRET)' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  secret: string;
}
