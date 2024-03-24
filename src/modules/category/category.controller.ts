import { Body, Controller, Get, Patch, Post, Req, Res } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Request, Response } from "express"
import { RequestToken } from 'src/common/interface';
import { CreateCategoryDto } from './dto/createCategory.dto';
@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService
  ) { }
  @Get('/all')
  async findAllCategory(@Res() res: Response) {
    try {
      let { data, err } = await this.categoryService.findAllCategory()
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
      let { data, err } = await this.categoryService.findCategory()
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
  async create(@Req() req: RequestToken, @Body() body: CreateCategoryDto, @Res() res: Response) {
    try {
      let { data, err } = await this.categoryService.create(
        {
          ...body,
          avatar: body.avatar ? body.avatar : "https://cdn-icons-png.freepik.com/256/2652/2652218.png",
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
  @Patch('/:categoryId')
  async update(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      let { data, err } = await this.categoryService.update(Number(req.params.categoryId)
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
