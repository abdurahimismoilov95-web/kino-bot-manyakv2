import {
  Controller, Post, UploadedFile, UseInterceptors,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const UPLOADS_BASE = process.env.UPLOADS_DIR || './uploads';

function safeFilename(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void,
) {
  const ext = path.extname(file.originalname).toLowerCase() || '.bin';
  cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'upload', version: '1' })
export class UploadController {
  @Post('poster')
  @AdminOnly()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[Admin] Poster rasmi yuklash' })
  @UseInterceptors(
    FileInterceptor('poster', {
      storage: diskStorage({
        destination: (_req, _file, cb) =>
          cb(null, ensureDir(path.join(UPLOADS_BASE, 'posters'))),
        filename: safeFilename,
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadPoster(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    return { url: `/uploads/posters/${file.filename}` };
  }

  @Post('receipt')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tolov cheki rasmi yuklash' })
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: diskStorage({
        destination: (_req, _file, cb) =>
          cb(null, ensureDir(path.join(UPLOADS_BASE, 'receipts'))),
        filename: safeFilename,
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadReceipt(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    return { url: `/uploads/receipts/${file.filename}` };
  }

  @Post('video')
  @AdminOnly()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[Admin] Video fayl yuklash (HLS transcode uchun)' })
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: (_req, _file, cb) =>
          cb(null, ensureDir(path.join(UPLOADS_BASE, 'videos'))),
        filename: safeFilename,
      }),
      limits: { fileSize: 10 * 1024 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('video/')) {
          return cb(new BadRequestException('Only video files allowed'), false);
        }
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
    };
  }
}
