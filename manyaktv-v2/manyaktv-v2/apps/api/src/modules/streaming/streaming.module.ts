import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { StreamingService } from './streaming.service';
import { StreamingController } from './streaming.controller';
import { HlsAuthCacheService } from './hls-auth.cache';
import { Content } from '../content/entities/content.entity';
import { Episode } from '../content/entities/episode.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, Episode, User]),
    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: `redis://:${config.get('app.redis.password', '')}@${config.get('app.redis.host', 'localhost')}:${config.get('app.redis.port', 6379)}`,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [StreamingController],
  providers: [StreamingService, HlsAuthCacheService],
  exports: [StreamingService],
})
export class StreamingModule {}
