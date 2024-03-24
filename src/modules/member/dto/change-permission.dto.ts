import { IsNotEmpty } from "class-validator";

export class ChangePermissionDTO {
    @IsNotEmpty()
    permission: string
}