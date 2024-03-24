import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoginSocketService {
    constructor(private prisma: PrismaService) { }
    async findLogMany() {
        try {
            let logs = await this.prisma.log.findMany({
                include: {
                    member: true
                }
            });
            return {
                data: logs
            }
        } catch (err) {
            return {
                err
            }
        }
    }

    async createLog(data: any) {
        try {
            let log = await this.prisma.log.create({
                data,
                include: {
                    member: true
                }
            });
            return {
                data: log
            }
        } catch (err) {
            return {
                err
            }
        }
    }

    async findMemberMany() {
        try {
            let menbers = await this.prisma.member.findMany({
            });
            return {
                data: menbers
            }
        } catch (err) {
            return {
                err
            }
        }
    }
}
