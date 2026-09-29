import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { ContentService } from '../content/content.service';
import { PaymentService } from '../payment/payment.service';
import { EventsService } from '../events/events.service';
import { TelegramBroadcastService } from './telegram-broadcast.service';
import { Receipt, ReceiptStatus, ReceiptType } from '../payment/entities/receipt.entity';
import { Content } from '../content/entities/content.entity';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@AdminOnly()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly contentService: ContentService,
    private readonly paymentService: PaymentService,
    private readonly eventsService: EventsService,
    private readonly tgBroadcast: TelegramBroadcastService,
    @InjectRepository(Receipt) private readonly receiptRepo: Repository<Receipt>,
    @InjectRepository(Content) private readonly contentRepo: Repository<Content>,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard statistikasi' })
  async getDashboard() {
    const [userStats, pending] = await Promise.all([
      this.usersService.getStats(),
      this.paymentService.getPendingReceipts(1, 5),
    ]);
    return {
      users: userStats,
      pendingPayments: { total: pending.total, latest: pending.data.slice(0, 5) },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Daromad, kino sotuvi va server holati' })
  async getStats() {
    const now = new Date();
    const year = now.getFullYear();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const approved = await this.receiptRepo.find({
      where: { status: ReceiptStatus.APPROVED },
    });
    const pendingCount = await this.receiptRepo.count({
      where: { status: ReceiptStatus.PENDING },
    });
    const contents = await this.contentRepo.find();

    const dateOf = (r: Receipt): Date => new Date(r.reviewedAt || r.createdAt);

    const months: Array<{ month: number; vip: number; single: number; total: number }> = [];
    for (let i = 0; i < 12; i++) {
      months.push({ month: i + 1, vip: 0, single: 0, total: 0 });
    }

    let yearRevenue = 0;
    let allRevenue = 0;
    let vipSoldMonth = 0;
    let vipRevenueMonth = 0;
    let vipSoldYear = 0;
    let vipSoldAll = 0;
    let singleRevenueYear = 0;
    let vipRevenueYear = 0;
    let singleSoldMonth = 0;
    let singleRevenueMonth = 0;
    const perContent: Record<string, { sold: number; revenue: number }> = {};

    approved.forEach((r) => {
      const d = dateOf(r);
      const amount = Number(r.amount || 0);
      const isVip = r.type !== ReceiptType.SINGLE_CONTENT;
      allRevenue += amount;
      if (isVip) { vipSoldAll++; }

      if (r.contentId && !isVip) {
        const slot = perContent[r.contentId] || { sold: 0, revenue: 0 };
        slot.sold += 1;
        slot.revenue += amount;
        perContent[r.contentId] = slot;
      }

      if (d.getFullYear() === year) {
        yearRevenue += amount;
        const m = months[d.getMonth()];
        m.total += amount;
        if (isVip) { m.vip += amount; vipRevenueYear += amount; vipSoldYear++; }
        else { m.single += amount; singleRevenueYear += amount; }
      }
      if (d.getTime() >= monthAgo.getTime()) {
        if (isVip) { vipSoldMonth++; vipRevenueMonth += amount; }
        else { singleSoldMonth++; singleRevenueMonth += amount; }
      }
    });

    const mem = process.memoryUsage();
    let dbOk = true;
    let dbMs = 0;
    try {
      const t0 = Date.now();
      await this.receiptRepo.query('SELECT 1');
      dbMs = Date.now() - t0;
    } catch {
      dbOk = false;
    }

    const contentRows = contents.map((c: any) => {
      const p = perContent[c.id] || { sold: 0, revenue: 0 };
      return {
        id: c.id,
        title: c.title,
        type: c.type,
        year: c.year,
        posterUrl: c.posterUrl,
        price: c.price || 0,
        isPremium: !!c.isPremium,
        isSinglePurchase: !!c.isSinglePurchase,
        viewsCount: c.viewsCount || 0,
        sold: p.sold,
        revenue: Math.max(Number(c.revenue || 0), p.revenue),
      };
    });
    contentRows.sort((a, b) => (b.revenue - a.revenue) || (b.viewsCount - a.viewsCount));

    return {
      year,
      revenue: {
        all: allRevenue,
        year: yearRevenue,
        vipYear: vipRevenueYear,
        singleYear: singleRevenueYear,
        vipMonth: vipRevenueMonth,
        singleMonth: singleRevenueMonth,
      },
      vip: {
        soldMonth: vipSoldMonth,
        soldYear: vipSoldYear,
        soldAll: vipSoldAll,
      },
      singleSoldMonth,
      months,
      pendingReceipts: pendingCount,
      totals: {
        contents: contents.length,
        views: contentRows.reduce((a, c) => a + c.viewsCount, 0),
        singleSold: contentRows.reduce((a, c) => a + c.sold, 0),
      },
      contents: contentRows,
      server: {
        ok: dbOk,
        dbMs,
        uptimeSec: Math.round(process.uptime()),
        nodeVersion: process.version,
        env: process.env.NODE_ENV || 'development',
        memoryMb: Math.round(mem.rss / 1048576),
        heapMb: Math.round(mem.heapUsed / 1048576),
        time: now.toISOString(),
      },
    };
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Xabar yuborish (SSE yoki Telegram)' })
  async broadcast(@Body() body: any) {
    // Eski format: faqat ilova ichidagi SSE bildirishnoma
    if (body && body.type) {
      await this.eventsService.broadcast(body.type, { message: body.message });
      return { ok: true };
    }
    const text = String((body && (body.text || body.message)) || '').trim();
    if (!text) return { ok: false, total: 0, error: 'Matn bosh' };
    const r = await this.tgBroadcast.start({
      text,
      photoUrl: body.photoUrl || body.imageUrl || undefined,
      buttonText: body.buttonText || undefined,
      buttonUrl: body.buttonUrl || undefined,
      audience: body.audience || 'all',
    });
    return { ok: true, total: r.total, sent: r.total };
  }
}
