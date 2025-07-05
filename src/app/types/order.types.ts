import { z } from 'zod/v4';
import { Product } from './product.types';

// Customer schema and types
export const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Customer name is required').max(100),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  address: z.string().max(200).optional(),
  loyaltyPoints: z.number().min(0).default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

// Order item schema (product + quantity)
export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    image: z.string().optional(),
    category: z.string().optional(),
  }),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
  notes: z.string().optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

// Payment method types
export const PaymentMethodSchema = z.enum([
  'cash',
  'card',
  'digital_wallet',
  'gift_card',
  'store_credit'
]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// Payment schema
export const PaymentSchema = z.object({
  id: z.string().uuid().optional(),
  method: PaymentMethodSchema,
  amount: z.number().positive('Payment amount must be positive'),
  receivedAmount: z.number().positive('Received amount must be positive').optional(),
  changeAmount: z.number().min(0).default(0),
  reference: z.string().optional(), // Card transaction ID, etc.
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).default('pending'),
  processedAt: z.date().optional(),
});

export type Payment = z.infer<typeof PaymentSchema>;

// Order status types
export const OrderStatusSchema = z.enum([
  'draft',
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
  'refunded'
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// Main order schema
export const OrderSchema = z.object({
  id: z.string().uuid().optional(),
  orderNumber: z.string().min(1, 'Order number is required'),
  customer: CustomerSchema.optional(),
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  total: z.number().min(0),
  amountReceived: z.number().min(0).default(0),
  changeAmount: z.number().min(0).default(0),
  payments: z.array(PaymentSchema).default([]),
  status: OrderStatusSchema.default('draft'),
  check_in: z.boolean().default(false),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

// Cart item (simplified for checkout)
export const CartItemSchema = z.object({
  productId: z.string(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    image: z.string().optional(),
    category: z.string().optional(),
    inStock: z.boolean().default(true),
  }),
  quantity: z.number().min(1),
  notes: z.string().optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

// Cart state
export interface CartState {
  items: CartItem[];
  customer: Customer | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  loading: boolean;
  error: string | null;
}

// Payment state
export interface PaymentState {
  method: PaymentMethod | null;
  receivedAmount: number;
  changeAmount: number;
  processing: boolean;
  error: string | null;
}

// Checkout state
export interface CheckoutState {
  cart: CartState;
  payment: PaymentState;
  currentStep: 'cart' | 'customer' | 'payment' | 'complete';
}

// Tax configuration
export interface TaxConfig {
  rate: number; // e.g., 0.08 for 8%
  name: string; // e.g., "Sales Tax"
  included: boolean; // whether tax is included in product prices
}

// Default values
export const defaultCustomer: Partial<Customer> = {
  name: '',
  email: '',
  phone: '',
  address: '',
  loyaltyPoints: 0,
};

export const defaultCartState: CartState = {
  items: [],
  customer: null,
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  loading: false,
  error: null,
};

export const defaultPaymentState: PaymentState = {
  method: null,
  receivedAmount: 0,
  changeAmount: 0,
  processing: false,
  error: null,
};

export const defaultTaxConfig: TaxConfig = {
  rate: 0.08, // 8% sales tax
  name: 'Sales Tax',
  included: false,
};

// Utility functions for calculations
export const calculateItemTotal = (item: CartItem): number => {
  return item.product.price * item.quantity;
};

export const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + calculateItemTotal(item), 0);
};

export const calculateTax = (subtotal: number, taxRate: number): number => {
  return subtotal * taxRate;
};

export const calculateTotal = (subtotal: number, tax: number, discount: number): number => {
  return Math.max(0, subtotal + tax - discount);
};

export const calculateChange = (total: number, received: number): number => {
  return Math.max(0, received - total);
};

// Validation helpers
export const validateCartItem = (item: CartItem): { success: boolean; errors: string[] } => {
  try {
    CartItemSchema.parse(item);
    return { success: true, errors: [] };
  } catch (error: any) {
    const errors = error.errors?.map((err: any) => err.message) || ['Invalid cart item'];
    return { success: false, errors };
  }
};

export const validatePayment = (payment: Payment): { success: boolean; errors: string[] } => {
  try {
    PaymentSchema.parse(payment);
    return { success: true, errors: [] };
  } catch (error: any) {
    const errors = error.errors?.map((err: any) => err.message) || ['Invalid payment'];
    return { success: false, errors };
  }
}; 