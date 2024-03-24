import { Test, TestingModule } from '@nestjs/testing';
import { LoginSocketService } from './login_socket.service';

describe('LoginSocketService', () => {
  let service: LoginSocketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoginSocketService],
    }).compile();

    service = module.get<LoginSocketService>(LoginSocketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
