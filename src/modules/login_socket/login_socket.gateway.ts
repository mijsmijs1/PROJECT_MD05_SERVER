import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { LoginSocketService } from './login_socket.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MemberRole, member } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { token } from 'src/utils/token';
@Injectable()
@WebSocketGateway({ cors: true })
export class LoginSocketGateway implements OnModuleInit {
  @WebSocketServer()
  private serverSocket: Socket
  public memberLoginList: {
    socket: Socket,
    tokenCodeMember: string,
    data: member,
    loginAt: string
  }[] = []
  constructor(
    private readonly loginSocketService: LoginSocketService,
    private readonly prisma: PrismaService
  ) { }
  onModuleInit() {
    this.serverSocket.on("connection", async (socket: Socket) => {
      const tokenCodeMember = socket.handshake.auth.tokenMember || socket.handshake.query.tokenMember;
      if (tokenCodeMember) {

        let tokenData = await this.tokeAuthenMember(tokenCodeMember);
        if (!tokenData) {
          socket.emit("status", {
            message: "Xác thực thất bại!",
            data: null,
            invalidToken: true
          })
          socket.disconnect();
        } else {
          /* Check xem token đã dùng chưa */
          if (!this.memberLoginList.find(client => client.tokenCodeMember == tokenCodeMember)) { // token chưa trùng
            /* Check xem token có được tạo ra cùng 1 tài khoản không */
            if (this.memberLoginList.find(client => client.data.id == (tokenData as member).id)) {
              socket.emit("status", {
                message: "Xác thức thất bại! Tài khoản đã được đăng nhập ở một nơi khác!",
                data: null,
                invalidToken: false
              })
              socket.disconnect();
              return
            }
          }

          this.memberLoginList.push({
            socket,
            tokenCodeMember,
            data: tokenData,
            loginAt: String(Date.now())
          })

          socket.emit("status", {
            message: "Thành công!",
            data: tokenData
          })

          console.log(`Người dùng: ${(tokenData as member).firstName} ${(tokenData as member).lastName} vừa truy cập!`)
          try {
            await this.loginSocketService.createLog({
              memberId: (tokenData as member).id,
              note: `Thành viên: ${(tokenData as member).firstName} ${(tokenData as member).lastName} truy cập hệ thống!`,
              createTime: String(Date.now())
            })
          } catch (err) {
            console.log('err', err);

          }

          /* master send logs file */
          this.sendLog()
          this.sendMemberList()
          this.sendOnlineList()
          this.masterSocketOn(socket, tokenData)
        }
        socket.on('disconnect', () => {
          this.memberLoginList = this.memberLoginList.filter(client => client.socket.id != socket.id)
          socket.disconnect();
          console.log(`Người dùng: ${(tokenData as member).firstName} ${(tokenData as member).lastName} vừa đăng xuất!`)
          this.sendOnlineList()
        });
      }
    })

  }
  async masterSocketOn(socket: Socket, tokenData: member) {
    if (tokenData.role != MemberRole.admin) return
    socket.on("masterKick", async (data: {
      socketId: string,
      reason: string,
      targetMember: member
    }) => {
      for (let i in this.memberLoginList) {
        if (this.memberLoginList[i].socket.id == data.socketId) {
          this.memberLoginList[i].socket.emit("kick", data.reason);
          this.sendOnlineList()
          this.memberLoginList[i].socket.disconnect();
          this.memberLoginList.splice(Number(i), 1);
          try {
            await this.loginSocketService.createLog({
              memberId: (tokenData as member).id,
              note: `Master vừa đăng xuất thành viên ${data.targetMember.loginId}`,
              createTime: String(Date.now())
            })
            this.sendLog()
          } catch (err) { }
          break
        }
      }
    })
  }

  async tokeAuthenMember(tokenCode: string) {
    try {
      let tokenData = token.decodeToken(tokenCode)

      let member = await this.prisma.member.findUnique({
        where: {
          id: (tokenData as member).id
        }

      })

      if (!member) throw false
      if (member.updateTime != (tokenData as member).updateTime) throw false

      return member
    } catch (err) {
      return false
    }
  }

  async sendLog(socketClient: null | Socket = null) {
    if (socketClient != null) {
      let { data, err } = await this.loginSocketService.findLogMany()
      if (!err) {
        socketClient.emit("logs", data)
      }
      return
    }
    for (let i in this.memberLoginList) {
      if (JSON.parse(this.memberLoginList[i].data.permission).find((per: string) => per == "r:log")) {
        let { data, err } = await this.loginSocketService.findLogMany()
        if (!err) {
          this.memberLoginList[i].socket.emit("logs", data)
        }
      }
    }
  }

  async sendMemberList(socketClient: null | Socket = null) {
    if (socketClient != null) {
      let { data, err } = await this.loginSocketService.findMemberMany()
      if (!err) {
        socketClient.emit("members", data)
      }
      return
    }
    for (let i in this.memberLoginList) {
      if (JSON.parse(this.memberLoginList[i].data.permission).find((per: string) => per == "r:member")) {
        let { data, err } = await this.loginSocketService.findMemberMany()
        if (!err) {
          this.memberLoginList[i].socket.emit("members", data)
        }
      }
    }
  }

  async sendOnlineList() {
    for (let i in this.memberLoginList) {
      if (this.memberLoginList[i].data.role == MemberRole.admin) {
        this.memberLoginList[i].socket.emit("online-list", this.memberLoginList.map(client => {
          return {
            socketId: client.socket.id,
            data: client.data,
            loginAt: client.loginAt
          }
        }))
      }
    }
  }

}
