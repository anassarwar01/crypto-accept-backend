import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversionRatesService } from './conversion-rates.service';
import { ConversionRate } from '../transactions/entities/conversion-rate.entity';

describe('ConversionRatesService', () => {
    let service: ConversionRatesService;
    let repo: Repository<ConversionRate>;

    const mockConversionRateRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConversionRatesService,
                { provide: getRepositoryToken(ConversionRate), useValue: mockConversionRateRepo },
            ],
        }).compile();

        service = module.get<ConversionRatesService>(ConversionRatesService);
        repo = module.get(getRepositoryToken(ConversionRate));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getRate', () => {
        it('should return 1 if base and target are the same', async () => {
            const result = await service.getRate('USD', 'USD');
            expect(result).toBe(1);
        });

        it('should return the rate if found', async () => {
            const rate = { fiatConversionRate: 1.2 } as ConversionRate;
            mockConversionRateRepo.findOne.mockResolvedValue(rate);

            const result = await service.getRate('EUR', 'USD');
            expect(result).toBe(1.2);
        });

        it('should return null if not found', async () => {
            mockConversionRateRepo.findOne.mockResolvedValue(null);
            const result = await service.getRate('EUR', 'UNKNOWN');
            expect(result).toBeNull();
        });
    });

    describe('updateRate', () => {
        it('should update an existing rate', async () => {
            const existingRate = { baseCurrency: 'EUR', fiatCurrency: 'USD', fiatConversionRate: 1.1 };
            mockConversionRateRepo.findOne.mockResolvedValue(existingRate);

            await service.updateRate('EUR', 'USD', 1.2);
            expect(existingRate.fiatConversionRate).toBe(1.2);
            expect(mockConversionRateRepo.save).toHaveBeenCalledWith(existingRate);
        });

        it('should create a new rate if not found', async () => {
            mockConversionRateRepo.findOne.mockResolvedValue(null);
            const newRate = { baseCurrency: 'EUR', fiatCurrency: 'USD' };
            mockConversionRateRepo.create.mockReturnValue(newRate);

            await service.updateRate('EUR', 'USD', 1.2);
            expect(newRate).toHaveProperty('fiatConversionRate', 1.2);
            expect(mockConversionRateRepo.save).toHaveBeenCalledWith(newRate);
        });
    });
});
