import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantCustomersService } from './merchant-customers.service';
import { MerchantCustomer } from './entities/merchant-customer.entity';

describe('MerchantCustomersService', () => {
    let service: MerchantCustomersService;
    let repo: Repository<MerchantCustomer>;

    const mockMerchantCustomerRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MerchantCustomersService,
                { provide: getRepositoryToken(MerchantCustomer), useValue: mockMerchantCustomerRepo },
            ],
        }).compile();

        service = module.get<MerchantCustomersService>(MerchantCustomersService);
        repo = module.get(getRepositoryToken(MerchantCustomer));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all merchant customers', async () => {
            const expected = [{ merchantId: 'm1', customerId: 'c1' }] as MerchantCustomer[];
            mockMerchantCustomerRepo.find.mockResolvedValue(expected);

            const result = await service.findAll();
            expect(result).toEqual(expected);
            expect(mockMerchantCustomerRepo.find).toHaveBeenCalled();
        });
    });

    describe('linkCustomer', () => {
        it('should return existing link if found', async () => {
            const existing = { merchantId: 'm1', customerId: 'c1' };
            mockMerchantCustomerRepo.findOne.mockResolvedValue(existing);

            const result = await service.linkCustomer('m1', 'c1');
            expect(result).toEqual(existing);
            expect(mockMerchantCustomerRepo.findOne).toHaveBeenCalledWith({
                where: { merchantId: 'm1', customerId: 'c1' },
            });
            expect(mockMerchantCustomerRepo.create).not.toHaveBeenCalled();
        });

        it('should create and save new link if not found', async () => {
            mockMerchantCustomerRepo.findOne.mockResolvedValue(null);
            const newLink = { merchantId: 'm1', customerId: 'c1' };
            mockMerchantCustomerRepo.create.mockReturnValue(newLink);
            mockMerchantCustomerRepo.save.mockResolvedValue(newLink);

            const result = await service.linkCustomer('m1', 'c1');
            expect(result).toEqual(newLink);
            expect(mockMerchantCustomerRepo.create).toHaveBeenCalledWith({
                merchantId: 'm1',
                customerId: 'c1',
            });
            expect(mockMerchantCustomerRepo.save).toHaveBeenCalledWith(newLink);
        });
    });
});
