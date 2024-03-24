import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReceiptStatus } from '@prisma/client';
@Injectable()
export class ReceiptService {
    constructor(private readonly prisma: PrismaService) { }
    async addToCart(item: any, userId: any) {
        try {
            let cartExisted = await this.prisma.receipt.findMany({
                where: {
                    status: ReceiptStatus.shopping,
                    userId: userId
                },
                include: {
                    detail: {
                        include: {
                            products: true
                        }
                    }
                }
            } as any)

            //Khi user chua có receipt
            if (cartExisted.length == 0) {
                let receipt = await this.prisma.receipt.create({
                    data: {
                        createAt: String(Date.now()),
                        updateAt: String(Date.now()),
                        userId: userId,
                        deliveryAddress: "not update",
                        detail: {
                            create: [
                                {
                                    productId: item.productId
                                }
                            ]
                        }
                    },
                    include: {
                        detail: {
                            include: {
                                products: true
                            }
                        }
                    }
                } as any)
                // console.log('receipt', receipt);
                return {
                    status: true,
                    message: "add to cart ok (new cart)",
                    data: receipt
                }
            }
            else {
                // khi co gio hang
                let cart = cartExisted[0];
                let existedItem = (cart as any).detail?.find(findItem => findItem.productId === item.productId)

                if (existedItem) {
                    // await this.prisma.receipt_details.update({
                    //     where: {
                    //         id: existedItem.id
                    //     },
                    //     data: {
                    //         ...existedItem
                    //     }
                    // })
                    return {
                        status: false,
                        message: "Sản phẩm đã có trong giỏ hàng",
                        data: null
                    }
                } else {
                    await this.prisma.receipt_details.create({
                        data: {
                            productId: item.productId,
                            receiptId: cart.id
                        }
                    })
                }
                let realCart = await this.prisma.receipt.findUnique({
                    where: {
                        id: cart.id
                    },
                    include: {
                        detail: {
                            include: {
                                products: true
                            }
                        }
                    }
                })
                return {
                    status: true,
                    message: "add to cart ok ( old cart updated)",
                    data: realCart
                }
            }
        } catch (err) {
            console.log('err', err);
            return {
                status: false,
                message: "add to cart failed",
                data: null
            }
        }
    }
    async findManyByUserId(userId: number) {
        try {
            let user = await this.prisma.receipt.findMany({
                where: {
                    userId
                },
                include: {
                    detail: {
                        include: {
                            products: true
                        }
                    }
                }
            })
            if (!user) {
                throw "Reaciept không tồn tại"
            }
            return {
                data: user
            }
        } catch (err) {
            return {
                err
            }
        }
    }
    async findMany() {
        try {
            let user = await this.prisma.receipt.findMany({
                include: {
                    detail: {
                        include: {
                            products: true
                        }
                    }
                }
            })
            if (!user) {
                throw "Reaciept không tồn tại"
            }
            return {
                data: user
            }
        } catch (err) {
            return {
                err
            }
        }
    }

    async delete(id: number) {
        try {
            let result = await this.prisma.receipt_details.delete({
                where: {
                    id: id
                },
                include: {
                    products: true
                }
            })
            if (!result) {
                throw "Reaciept không tồn tại"
            }
            return {
                data: result
            }
        } catch (err) {
            return {
                err
            }
        }
    }
}
