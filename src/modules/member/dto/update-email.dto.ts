import { Allow, IsEmail } from "class-validator";

export class UpdateEmailDTO {
    @Allow()
    email?: string
}