import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { ContentModule } from '../content/content.module';
import { PaymentModule } from '../payment/payment.module';
import { EventsModule } from '../events/events.module';
import { PanelModule } from '../panel/panel.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    ContentModule,
    PaymentModule,
    EventsModule,
    PanelModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
