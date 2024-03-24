import { IsNotEmpty, Length } from "class-validator"

export class MemberLoginDto {
    @Length(6, 15)
    loginId: string
    @IsNotEmpty()
    password: string
}