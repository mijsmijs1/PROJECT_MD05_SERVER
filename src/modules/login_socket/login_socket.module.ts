import { Global, Module } from '@nestjs/common';
import { LoginSocketService } from './login_socket.service';
import { LoginSocketGateway } from './login_socket.gateway';
import { PrismaService } from '../prisma/prisma.service';
@Global()
@Module({
  providers: [LoginSocketGateway, LoginSocketService, PrismaService],
  exports: [LoginSocketService, LoginSocketGateway]
})
export class LoginSocketModule { }
