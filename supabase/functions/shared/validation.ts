// @deno-types="npm:zod@3.22.4"
import { z } from 'zod';

/**
 * Sanitizes input strings to prevent XSS and other injection attacks
 * @param input - The input string to sanitize
 * @returns The sanitized string
 */
export function sanitizeInput(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/['"]/g, '') // Remove quotes to prevent SQL injection
    .trim();
}

/**
 * Validates input data against a Zod schema
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns The validated data
 * @throws {Error} If validation fails
 */
export function validateInput<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw new Error(`Validation error: ${JSON.stringify(formattedError)}`);
    }
    throw error;
  }
} 