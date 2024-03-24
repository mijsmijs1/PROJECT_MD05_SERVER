import { Body, Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { Request, Response } from "express"
import { RequestToken } from 'src/common/interface';
import { ProductStatus } from '@prisma/client';
@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) { }
  @Post("/add-to-cart")
  async createUser(@Body() body: any, @Req() req: RequestToken, @Res() res: Response) {
    try {
      let { status, data, message } = await this.receiptService.addToCart(body, Number(req.tokenData.id))
      if (!status) {
        throw {
          message
        }
      }
      return res.status(200).json({
        data,
        message
      })

    } catch (err) {
      return res.status(500).json({
        message: err.message ? [err.message] : ["loi sever"]
      })


    }

  }
  @Get('/:id')
  async findManyByUserId(@Req() req: Request, @Res() res: Response) {
    try {
      let { err, data } = await this.receiptService.findManyByUserId(Number(req.params.id))
      const activeReceipts = [{
        ...data[0], detail: data[0].detail.filter(detail => detail.products.status === ProductStatus.active)
      }];
      if (err) {
        throw "Lỗi CSDL"
      }

      res.status(200).json({
        message: "Get user thành công!",
        data: activeReceipts
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
      let { err, data } = await this.receiptService.findMany()

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

  @Delete('/:itemId')
  async delete(@Req() req: Request, @Res() res: Response) {
    try {
      let { err, data } = await this.receiptService.delete(Number(req.params.itemId))

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


}
