import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { Socket } from 'socket.io';
import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { ChatType, user } from '@prisma/client';


import { ChatSocketService } from './chat_socket.service';
import { DiscordSocketService } from '../discord_socket/discord_socket.service';
import { util } from 'src/utils';
import { token } from 'src/utils/token';

@WebSocketGateway({ cors: true })
export class ChatSocketGateway implements OnModuleInit {

  @WebSocketServer()
  SocketServer: Socket

  socketClientList: {
    token: string;
    data: user;
    sockets: Socket[]
  }[] = []

  constructor(
    private readonly chatService: ChatSocketService,
    @Inject(forwardRef(() => DiscordSocketService))
    private readonly discordService: DiscordSocketService
  ) { }

  onModuleInit() {
    this.SocketServer.on("connection", (socketClient: Socket) => {
      let tokenCodeChat = socketClient.handshake.query.tokenChat;   
      if (tokenCodeChat) {
        /* Giải token */
        let decodeData = token.decodeToken(String(tokenCodeChat));

        /* Xử lý lỗi */
        if (!decodeData) {
          socketClient.emit("login-status", {
            status: false,
            message: [
              "Token invalid"
            ]
          })
          socketClient.disconnect();
        } else {
          /* Thêm vào danh sách client đang truy cập */
          this.addClient(String(tokenCodeChat), socketClient, decodeData as user)
        }
      }

    })
  }

  addClient(token: string, socketClient: Socket, decodeData: user) {
    let flag = false;
    for (let i in this.socketClientList) {
      if (this.socketClientList[i].token == token) {
        this.socketClientList[i].sockets.push(socketClient)

        flag = true;
        break
      }
    }
    if (!flag) this.socketClientList.push({
      token,
      data: decodeData,
      sockets: [
        socketClient
      ]
    })
    socketClient.emit("login-status", {
      status: true,
      message: [
        "Kết nối thành công!"
      ]
    })
    this.sendHistory(decodeData.id)
  }

  async sendHistory(userId: number) {
    let client = this.socketClientList.find(client => client.data.id == userId)
    if (!client) return
    try {
      let { data, err } = await this.chatService.findHistory(userId);
      for (let i in client.sockets) {
        client.sockets[i].emit('chat-history', data)
      }
    } catch (err) {

    }
  }

  @SubscribeMessage('user-chat')
  async userChat(@MessageBody() body: {
    userId: number;
    content: string;
  }) {
    let client = this.socketClientList.find(item => item.data.id == body.userId);
    let historyObj = await this.chatService.findHistory(client.data.id);
    if (historyObj.err) {

    }
    if (historyObj.data.length == 0) {
      let textChannel = await this.discordService.createTextChannel(client.data.userName)
      let { data, err } = await this.chatService.createChat({
        content: body.content,
        createAt: String(Date.now()),
        type: ChatType.TEXT,
        userId: body.userId,
        discordChannel: textChannel.id
      })
      textChannel.send(`${client.data.userName}: ${data.content}`)
    } else {
      let channelCode = historyObj.data[0].discordChannel;
      let textChannel = await this.discordService.getTextChannel(channelCode);
      let { data, err } = await this.chatService.createChat({
        content: body.content,
        createAt: String(Date.now()),
        type: ChatType.TEXT,
        userId: body.userId,
        discordChannel: textChannel.id
      })
      textChannel.send(`${client.data.userName}: ${data.content}`)
    }
    this.sendHistory(body.userId)
  }

  async sendMessage(channelId: string, content: string) {
    let { err, data } = await this.chatService.findHistoryByDiscordChannel(channelId);
    let userId = data.userId;
    let client = this.socketClientList.find(client => client.data.id == data.userId);



    if (client) {
      let { data, err } = await this.chatService.createChat({
        content: content,
        createAt: String(Date.now()),
        type: ChatType.TEXT,
        userId: client.data.id,
        discordChannel: channelId,
        memberId: 1
      })
      this.sendHistory(client.data.id)
    } else {
      let { data, err } = await this.chatService.createChat({
        content: content,
        createAt: String(Date.now()),
        type: ChatType.TEXT,
        userId: userId,
        discordChannel: channelId,
        memberId: 1
      })
    }
  }
}
