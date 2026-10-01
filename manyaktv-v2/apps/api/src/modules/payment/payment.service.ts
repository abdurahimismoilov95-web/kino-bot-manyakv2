import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt, ReceiptStatus, ReceiptType } from './entities/receipt.entity';
import { UsersService } from '../users/users.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { EventsService } from '../events/events.service';

export interface CreateReceiptDto {
  type: ReceiptType;
  imageUrl: string;
  planId?: string;
  planName?: string;
  contentId?: string;
  contentTitle?: string;
  amount: number;
  promoCode?: string;
  discountPercent?: number;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepo: Repository<Receipt>,
    private readonly usersService: UsersService,
    private readonly subscriptionService: SubscriptionService,
    private readonly eventsService: EventsService,
  ) {}

  async submitReceipt(userId: string, dto: CreateReceiptDto): Promise<Receipt> {
    const receipt = this.receiptRepo.create({
      userId,
      ...dto,
      status: ReceiptStatus.PENDING,
    });
    const saved = await this.receiptRepo.save(receipt);

    await this.eventsService.broadcast('payment.pending', {
      receiptId: saved.id,
      userId,
      amount: dto.amount,
    });

    return saved;
  }

  async getPendingReceipts(page = 1, limit = 20) {
    const [data, total] = await this.receiptRepo.findAndCount({
      where: { status: ReceiptStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getAllReceipts(page = 1, limit = 20) {
    const [data, total] = await this.receiptRepo.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getUserReceipts(userId: string) {
    return this.receiptRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Chekni tasdiqlash.
   *  - Obuna cheki: foydalanuvchiga tarif muddaticha VIP beriladi.
   *  - Bitta kontent cheki: VIP berilmaydi, faqat shu kontent ochiladi
   *    (ruxsat streaming xizmatida tasdiqlangan chek bo'yicha tekshiriladi).
   */
  async approveReceipt(receiptId: string, adminId: string): Promise<Receipt> {
    const receipt = await this.receiptRepo.findOne({
      where: { id: receiptId },
      relations: ['user'],
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    if (receipt.status !== ReceiptStatus.PENDING) {
      throw new BadRequestException('Receipt is not in pending state');
    }

    const isSingle = receipt.type === ReceiptType.SINGLE_CONTENT && !!receipt.contentId;
    let durationDays = 0;
    if (!isSingle) {
      durationDays = 30;
      if (receipt.planId) {
        const plan = await this.subscriptionService.findPlanById(receipt.planId);
        if (plan) durationDays = plan.durationDays;
      }
      await this.usersService.grantVip(receipt.userId, durationDays);
    }

    receipt.status = ReceiptStatus.APPROVED;
    receipt.reviewedBy = adminId;
    receipt.reviewedAt = new Date();
    const saved = await this.receiptRepo.save(receipt);

    await this.eventsService.publishToUser(receipt.userId, 'payment.approved', {
      receiptId,
      planName: receipt.planName,
      durationDays,
      contentId: isSingle ? receipt.contentId : null,
      contentTitle: isSingle ? receipt.contentTitle : null,
    });

    return saved;
  }

  async rejectReceipt(
    receiptId: string,
    adminId: string,
    reason: string,
  ): Promise<Receipt> {
    const receipt = await this.receiptRepo.findOneBy({ id: receiptId });
    if (!receipt) throw new NotFoundException('Receipt not found');
    if (receipt.status !== ReceiptStatus.PENDING) {
      throw new BadRequestException('Receipt is not in pending state');
    }

    receipt.status = ReceiptStatus.REJECTED;
    receipt.reviewedBy = adminId;
    receipt.reviewedAt = new Date();
    receipt.rejectReason = reason;
    const saved = await this.receiptRepo.save(receipt);

    await this.eventsService.publishToUser(receipt.userId, 'payment.rejected', {
      receiptId,
      reason,
    });

    return saved;
  }
}
