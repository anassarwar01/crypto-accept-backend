import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptocurrencyService } from './crypto-currencies.service';
import { Cryptocurrency } from './entities/crypto-currency.entity';

describe('CryptocurrencyService', () => {
    let service: CryptocurrencyService;
    let repo: Repository<Cryptocurrency>;

    const mockCryptoRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CryptocurrencyService,
                {
                    provide: getRepositoryToken(Cryptocurrency),
                    useValue: mockCryptoRepo,
                },
            ],
        }).compile();

        service = module.get<CryptocurrencyService>(CryptocurrencyService);
        repo = module.get<Repository<Cryptocurrency>>(getRepositoryToken(Cryptocurrency));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of cryptocurrencies', async () => {
            const expectedResult = [{ id: 1, cryptoCurrencyCode: 'BTC' }] as Cryptocurrency[];
            mockCryptoRepo.find.mockResolvedValue(expectedResult);

            const result = await service.findAll();
            expect(result).toEqual(expectedResult);
            expect(mockCryptoRepo.find).toHaveBeenCalled();
        });
    });

    describe('findByCode', () => {
        it('should return a cryptocurrency by code', async () => {
            const code = 'BTC';
            const expectedResult = { id: 1, cryptoCurrencyCode: code } as Cryptocurrency;
            mockCryptoRepo.findOne.mockResolvedValue(expectedResult);

            const result = await service.findByCode(code);
            expect(result).toEqual(expectedResult);
            expect(mockCryptoRepo.findOne).toHaveBeenCalledWith({
                where: { cryptoCurrencyCode: code },
            });
        });

        it('should return null if cryptocurrency is not found', async () => {
            mockCryptoRepo.findOne.mockResolvedValue(null);
            const result = await service.findByCode('NON_EXISTENT');
            expect(result).toBeNull();
        });
    });
});
