export class GetCustomerDTO {
  email: string;

  constructor(request: { customer: { email: string } }) {
    this.email = request.customer.email;
  }
}
