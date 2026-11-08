import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { MediaType } from '../../generated/prisma/client.js';

export class MediaDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: MediaType }) type: MediaType;
  @ApiProperty() mimeType: string;
  @ApiProperty({ description: 'Tamanho em bytes' }) size: number;
  @ApiProperty({ example: '/uploads/3f1c….jpg' }) url: string;
  @ApiProperty({ description: 'Em quantos itens de playlist a mídia aparece' }) usageCount: number;
  @ApiProperty() createdAt: Date;
}

export class RenameMediaDto {
  @ApiProperty({ example: 'Promoção de verão' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'O nome não pode ficar vazio' })
  @MaxLength(120, { message: 'Use no máximo 120 caracteres' })
  name: string;
}

export class UploadLimitsDto {
  @ApiProperty() maxUploadMb: number;
  @ApiProperty() maxFilesPerRequest: number;
  @ApiProperty({ type: [String] }) mimeTypes: string[];
  @ApiProperty({ type: [String] }) extensions: string[];
}

export class MediaInUseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}
