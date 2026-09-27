import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Get()
  @Public()
  check() {
    return {
      status: 'ok',
      service: 'manyaktv-api',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
