import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || '',
  ssl:
    process.env.DB_SSL === 'true' ||
    /[.]render[.]com/.test(process.env.DATABASE_URL || ''),
  poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
}));
