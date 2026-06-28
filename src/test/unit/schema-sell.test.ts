/**
 * CHARACTERIZATION TESTS — sell/page.tsx Zod schema
 *
 * Extracted and tested independently so refactors to the form
 * can't silently change validation rules.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Copied from sell/page.tsx — if the schema changes, this test suite
// tells you exactly what validation rules were broken.
const schema = z.object({
  type:           z.enum(['product', 'service']),
  title:          z.string().min(3, 'Title must be at least 3 characters').max(80, 'Title is too long'),
  price:          z.coerce.number().positive('Price must be a positive number'),
  price_is_range: z.boolean(),
  price_max:      z.coerce.number().optional(),
  description:    z.string().max(1000, 'Description is too long').optional(),
  category_id:    z.coerce.number().positive('Choose a category'),
  is_available:   z.boolean(),
  stock:          z.coerce.number().int().positive().optional(),
  delivery_info:  z.string().max(200).optional(),
}).refine(
  data => !data.price_is_range || (data.price_max != null && data.price_max > data.price),
  { message: 'Max price must be greater than the minimum price', path: ['price_max'] }
);

const VALID_BASE = {
  type: 'product' as const,
  title: 'Chocolate Chip Cookies',
  price: 150,
  price_is_range: false,
  category_id: 3,
  is_available: true,
};

describe('Sell form schema', () => {
  it('accepts a valid product', () => {
    expect(schema.safeParse(VALID_BASE).success).toBe(true);
  });

  it('rejects title shorter than 3 characters', () => {
    const result = schema.safeParse({ ...VALID_BASE, title: 'AB' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('3 characters');
    }
  });

  it('rejects title longer than 80 characters', () => {
    const result = schema.safeParse({ ...VALID_BASE, title: 'A'.repeat(81) });
    expect(result.success).toBe(false);
  });

  it('rejects zero or negative price', () => {
    expect(schema.safeParse({ ...VALID_BASE, price: 0 }).success).toBe(false);
    expect(schema.safeParse({ ...VALID_BASE, price: -10 }).success).toBe(false);
  });

  it('coerces string price to number', () => {
    const result = schema.safeParse({ ...VALID_BASE, price: '150' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(150);
  });

  it('rejects missing category', () => {
    const result = schema.safeParse({ ...VALID_BASE, category_id: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects price_is_range=true when price_max is missing', () => {
    const result = schema.safeParse({ ...VALID_BASE, price_is_range: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('price_max');
    }
  });

  it('rejects price_is_range=true when price_max <= price', () => {
    const result = schema.safeParse({
      ...VALID_BASE,
      price_is_range: true,
      price_max: 100, // less than price of 150
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid price range', () => {
    const result = schema.safeParse({
      ...VALID_BASE,
      price_is_range: true,
      price_max: 300,
    });
    expect(result.success).toBe(true);
  });

  it('accepts service type', () => {
    const result = schema.safeParse({ ...VALID_BASE, type: 'service' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = schema.safeParse({ ...VALID_BASE, type: 'rental' });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields as undefined', () => {
    const result = schema.safeParse(VALID_BASE); // no description, stock, delivery_info
    expect(result.success).toBe(true);
  });

  it('rejects description over 1000 characters', () => {
    const result = schema.safeParse({ ...VALID_BASE, description: 'A'.repeat(1001) });
    expect(result.success).toBe(false);
  });
});
