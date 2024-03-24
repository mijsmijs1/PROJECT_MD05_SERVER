import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: "UserName must be at least 6 characters long" })
  @MaxLength(18)
  name: string;

  @IsNotEmpty()
  @IsString()
  codeName: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
