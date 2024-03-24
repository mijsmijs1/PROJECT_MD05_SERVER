import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength, Validate } from "class-validator";

export class ChangeEmailDTO {

    @IsEmail()
    @IsNotEmpty()
    @IsString()
    oldEmail: string
    @IsEmail()
    @IsNotEmpty()
    @IsString()
    newEmail: string

}