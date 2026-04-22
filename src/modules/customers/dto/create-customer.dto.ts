// Backward compatible DTO for existing code
export class CreateCustomerDto { }

// New DTO for payment URL functionality
export class CreateCustomerDTO {
  email: string;
  firstName?: string | null;
  lastName?: string | null;

  constructor(request: {
    customer: {
      email: string;
      firstName?: string | null;
      lastName?: string | null;
    };
  }) {
    this.email = request.customer.email;
    this.firstName = request.customer.firstName ?? null;
    this.lastName = request.customer.lastName ?? null;
  }
}
