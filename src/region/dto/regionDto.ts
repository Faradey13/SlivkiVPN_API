import { ApiProperty } from '@nestjs/swagger';

export class createRegionDto {
  @ApiProperty({ description: 'название региона', example: 'Германия' })
  region_name: string;

  @ApiProperty({ description: 'название региона english', example: 'GERMANY' })
  region_name_eng: string;

  @ApiProperty({ description: 'url для подключения', example: 'https//...' })
  apiUrl: string;

  @ApiProperty({ description: 'секретный ключ', example: 'FDsfsdf8s7dsf' })
  fingerprint: string;

  @ApiProperty({ description: 'флаг региона', example: '🇩🇪' })
  flag: string;
}

export class createRegionResponseDto extends createRegionDto {
  @ApiProperty({ description: 'id региона', example: 1 })
  id: string;
}
