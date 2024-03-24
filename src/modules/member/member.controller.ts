import { Body, Controller, Get, Ip, Param, Post, Patch, Req, Res, Version, ParseIntPipe, Query, ParseBoolPipe } from '@nestjs/common';
import { MemberService } from './member.service';
import { Response, Request } from 'express';
import { MemberLoginDto } from './dto/member-login.dto';
import { compareSync } from 'bcrypt'
import { MailService } from '../mail/mail.service';
import { RequestToken } from 'src/common/interface';
import { hashSync } from 'bcrypt'
import { ChangePasswordDTO } from './dto/change-password.dto';
import { CreateMemberDTO } from './dto/create-member.dto';
import { MemberRole, member } from '@prisma/client';
import { ChangePermissionDTO } from './dto/change-permission.dto';
// import { LoginService } from '../login/login.service';
// import { LoginGateway } from '../login/login.gateway';
import { token } from 'src/utils/token';

@Controller('member')
export class MemberController {
  constructor(
    private readonly memberService: MemberService,
    private readonly mailService: MailService,
    // private readonly loginService: LoginService,
    // private readonly loginGateway: LoginGateway
  ) { }

  @Post("/login")
  async login(@Req() req: Request, @Ip() ip: string, @Body() body: MemberLoginDto, @Res() res: Response) {
    try {
      let realIpList = (req as any).headers['x-forwarded-for'] ? (req as any).headers['x-forwarded-for'] : ip

      let { data, err } = await this.memberService.findByLoginId(body.loginId)

      if (err) {
        throw err.message || "DB Connect Failed!"
      }

      if (compareSync(body.password, data.password) == false) {
        throw "Mật khẩu không chính xác!"
      }


      let ipList: string[] = JSON.parse(data.ipList);
      if (!(ipList.find(ipItem => ipItem == realIpList.split(',')[0]))) {
        let html = `
          <h2>New IP: ${realIpList.split(',')[0]}</h2>
          <a href="${process.env.SV_API}/member/email/${token.createToken({
          ...data,
          newIp: realIpList.split(',')[0]
        })}">Xác thực</a>
        `
        await this.mailService.sendMail(data.email, "Xác thực vị trí đăng nhập mới", html)

        throw "Vui lòng truy cập email xác thực vị trí đăng nhập mới!"
      }

      return res.status(200).json({
        token: token.createToken(data, "1d")
      })
    } catch (err) {
      return res.status(403).json({
        message: err.command ? "Hệ thống mail bận vui lòng liên hệ QTV để cập nhật vị trí đăng nhập mới!" : err
      })
    }
  }

  @Get("/email/:token")
  async emailConfirm(@Req() req: RequestToken, @Res() res: Response) {
    try {
      let user = await this.memberService.findByLoginId(req.tokenData.loginId)

      if (user.err) {
        throw user.err.message || "DB Connect Failed!"
      }
      let ipList: string[] = JSON.parse(user.data.ipList);
      let { err } = await this.memberService.update(user.data.id, {
        ipList: JSON.stringify([...ipList, req.tokenData.newIp])
      });

      if (err) {
        throw err.message || "DB Connect Failed!"
      }
      return res.status(200).send("Thêm ip mới thành công!")
    } catch (err) {
      return res.status(403).send("Thêm ip mới thất bại!")
    }
  }

  @Patch("/:id/change-password")
  async update(@Param('id', ParseIntPipe) memberId: number, @Body() body: ChangePasswordDTO, @Res() res: Response) {
    try {
      const { err, data } = await this.memberService.update(memberId, {
        ...body,
        password: hashSync(body.password, 10),
        firstLoginState: false
      })

      if (err) {
        throw err.message || "DB Connect Failed!";
      }
      return res.status(200).json({
        message: "Cập nhật mật khẩu thành công!",
        token: token.createToken(data)
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message || "Lỗi server",
      });
    }
  }

  @Patch("/:id/change-permission")
  async updatePermission(@Req() req: RequestToken, @Param('id', ParseIntPipe) memberId: number, @Body() body: ChangePermissionDTO, @Res() res: Response) {
    try {
      if (req.tokenData.role != MemberRole.admin) {
        throw "Permission Denied"
      }
      const { err, data } = await this.memberService.update(memberId, {
        ...body
      })

      if (err) {
        throw err.message || "DB Connect Failed!";
      }

      // await this.loginService.createLog({
      //   memberId: req.tokenData.id,
      //   note: `Thành viên: ${(req.tokenData as member).firstName} ${(req.tokenData as member).lastName} đã thay đổi quyền của user có id: ${memberId}`,
      //   createTime: String(Date.now())
      // })

      // this.loginGateway.sendLog(this.loginGateway.memberLoginList.find(item => item.data.role == MemberRole.master).socket)

      return res.status(200).json({
        message: "Cập nhật quyền thành công!",
        data: data
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message || "Lỗi server",
      });
    }
  }

  @Get("/:id/update-email")
  async updateEmail(@Param('id', ParseIntPipe) memberId: number, @Query('type', ParseBoolPipe) type: Boolean, @Query('token') tokenCode: string, @Query('email') email: string, @Res() res: Response) {
    try {
      const { err, data } = await this.memberService.findById(memberId)

      if (err) {
        throw err.message || "DB Connect Failed!";
      }

      if (!type) {
        console.log("body.email", email)
        let html = `
          <h2>Cập nhật email cho CHOTROI.VN account: ${data.loginId}</h2>
          <h2>Sau khi ấn vào liên kết bên dưới tài khoản của bạn sẽ liên kết với email: ${email}</h2>
          <a href="${process.env.SV_API}/member/${memberId}/update-email?type=true&token=${token.createToken({
          ...data,
          newEmail: email
        })}">Xác thực</a>
        `
        await this.mailService.sendMail(data.email, "Cập nhật email tài khoản ERN", html)
        return res.status(200).json({
          message: "Gửi yêu cầu cập nhật email thành công, vui lòng vào email để xác nhận!"
        });
      }

      let tokenData = token.decodeToken(tokenCode);

      const updateRes = await this.memberService.update(memberId, {
        email: (tokenData as any).newEmail,
        emailConfirm: true
      })
      if (updateRes.err) throw {
        message: "Loi cap nhat"
      }

      return res.status(200).json({
        message: "Xác thực email thành công!",
        token: token.createToken(updateRes.data)
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message || "Lỗi server",
      });
    }
  }

  @Post()
  async create(@Req() req: RequestToken, @Body() body: CreateMemberDTO, @Res() res: Response) {
    try {
      if (req.tokenData.role == MemberRole.admin && body.role == MemberRole.admin) {
        return res.status(500).json({
          message: "Bạn không đủ quyền tạo tài khoản admin!"
        })
      }
      if (req.tokenData.role == MemberRole.member) {
        return res.status(500).json({
          message: "Bạn không đủ quyền tạo tài khoản!"
        })
      }

      let password: string = String(Math.floor(Date.now() * Math.random()))
      const { data, err } = await this.memberService.create({
        ...body,
        emailConfirm: true,
        password: hashSync(password, 10),
        createTime: String(Date.now()),
        updateTime: String(Date.now()),
        avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmy5w2Op-iHyHnd8wR661cEL9YAuprFlHTJL8qUXZfxS_9Pvc51dBrJ94ZAhTfLD2dqVE&usqp=CAU"
      });
      if (err) {
        if (err.meta.target == 'member_loginId_key') {
          throw {
            message: 'Tên đăng nhập đã tồn tại trong hệ thống. Vui lòng chọn tên đăng nhập khác!'
          }
        }
        if (err.meta.target == 'member_email_key') {
          throw {
            message: 'Email đã tồn tại trong hệ thống. Vui lòng chọn email khác!'
          }
        }
      }
      let html = `
          <h2>Thông báo mật khẩu lần đâù cho ERN account: ${data.loginId}</h2>
          <h2>Đây là mật khẩu được cung cấp cho tài khoản của bạn, vui lòng không chia sẽ thông tin này cho bất cứ ai</h2>
          <h1>Mật khẩu: ${password}</h1>
          `
      this.mailService.sendMail(data.email, "Cấp mật khẩu lần đầu cho ERN admin", html)
      return res.status(200).json({
        data
      })
    } catch (err) {
      return res.status(500).json({
        err: err.message || "Lỗi server"
      })
    }
  }
}