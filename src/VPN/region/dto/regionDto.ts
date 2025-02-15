import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class createRegionDto {
  @ApiProperty({ description: 'название региона', example: 'Германия' })
  @IsString()
  region_name: string;

  @IsString()
  @ApiProperty({ description: 'название региона english', example: 'GERMANY' })
  region_name_eng: string;

  @IsString()
  @ApiProperty({ description: 'флаг региона', example: '🇩🇪' })
  flag: string;
}

export class createRegionResponseDto extends createRegionDto {
  @IsString()
  @ApiProperty({ description: 'id региона', example: 1 })
  id: string;
}
