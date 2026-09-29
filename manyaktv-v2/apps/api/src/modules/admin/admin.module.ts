import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { TelegramBroadcastService } from './telegram-broadcast.service';
import { UsersModule } from '../users/users.module';
import { ContentModule } from '../content/content.module';
import { PaymentModule } from '../payment/payment.module';
import { EventsModule } from '../events/events.module';
import { PanelModule } from '../panel/panel.module';
import { User } from '../users/entities/user.entity';
import { Receipt } from '../payment/entities/receipt.entity';
import { Content } from '../content/entities/content.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Receipt, Content]),
    UsersModule,
    ContentModule,
    PaymentModule,
    EventsModule,
    PanelModule,
  ],
  controllers: [AdminController],
  providers: [TelegramBroadcastService],
})
export class AdminModule {}
