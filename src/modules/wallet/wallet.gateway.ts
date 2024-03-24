import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import { Socket } from "socket.io"
import { Injectable, OnModuleInit } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { MemberRole, member, user } from "@prisma/client"
import { token } from "src/utils/token";
import { WalletService } from "./wallet.service";
@Injectable()
@WebSocketGateway({
  cors: true
})
export class WalletGateway implements OnModuleInit {

  @WebSocketServer()
  private serverSocket: Socket

  public userTopUpList: {
    socket: Socket,
    tokenCode: string,
    data: user,
    loginAt: string
  }[] = []
  public memberLoginList: {
    socket: Socket,
    tokenCode: string,
    data: member,
    loginAt: string
  }[] = []
  constructor(private readonly walletService: WalletService, private readonly prisma: PrismaService) { }

  onModuleInit() {
    this.serverSocket.on("connection", async (socket) => {
      const tokenCodeTopUp = socket.handshake.auth.tokenTopUp || socket.handshake.query.tokenTopUp;
      if (tokenCodeTopUp) {
        let tokenData = await this.tokeAuthen(String(tokenCodeTopUp));
        if (!tokenData) {
          console.log("Xác thực thất bại!12");
          socket.emit("state", {
            message: "Xác thực thất bại Top_Up!",
            data: null,
            invalidToken: true
          })
          // socket.disconnect();
        } else {
          this.userTopUpList.push({
            socket,
            tokenCode: tokenCodeTopUp,
            data: tokenData,
            loginAt: String(Date.now())
          })
          socket.emit("state", {
            message: "Xác thực thành công Top_Up!",
            data: tokenData,
            invalidToken: false
          })
          console.log(`Người dùng: ${(tokenData as user).firstName} ${(tokenData as user).lastName} vừa truy cập vào trang nạp tiền!`)
        }



      }
    })
  }

  async topUpSuccess(userName: string, data: user) {
    let userSocket = this.userTopUpList.find((client) => client.data.userName == userName);
    for (let i in this.userTopUpList) {
      if (this.userTopUpList[i].data.userName == userName) {
        let tokenCode = token.createToken(data)
        this.userTopUpList[i].socket.emit("topUp", {
          message: "Nạp tiền thành công!",
          data,
          tokenCode
        });
      }

    }
  }
  async tokeAuthen(tokenCode: string) {
    try {
      let tokenData = token.decodeToken(tokenCode)
      let member = await this.prisma.user.findUnique({
        where: {
          id: (tokenData as user).id
        }
      })

      if (!member) throw false

      return member
    } catch (err) {
      console.log("err", err);
      return false
    }
  }


}
