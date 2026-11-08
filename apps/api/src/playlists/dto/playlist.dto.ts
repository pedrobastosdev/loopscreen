import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MediaDto } from '../../media/dto/media.dto.js';

export const MAX_PLAYLIST_ITEMS = 500;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreatePlaylistDto {
  @ApiProperty({ example: 'Loja – Vitrine' })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Dê um nome para a playlist' })
  @MaxLength(80, { message: 'Use no máximo 80 caracteres' })
  name: string;
}

export class PlaylistItemInputDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  mediaId: string;

  @ApiPropertyOptional({ default: 10, description: 'Segundos na tela (só para imagens)' })
  @IsOptional()
  @IsInt({ message: 'A duração precisa ser um número inteiro de segundos' })
  @Min(1, { message: 'A duração mínima é 1 segundo' })
  @Max(3600, { message: 'A duração máxima é 3600 segundos' })
  durationSec?: number;
}

export class SavePlaylistDto extends CreatePlaylistDto {
  @ApiProperty({ type: [PlaylistItemInputDto], description: 'Itens na ordem de exibição' })
  @IsArray()
  @ArrayMaxSize(MAX_PLAYLIST_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => PlaylistItemInputDto)
  items: PlaylistItemInputDto[];
}

export class PlaylistSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() itemCount: number;
  @ApiProperty({ description: 'Duração aproximada (imagens; vídeos não entram na soma)' })
  imageDurationSec: number;
  @ApiProperty() videoCount: number;
  @ApiProperty() screenCount: number;
  @ApiPropertyOptional({ type: MediaDto, nullable: true }) cover: MediaDto | null;
  @ApiProperty() updatedAt: Date;
}

export class PlaylistItemDto {
  @ApiProperty() id: string;
  @ApiProperty() order: number;
  @ApiProperty() durationSec: number;
  @ApiProperty({ type: MediaDto }) media: MediaDto;
}

export class PlaylistDetailDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() screenCount: number;
  @ApiProperty({ type: [PlaylistItemDto] }) items: PlaylistItemDto[];
  @ApiProperty() updatedAt: Date;
}
