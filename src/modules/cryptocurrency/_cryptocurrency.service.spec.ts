import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptocurrencyService } from './cryptocurrency.service';
import { Cryptocurrency } from './entities/cryptocurrency.entity';

describe('CryptocurrencyService', () => {
  let service: CryptocurrencyService;
  let cryptoRepo: Repository<Cryptocurrency>;

  const mockRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptocurrencyService,
        {
          provide: getRepositoryToken(Cryptocurrency),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CryptocurrencyService>(CryptocurrencyService);
    cryptoRepo = module.get<Repository<Cryptocurrency>>(
      getRepositoryToken(Cryptocurrency),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should return all cryptocurrencies', async () => {
    const mockData: Cryptocurrency[] = [
      { name: 'Bitcoin', symbol: 'BTC', price: 30000 },
      { name: 'Ethereum', symbol: 'ETH', price: 2000 },
    ];

    mockRepository.find.mockResolvedValue(mockData);

    const result = await service.findAll();
    expect(result).toEqual(mockData);
    expect(mockRepository.find).toHaveBeenCalled();
  });
});
