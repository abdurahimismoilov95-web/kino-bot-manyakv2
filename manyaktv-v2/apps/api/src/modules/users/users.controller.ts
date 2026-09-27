import {
  Controller, Get, Param, Patch, Body, Query,
  UseGuards, Post, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/admin.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from './entities/user.entity';
import { IsString, IsNotEmpty, IsEnum, IsInt, Min } from 'class-validator';

class BanUserDto {
  @IsString() @IsNotEmpty() reason: string;
}
class SetRoleDto {
  @IsEnum(UserRole) role: UserRole;
}
class GrantVipDto {
  @IsInt() @Min(1) durationDays: number;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'My profile' })
  async getMe(@CurrentUser() user: User) {
    return user;
  }

  @Post('checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Daily check-in (token earn)' })
  async checkin(@CurrentUser() user: User) {
    return this.usersService.dailyCheckin(user.id);
  }

  @Get()
  @AdminOnly()
  @ApiOperation({ summary: '[Admin] Barcha foydalanuvchilar' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(+page, +limit, search);
  }

  @Get('stats')
  @AdminOnly()
  @ApiOperation({ summary: '[Admin] Foydalanuvchilar statistikasi' })
  async getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @AdminOnly()
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/ban')
  @AdminOnly()
  async ban(
    @Param('id') id: string,
    @Body() dto: BanUserDto,
    @CurrentUser() admin: User,
  ) {
    return this.usersService.banUser(id, dto.reason, admin.id);
  }

  @Patch(':id/unban')
  @AdminOnly()
  async unban(@Param('id') id: string) {
    return this.usersService.unbanUser(id);
  }

  @Patch(':id/grant-vip')
  @AdminOnly()
  async grantVip(@Param('id') id: string, @Body() dto: GrantVipDto) {
    return this.usersService.grantVip(id, dto.durationDays);
  }

  @Patch(':id/revoke-vip')
  @AdminOnly()
  async revokeVip(@Param('id') id: string) {
    return this.usersService.revokeVip(id);
  }

  @Patch(':id/reset-hwid')
  @AdminOnly()
  async resetHwid(@Param('id') id: string) {
    return this.usersService.resetHwid(id);
  }

  @Patch(':id/role')
  @AdminOnly()
  async setRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    return this.usersService.setRole(id, dto.role);
  }
}
