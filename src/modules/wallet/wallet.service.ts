import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) { }
    async UpdateRevenue(amount: number) {
        try {
            let data = null;
            const now = new Date();
            const currentMonth = now.getMonth() + 1; // Tháng bắt đầu từ 0, cần +1 để lấy tháng từ 1 đến 12
            const currentYear = now.getFullYear();

            // Tìm bản ghi Revenue có năm và tháng tương ứng
            let revenueRecord = await this.prisma.revenue.findFirst({
                where: {
                    month: currentMonth,
                    year: currentYear,
                },
            });

            if (!revenueRecord) {
                // Nếu không có bản ghi, tạo một bản ghi mới
                data = await this.prisma.revenue.create({
                    data: {
                        month: currentMonth,
                        year: currentYear,
                        amount: amount, // Đặt amount là 0
                        createdAt: String(Date.now())
                    },
                });
            } else {
                // Nếu có bản ghi, cập nhật bản ghi đó
                data = await this.prisma.revenue.update({
                    where: {
                        id: revenueRecord.id, // Sử dụng id để xác định bản ghi cần cập nhật
                    },
                    data: {
                        amount: {
                            increment: amount, // Cộng dồn amount mới vào amount hiện tại
                        },
                    },
                });
            }
            return {
                data
            }
        } catch (err) {
            return {
                err
            }
        }
    }
    async getTotalRevenue() {
        try {
            let data = await this.prisma.revenue.findMany({})
            return {
                data
            }
        } catch (err) {
            return {
                err
            }
        }
    }

}
