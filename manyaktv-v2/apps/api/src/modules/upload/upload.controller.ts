import {
  Controller, Post, UploadedFile, UploadedFiles, UseInterceptors,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

const UPLOADS_BASE = process.env.UPLOADS_DIR || './uploads';

/**
 * Faqat xavfsiz rasm turlari. SVG ataylab ruxsat etilmaydi:
 * SVG ichida JavaScript bo'lishi mumkin (saqlangan XSS hujumi).
 */
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const VIDEO_TYPES: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-matroska': '.mkv',
  'video/x-m4v': '.m4v',
  'video/x-msvideo': '.avi',
  'video/mp2t': '.ts',
};
const SAFE_VIDEO_EXT = ['.mp4', '.webm', '.mov', '.mkv', '.m4v', '.avi', '.ts'];

/** Fayl nomi foydalanuvchidan olinmaydi: tasodifiy 128-bit nom + turga mos kengaytma. */
function safeFilename(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void,
) {
  const mt = String(file.mimetype || '').toLowerCase();
  let ext = IMAGE_TYPES[mt] || VIDEO_TYPES[mt] || '';
  if (!ext && mt.startsWith('video/')) {
    const orig = path.extname(file.originalname || '').toLowerCase();
    ext = SAFE_VIDEO_EXT.includes(orig) ? orig : '.mp4';
  }
  if (!ext) ext = '.bin';
  cb(null, `${Date.now()}-${randomBytes(16).toString('hex')}${ext}`);
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function imageFilter(_req: unknown, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) {
  const mt = String(file.mimetype || '').toLowerCase();
  if (!IMAGE_TYPES[mt]) {
    return cb(new BadRequestException('Faqat JPG, PNG, WEBP, GIF yoki HEIC rasm qabul qilinadi'), false);
  }
  cb(null, true);
}

function videoFilter(_req: unknown, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) {
  const mt = String(file.mimetype || '').toLowerCase();
  if (!mt.startsWith('video/')) {
    return cb(new BadRequestException('Faqat video fayl qabul qilinadi'), false);
  }
  cb(null, true);
}

/**
 * Fayl haqiqatan rasm ekanini birinchi baytlari orqali tekshiradi
 * (kengaytma yoki Content-Type ni soxtalashtirib boshqa fayl yuklashdan himoya).
 */
function isRealImage(filePath: string): boolean {
  let fd: number | null = null;
  try {
    fd = fs.openSync(filePath, 'r');
    const b = Buffer.alloc(16);
    const n = fs.readSync(fd, b, 0, 16, 0);
    if (n < 12) return false;
    // JPEG
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;
    // PNG
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return true;
    // GIF
    if (b.toString('ascii', 0, 3) === 'GIF') return true;
    // WEBP
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return true;
    // HEIC / HEIF
    if (b.toString('ascii', 4, 8) === 'ftyp') return true;
    return false;
  } catch {
    return false;
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch { /* e'tiborsiz */ }
    }
  }
}

function rejectFile(file: Express.Multer.File, msg: string): never {
  try { fs.unlinkSync(file.path); } catch { /* e'tiborsiz */ }
  throw new BadRequestException(msg);
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
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
      fileFilter: imageFilter,
    }),
  )
  uploadPoster(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    if (!isRealImage(file.path)) rejectFile(file, 'Fayl haqiqiy rasm emas');
    return { url: `/uploads/posters/${file.filename}` };
  }

  /** Maydon nomi ('file' yoki 'receipt') farqi qilmaydi - birinchi rasm olinadi. */
  @Post('receipt')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tolov cheki rasmi yuklash' })
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (_req, _file, cb) =>
          cb(null, ensureDir(path.join(UPLOADS_BASE, 'receipts'))),
        filename: safeFilename,
      }),
      limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 10 },
      fileFilter: imageFilter,
    }),
  )
  uploadReceipt(@UploadedFiles() files: Express.Multer.File[]) {
    const file = files && files[0];
    if (!file) throw new BadRequestException('File is required');
    if (!isRealImage(file.path)) rejectFile(file, 'Fayl haqiqiy rasm emas');
    return { url: `/uploads/receipts/${file.filename}` };
  }

  @Post('video')
  @AdminOnly()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '[Admin] Video fayl yuklash' })
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: (_req, _file, cb) =>
          cb(null, ensureDir(path.join(UPLOADS_BASE, 'videos'))),
        filename: safeFilename,
      }),
      limits: { fileSize: 10 * 1024 * 1024 * 1024, files: 1 },
      fileFilter: videoFilter,
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    return {
      url: `/uploads/videos/${file.filename}`,
      filename: file.filename,
      size: file.size,
    };
  }
}
