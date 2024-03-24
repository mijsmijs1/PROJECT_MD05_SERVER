import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength, Validate } from "class-validator";

export class ChangePassDTO {
    @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(12, { message: 'Password must not be longer than 12 characters' })
    @Matches(/^[^\s]+$/, { message: 'Password cannot contain spaces' })
    newPassword: string
    @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(12, { message: 'Password must not be longer than 12 characters' })
    @Matches(/^[^\s]+$/, { message: 'Password cannot contain spaces' })
    oldPassword: string
}