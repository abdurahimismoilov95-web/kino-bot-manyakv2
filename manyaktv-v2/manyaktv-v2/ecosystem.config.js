/**
 * PM2 Ecosystem config — MANYAK TV v2
 * FIX: NestJS single process → cluster mode (barcha CPU core lar)
 * Ishlatish: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'manyaktv-api',
      script: './apps/api/dist/main.js',
      cwd: '/app',

      // ─── CLUSTER MODE: CPU core soniga qarab worker yaratadi
      // 4 core server = 4 Node.js process = 4x throughput
      instances: 'max',   // 'max' = CPU count, yoki aniq son: 4
      exec_mode: 'cluster',

      // ─── Memory management
      max_memory_restart: '1500M',   // 1.5GB dan oshsa restart
      node_args: '--max-old-space-size=1400',

      // ─── Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // ─── Restart policy
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,

      // ─── Logging
      out_file:   '/var/log/manyaktv/api-out.log',
      error_file: '/var/log/manyaktv/api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // ─── Zero-downtime deploy
      listen_timeout: 10000,
      kill_timeout:   5000,
      wait_ready: true,           // app.listen() da process.send('ready') kerak
    },
  ],
};
