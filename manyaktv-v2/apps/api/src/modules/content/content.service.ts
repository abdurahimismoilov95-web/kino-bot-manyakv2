import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Content, ContentType } from './entities/content.entity';
import { Episode } from './entities/episode.entity';
import { WatchHistory } from './entities/watch-history.entity';
import { Favorite } from './entities/favorite.entity';

export interface ContentQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: ContentType;
  genre?: string;
  isPremium?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
}

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content) private readonly contentRepo: Repository<Content>,
    @InjectRepository(Episode) private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(WatchHistory) private readonly historyRepo: Repository<WatchHistory>,
    @InjectRepository(Favorite) private readonly favoriteRepo: Repository<Favorite>,
  ) {}

  async findAll(q: ContentQuery = {}) {
    const { page = 1, limit = 20, search, type, genre, isPremium, isTrending, isFeatured } = q;
    const qb = this.contentRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.episodes', 'ep');

    if (search) {
      qb.andWhere('(c.title ILIKE :s OR c.originalTitle ILIKE :s)', { s: `%${search}%` });
    }
    if (type) {
      qb.andWhere('c.type = :type', { type });
    }

    if (genre) {
      qb.andWhere(
        '(c.genres = :exact OR c.genres LIKE :start OR c.genres LIKE :end OR c.genres LIKE :mid)',
        {
          exact: genre,
          start: `${genre},%`,
          end: `%,${genre}`,
          mid: `%,${genre},%`,
        },
      );
    }

    if (isPremium !== undefined) {
      qb.andWhere('c.isPremium = :isPremium', { isPremium });
    }
    if (isTrending) {
      qb.andWhere('c.isTrending = true');
    }
    if (isFeatured) {
      qb.andWhere('c.isFeatured = true');
    }

    qb.orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Content> {
    const content = await this.contentRepo.findOne({
      where: { id },
      relations: ['episodes'],
    });
    if (!content) throw new NotFoundException(`Content ${id} not found`);
    return content;
  }

  async getFeatured(): Promise<Content[]> {
    return this.contentRepo.find({ where: { isFeatured: true }, take: 10 });
  }

  async getTrending(): Promise<Content[]> {
    return this.contentRepo.find({
      where: { isTrending: true },
      order: { viewsCount: 'DESC' },
      take: 20,
    });
  }

  async create(data: any): Promise<Content> {
    const content = this.contentRepo.create(data as Partial<Content>);
    return this.contentRepo.save(content);
  }

  async update(id: string, data: any): Promise<Content> {
    await this.findById(id);
    const rest: any = Object.assign({}, data);
    const episodes = rest.episodes;
    delete rest.episodes;
    delete rest.id;
    delete rest.createdAt;
    delete rest.updatedAt;
    delete rest.viewsCount;
    delete rest.revenue;
    delete rest.likesCount;
    if (Object.keys(rest).length > 0) {
      await this.contentRepo.update(id, rest);
    }

    if (Array.isArray(episodes)) {
      const existing = await this.episodeRepo.find({ where: { contentId: id } });
      const keep = new Set<string>();
      for (let i = 0; i < episodes.length; i++) {
        const e = episodes[i];
        const season = e.seasonNumber || 1;
        const num = e.episodeNumber || i + 1;
        const found = existing.find(
          (x) => x.seasonNumber === season && x.episodeNumber === num,
        );
        if (found) {
          keep.add(found.id);
          found.title = e.title || found.title;
          found.videoUrl = e.videoUrl || null;
          await this.episodeRepo.save(found);
        } else {
          const created = await this.episodeRepo.save(
            this.episodeRepo.create({
              contentId: id,
              seasonNumber: season,
              episodeNumber: num,
              title: e.title || num + '-qism',
              videoUrl: e.videoUrl || null,
            }),
          );
          keep.add(created.id);
        }
      }
      for (const old of existing) {
        if (!keep.has(old.id)) {
          try {
            await this.episodeRepo.delete(old.id);
          } catch {
            /* tarix bilan bogliq epizod - otkazib yuboriladi */
          }
        }
      }
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.contentRepo.delete(id);
  }

  async updateTranscodeStatus(
    id: string,
    status: string,
    qualities: string[],
  ): Promise<void> {
    await this.contentRepo.update(id, {
      transcodeStatus: status,
      availableQualities: qualities as any,
    });
  }

  async upsertWatchHistory(
    userId: string,
    contentId: string,
    episodeId: string | null,
    progressSeconds: number,
    durationSeconds: number,
  ) {
    const whereCondition = episodeId
      ? { userId, contentId, episodeId }
      : { userId, contentId, episodeId: IsNull() };

    let entry = await this.historyRepo.findOne({ where: whereCondition as any });
    if (!entry) {
      entry = this.historyRepo.create({ userId, contentId, episodeId, progressSeconds, durationSeconds });
    } else {
      entry.progressSeconds = progressSeconds;
      entry.durationSeconds = durationSeconds;
    }
    entry.isCompleted = durationSeconds > 0 && progressSeconds / durationSeconds > 0.9;
    return this.historyRepo.save(entry);
  }

  async getWatchHistory(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.historyRepo.findAndCount({
      where: { userId },
      relations: ['content'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleFavorite(userId: string, contentId: string): Promise<{ added: boolean }> {
    const existing = await this.favoriteRepo.findOne({ where: { userId, contentId } });
    if (existing) {
      await this.favoriteRepo.delete(existing.id);
      return { added: false };
    }
    await this.favoriteRepo.save(this.favoriteRepo.create({ userId, contentId }));
    return { added: true };
  }

  async getFavorites(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.favoriteRepo.findAndCount({
      where: { userId },
      relations: ['content'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async incrementViews(contentId: string): Promise<void> {
    await this.contentRepo.increment({ id: contentId }, 'viewsCount', 1);
  }
}
