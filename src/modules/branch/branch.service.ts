import { Injectable } from '@nestjs/common';
import { AvailableStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchService {
    constructor(
        private readonly prisma: PrismaService
    ) { }
    async findBranches() {
        try {
            let branch = await this.prisma.branch.findMany({
                where: {
                    status: AvailableStatus.active
                }
            })
            return {
                data: branch
            }
        } catch (err) {
            return {
                err
            }
        }
    }
    async findAllBranches() {
        try {
            let branch = await this.prisma.branch.findMany({
            })
            return {
                data: branch
            }
        } catch (err) {
            return {
                err
            }
        }
    }
    async create(data) {
        try {
            let branch = await this.prisma.branch.create({
                data
            })
            return {
                data: branch
            }
        } catch (err) {
            return {
                err
            }
        }
    }
    async update(branchId: number, data: any) {
        try {
            let branch = await this.prisma.branch.update({
                where: {
                    id: branchId
                },
                data: {
                    ...data
                }
            })
            return {
                data: branch
            }
        } catch (err) {
            return {
                err
            }
        }
    }
}
