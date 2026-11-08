import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const emptyToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? null : trim({ value });

export class PairScreenDto {
  @ApiProperty({ example: '482913' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @Matches(/^\d{6}$/, { message: 'O código tem 6 dígitos' })
  code: string;

  @ApiProperty({ example: 'TV da vitrine' })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Dê um nome para a tela' })
  @MaxLength(60, { message: 'Use no máximo 60 caracteres no nome' })
  name: string;

  @ApiPropertyOptional({ example: 'Loja centro' })
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  @MaxLength(80, { message: 'Use no máximo 80 caracteres no local' })
  location?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  playlistId?: string | null;
}

export class UpdateScreenDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Dê um nome para a tela' })
  @MaxLength(60, { message: 'Use no máximo 60 caracteres no nome' })
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  @MaxLength(80, { message: 'Use no máximo 80 caracteres no local' })
  location?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'null remove a playlist da tela' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  playlistId?: string | null;
}

export class ScreenPlaylistDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class ScreenDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String }) location: string | null;
  @ApiProperty({ nullable: true, type: ScreenPlaylistDto }) playlist: ScreenPlaylistDto | null;
  @ApiProperty() online: boolean;
  @ApiProperty({ nullable: true, type: Date }) lastSeenAt: Date | null;
  @ApiProperty() pairedAt: Date;
}
