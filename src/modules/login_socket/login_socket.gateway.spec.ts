import { Test, TestingModule } from '@nestjs/testing';
import { LoginSocketGateway } from './login_socket.gateway';
import { LoginSocketService } from './login_socket.service';

describe('LoginSocketGateway', () => {
  let gateway: LoginSocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoginSocketGateway, LoginSocketService],
    }).compile();

    gateway = module.get<LoginSocketGateway>(LoginSocketGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
