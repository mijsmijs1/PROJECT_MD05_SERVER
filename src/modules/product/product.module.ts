
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { UserTokenMiddleWare } from 'src/middlewares/authen_user.middleware';
import { TokenAuthenMiddleware } from 'src/middlewares/authen_member.middleware';

@Module({
  controllers: [ProductController],
  providers: [ProductService, UserService],
})

export class ProductModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenAuthenMiddleware)
      .forRoutes(
        { path: "product/updateByAdmin/:id", method: RequestMethod.PATCH, version: "1" },
      )
      .apply(UserTokenMiddleWare)
      .forRoutes(
        { path: "product", method: RequestMethod.POST, version: "1" },
        { path: "product/:id", method: RequestMethod.PATCH, version: "1" },
        { path: "product/updateVideo/:productId", method: RequestMethod.PATCH, version: "1" },
        { path: "product/updateImg/:productId", method: RequestMethod.PATCH, version: "1" },
        { path: "product/push-product/:productId", method: RequestMethod.PATCH, version: "1" }
      )
  }

}
