import { Injectable, NestMiddleware, Next, Req, Res } from "@nestjs/common";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { NextFunction, Response } from 'express'
import { util } from "src/utils";
import { UserService } from "src/modules/user/user.service";
import { RequestToken } from "src/common/interface";
@Injectable()
export class UserTokenMiddleWare implements NestMiddleware {
    constructor(private readonly prisma: PrismaService, private readonly userService: UserService) { }
    async use(@Req() req: RequestToken, @Res() res: Response, @Next() next: NextFunction) {
        try {
            let tokenCode = req.params?.token ? String(req.params?.token) : String(req.headers?.token)
            if (tokenCode == "undefined") {
                tokenCode = String(req.query?.token)
            }
            if (!tokenCode) {
                throw {
                    message: "Không tìm thấy token!"
                }
            }
            let tokenData: any = util.token.decodeToken(String(tokenCode))
            if (!tokenData) {
                throw {
                    message: "Token không hợp lệ!"
                }
            }

            let { data, err } = await this.userService.findUser(tokenData.userName)
            if (err) {
                throw {
                    message: "Người dùng không tồn tại"
                }
            }
            if (data.updateAt != tokenData.updateAt) {
                throw {
                    message: "Token không hợp lệ! ERR"
                }
            }
            req.tokenData = tokenData
            next()
        } catch (err) {
            console.log(err);

            return res.status(413).json({
                message: err.message ? [err.message] : ["Xác thực thất bại, lỗi hệ thống!"]
            })
        }
    }
}