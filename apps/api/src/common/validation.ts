import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/** Junta as mensagens de erros aninhados sem o prefixo "items.0." do class-validator. */
export function flattenValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...flattenValidationErrors(error.children ?? []),
  ]);
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException([...new Set(flattenValidationErrors(errors))]),
  });
}
