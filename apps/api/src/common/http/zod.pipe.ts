import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodTypeAny, z } from 'zod';

/**
 * Validates and coerces a request payload with a Zod schema.
 *
 * A ZodError propagates to AllExceptionsFilter, which renders it as a 422 with
 * per-field messages the admin forms can display inline.
 */
@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata): z.infer<T> {
    return this.schema.parse(value ?? {});
  }
}

/** Shorthand: `@Body(zodBody(contactFormSchema)) body: ContactFormInput`. */
export function zodBody<T extends ZodTypeAny>(schema: T): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}

/** Shorthand for query strings, which arrive as strings and need coercion. */
export function zodQuery<T extends ZodTypeAny>(schema: T): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}
