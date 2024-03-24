import { Global, Module } from '@nestjs/common';
import { ChatSocketService } from './chat_socket.service';
import { ChatSocketGateway } from './chat_socket.gateway';
@Global()
@Module({
  providers: [ChatSocketGateway, ChatSocketService],
  exports:[ChatSocketService,ChatSocketGateway]
})
export class ChatSocketModule {}
