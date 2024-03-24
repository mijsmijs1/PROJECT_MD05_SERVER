import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Request, Response } from 'express'
import { UserService } from '../user/user.service';
import { WalletGateway } from './wallet.gateway';
import * as moment from 'moment';
import * as CryptoJS from "crypto-js";
import axios from 'axios';
import * as qs from 'qs';
import { token } from 'src/utils/token';
import { RequestToken } from 'src/common/interface';
@Controller('wallet')
export class WalletController {
  private config = {
    appid: "553",
    key1: "9phuAOYhan4urywHTh0ndEXiV3pKHr5Q",
    key2: "Iyz2habzyr7AG8SgvoBCbKwKi3UzlLi3",
  };
  constructor(
    private readonly walletService: WalletService,
    private readonly userService: UserService,
    private readonly walletGateway: WalletGateway) { }
  @Post("/payZaloCheck/:zaloPayReceiptId")
  async payZaloCheck(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      let transID = req.params.zaloPayReceiptId;
      let postData = {
        appid: this.config.appid,
        apptransid: transID, // Input your app_trans_id
      }
      let data1 = postData.appid + "|" + postData.apptransid + "|" + this.config.key1; // appid|app_trans_id|key1
      (postData as any).mac = CryptoJS?.HmacSHA256(data1, this.config.key1).toString();
      let postConfig = {
        method: 'post',
        url: "https://sandbox.zalopay.com.vn/v001/tpe/getstatusbyapptransid",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify(postData)
      };
      let result = await axios(postConfig);
      console.log('result', result);

      if (result.data.returncode != 1) {
        throw {
          message: "Thanh toan that bai!"
        }
      }
      let { data, err } = await this.userService.updateWallet(String(body.userName), Number(result.data.amount))
      await this.walletService.UpdateRevenue(Number(result.data.amount))
      if (!err) {
        let tokenCode = token.createToken(data)
        return res.status(200).json({
          status: true,
          amount: result.data.amount,
          token: tokenCode,
          data
        })
      }
    } catch (err) {
      console.log('err', err);
      return res.status(500).json({
        status: false,
        message: err.message || "Loi Server!"
      })
    }
  }
  @Post("/payZalo")
  async payZalo(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    try {
      const embed_data = { merchantinfo: "embeddata123" };
      const items = [{}];
      const transID = Math.floor(Math.random() * 1000000);
      const order = {
        appid: this.config.appid,
        apptransid: `${(moment()).format('YYMMDD')}_${Math.ceil(Date.now() * Math.random())}_${body.receiptId}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
        appuser: "PHUQUY",
        apptime: Date.now(), // miliseconds
        item: JSON.stringify(items),
        embeddata: JSON.stringify(embed_data),
        amount: Number(body.total),
        description: `PHUQUY.VN - Payment for the order #${transID}`,
        bankcode: "zalopayapp",
      };
      const data = this.config.appid + "|" + order.apptransid + "|" + order.appuser + "|" + order.amount + "|" + order.apptime + "|" + order.embeddata + "|" + order.item;
      (order as any).mac = (CryptoJS)?.HmacSHA256(data, this.config.key1).toString();
      let result = await axios.post("https://sandbox.zalopay.com.vn/v001/tpe/createorder", null, { params: order })
      console.log(result);
      console.log('(order as any).mac', (order as any).mac);

      if (result.data.returncode == 1) {
        return res.status(200).json({
          qrCodeUrl: result.data.orderurl,
          orderId: order.apptransid,
          message: "Tạo mã QR thành công"
        })
      } else {
        throw {
          message: "Tạo mã QR thất bại"
        }
      }

    } catch (err) {
      console.log('zalo err', err);
      return res.status(500).json({
        data: null,
        message: err.message || "Loi Server!"
      })
    }
  }
  @Post()
  async topUp(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    console.log("đã vào!")
    if (process.env.CASSO_KEY != req.headers['secure-token']) {
      console.log("key loi")
      return res.status(500).json({
        message: "err"
      })
    }
    // const spaceIndex = body.data[0].description.lastIndexOf("-");

    // // Tìm vị trí của dấu - sau số điện thoại
    // const dashIndex = body.data[0].description.indexOf(";", spaceIndex);

    // // Cắt phần tử từ vị trí khoảng trắng đến vị trí dấu -
    // const userName = body.data[0].description.substring(spaceIndex + 1, dashIndex);

    let string = String(body.data[0].description)
    let splitedString = string.split("-")
    let userName = splitedString[splitedString.length - 1]

    // let userName = String(body.data[0].description)
    console.log('userName', userName);

    let { data, err } = await this.userService.updateWallet(String(userName), body.data[0].amount)
    console.log("da vao", err);
    if (!err) {
      this.walletGateway.topUpSuccess(String(userName), data);
      await this.walletService.UpdateRevenue(body.data[0].amount)
      return res.status(200).json({
        message: "Ok"
      })
    }
  }
  @Get('/total-revenue')
  async getTotalRevenue(@Req() req: RequestToken, @Res() res: Response) {
    try {
      let { err, data } = await this.walletService.getTotalRevenue()
      if (err) {
        return {
          message: "System ERR!"
        }
      }
      const amount = data.reduce((total: any, currentValue: any) => {
        return { amount: total.amount + currentValue.amount }
      }, { amount: 0 })
      res.status(200).json({
        message: "Get Revenure thành công!",
        data: amount
      })
    } catch (err) {
      res.status(500).json({
        message: err.message ? [err.message] : ["Lỗi Server!"]
      })
    }
  }

}
