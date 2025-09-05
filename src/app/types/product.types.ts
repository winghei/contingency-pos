import { z } from 'zod';

// Zod schema for product validation
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Product name is required').max(100, 'Product name must be less than 100 characters'),
  price: z.number().positive('Price must be positive').min(0.01, 'Price must be at least €0.01'),
  image: z.string().optional().refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
    message: 'Image must be a valid URL or empty'
  }),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  category: z.string().optional(),
  inStock: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Create form schema (without id and timestamps)
export const ProductFormSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript interfaces derived from Zod schemas
export type Product = z.infer<typeof ProductSchema>;
export type ProductForm = z.infer<typeof ProductFormSchema>;

// Additional types for the POS system
export type ProductId = string;

export interface ProductListState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export interface ProductFormState {
  isOpen: boolean;
  editingProduct: Product | null;
  loading: boolean;
  error: string | null;
}

// Validation result type
export interface ValidationResult {
  success: boolean;
  errors: Record<string, string>;
}

// Default product for form initialization
export const defaultProduct: ProductForm = {
  name: '',
  price: 0,
  image: '',
  description: '',
  category: '',
  inStock: true,
}; 