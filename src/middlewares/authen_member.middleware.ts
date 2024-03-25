import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { RequestToken } from 'src/common/interface';
import { PrismaService } from 'src/modules/prisma/prisma.service';

import { member } from '@prisma/client'
import { token } from 'src/utils/token';
@Injectable()
export class TokenAuthenMiddleware implements NestMiddleware {

  constructor(private prisma: PrismaService) { }

  async use(req: RequestToken, res: Response, next: NextFunction) {
    try {
      let tokenCode = (req.headers?.tokenmember ? String(req.headers?.tokenmember) : String(req.params.tokenMember));
      if (tokenCode == "undefined" || tokenCode == "null") {
        tokenCode = String(req.query?.tokenMember)
      }
      console.log('token', tokenCode);


      if (!tokenCode) return res.status(413).json({
        message: "Xác thực thất bại!"
      })

      let tokenData = token.decodeToken(tokenCode)
      req.tokenData = tokenData;
      console.log('token', tokenData);
      let member = await this.prisma.member.findUnique({
        where: {
          id: (tokenData as member).id
        }
      })

      if (!member) throw false

      if (member.updateTime != (tokenData as member).updateTime) throw false

      next();
    } catch (err) {
      console.log(err);
      return res.status(413).json({
        message: "Xác thực thất bại!"
      })
    }
  }
}
