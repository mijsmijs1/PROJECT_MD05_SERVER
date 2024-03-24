import { Body, Controller, Ip, Post, Req, Res, Get, Param, ParseIntPipe, Patch, UsePipes, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from "express"
import { token } from 'src/utils/token';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { unlinkSync, writeFileSync } from 'fs';
import { compareSync, hashSync } from 'bcrypt';
import { RequestToken } from 'src/common/interface';
import { ChangePassDTO } from './dto/changePassword.dto';
import { ChangeEmailDTO } from './dto/changeEmail.dto';
import { MailService } from '../mail/mail.service';
import { Prisma } from '@prisma/client';
import { util } from 'src/utils';
import { UpdateUserDto } from './dto/updateUser.dto';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService, private readonly mailService: MailService) { }

  @Get('/confirm-email/:id')
  async confirmEmail(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      let { err, data } = await this.userService.findById(Number(req.params.id))
      if (data.email != body.email) {
        res.status(200).json({
          message: "Email không trùng hợp!",
          status: false
        })
      }
      if (err) {
        throw "Lỗi CSDL"
      }

      res.status(200).json({
        message: "Email phù hợp!",
        status: true
      })
    } catch (err) {
      res.status(500).json({
        message: err ? [err] : ["Lỗi Server!"]
      })
    }
  }

  @Patch('/update-avatar/:userId')
  @UseInterceptors(FileInterceptor('img'))
  async updateVideo(@UploadedFile(new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
      new FileTypeValidator({ fileType: /^image\// }),
    ]
  })) img: Express.Multer.File, @Req() req: Request, @Res() res: Response) {

    try {

      let fileName = `user_avatar_${Math.ceil(Date.now() * Math.random())}.${img.mimetype.split("/")[1]}`
      writeFileSync(`public/img/${fileName}`, img.buffer)
      let user = await this.userService.findById(Number(req.params.userId))
      let { err, data } = await this.userService.update(Number(req.params.userId), {
        avatar: `img/${fileName}`
      });

      if (err) {
        throw "Lỗi CSDL"
      }
      if (user.data.avatar.includes("img/user_avatar_")) {
        unlinkSync(`./public/${user.data.avatar}`)
      }

      res.status(200).json({
        message: "Update user avatar thành công!",
        data,
        token: token.createToken(data)
      })
    } catch (err) {
      res.status(500).json({
        message: err ? [err] : ["Lỗi Server!"]
      })
    }
  }
  @Patch('/change-password/:userId')
  async changePass(@Req() req: RequestToken, @Body() body: ChangePassDTO, @Res() res: Response) {
    try {
      let userId = req.params.userId
      if (!compareSync(body.oldPassword, req.tokenData.password)) {
        throw {
          message: "Password incorret!"
        }


      }
      let updatedUser = await this.userService.update(Number(userId), { password: hashSync(body.newPassword, 10) })
      if (updatedUser.err) {
        throw {
          message: "Lỗi CSDL"
        }
      }

      res.status(200).json({
        message: "Update password user OK!",
        data: updatedUser.data,
        token: token.createToken(updatedUser.data)
      })
    } catch (err) {
      res.status(500).json({
        message: err.message ? [err.message] : ["Lỗi Server!"]
      })
    }
  }
  @Patch('/change-email/:userId')
  async changeEmail(@Req() req: RequestToken, @Body() body: ChangeEmailDTO, @Res() res: Response) {
    try {
      let userId = req.params.userId
      let user = await this.userService.findById(Number(userId))
      if (user.data.email == "changing") {
        throw {
          message: "Email change is in progress, please try again in 5 minutes!"
        }
      }

      if (body.oldEmail != req.tokenData.email) {
        throw {
          message: "Email incorret!"
        }
      }
      let userFindByEmail = await this.userService.findByEmail(body.newEmail)
      if (userFindByEmail.data) {
        throw {
          message: "Email already exists!"
        }
      }
      await this.mailService.sendMail(body.oldEmail, 'Xác nhận thay đổi địa chỉ Email!',
        `
      <h3>Xác nhận thay đổi địa chỉ email cho tài khoản ${req.tokenData.userName}</h3>
      <p>Xin chào ${req.tokenData.firstName ? req.tokenData.firstName : req.tokenData.userName} ${req.tokenData.lastName ? req.tokenData.lastName : ""}, 
      đây là email xác thực thay đổi địa chỉ email, vui lòng click vào link phía dưới để xác nhận!</p>
      <p>Liên kết có thời hạn 5 phút.</p>
      <a href="${process.env.SV_API}/user/change_old_email/${util.token.createToken({
          ...user.data
        }, String(5 * 60 * 1000))}">Xác nhận!</a>
      `)
      let countdown = 60; //300s 5 phút
      let shouldStop = false;
      const intervalId = setInterval(async () => {
        // Kiểm tra nếu đếm ngược đã đạt 0
        try {
          if (countdown <= 0) {
            clearInterval(intervalId);
            let user = await this.userService.update(req.tokenData.id, {
              email: body.oldEmail
            })
          } else if (shouldStop) {
            clearInterval(intervalId);
            let res = await this.userService.findById(req.tokenData.id)
            await this.mailService.sendMail(body.newEmail, 'Xác nhận Email mới!',
              `
        <h3>Xác nhận Email mới cho tài khoản ${req.tokenData.userName}</h3>
        <p>Xin chào ${req.tokenData.firstName ? req.tokenData.firstName : req.tokenData.userName} ${req.tokenData.lastName ? req.tokenData.lastName : ""}, 
        đây là email xác nhận thay đổi địa chỉ email, vui lòng click vào link phía dưới để xác nhận!</p>
        <p>Liên kết có thời hạn 5 phút.</p>
        <a href="${process.env.SV_API}/user/change_new_email?token=${util.token.createToken({
                ...res.data
              }, String(5 * 60 * 1000))}&&new-email=${body.newEmail}">Xác nhận!</a>
        `)
            let remainingTime = 60; // 300s (5 phút)
            let shouldStopCountdown = false;
            const customIntervalId = setInterval(async () => {
              try {
                if (remainingTime <= 0) {
                  clearInterval(customIntervalId);
                  let userUpdate = await this.userService.update(req.tokenData.id, {
                    email: body.oldEmail
                  });
                } else if (shouldStopCountdown) {
                  clearInterval(customIntervalId);
                } else {
                  let userFind = await this.userService.findById(req.tokenData.id);
                  if (userFind.data.email == body.newEmail) {
                    shouldStopCountdown = true;
                  }
                  remainingTime -= 5;
                }
              } catch (err) {
                clearInterval(customIntervalId);
              }

            }, 5000);
          } else {
            if (user.data.email != "changing") {
              let res = await this.userService.findById(req.tokenData.id)
              if (res.data.email == "changing") {
                shouldStop = true;
              }
            }
            countdown -= 5;
          }
        } catch (err) {
          clearInterval(intervalId);
        }

      }, 5000)
      res.status(200).json({
        message: "We have sent you a change confirmation email, please check your old email then the new email to confirm!",
      })
    } catch (err) {
      res.status(500).json({
        message: err.message ? [err.message] : ["Lỗi Server!"]
      })
    }
  }

  @Get('/change_old_email/:token')
  async changeOldEmail(@Req() req: RequestToken, @Res() res: Response) {
    try {
      let { data, err } = await this.userService.update(req.tokenData.id, {
        email: "changing"
      })
      if (err) {
        throw {
          message: "Xác thực thay đổi email cũ thất bại!"
        }
      }
      return res.status(200).send("Xác thực thay đổi email cũ thành công!")
    } catch (err) {
      return res.status(500).send(`${err.message ? err.message : "Lỗi hệ thống, vui lòng thử lại sau!"}`)
    }
  }
  @Get('/reissue-password/:token')
  async changePassByEmail(@Req() req: RequestToken, @Res() res: Response) {
    try {
      let NewPassword = String(Math.floor(Date.now() * Math.random()))
      let { data, err } = await this.userService.update(req.tokenData.id, {
        password: hashSync(NewPassword, 10)
      })
      if (err) {
        throw {
          message: "Xác thực lấy lại mật khẩu thất bại!"
        }
      }
      return res.status(200).send(`Đây là mật khẩu mới của bạn : "${NewPassword}", vui lòng thực hiện thay đổi sau khi đăng nhập!`)
    } catch (err) {
      return res.status(500).send(`${err.message ? err.message : "Lỗi hệ thống, vui lòng thử lại sau!"}`)
    }
  }
  @Get('/change_new_email')
  async changeNewEmail(@Req() req: RequestToken, @Res() res: Response) {
    try {
      let newEmail = req.query['new-email']

      let { data, err } = await this.userService.update(req.tokenData.id, {
        email: String(newEmail)
      })
      if (err) {
        throw {
          message: "Xác thực email mới thất bại!"
        }
      }
      return res.status(200).send("Xác thực email mới thành công!")
    } catch (err) {
      console.log('err123', err);

      return res.status(500).send(`${err.message ? err.message : "Lỗi hệ thống, vui lòng thử lại sau!"}`)
    }
  }
  @Get('/get-count')
  async getUserCount(@Req() req: Request, @Res() res: Response) {
    try {
      let { err, data } = await this.userService.getUserCount()

      if (err) {
        throw "Lỗi CSDL"
      }

      res.status(200).json({
        message: "Get user thành công!",
        data: {
          userCount: data
        }
      })
    } catch (err) {
      res.status(500).json({
        message: err ? [err] : ["Lỗi Server!"]
      })
    }
  }
  @Get('/getByAdmin/:id')
  async getUserByIdByAdmin(@Req() req: Request, @Res() res: Response) {
    try {
      let { err, data } = await this.userService.findById(Number(req.params.id))

      if (err) {
        throw "Lỗi CSDL"
      }

      res.status(200).json({
        message: "Get user thành công!",
        data: {
          ...data
        }
      })
    } catch (err) {
      res.status(500).json({
        message: err ? [err] : ["Lỗi Server!"]
      })
    }
  }
  @Get('/:id')
  async getProductById(@Req() req: Request, @Res() res: Response) {
    try {
      let { err, data } = await this.userService.findById(Number(req.params.id))

      if (err) {
        throw "Lỗi CSDL"
      }

      res.status(200).json({
        message: "Get user thành công!",
        data: {
          ...data
        }
      })
    } catch (err) {
      res.status(500).json({
        message: err ? [err] : ["Lỗi Server!"]
      })
    }
  }
  @Get('/')
  async findMany(@Req() req: Request, @Res() res: Response) {
    try {
      let { err, data } = await this.userService.findMany()

      if (err) {
        throw "Lỗi CSDL"
      }

      res.status(200).json({
        message: "Get user thành công!",
        data
      })
    } catch (err) {
      res.status(500).json({
        message: err ? [err] : ["Lỗi Server!"]
      })
    }
  }
  @Patch('/payment/:userId')
  async payment(@Req() req: RequestToken, @Body() body: any, @Res() res: Response) {
    try {
      let userId = req.params.userId
      if (req.tokenData.id != userId) {
        throw {
          message: 'Authentication of account information failed'
        }
      }
      if (body.wallet) {
        if (body.wallet > req.tokenData.wallet) {
          throw {
            message: 'Payment order failed'
          }
        }
      }
      if (req.tokenData.wallet < Number(body.amount)) {
        throw {
          message: "The amount in the account is not enough to pay, please top up!"
        }
      }
      let { err, data } = await this.userService.update(Number(userId), { wallet: req.tokenData.wallet - Number(body.amount) })
      if (err) {
        throw {
          message: "Lỗi CSDL"
        }
      }

      res.status(200).json({
        message: "Update user thành công!",
        data,
        token: token.createToken(data)
      })
    } catch (err) {
      res.status(500).json({
        message: err.message ? [err.message] : ["Lỗi Server!"]
      })
    }
  }
  @Patch('/updateByAdmin/:userId')
  async updateByAdmin(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      let userId = req.params.userId
      let { err, data } = await this.userService.update(Number(userId), { ...body })
      if (err) {
        throw {
          message: "Lỗi CSDL"
        }
      }

      res.status(200).json({
        message: "Update user thành công!",
        data,
        token: token.createToken(data)
      })
    } catch (err) {
      res.status(500).json({
        message: err.message ? [err.message] : ["Lỗi Server!"]
      })
    }
  }
  @Patch('/:userId')
  async update(@Req() req: RequestToken, @Body() body: UpdateUserDto, @Res() res: Response) {
    try {
      let userId = req.params.userId
      if (req.tokenData.id != userId) {
        throw {
          message: 'Authentication of account information failed'
        }
      }
      if (body.wallet) {
        if (body.wallet > req.tokenData.wallet) {
          throw {
            message: 'Payment order failed'
          }
        }
      }
      let { err, data } = await this.userService.update(Number(userId), { ...body })
      if (err) {
        throw {
          message: "Lỗi CSDL"
        }
      }

      res.status(200).json({
        message: "Update user thành công!",
        data,
        token: token.createToken(data)
      })
    } catch (err) {
      res.status(500).json({
        message: err.message ? [err.message] : ["Lỗi Server!"]
      })
    }
  }

}
