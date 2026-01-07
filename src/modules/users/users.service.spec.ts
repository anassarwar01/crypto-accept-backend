import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return a user if found', async () => {
      const user = { id: 'u1' } as User;
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.getUserById('u1');
      expect(result).toEqual(user);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'u1' },
        relations: [],
      });
    });

    it('should return null if not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const result = await service.getUserById('u_not_found');
      expect(result).toBeNull();
    });
  });
});
