import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { TokenAuthenMiddleware } from 'src/middlewares/authen_member.middleware';

@Module({
  controllers: [BranchController],
  providers: [BranchService],
})

export class BranchModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenAuthenMiddleware)
      .forRoutes(
        { path: "branch", method: RequestMethod.POST, version: "1" },
        { path: "branch/:branchId", method: RequestMethod.PATCH, version: "1" },
      )
  }
}