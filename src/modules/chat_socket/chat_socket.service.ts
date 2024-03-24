import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { ChatType } from '@prisma/client';
interface Chat2  {
    id?: number;
    userId: number;
    memberId?: number;
    content: string;
    type: ChatType;
    createAt: string;
    discordChannel: string;
}

@Injectable()
export class ChatSocketService {
    constructor(private prisma: PrismaService){}

    async findHistory(userId: number) {
        try {
            let history = await this.prisma.chat.findMany({
                where: {
                    userId
                }
            })

            return {
                data: history
            }
        }catch(err) {
            return {
                err
            }
        }
    }

    async findHistoryByDiscordChannel(discordChannel: string) {
        try {
            let chat = await this.prisma.chat.findFirst({
                where: {
                    discordChannel
                }
            })

            return {
                data: chat
            }
        }catch(err) {
            return {
                err
            }
        }
    }

    async createChat(data: Chat2) {
        try {
            let newChat = await this.prisma.chat.create({
               data
            })

            return {
                data: newChat
            }
        }catch(err) {
            return {
                err
            }
        }
    }
}
