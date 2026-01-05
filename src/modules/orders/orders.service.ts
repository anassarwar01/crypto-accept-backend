import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateOrderRequestDTO } from './dto/create-order-request.dto';
import { CreatePaymentUrlDTO } from './dto/create-payment-url.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly configService: ConfigService) { }

  async createOrderRequest(dto: CreateOrderRequestDTO): Promise<any> {
    // TODO: Implement order request creation logic
    // This should create an order request in the database
    return {
      id: 'order-request-id', // Placeholder
      ...dto,
    };
  }

  async generateOrderReqUrl(dto: CreatePaymentUrlDTO): Promise<string> {
    const paymentUrl = this.configService.get<string>('PAYMENT_URL');
    return `${paymentUrl}?ref=${dto.orderRequest.systemReference}`;
  }
}

