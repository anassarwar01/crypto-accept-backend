import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  static async getUserById(
    userId: string,
    userRepository: Repository<User>,
  ): Promise<User | null> {
    return userRepository.findOne({
      where: { id: userId },
      relations: [],
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return UsersService.getUserById(id, this.userRepository);
  }

  create(_createUserDto: CreateUserDto) {
    void _createUserDto;
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, _updateUserDto: UpdateUserDto) {
    void _updateUserDto;
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
