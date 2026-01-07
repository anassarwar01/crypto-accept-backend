import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDTO } from './dto/create-customer.dto';
import { GetCustomerDTO } from './dto/get-customer.dto';

describe('CustomersService', () => {
  let service: CustomersService;
  let repo: Repository<Customer>;

  const mockCustomerRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: mockCustomerRepo },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repo = module.get(getRepositoryToken(Customer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCustomerByEmail', () => {
    it('should return a customer by email', async () => {
      const dto = { email: 'test@test.com' } as GetCustomerDTO;
      const customer = { id: 'c_123', email: 'test@test.com' };
      mockCustomerRepo.findOne.mockResolvedValue(customer);

      const result = await service.getCustomerByEmail(dto);
      expect(result).toEqual(customer);
      expect(mockCustomerRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
    });
  });

  describe('createCustomer', () => {
    it('should create and save a customer', async () => {
      const dto = { email: 'test@test.com', firstName: 'John', lastName: 'Doe' } as CreateCustomerDTO;
      const customer = { email: 'test@test.com', name: 'John Doe' };
      mockCustomerRepo.create.mockReturnValue(customer);
      mockCustomerRepo.save.mockResolvedValue({ id: 'c_123', ...customer });

      const result = await service.createCustomer(dto);
      expect(result).toHaveProperty('id', 'c_123');
      expect(mockCustomerRepo.create).toHaveBeenCalledWith({
        email: dto.email,
        name: 'John Doe',
      });
      expect(mockCustomerRepo.save).toHaveBeenCalledWith(customer);
    });
  });
});
