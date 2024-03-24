import { MemberRole, PrismaClient } from '@prisma/client';
import { hashSync } from 'bcrypt';
const prisma = new PrismaClient();
import branches from './branch';
import categories from './category';
import product from './product';
import user from './user';
import img from './img';
(async () => {
    try {

        await prisma.category.createMany({
            data: [
                ...categories
            ]
        })
        await prisma.branch.createMany({
            data: [
                ...branches
            ]
        })
        await prisma.user.create({
            data: {
                ...user
            }
        })
        await prisma.member.create({
            data: {
                createTime: String(Date.now()),
                email: "nguyphuquy1@gmail.com",
                emailConfirm: true,
                firstLoginState: false,
                ipList: "[]",
                loginId: "master",
                password: hashSync("123", 10),
                permission: '["c:log", "r:log", "u:log","d:log", "c:member", "r:member", "u:member","d:member","c:category", "r:category", "u:category", "d:category", "c:course", "r:course", "u:course","d:course","c:carousel", "r:carousel", "u:carousel","d:carousel"]',
                phoneNumber: "0327513465",
                updateTime: String(Date.now()),
                firstName: "Thầy",
                lastName: "Phước",
                role: MemberRole.admin,
                avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmy5w2Op-iHyHnd8wR661cEL9YAuprFlHTJL8qUXZfxS_9Pvc51dBrJ94ZAhTfLD2dqVE&usqp=CAU"
            }
        })
        await prisma.product.createMany({
            data: [
                ...product
            ]
        })
        await prisma.img.createMany({
            data: [
                ...img
            ]
        })
    } catch (err) {
        console.log("da vao err", err)
    }
})()