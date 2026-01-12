import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlag } from './entities/feature-flag.entity';

describe('FeatureFlagService', () => {
    let service: FeatureFlagService;
    let repository: jest.Mocked<Repository<FeatureFlag>>;

    const mockRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FeatureFlagService,
                {
                    provide: getRepositoryToken(FeatureFlag),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<FeatureFlagService>(FeatureFlagService);
        repository = module.get(getRepositoryToken(FeatureFlag));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getFlag', () => {
        it('should retrieve a feature flag by key', async () => {
            const mockFlag: FeatureFlag = {
                id: '1',
                key: 'test_flag',
                active: true,
                rules: {},
            } as FeatureFlag;

            mockRepository.findOne.mockResolvedValue(mockFlag);

            const result = await service.getFlag('test_flag');

            expect(repository.findOne).toHaveBeenCalledWith({ where: { key: 'test_flag' } });
            expect(result).toEqual(mockFlag);
        });

        it('should return null if flag does not exist', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.getFlag('nonexistent_flag');

            expect(result).toBeNull();
        });
    });

    describe('isCountryAllowed', () => {
        it('should return true when flag does not exist', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.isCountryAllowed('US');

            expect(result).toBe(true);
        });

        it('should return true when flag is not active', async () => {
            const mockFlag: FeatureFlag = {
                id: '1',
                key: 'country_restriction',
                active: false,
                rules: { allowed_countries: ['GB'] },
            } as FeatureFlag;

            mockRepository.findOne.mockResolvedValue(mockFlag);

            const result = await service.isCountryAllowed('US');

            expect(result).toBe(true);
        });

        it('should return true when country is in allowed list', async () => {
            const mockFlag: FeatureFlag = {
                id: '1',
                key: 'country_restriction',
                active: true,
                rules: { allowed_countries: ['US', 'GB', 'CA'] },
            } as FeatureFlag;

            mockRepository.findOne.mockResolvedValue(mockFlag);

            const result = await service.isCountryAllowed('US');

            expect(result).toBe(true);
        });

        it('should return false when country is not in allowed list', async () => {
            const mockFlag: FeatureFlag = {
                id: '1',
                key: 'country_restriction',
                active: true,
                rules: { allowed_countries: ['GB', 'CA'] },
            } as FeatureFlag;

            mockRepository.findOne.mockResolvedValue(mockFlag);

            const result = await service.isCountryAllowed('US');

            expect(result).toBe(false);
        });

        it('should be case insensitive for country codes', async () => {
            const mockFlag: FeatureFlag = {
                id: '1',
                key: 'country_restriction',
                active: true,
                rules: { allowed_countries: ['US', 'GB'] },
            } as FeatureFlag;

            mockRepository.findOne.mockResolvedValue(mockFlag);

            const result = await service.isCountryAllowed('us');

            expect(result).toBe(true);
        });

        it('should return true when allowed_countries is not an array', async () => {
            const mockFlag: FeatureFlag = {
                id: '1',
                key: 'country_restriction',
                active: true,
                rules: { allowed_countries: 'invalid' },
            } as FeatureFlag;

            mockRepository.findOne.mockResolvedValue(mockFlag);

            const result = await service.isCountryAllowed('US');

            expect(result).toBe(true);
        });

        it('should return true when rules is null', async () => {
            const mockFlag: FeatureFlag = {
                id: '1',
                key: 'country_restriction',
                active: true,
                rules: null,
            } as FeatureFlag;

            mockRepository.findOne.mockResolvedValue(mockFlag);

            const result = await service.isCountryAllowed('US');

            expect(result).toBe(true);
        });
    });
});
