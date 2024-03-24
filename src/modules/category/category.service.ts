import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailableStatus } from '@prisma/client';

@Injectable()
export class CategoryService {
    constructor(
        private readonly prisma: PrismaService
    ) { }
    async findCategory() {
        try {
            let categories = await this.prisma.category.findMany({
                where: {
                    status: AvailableStatus.active
                },
                include: {
                    branches: true
                }
            })
            return {
                data: categories
            }
        } catch (err) {
            return {
                err
            }
        }
    }
    async findAllCategory() {
        try {
            let categories = await this.prisma.category.findMany({
                include: {
                    branches: true
                }
            })
            return {
                data: categories
            }
        } catch (err) {
            return {
                err
            }
        }
    }
    async create(data) {
        try {
            let category = await this.prisma.category.create({
                data
            })
            return {
                data: category
            }
        } catch (err) {
            return {
                err
            }
        }
    }
    async update(categoryId: number, data: any) {
        try {
            let category = await this.prisma.category.update({
                where: {
                    id: categoryId
                },
                data: {
                    ...data
                }
            })
            return {
                data: category
            }
        } catch (err) {
            return {
                err
            }
        }
    }
}
