import { IsNotEmpty } from "class-validator";

export class userLoginDTO {
    @IsNotEmpty()
    loginInfo: string
    @IsNotEmpty()
    password: string

}