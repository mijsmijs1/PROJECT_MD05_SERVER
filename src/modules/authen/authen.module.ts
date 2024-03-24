import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthenService } from './authen.service';
import { AuthenController } from './authen.controller';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UserTokenMiddleWare } from 'src/middlewares/authen_user.middleware';

@Module({
  controllers: [AuthenController],
  providers: [AuthenService, UserService, MailService],
})
export class AuthenModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserTokenMiddleWare)
      .forRoutes(
        { path: "authen/confirm_ip/:token", method: RequestMethod.GET, version: "1" },
        { path: "authen/confirm_email/:token", method: RequestMethod.GET, version: "1" },
        { path: "authen/decodeToken/:token", method: RequestMethod.GET, version: "1" }
      )
  }


}
