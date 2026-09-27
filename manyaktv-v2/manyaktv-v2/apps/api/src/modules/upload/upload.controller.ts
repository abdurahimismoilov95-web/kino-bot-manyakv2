import {
  Controller, Post, UploadedFile, UseInterceptors,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

/** Fayl nomini xavfsiz qilish: UUID + original extension */
function safeFilename(_req: any, file: Express.Multer.File, cb: Function) {
  const ext = path.extname(file.originalname).toLowerCase() || '.bin';
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  cb(null, unique);
}

/** Papka mavjud bo'lmasada yaratish */
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

const UPLOADS_BASE = process.env.UPLOADS_DIR || './uploads';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'upload', version: '1' })
export class UploadController {
  constructor(private readonly config: ConfigService) {}

  // ─── Poster rasm yuklash (Admin only) ───────────────────────
  @Post('poster')
  @AdminOnly()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[Admin] Poster rasmi yuklash' })
  @UseInterceptors(
    FileInterceptor('poster', {
      // BUG FIX: diskStorage qo'shildi — memory storage'da file.filename UNDEFINED
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, ensureDir(path.join(UPLOADS_BASE, 'posters'))),
        filename: safeFilename,
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/'))
          return cb(new BadRequestException('Only image files allowed'), false);
        cb(null, true);
      },
    }),
  )
  uploadPoster(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    return { url: `/uploads/posters/${file.filename}` };
  }

  // ─── To'lov cheki yuklash (har qanday login foydalanuvchi) ───
  @Post('receipt')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'To\'lov cheki rasmi yuklash' })
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, ensureDir(path.join(UPLOADS_BASE, 'receipts'))),
        filename: safeFilename,
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/'))
          return cb(new BadRequestException('Only image files allowed'), false);
        cb(null, true);
      },
    }),
  )
  uploadReceipt(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    return { url: `/uploads/receipts/${file.filename}` };
  }

  // ─── Video fayl yuklash (Admin only) ────────────────────────
  @Post('video')
  @AdminOnly()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[Admin] Video fayl yuklash (HLS transcode uchun)' })
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, ensureDir(path.join(UPLOADS_BASE, 'videos'))),
        filename: safeFilename,
      }),
      limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('video/'))
          return cb(new BadRequestException('Only video files allowed'), false);
        cb(null, true);
      },
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const filePath = path.join(UPLOADS_BASE, 'videos', file.filename);
    return {
      path: filePath,
      filename: file.filename,
      size: file.size,
      message: `Video yuklandi. Transcode: bash infra/scripts/transcode-hls.sh "${filePath}" <content_id>`,
    };
  }
}
