export class CreatePaymentUrlDTO {
  orderRequest: any; // Replace with actual OrderRequest entity type

  constructor(orderRequest: any) {
    this.orderRequest = orderRequest;
  }
}

