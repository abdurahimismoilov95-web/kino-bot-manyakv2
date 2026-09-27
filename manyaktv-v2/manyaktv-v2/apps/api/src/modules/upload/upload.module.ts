import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadController } from './upload.controller';
import * as path from 'path';
import * as crypto from 'crypto';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const folder = file.fieldname === 'receipt' ? 'receipts'
            : file.fieldname === 'poster' ? 'posters'
            : file.fieldname === 'video' ? 'videos'
            : 'misc';
          cb(null, path.join(process.env.UPLOADS_DIR || './uploads', folder));
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const name = crypto.randomBytes(16).toString('hex');
          cb(null, `${name}${ext}`);
        },
      }),
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max (video uchun)
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
