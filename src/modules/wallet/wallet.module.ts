import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { UserService } from '../user/user.service';
import { WalletGateway } from './wallet.gateway';
import { TokenAuthenMiddleware } from 'src/middlewares/authen_member.middleware';

@Module({
  controllers: [WalletController],
  providers: [WalletService, UserService, WalletGateway],
  exports: [WalletService, WalletGateway]
})
export class WalletModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenAuthenMiddleware)
      .forRoutes(
        { path: "wallet/total-revenue", method: RequestMethod.GET, version: "1" },
      )
  }
}
