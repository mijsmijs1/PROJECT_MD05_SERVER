import { MemberRole } from "@prisma/client";
import { IsEmail, IsNotEmpty } from "class-validator";

export class CreateMemberDTO {
    @IsNotEmpty()
    loginId: string
    @IsNotEmpty()
    role: MemberRole
    @IsNotEmpty()
    firstName: string
    @IsNotEmpty()
    lastName: string
    @IsNotEmpty()
    phoneNumber: string
    @IsEmail()
    email: string
}