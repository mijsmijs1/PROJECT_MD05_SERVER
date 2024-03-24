import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenModule } from './modules/authen/authen.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { MailModule } from './modules/mail/mail.module';
import { LoginSocketModule } from './modules/login_socket/login_socket.module';
import { MemberModule } from './modules/member/member.module';
import { ChatSocketModule } from './modules/chat_socket/chat_socket.module';
import { DiscordSocketModule } from './modules/discord_socket/discord_socket.module';

import { CategoryModule } from './modules/category/category.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ReceiptModule } from './modules/receipt/receipt.module';
import { ProductModule } from './modules/product/product.module';
import { BranchModule } from './modules/branch/branch.module';


@Module({
  imports: [AuthenModule,
    UserModule,
    PrismaModule,
    MailModule,
    LoginSocketModule,
    MemberModule,
    ChatSocketModule,
    DiscordSocketModule,
    CategoryModule,
    WalletModule,
    ReceiptModule,
    ProductModule,
    BranchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
