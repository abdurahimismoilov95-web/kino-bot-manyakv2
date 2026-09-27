import { Controller, UseGuards } from '@nestjs/common';
import { Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Events (SSE)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'events', version: '1' })
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * GET /api/v1/events/stream
   * BUG FIX: @Get('stream') + @Sse() birgalikda noto'g'ri.
   * @Sse('path') o'zi GET route + SSE response type o'rnatadi.
   */
  @Sse('stream')
  @ApiOperation({ summary: 'SSE real-time event stream (Redis pub/sub)' })
  stream(@CurrentUser() user: User): Observable<MessageEvent> {
    return this.eventsService.getStream(user.id);
  }
}
