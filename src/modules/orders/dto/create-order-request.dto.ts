import { User } from '../../users/entities/user.entity';

export class CreateOrderRequestDTO {
  customerId: string;
  fiatAmount: number;
  fiatCurrency: string;
  paymentRequestId: string;
  callbackUrl?: string;
  redirectUrl: string;
  paymentMethod?: string;

  constructor(
    request: {
      order: { fiatAmount: number; fiatCurrency: string };
      paymentRequestId: string;
      callbackUrl?: string;
      redirectUrl: string;
      paymentMethod?: string;
    },
    customerId: string,
  ) {
    this.customerId = customerId;
    this.fiatAmount = request.order.fiatAmount;
    this.fiatCurrency = request.order.fiatCurrency;
    this.paymentRequestId = request.paymentRequestId;
    this.callbackUrl = request.callbackUrl;
    this.redirectUrl = request.redirectUrl;
    this.paymentMethod = request.paymentMethod;
  }
}

