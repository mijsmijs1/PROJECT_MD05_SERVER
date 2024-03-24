import { IsNotEmpty, Length } from "class-validator";

export class ChangePasswordDTO {
    @IsNotEmpty()
    password: string;
}