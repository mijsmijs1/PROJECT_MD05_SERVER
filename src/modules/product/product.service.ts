import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createProductDTO } from './dto/create_product.dto';
import { AvailableStatus, ProductStatus } from '@prisma/client';
import * as unorm from 'unorm';
import * as schedule from 'node-schedule';
import { error } from 'console';
import { unlinkSync } from 'fs';
@Injectable()
export class ProductService {
    constructor(private readonly primaService: PrismaService) {
        // Tạo lịch chạy vào lúc 0 giờ mỗi ngày
        const job = schedule.scheduleJob('0 0 * * *', async () => {
            // Đặt ở đây các dòng lệnh bạn muốn chạy vào lúc 0 giờ mỗi ngày
            // Ví dụ:
            try {
                let allProduct = await this.primaService.product.findMany({
                    where: {
                        moderationStatus: AvailableStatus.active,
                        priorityStatus: AvailableStatus.active
                    },
                    select: {
                        id: true,
                        priorityTimeLine: true,
                        postAt: true
                    }
                });
                for (let i of allProduct) {
                    if (!i.postAt || i.postAt == 'not update') {
                        continue
                    }
                    if (Number(Date.now()) - Number(i.postAt) > 3 * 30 * 24 * 60 * 60 * 1000) {
                        let product = await this.primaService.product.update({
                            where: {
                                id: i.id
                            },
                            data: {
                                status: ProductStatus.done,
                                postAt: 'not update',
                                priorityStatus: AvailableStatus.inactive,
                                priorityTimeLine: 'not update'
                            }
                        })
                        if (product) {
                            if (product.videoUrl.includes("video/product_video_")) {
                                unlinkSync(`./public/${product.videoUrl}`)
                            }
                        }
                        
                        continue
                    }
                    if (!i.priorityTimeLine || i.priorityTimeLine == 'not update') {
                        continue
                    }
                    if (Number(Date.now()) - Number(i.priorityTimeLine) > 15 * 24 * 60 * 60 * 1000) {
                        await this.primaService.product.update({
                            where: {
                                id: i.id
                            },
                            data: {
                                priorityStatus: AvailableStatus.inactive,
                                priorityTimeLine: 'not update'
                            }
                        })
                    }
                }

            } catch (error) {
                console.error('Error updating product status:', error);
            }
        });
    }
    async create(productData: createProductDTO) {
        try {
            let product = await this.primaService.product.create({
                data: productData
            })
            return {
                data: product
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async createImg(img: any) {
        try {
            let product = await this.primaService.img.create({
                data: img
            })
            return {
                data: product
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async deleteImg(id: number) {
        try {
            let imgs = await this.primaService.img.delete({
                where: {
                    id
                }
            })
            return {
                data: imgs
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async update(productId: any, videoUrl: any) {
        try {
            let product = await this.primaService.product.update({
                where: {
                    id: productId
                },
                data: {
                    ...videoUrl,
                    updateAt: String(Date.now())
                }
            })
            return {
                data: product
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async get(page: number) {
        try {

            let startIndex = 0; // Bắt đầu từ sản phẩm thứ 18
            let endIndex = 18; // Kết thúc ở sản phẩm thứ 36
            if (page > 1) {
                startIndex = 18 * (page - 1)
                endIndex = 18 * page
            }
            let product = await this.primaService.product.findMany({
                where: {
                    status: ProductStatus.active,
                    moderationStatus: AvailableStatus.active
                },
                include: {
                    imgs: true
                },
                take: 18, // Số lượng sản phẩm cần lấy
                skip: startIndex // Bỏ qua số lượng sản phẩm cần bắt đầu từ
            })
            return {
                data: product
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async getReviewing() {
        try {
            let product = await this.primaService.product.findMany({
                where: {
                    status: ProductStatus.inactive,
                    moderationStatus: AvailableStatus.inactive
                },
                include: {
                    imgs: true
                },
                take: 18
            })
            return {
                data: product
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async getProductTotal() {
        try {
            let count = await this.primaService.product.count({
                where: {
                    status: ProductStatus.active,
                    moderationStatus: AvailableStatus.active
                }
            })
            return {
                data: count
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async getDelete() {
        try {
            let product = await this.primaService.product.findMany({
                where: {
                    status: ProductStatus.delete
                },
                include: {
                    imgs: true
                },
                take: 18
            })
            return {
                data: product
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async getById(id: number) {
        try {
            let product = await this.primaService.product.findUnique({
                where: {
                    id: id
                },
                include: {
                    imgs: true
                }
            })
            return {
                data: product
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async getStatusCount(id: number) {
        try {
            let products = [];
            if (id != -1) {
                products = await this.primaService.product.findMany({
                    where: {
                        userId: id
                    },
                    select: {
                        id: true,
                        status: true
                    }
                })
            } else {
                products = await this.primaService.product.findMany({
                    select: {
                        id: true,
                        status: true
                    }
                })
            }

            let activeProductCount = 0;
            let waitingProductCount = 0;
            let doneProductCount = 0;
            let refusedProductCount = 0;
            let hiddenProductCount = 0;
            for (let i of products) {
                if (i.status == ProductStatus.active) {
                    activeProductCount += 1
                }
                if (i.status == ProductStatus.inactive) {
                    waitingProductCount += 1
                }
                if (i.status == ProductStatus.deny) {
                    refusedProductCount += 1
                }
                if (i.status == ProductStatus.delete) {
                    hiddenProductCount += 1
                }
                if (i.status == ProductStatus.done) {
                    doneProductCount += 1
                }
            }
            return {
                data: {
                    activeProductCount,
                    waitingProductCount,
                    doneProductCount,
                    refusedProductCount,
                    hiddenProductCount,
                }
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async getProductByUserId(userId: number, status: string, page: number) {
        try {
            let product = [];
            let startIndex = 0; // Bắt đầu từ sản phẩm thứ 18
            let endIndex = 18; // Kết thúc ở sản phẩm thứ 36
            if (page > 1) {
                startIndex = 18 * (page - 1)
                endIndex = 18 * page
            }
            let productStatus = null;
            if (status == 'active') {
                productStatus = ProductStatus.active
            }
            if (status == 'inactive') {
                productStatus = ProductStatus.inactive
            }
            if (status == 'done') {
                productStatus = ProductStatus.done
            }
            if (status == 'deny') {
                productStatus = ProductStatus.deny
            }
            if (status == 'delete') {
                productStatus = ProductStatus.delete
            }
            if (userId == -1) {
                product = await this.primaService.product.findMany({
                    where: {
                        status: productStatus
                    },
                    include: {
                        imgs: true
                    },
                    take: 18, // Số lượng sản phẩm cần lấy
                    skip: startIndex // Bỏ qua số lượng sản phẩm cần bắt đầu từ
                })
            } else {
                product = await this.primaService.product.findMany({
                    where: {
                        userId: userId,
                        status: productStatus
                    },
                    include: {
                        imgs: true
                    },
                    take: 18, // Số lượng sản phẩm cần lấy
                    skip: startIndex // Bỏ qua số lượng sản phẩm cần bắt đầu từ
                })
            }



            return {
                data: product
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async getByCategory(categoryCodename: string, page: number, sortBy: string, address: string) {
        try {
            let startIndex = 1;
            let endIndex = 15;
            if (page > 1) {
                startIndex = 15 * (page - 1)
                endIndex = 15 * page
            }
            let products = await this.primaService.product.findMany({
                where: {
                    status: ProductStatus.active,
                    moderationStatus: AvailableStatus.active
                }
            });
            let category = await this.primaService.category.findFirst({
                where: {
                    codeName: categoryCodename
                },
                include: {
                    branches: true
                }
            })

            products = products.filter(item => {
                for (let i of category.branches) {
                    if ((i as any).id == item.branchId) {
                        return item
                    }
                }
            })
            let result = [];
            if (sortBy == "none" || sortBy == "priority") {
                let priorityProducts = products.filter(item => {
                    if (item.priorityStatus == AvailableStatus.active) {
                        return item
                    }
                })
                let normalProduct = products.filter(item => {
                    if (item.priorityStatus == AvailableStatus.inactive) {
                        return item
                    }
                })
                result = [...priorityProducts, ...normalProduct]
            } else if (sortBy == 'time') {
                result = [...products.sort((a, b) => Number(b.postAt) - Number(a.postAt))]
            } else if (sortBy == 'price-highToLow') {
                result = [...products.sort((a, b) => Number(a.price) - Number(b.price))]
            } else if (sortBy == 'price-lowToHigh') {
                result = [...products.sort((a, b) => Number(b.price) - Number(a.price))]
            }
            if (address != "none") {
                result = [...result.filter((product) =>
                    product.address.split("&&")[product.address.split("&&").length - 1] == address
                )]
            }
            // product.name.includes(keyWord)
            result = [...result].slice(startIndex - 1, endIndex - 1)
            return {
                data: {
                    products: result,
                    totalNumber: products.length
                }
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async getByBranch(branchCodename: string, page: number, sortBy: string, address: string) {
        try {
            let startIndex = 1;
            let endIndex = 15;
            if (page > 1) {
                startIndex = 15 * (page - 1)
                endIndex = 15 * page
            }
            let branch = await this.primaService.branch.findFirst({
                where: {
                    codeName: branchCodename
                }
            })
            let products = await this.primaService.product.findMany({
                where: {
                    status: ProductStatus.active,
                    moderationStatus: AvailableStatus.active,
                    branchId: branch.id
                }
            });

            let result = [];
            if (sortBy == "none" || sortBy == "priority") {
                let priorityProducts = products.filter(item => {
                    if (item.priorityStatus == AvailableStatus.active) {
                        return item
                    }
                })
                let normalProduct = products.filter(item => {
                    if (item.priorityStatus == AvailableStatus.inactive) {
                        return item
                    }
                })
                result = [...priorityProducts, ...normalProduct]
            } else if (sortBy == 'time') {
                result = [...products.sort((a, b) => Number(b.postAt) - Number(a.postAt))]
            } else if (sortBy == 'price-highToLow') {
                result = [...products.sort((a, b) => Number(a.price) - Number(b.price))]
            } else if (sortBy == 'price-lowToHigh') {
                result = [...products.sort((a, b) => Number(b.price) - Number(a.price))]
            }
            if (address != "none") {
                result = [...result.filter((product) =>
                    product.address.split("&&")[product.address.split("&&").length - 1] == address
                )]
            }
            // product.name.includes(keyWord)
            result = [...result].slice(startIndex - 1, endIndex - 1)
            return {
                data: {
                    products: result,
                    totalNumber: products.length
                }
            }
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async getByKeyWord(keyWord: string, categoryCodeName: string) {
        try {
            let products = []
            if (categoryCodeName == 'all') {
                products = await this.primaService.product.findMany({
                    where: {
                        status: ProductStatus.active,
                        moderationStatus: AvailableStatus.active
                    },
                    select: {
                        id: true,
                        name: true,
                        branchId: true
                    }
                });
            } else {
                products = await this.primaService.product.findMany({
                    where: {
                        status: ProductStatus.active,
                        moderationStatus: AvailableStatus.active
                    },
                    select: {
                        id: true,
                        name: true,
                        branchId: true
                    }
                });
                let category = await this.primaService.category.findFirst({
                    where: {
                        codeName: categoryCodeName
                    },
                    include: {
                        branches: true
                    }
                })

                products = products.filter(item => {
                    for (let i of category.branches) {
                        if ((i as any).id == item.branchId) {
                            return item
                        }
                    }
                })
            }

            let filteredProducts: any = ""
            let nomalString = unorm.nfd(keyWord).replace(/[\u0300-\u036f]/g, "")
            if (nomalString == keyWord) {
                filteredProducts = products.filter((product) =>

                    unorm.nfd(product.name).replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().includes(keyWord.toLocaleLowerCase())
                );
            } else {
                filteredProducts = products.filter((product) =>

                    product.name.toLocaleUpperCase().includes(keyWord.toLocaleUpperCase()) || product.name.toLocaleLowerCase().includes(keyWord.toLocaleLowerCase())
                );
            }
            // product.name.includes(keyWord)

            return {
                data: filteredProducts,
            };
        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
    async getByKeyWordFull(keyWord: string, codeName: string, page: number, sortBy: string, address: string) {
        try {
            let result = [];
            let startIndex = 1;
            let endIndex = 15;
            if (page > 1) {
                startIndex = 15 * (page - 1)
                endIndex = 15 * page
            }
            let products = []
            if (codeName == 'all') {
                products = await this.primaService.product.findMany({
                    where: {
                        status: ProductStatus.active,
                        moderationStatus: AvailableStatus.active
                    },
                });
            } else {
                products = await this.primaService.product.findMany({
                    where: {
                        status: ProductStatus.active,
                        moderationStatus: AvailableStatus.active
                    }
                });
                let category = await this.primaService.category.findFirst({
                    where: {
                        codeName
                    },
                    include: {
                        branches: true
                    }
                })

                products = products.filter(item => {
                    for (let i of category.branches) {
                        if ((i as any).id == item.branchId) {
                            return item
                        }
                    }
                })
            }


            if (products) {
                let filteredProducts: any = ""
                let nomalString = unorm.nfd(keyWord).replace(/[\u0300-\u036f]/g, "")
                if (nomalString == keyWord) {
                    filteredProducts = products.filter((product) =>

                        unorm.nfd(product.name).replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().includes(keyWord.toLocaleLowerCase())
                    );
                } else {
                    filteredProducts = products.filter((product) =>

                        product.name.toLocaleUpperCase().includes(keyWord.toLocaleUpperCase()) || product.name.toLocaleLowerCase().includes(keyWord.toLocaleLowerCase())
                    );
                }

                if (sortBy == "none" || sortBy == "priority") {
                    let priorityProducts = filteredProducts.filter(item => {
                        if (item.priorityStatus == AvailableStatus.active) {
                            return item
                        }
                    })
                    let normalProduct = filteredProducts.filter(item => {
                        if (item.priorityStatus == AvailableStatus.inactive) {
                            return item
                        }
                    })
                    result = [...priorityProducts, ...normalProduct]
                } else if (sortBy == 'time') {
                    result = [...filteredProducts.sort((a, b) => Number(b.postAt) - Number(a.postAt))]
                } else if (sortBy == 'price-highToLow') {
                    result = [...filteredProducts.sort((a, b) => Number(a.price) - Number(b.price))]
                } else if (sortBy == 'price-lowToHigh') {
                    result = [...filteredProducts.sort((a, b) => Number(b.price) - Number(a.price))]
                }
                if (address != "none") {
                    result = [...result.filter((product) =>
                        product.address.split("&&")[product.address.split("&&").length - 1] == address
                    )]
                }
                // product.name.includes(keyWord)
                result = [...result].slice(startIndex - 1, endIndex - 1)
                return {
                    data: {
                        products: result || filteredProducts,
                        totalNumber: filteredProducts.length
                    }
                };
            } else {

            }

        } catch (err) {
            console.log(err);
            return {
                err
            }

        }
    }
}
