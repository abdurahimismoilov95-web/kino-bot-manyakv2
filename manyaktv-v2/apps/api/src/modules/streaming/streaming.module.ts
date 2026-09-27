import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamingService } from './streaming.service';
import { StreamingController } from './streaming.controller';
import { HlsAuthCacheService } from './hls-auth.cache';
import { Content } from '../content/entities/content.entity';
import { Episode } from '../content/entities/episode.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Content, Episode, User])],
  controllers: [StreamingController],
  providers: [StreamingService, HlsAuthCacheService],
  exports: [StreamingService],
})
export class StreamingModule {}
