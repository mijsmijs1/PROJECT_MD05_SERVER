
import { AuthenService } from './authen.service';
import { Body, Controller, Ip, Post, Req, Res, Get, Param, ParseIntPipe, Patch, UsePipes } from '@nestjs/common';

import { Request, Response } from "express"

import { util } from 'src/utils';
import { RequestToken } from 'src/common/interface';
import { compareSync, hashSync } from 'bcrypt'
import { CreateUserDTO } from './dto/create-user.dto';
import { AvailableStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import axios from 'axios';
import { token } from 'src/utils/token';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { UserService } from '../user/user.service';
import { userLoginDTO } from './dto/login.dto';
@Controller('authen')
export class AuthenController {
  constructor(private readonly userService: UserService, private readonly mailService: MailService) { }
  @Post("/register")
  async createUser(@Ip() ip: string, @Body(new ValidationPipe()) body: CreateUserDTO, @Req() req: Request, @Res() res: Response) {
    try {
      let realIpList = (req as any).headers['x-forwarded-for'] ? (req as any).headers['x-forwarded-for'] : ip
      let { data, err } = await this.userService.create({
        ...body,
        password: hashSync(body.password ? body.password : "123456", 10),
        ipList: JSON.stringify([`${realIpList}`]),
        avatar: "img/avatar.png",
        createAt: String(Date.now()),
        updateAt: String(Date.now())
      });
      if (err) {
        if (err.meta?.target == 'user_userName_key') {
          throw {
            message: 'Tên người dùng này đã tồn tại!'
          };
        }
        if (err.meta?.target == 'user_email_key') {
          throw {
            message: 'Email đã được sử dụng!'
          };
        }
      }
      this.mailService.sendMail(data.email, '[CHOTROI.VN]_Xác thực địa chỉ email!',
        `
        <h3>Xác thực địa chỉ email cho tài khoản ${data.userName}</h3>
        <p>Xin chào ${data.firstName ? data.firstName : data.userName} ${data.lastName ? data.lastName : ""}, 
        đây là email xác thực địa chỉ đăng nhập, vui lòng click vào link phía dưới để xác thực email!</p>
        <p>Liên kết có thời hạn 5 phút.</p>
        <a href="${process.env.SV_API}/authen/confirm_email/${util.token.createToken({
          ...data,
          emailConfirm: AvailableStatus.active
        })}">Xác thực ngay!</a>
        `)



      return res.status(200).json({
        message: "Tạo tài khoản thành công!",
        data
      })

    } catch (err) {
      return res.status(500).json({
        message: err.message ? [err.message] : ["loi sever"]
      })


    }

  }

  @Post('/login')
  async login(@Ip() ip: string, @Req() req: Request, @Body() body: userLoginDTO, @Res() res: Response) {
    let realIpList = (req as any).headers['x-forwarded-for'] ? (req as any).headers['x-forwarded-for'] : ip
    try {
      let { data, err } = await this.userService.findUser(body.loginInfo)
      if (err) {
        throw {
          message: err
        }
      }
      if (!data.status) {
        throw {
          message: "Your account has been locked!"
        }
      }


      if (!compareSync(body.password, data.password)) {
        throw {
          message: "Mật khẩu không chính xác!"
        }
      }
      if (body.loginInfo.includes("@") && data.emailConfirm != AvailableStatus.active) {
        this.mailService.sendMail(data.email, '[CHOTROI.VN]_Xác thực địa chỉ email!',
          `
        <h3>Xác thực địa chỉ email cho tài khoản ${data.userName}</h3>
        <p>Xin chào ${data.firstName ? data.firstName : data.userName} ${data.lastName ? data.lastName : ""}, 
        đây là email xác thực địa chỉ đăng nhập, vui lòng click vào link phía dưới để xác thực email!</p>
        <p>Liên kết có thời hạn 5 phút.</p>
        <a href="${process.env.SV_API}/authen/confirm_email/${util.token.createToken({
            ...data,
            emailConfirm: AvailableStatus.active
          })}">Xác thực ngay!</a>
        `)
        throw {
          message: `Địa chỉ email của bạn chưa được xác thực, không thể đăng nhập bằng email, chúng tôi đã gửi mail xác thực cho ${data.email}!`
        }
      }
      if (!JSON.parse(data.ipList).find((item: string) => item == realIpList.split(',')[0])) {
        let NewIpList = JSON.stringify([...JSON.parse(data.ipList), realIpList.split(',')[0]])

        this.mailService.sendMail(data.email, '[CHOTROI.VN]_Cập nhật vị trí đăng nhập mới!',
          `
        <h3>Cập nhật vị trí đăng nhập mới cho tài khoản ${data.userName}</h3>
        <p>Xin chào ${data.firstName ? data.firstName : data.userName} ${data.lastName ? data.lastName : ""}, 
        chúng tôi phát hiện bạn đang đăng nhập ở vị trí mới, vui lòng click vào link phía dưới để xác thực vị trí đăng nhập mới!</p>
        <p>Địa chỉ IP:${realIpList.split(',')[0]}, liên kết có thời hạn 5 phút.</p>
        <a href="${process.env.SV_API}/authen/confirm_ip/${util.token.createToken({
            ...data,
            ipList: NewIpList,
          })}">Xác thực ngay!</a>
        `)
        throw {
          message: "Bạn đang đăng nhập ở vị trí mới, vui lòng vào email xác nhận!"
        }
      }
      let lastLogin = String(Date.now())
      await this.userService.update(data.id, {
        ...data,
        lastLogin,
      })
      let result = await this.userService.findById(data.id)
      return res.status(200).json({
        data: util.token.createToken(result.data, "1d"),
        message: "Đăng nhập thành công!"
      })
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: err.message ? [err.message] : ["Đăng nhập thất bại! Vui lòng thử lại sau!"]
      })
    }

  }

  @Get('/confirm_ip/:token')
  async confirmIp(@Req() req: RequestToken, @Res() res: Response) {

    try {
      let { data, err } = await this.userService.update(req.tokenData.id, {
        ipList: req.tokenData.ipList
      })
      if (err) {
        throw {
          message: "Thêm IP mới thất bại!"
        }
      }
      return res.status(200).send("Thêm IP mới thành công!")
    } catch (err) {
      console.log('err', err);
      return res.status(500).send(`${err.message ? err.message : "Lỗi hệ thống, vui lòng thử lại sau!"}`)
    }
  }

  @Get('/confirm_email/:token')
  async confirmEmail(@Req() req: RequestToken, @Res() res: Response) {
    try {
      let { data, err } = await this.userService.update(req.tokenData.id, {
        emailConfirm: AvailableStatus.active
      })
      if (err) {
        throw {
          message: "Kích hoạt email thất bại!"
        }
      }
      return res.status(200).send("Kích hoạt email thành công!")
    } catch (err) {
      return res.status(500).send(`${err.message ? err.message : "Lỗi hệ thống, vui lòng thử lại sau!"}`)
    }
  }
  @Get('/decodeToken/:token')
  async decodeToken(@Req() req: RequestToken, @Res() res: Response) {
    try {
      return res.status(200).json({
        data: req.tokenData,
        message: "decode Token thành công!"
      })
    } catch (err) {
      return res.status(500).json({
        data: null,
        message: [err.message] ? [err.message] : "decode Token không thành công!"
      })
    }
  }
  @Post('/loginWithGoogle')
  async loginWithGoogle(@Ip() ip: string, @Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      let googleTokenData = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.GOOGLE_FIREBASE_KEY}`,
        {
          idToken: body.googleToken
        })
      if (googleTokenData.data.users[0].email != body.user.email) {
        throw {
          message: "Lỗi hệ thống đăng nhập!"
        }
      }
      let { data, err } = await this.userService.findUser(googleTokenData.data.users[0].email);
      if (!err) {
        if (!data.status) {
          throw {
            message: "Your account has been locked!"
          }
        }
      }


      if (err) {
        let realIpList = (req as any).headers['x-forwarded-for'] ? (req as any).headers['x-forwarded-for'] : ip
        let { data, err } = await this.userService.create({
          ...req.body.user,
          emailConfirm: AvailableStatus.active,
          password: String(hashSync(body.user?.password, 10)),
          createAt: String(Date.now()),
          updateAt: String(Date.now()),
          ipList: JSON.stringify([String(realIpList)])
        })
        if (err) {
          throw {
            message: "Lỗi hệ thống đăng nhập!"
          }
        }
        let lastLogin = String(Date.now())
        await this.userService.update(data.id, {
          ...data,
          lastLogin,
        })
        let result = await this.userService.findById(data.id)
        return res.status(200).json({
          message: "Đăng nhập thành công!",
          token: util.token.createToken(result.data, "1d")
        })
      } else {
        let lastLogin = String(Date.now())
        await this.userService.update(data.id, {
          ...data,
          lastLogin,
        })
        let result = await this.userService.findById(data.id)
        return res.status(200).json({
          message: "Đăng nhập thành công!",
          token: util.token.createToken(result.data, "1d")
        })
      }
    } catch (err) {
      console.log(err);

      return res.status(500).json({
        message: err.message ? [err.message] : ["Loi Server!"]
      })

    }
  }
  @Patch('/forgotPassword')
  async forgotPassword(@Req() req: Request, @Body() body: { email: string }, @Res() res: Response) {
    try {
      let user = await this.userService.findByEmail(body.email)


      if (!user.data || user.err) {
        throw {
          message: "Email không tồn tại!"
        }
      }

      await this.mailService.sendMail(user.data.email, 'Email cấp lại mật khẩu!',
        `
      <h3>Xác nhận cấp lại mật khẩu cho tài khoản ${user.data.userName}</h3>
      <p>Xin chào ${user.data.firstName ? user.data.firstName : user.data.userName} ${user.data.lastName ? user.data.lastName : ""}, 
      đây là email xác thực cấp lại mật khẩu, vui lòng click vào link phía dưới để nhận mật khẩu mới!</p>
      <p>Liên kết có thời hạn 5 phút.</p>
      <a href="${process.env.SV_API}/user/reissue-password/${util.token.createToken({
          ...user.data
        }, String(5 * 60 * 1000))}">Nhận mật khẩu mới!</a>
      `)
      res.status(200).json({
        message: "We have sent you a update pasword email, please check your email to confirm!",
      })
    } catch (err) {
      res.status(500).json({
        message: err.message ? [err.message] : ["Lỗi Server!"]
      })
    }
  }
}
