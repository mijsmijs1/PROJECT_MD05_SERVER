import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UserTokenMiddleWare } from 'src/middlewares/authen_user.middleware';
import { TokenAuthenMiddleware } from 'src/middlewares/authen_member.middleware';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenAuthenMiddleware)
      .forRoutes(
        { path: "user/getByAdmin/:id", method: RequestMethod.GET, version: "1" },
        { path: "user", method: RequestMethod.GET, version: "1" },
        { path: "user/updateByAdmin/:userId", method: RequestMethod.PATCH, version: "1" },
      )
      .apply(UserTokenMiddleWare)
      .forRoutes(
        { path: "user/confirm-email/:id", method: RequestMethod.GET, version: "1" },
        { path: "user/change_old_email/:token", method: RequestMethod.GET, version: "1" },
        { path: "user/reissue-password/:token", method: RequestMethod.GET, version: "1" },
        { path: "user/change_new_email", method: RequestMethod.GET, version: "1" },
        { path: "user/update-avatar/:userId", method: RequestMethod.PATCH, version: "1" },
        { path: "user/change-password/:userId", method: RequestMethod.PATCH, version: "1" },
        { path: "user/change-email/:userId", method: RequestMethod.PATCH, version: "1" },
        { path: "user/payment/:userId", method: RequestMethod.PATCH, version: "1" },
        { path: "user/:userId", method: RequestMethod.PATCH, version: "1" },
      )
  }


}
