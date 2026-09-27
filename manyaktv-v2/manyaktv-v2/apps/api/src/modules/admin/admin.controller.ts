import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { ContentService } from '../content/content.service';
import { PaymentService } from '../payment/payment.service';
import { EventsService } from '../events/events.service';

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

  @Post('broadcast')
  @ApiOperation({ summary: 'Barcha foydalanuvchilarga xabar yuborish (SSE)' })
  async broadcast(@Body() body: { type: string; message: string }) {
    await this.eventsService.broadcast(body.type, { message: body.message });
    return { ok: true };
  }
}
