import { registerAs } from '@nestjs/config';

/**
 * Database konfiguratsiya fayli.
 * ConfigModule.forRoot({ load: [databaseConfig] }) uchun registerAs formatida.
 *
 * PRODUCTION NOTE: DB_POOL_MAX = 50 (default: 20)
 * 3 NestJS replika × 50 = 150 conn → PostgreSQL max_connections = 200
 */
const databaseConfig = registerAs('database', () => ({
  url:      process.env.DATABASE_URL,
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'manyaktv',
  password: process.env.DB_PASSWORD || 'changeme',
  name:     process.env.DB_NAME     || 'manyaktv',
  ssl:      process.env.DB_SSL === 'true',
  poolMin:  parseInt(process.env.DB_POOL_MIN     || '5',     10),
  poolMax:  parseInt(process.env.DB_POOL_MAX     || '50',    10),  // FIX: 10 → 50
  acquire:  parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
  idle:     parseInt(process.env.DB_POOL_IDLE    || '10000', 10),
}));

export default databaseConfig;
