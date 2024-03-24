import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TokenAuthenMiddleware } from 'src/middlewares/authen_member.middleware';
@Global()
@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService]
})

export class CategoryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenAuthenMiddleware)
      .forRoutes(
        { path: "category", method: RequestMethod.POST, version: "1" },
        { path: "category/:categoryId", method: RequestMethod.PATCH, version: "1" },
      )
  }
}