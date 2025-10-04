import { z } from 'zod';

export const nameSchema = z.string().min(1, 'Required').max(120, 'Too long');
export const emailSchema = z.string().min(1, 'Required').email('Invalid email');
export const nonNegativeNumber = z
  .number({ invalid_type_error: 'Must be a number' })
  .min(0, 'Must be ≥ 0');

export const requiredString = z.string().min(1, 'Required');
export const optionalString = z.string().optional();

export const positiveNumber = z
  .number({ invalid_type_error: 'Must be a number' })
  .min(0.01, 'Must be greater than 0');

export const currency = z
  .string()
  .min(1, 'Required')
  .transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('Invalid number');
    return num;
  });

export const dateString = z
  .string()
  .min(1, 'Required')
  .transform((val) => new Date(val));
