import { Injectable, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  Product,
  ProductForm,
  ProductSchema,
  ProductFormSchema,
  ValidationResult,
} from "../types/product.types";
import { v4 as uuidv4 } from "uuid";

@Injectable({
  providedIn: "root",
})
export class ProductService {
  // Private signals for state management
  private _products = signal<Product[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _scraping = signal<boolean>(false);

  // Public readonly signals
  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly scraping = this._scraping.asReadonly();

  // Computed signals
  readonly productCount = computed(() => this._products().length);
  readonly inStockProducts = computed(() =>
    this._products().filter((product) => product.inStock)
  );
  readonly totalValue = computed(() =>
    this._products().reduce((total, product) => total + product.price, 0)
  );

  constructor(private http: HttpClient) {
    // Load products from localStorage on service initialization
    this.loadProductsFromStorage();
  }

  // Validation methods
  validateProduct(product: ProductForm): ValidationResult {
    try {
      ProductFormSchema.parse(product);
      return { success: true, errors: {} };
    } catch (error: any) {
      const errors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path.join(".");
          errors[field] = err.message;
        });
      }
      return { success: false, errors };
    }
  }

  // CRUD Operations
  async addProduct(productForm: ProductForm): Promise<Product | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Validate the product
      const validation = this.validateProduct(productForm);
      if (!validation.success) {
        const errorMessage = Object.values(validation.errors).join(", ");
        this._error.set(errorMessage);
        return null;
      }

      // Create new product with generated ID and timestamps
      const newProduct: Product = {
        ...productForm,
        id: uuidv4(),
        image: productForm.image?.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Validate the complete product
      const validatedProduct = ProductSchema.parse(newProduct);
    
      // Add to products array
      this._products.update((products) => [...products, validatedProduct]);

      // Save to localStorage
      this.saveProductsToStorage();

      return validatedProduct;
    } catch (error) {
      this._error.set("Failed to add product: " + (error as Error).message);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async updateProduct(
    id: string,
    productForm: ProductForm
  ): Promise<Product | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Validate the product
      const validation = this.validateProduct(productForm);
      if (!validation.success) {
        const errorMessage = Object.values(validation.errors).join(", ");
        this._error.set(errorMessage);
        return null;
      }

      // Find existing product
      const existingProduct = this._products().find((p) => p.id === id);
      if (!existingProduct) {
        this._error.set("Product not found");
        return null;
      }

      // Create updated product
      const updatedProduct: Product = {
        ...existingProduct,
        ...productForm,
        image: productForm.image?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      // Validate the complete product
      const validatedProduct = ProductSchema.parse(updatedProduct);

      // Update products array
      this._products.update((products) =>
        products.map((p) => (p.id === id ? validatedProduct : p))
      );

      // Save to localStorage
      this.saveProductsToStorage();

      return validatedProduct;
    } catch (error) {
      this._error.set("Failed to update product: " + (error as Error).message);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Check if product exists
      const productExists = this._products().some((p) => p.id === id);
      if (!productExists) {
        this._error.set("Product not found");
        return false;
      }

      // Remove from products array
      this._products.update((products) => products.filter((p) => p.id !== id));

      // Save to localStorage
      this.saveProductsToStorage();

      return true;
    } catch (error) {
      this._error.set("Failed to delete product: " + (error as Error).message);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  getProductById(id: string): Product | undefined {
    return this._products().find((p) => p.id === id);
  }

  searchProducts(query: string): Product[] {
    if (!query.trim()) {
      return this._products();
    }

    const lowerQuery = query.toLowerCase();
    return this._products().filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description?.toLowerCase().includes(lowerQuery) ||
        product.category?.toLowerCase().includes(lowerQuery)
    );
  }

  // Local storage methods
  private saveProductsToStorage(): void {
    try {
      localStorage.setItem("pos-products", JSON.stringify(this._products()));
    } catch (error) {
      console.error("Failed to save products to localStorage:", error);
    }
  }

  loadProductsFromStorage(): void {
    try {
      const stored = localStorage.getItem("pos-products");

      if (stored) {
        const products = JSON.parse(stored);
        // Validate each product before loading
        const validProducts = products.filter((product: any) => {
       
          try {
            ProductSchema.parse(product);

            return true;
          } catch {
            return false;
          }
        });
        this._products.set(validProducts);
      }
    } catch (error) {
      console.error("Failed to load products from localStorage:", error);
      this._products.set([]);
    }
  }

  // Utility methods
  clearAllProducts(): void {
    this._products.set([]);
    this.saveProductsToStorage();
  }

  clearError(): void {
    this._error.set(null);
  }

  // Demo data method for testing
  loadDemoData(): void {
    const demoProducts: ProductForm[] = [
      {
        name: "Espresso",
        price: 2.5,
        image:
          "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400",
        description: "Rich and bold espresso shot",
        category: "Coffee",
        inStock: true,
      },
      {
        name: "Cappuccino",
        price: 4.0,
        image:
          "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
        description: "Creamy cappuccino with steamed milk",
        category: "Coffee",
        inStock: true,
      },
      {
        name: "Croissant",
        price: 3.5,
        image:
          "https://images.unsplash.com/photo-1555507036-ab794f27d1ea?w=400",
        description: "Buttery, flaky croissant",
        category: "Pastry",
        inStock: true,
      },
    ];

    // Add demo products
    demoProducts.forEach((product) => {
      this.addProduct(product);
    });
  }

  // Web scraping methods for Ditsch products
  async scrapeDitschProducts(): Promise<Product[]> {
    this._scraping.set(true);
    this._error.set(null);

    try {
      // Using a CORS proxy to scrape Ditsch website
      const proxyUrl = "https://api.allorigins.win/raw?url=";
      const ditschUrl = "https://www.ditsch.de/en/shops/produktwelt/";

      const response = await this.http
        .get(`${proxyUrl}${encodeURIComponent(ditschUrl)}`, {
          responseType: "text",
        })
        .toPromise();

      if (typeof response === "string") {
        const products = this.parseDitschProducts(response);
        return products;
      } else {
        throw new Error("Failed to fetch Ditsch products");
      }
    } catch (error) {
      this._error.set(
        "Failed to scrape Ditsch products: " + (error as Error).message
      );
      return [];
    } finally {
      this._scraping.set(false);
    }
  }

  private parseDitschProducts(html: string): Product[] {
    const products: Product[] = [];

    try {
      // Create a DOM parser to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Look for product elements based on the actual Ditsch page structure
      // The page shows products with names like "Pretzel With Sunflower Seeds & Salt", "XL-Butter-Brezel", etc.
      const productElements = doc.querySelectorAll(
        'h4, h5, [class*="product"], [class*="item"]'
      );

      productElements.forEach((element, index) => {
        try {
          const productName = element.textContent?.trim();

          // Skip if no product name or if it's a category header
          if (!productName || productName.length < 3) return;

          // Skip category headers and navigation elements
          const skipKeywords = [
            "Categories",
            "Special offers",
            "Pretzels",
            "Overbacked",
            "Vegan",
            "Vegetarian",
            "Croissants",
            "Pizzas",
            "Covered",
            "Dips",
            "Beverages",
            "Hot drinks",
            "Cold drinks",
          ];
          if (
            skipKeywords.some((keyword) =>
              productName.toLowerCase().includes(keyword.toLowerCase())
            )
          )
            return;

          // Extract product image using comprehensive method
          const imageUrl = this.extractProductImage(doc, productName, element);

          // Determine category based on product name
          let category = "Ditsch";
          if (productName.toLowerCase().includes("pretzel")) {
            category = "Pretzels";
          } else if (productName.toLowerCase().includes("pizza")) {
            category = "Pizzas";
          } else if (productName.toLowerCase().includes("croissant")) {
            category = "Croissants";
          } else if (productName.toLowerCase().includes("dip")) {
            category = "Dips";
          } else if (
            productName.toLowerCase().includes("drink") ||
            productName.toLowerCase().includes("beverage")
          ) {
            category = "Beverages";
          }

          // Generate a reasonable price based on product type (since prices aren't visible on the page)
          let price = 3.5; // Default price for most items
          let fallbackImageUrl =
            "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Ditsch+Product"; // Default placeholder

          if (
            productName.toLowerCase().includes("xl") ||
            productName.toLowerCase().includes("large")
          ) {
            price = 4.5;
            fallbackImageUrl =
              "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Ditsch+XL+Product";
          } else if (
            productName.toLowerCase().includes("mini") ||
            productName.toLowerCase().includes("snack")
          ) {
            price = 2.5;
            fallbackImageUrl =
              "https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Ditsch+Mini+Product";
          } else if (productName.toLowerCase().includes("pizza")) {
            price = 6.5;
            fallbackImageUrl =
              "https://via.placeholder.com/300x200/F44336/FFFFFF?text=Ditsch+Pizza";
          } else if (productName.toLowerCase().includes("croissant")) {
            price = 3.0;
            fallbackImageUrl =
              "https://via.placeholder.com/300x200/FFC107/FFFFFF?text=Ditsch+Croissant";
          } else if (productName.toLowerCase().includes("dip")) {
            price = 2.0;
            fallbackImageUrl =
              "https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Ditsch+Dip";
          } else if (
            productName.toLowerCase().includes("drink") ||
            productName.toLowerCase().includes("beverage")
          ) {
            price = 2.5;
            fallbackImageUrl =
              "https://via.placeholder.com/300x200/2196F3/FFFFFF?text=Ditsch+Beverage";
          } else if (productName.toLowerCase().includes("pretzel")) {
            fallbackImageUrl =
              "https://via.placeholder.com/300x200/8BC34A/FFFFFF?text=Ditsch+Pretzel";
          }

          // Create product object
          const product: Product = {
            id: uuidv4(),
            name: productName,
            price,
            image: imageUrl || fallbackImageUrl, // Use scraped image or fallback
            description: `Fresh ${productName.toLowerCase()} from Ditsch bakery`,
            category,
            inStock: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Validate the product
          const validatedProduct = ProductSchema.parse(product);
          products.push(validatedProduct);
        } catch (productError) {
          console.warn("Failed to parse product:", productError);
        }
      });

      console.log(`Successfully parsed ${products.length} Ditsch products`);
      return products;
    } catch (error) {
      console.error("Error parsing Ditsch products:", error);
      return [];
    }
  }

  private extractPrice(priceText: string): number {
    // Extract numeric price from various formats
    const priceMatch = priceText.match(/[\d,]+\.?\d*/);
    if (priceMatch) {
      return parseFloat(priceMatch[0].replace(/,/g, ""));
    }
    return 0;
  }

  async loadDitschProducts(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const scrapedProducts = await this.scrapeDitschProducts();

      if (scrapedProducts.length > 0) {
        // Add scraped products to existing products
        this._products.update((products) => [...products, ...scrapedProducts]);
        this.saveProductsToStorage();
        console.log(`Loaded ${scrapedProducts.length} Ditsch products`);
      } else {
        this._error.set("No Ditsch products found");
      }
    } catch (error) {
      this._error.set(
        "Failed to load Ditsch products: " + (error as Error).message
      );
    } finally {
      this._loading.set(false);
    }
  }

  private extractProductImage(
    doc: Document,
    productName: string,
    element: Element
  ): string {
    let imageUrl = "";

    // Method 1: Look for images in the same container as the product name
    const parentElement = element.closest(
      '[class*="product"], [class*="item"], div, section, article'
    );
    if (parentElement) {
      const imageElement = parentElement.querySelector("img");
      if (imageElement) {
        const src =
          imageElement.getAttribute("src") ||
          imageElement.getAttribute("data-src");
        if (src) {
          imageUrl = src.startsWith("http")
            ? src
            : `https://www.ditsch.de${src}`;
          return imageUrl;
        }
      }
    }

    // Method 2: Look for images with alt text matching the product name
    const allImages = doc.querySelectorAll("img");
    for (const img of allImages) {
      const imgSrc = img.getAttribute("src") || img.getAttribute("data-src");
      const imgAlt = img.getAttribute("alt") || "";
      const imgTitle = img.getAttribute("title") || "";

      if (
        imgSrc &&
        (imgAlt.toLowerCase().includes(productName.toLowerCase()) ||
          imgTitle.toLowerCase().includes(productName.toLowerCase()))
      ) {
        imageUrl = imgSrc.startsWith("http")
          ? imgSrc
          : `https://www.ditsch.de${imgSrc}`;
        return imageUrl;
      }
    }

    // Method 3: Look for images with src containing product name keywords
    const productKeywords = productName
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 2);
    for (const img of allImages) {
      const imgSrc = img.getAttribute("src") || img.getAttribute("data-src");
      if (
        imgSrc &&
        productKeywords.some((keyword) =>
          imgSrc.toLowerCase().includes(keyword)
        )
      ) {
        imageUrl = imgSrc.startsWith("http")
          ? imgSrc
          : `https://www.ditsch.de${imgSrc}`;
        return imageUrl;
      }
    }

    // Method 4: Look for images in nearby containers (within 3 levels up)
    let currentElement = element.parentElement;
    for (let i = 0; i < 3 && currentElement; i++) {
      const nearbyImage = currentElement.querySelector("img");
      if (nearbyImage) {
        const src =
          nearbyImage.getAttribute("src") ||
          nearbyImage.getAttribute("data-src");
        if (src) {
          imageUrl = src.startsWith("http")
            ? src
            : `https://www.ditsch.de${src}`;
          return imageUrl;
        }
      }
      currentElement = currentElement.parentElement;
    }

    return imageUrl;
  }
}
