import { registerAs } from '@nestjs/config';
import * as path from 'path';

export default registerAs('storage', () => ({
  uploadsDir:       process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'),
  hlsOutputDir:     process.env.HLS_OUTPUT_DIR || path.join(process.cwd(), 'hls-output'),
  signingSecret:    process.env.FILE_SIGNING_SECRET || 'INSECURE_DEFAULT_CHANGE_ME',
  signedUrlTtl:     parseInt(process.env.FILE_SIGNED_URL_TTL_SECONDS || '3600', 10),
  nginxHlsBaseUrl:  process.env.NGINX_HLS_BASE_URL || 'http://localhost/hls',
}));
