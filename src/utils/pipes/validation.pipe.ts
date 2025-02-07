import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationException } from '../exceptions/validation.exception';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  constructor() {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    const obj = plainToInstance(metadata.metatype, value);

    if (typeof obj === 'string') {
      return value;
    }

    const errors = await validate(obj);

    if (errors.length) {
      const messages = errors.map((err) => {
        const constraints = Object.values(err.constraints).join(', ');
        return `${err.property} - ${constraints}`;
      });
      throw new ValidationException(messages);
    }
    return value;
  }
}
