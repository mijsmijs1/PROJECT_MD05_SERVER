import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { ReceiptController } from './receipt.controller';

import { UserService } from '../user/user.service';
import { UserTokenMiddleWare } from 'src/middlewares/authen_user.middleware';

@Module({
  controllers: [ReceiptController],
  providers: [ReceiptService,UserService],
})
export class ReceiptModule implements NestModule{
  configure(consumer: MiddlewareConsumer){
    consumer
    .apply(UserTokenMiddleWare)
    .forRoutes(
      {path:"receipts/add-to-cart", method:RequestMethod.POST,version:"1"},
      
    )
  }
}
