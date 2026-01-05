// Backward compatible DTO for existing code
export class CreateCustomerDto { }

// New DTO for payment URL functionality
export class CreateCustomerDTO {
  email: string;
  firstName?: string;
  lastName?: string;

  constructor(request: {
    customer: {
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }) {
    this.email = request.customer.email;
    this.firstName = request.customer.firstName;
    this.lastName = request.customer.lastName;
  }
}
