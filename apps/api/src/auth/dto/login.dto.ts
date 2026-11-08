import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@loopscreen.local' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Informe um email válido' })
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'sua-senha' })
  @IsString()
  @MinLength(1, { message: 'Informe a senha' })
  @MaxLength(200)
  password: string;
}

export class AuthUserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
}

export class LoginResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty({ type: AuthUserDto }) user: AuthUserDto;
}
