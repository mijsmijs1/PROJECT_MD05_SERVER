
import { BranchService } from './branch.service';
import { Body, Controller, Get, Patch, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from "express"
import { RequestToken } from 'src/common/interface';
import { CreateBranchDto } from './dto/createBranch.dto';

@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) { }
  @Get('/all')
  async findAllCategory(@Res() res: Response) {
    try {
      let { data, err } = await this.branchService.findAllBranches()
      if (err) {
        throw {
          message: "Lỗi cơ sở dữ liệu!"
        }
      }
      return res.status(200).json({
        data
      })
    } catch (err) {
      return res.status(500).json({
        message: err.message ? [err.message] : ["loi sever"]
      })
    }
  }
  @Get('/')
  async findCategory(@Res() res: Response) {
    try {
      let { data, err } = await this.branchService.findBranches()
      if (err) {
        throw {
          message: "Lỗi cơ sở dữ liệu!"
        }
      }
      return res.status(200).json({
        data
      })
    } catch (err) {
      return res.status(500).json({
        message: err.message ? [err.message] : ["loi sever"]
      })
    }
  }
  @Post('/')
  async create(@Req() req: RequestToken, @Body() body: CreateBranchDto, @Res() res: Response) {
    try {
      let { data, err } = await this.branchService.create(
        {
          ...body,
          createAt: String(Date.now()),
          updateAt: String(Date.now())
        }
      )
      if (err) {
        throw {
          message: "Lỗi cơ sở dữ liệu!"
        }
      }
      return res.status(200).json({
        data
      })
    } catch (err) {
      return res.status(500).json({
        message: err.message ? [err.message] : ["loi sever"]
      })
    }
  }
  @Patch('/:branchId')
  async update(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      let { data, err } = await this.branchService.update(Number(req.params.branchId)
        , {
          ...body,
          updateAt: String(Date.now())
        }
      )
      if (err) {
        throw {
          message: "Lỗi cơ sở dữ liệu!"
        }
      }
      return res.status(200).json({
        data
      })
    } catch (err) {
      return res.status(500).json({
        message: err.message ? [err.message] : ["loi sever"]
      })
    }
  }
}
