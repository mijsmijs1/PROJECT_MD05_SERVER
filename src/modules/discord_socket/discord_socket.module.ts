import { Global, Module } from '@nestjs/common';
import { DiscordSocketService } from './discord_socket.service';

@Global()
@Module({
  controllers: [],
  providers: [DiscordSocketService],
  exports:[DiscordSocketService]
})
export class DiscordSocketModule {}
