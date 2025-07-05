import { z } from 'zod';

// Zod schema for scraper configuration
export const ScraperConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  model: z.string().default('gemini-1.5-flash'),
  maxTokens: z.number().min(1).max(8192).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(0.8),
  topK: z.number().min(1).max(40).default(40),
});

// Zod schema for scraping request
export const ScrapingRequestSchema = z.object({
  url: z.string().url('Valid URL is required'),
  selectors: z.array(z.string()).optional(),
  extractData: z.record(z.string(), z.string()).optional(),
  instructions: z.string().optional(),
  timeout: z.number().min(1000).max(30000).default(10000),
});

// Zod schema for scraping response
export const ScrapingResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.unknown()).optional(),
  rawContent: z.string().optional(),
  error: z.string().optional(),
  metadata: z.object({
    url: z.string(),
    timestamp: z.string(),
    processingTime: z.number(),
    modelUsed: z.string(),
  }).optional(),
});

// Zod schema for product extraction
export const ProductExtractionSchema = z.object({
  name: z.string().optional(),
  price: z.number().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  category: z.string().optional(),
  inStock: z.boolean().optional(),
  sku: z.string().optional(),
  brand: z.string().optional(),
});

// TypeScript interfaces derived from Zod schemas
export type ScraperConfig = z.infer<typeof ScraperConfigSchema>;
export type ScrapingRequest = z.infer<typeof ScrapingRequestSchema>;
export type ScrapingResponse = z.infer<typeof ScrapingResponseSchema>;
export type ProductExtraction = z.infer<typeof ProductExtractionSchema>;

// Additional types for the scraper system
export interface ScraperState {
  isScraping: boolean;
  progress: number;
  currentUrl: string | null;
  error: string | null;
  lastResult: ScrapingResponse | null;
}

export interface ScrapingTemplate {
  id: string;
  name: string;
  description: string;
  url: string;
  selectors: Record<string, string>;
  instructions: string;
  category: 'product' | 'content' | 'data' | 'custom';
}

export interface ScrapingHistory {
  id: string;
  url: string;
  timestamp: string;
  success: boolean;
  dataSize: number;
  processingTime: number;
  template?: string;
}

// Gemini API specific types
export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

// Error types
export type ScraperError = 
  | 'API_KEY_MISSING'
  | 'INVALID_URL'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'PARSE_ERROR'
  | 'GEMINI_API_ERROR'
  | 'UNKNOWN_ERROR';

export interface ScraperErrorDetails {
  type: ScraperError;
  message: string;
  code?: string;
  url?: string;
}

// Validation result type
export interface ScraperValidationResult {
  success: boolean;
  errors: Record<string, string>;
}

// Default configurations
export const defaultScraperConfig: ScraperConfig = {
  apiKey: '',
  model: 'gemini-1.5-flash',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
};

export const defaultScrapingRequest: ScrapingRequest = {
  url: '',
  selectors: [],
  extractData: {},
  instructions: '',
  timeout: 10000,
};

// Predefined scraping templates
export const defaultScrapingTemplates: ScrapingTemplate[] = [
  {
    id: 'product-page',
    name: 'Product Page Scraper',
    description: 'Extract product information from e-commerce pages',
    url: '',
    selectors: {
      name: 'h1, .product-title, .product-name',
      price: '.price, .product-price, [data-price]',
      description: '.description, .product-description, .details',
      image: 'img[src*="product"], .product-image img',
      category: '.category, .breadcrumb, .product-category',
    },
    instructions: 'Extract product information including name, price, description, image, and category. Return the data in JSON format.',
    category: 'product',
  },
  {
    id: 'content-scraper',
    name: 'Content Scraper',
    description: 'Extract general content from web pages',
    url: '',
    selectors: {
      title: 'h1, h2, .title, .headline',
      content: 'p, .content, .text, article',
      images: 'img',
      links: 'a[href]',
    },
    instructions: 'Extract the main content, title, images, and links from the page. Return structured data.',
    category: 'content',
  },
  {
    id: 'data-table',
    name: 'Data Table Scraper',
    description: 'Extract tabular data from web pages',
    url: '',
    selectors: {
      table: 'table, .table, .data-table',
      rows: 'tr',
      cells: 'td, th',
    },
    instructions: 'Extract all tabular data and convert it to a structured format. Preserve headers and data relationships.',
    category: 'data',
  },
]; 