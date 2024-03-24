import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer'
@Injectable()
export class MailService {
    private readonly transporter = createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_ID,
            pass: process.env.MAIL_CODE
        }
    });

    async sendMail(to: string, subject: string, html: string, from: string = process.env.MAIL_ID) {
        let mailOptions = {
            from,
            to,
            subject,
            html
        };
        return await this.transporter.sendMail(mailOptions)
    }
}
